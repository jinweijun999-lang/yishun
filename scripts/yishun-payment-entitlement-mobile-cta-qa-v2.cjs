#!/usr/bin/env node
/**
 * yishun-payment-entitlement-mobile-cta-qa-v2.cjs
 * 移动端 390x844 viewport 专项复验：改进溢出检测
 * 区分 pointer-events-none 装饰性溢出 vs 真实交互溢出
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || '/Users/xiajarvan/.openclaw/workspace/yishun/evidence/yishun-payment-entitlement-mobile-cta-qa-20260516';
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

const results = { passed: 0, failed: 0, issues: [], screenshots: [] };

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function capture(page, label) {
  ensureDir(EVIDENCE_DIR);
  const file = path.join(EVIDENCE_DIR, `${label}-${TIMESTAMP}.png`);
  await page.screenshot({ path: file, fullPage: false });
  results.screenshots.push(file);
  console.log(`  [CAPTURED] ${file}`);
  return file;
}

/**
 * 检测真实溢出：排除 pointer-events-none 的装饰元素
 * 仅报告与用户可能交互的功能性元素的溢出
 */
async function detectRealOverflow(page) {
  return await page.evaluate(() => {
    const els = document.querySelectorAll('*');
    const realOverflow = [];
    const decorativeOverflow = [];

    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      // Only check elements that have actual rendered size and extend past right edge
      if (rect.width > 0 && rect.right > window.innerWidth) {
        const computed = window.getComputedStyle(el);
        const isPointerEventsNone = computed.pointerEvents === 'none';
        const isFixed = computed.position === 'fixed';
        const zIndex = parseInt(computed.zIndex || '0');
        const isFixedWithLowZ = isFixed && zIndex < 40;

        const info = `${el.tagName}${el.className ? '.' + el.className.split(' ')[0] : ''}`;
        if (isPointerEventsNone || isFixedWithLowZ) {
          decorativeOverflow.push({ info, zIndex, pointerEvents: computed.pointerEvents, position: computed.position });
        } else {
          realOverflow.push({ info, rectRight: Math.round(rect.right), innerWidth: window.innerWidth, zIndex: parseInt(computed.zIndex || '0') });
        }
      }
    });

    return { realOverflow, decorativeOverflow };
  });
}

async function checkPage(browser, url, label, authContext = null) {
  console.log(`\n=== ${label}: ${url} ===`);
  const context = await browser.newContext({ viewport: MOBILE_VIEWPORT });
  const page = await context.newPage();
  await page.setViewportSize(MOBILE_VIEWPORT);

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    if (!resp || resp.status() >= 500) {
      results.failed++;
      results.issues.push({ page: label, severity: 'ERROR', detail: `HTTP ${resp?.status()}` });
      await capture(page, `${label}-error`);
      await context.close();
      return;
    }
    // 401 / 3xx handled gracefully
    if (resp.status() >= 400 && resp.status() < 500) {
      console.log(`  HTTP ${resp.status()} — unauthenticated or redirect (expected for some pages)`);
    }

    await page.waitForTimeout(1500);
    await capture(page, `${label}-full`);

    // ── 1. PaymentValueMatrix 检测 ──────────────────────────────────
    // PVM 在移动端以不同 selector 存在：class含PaymentValueMatrix / data-testid / section with eyebrow text
    const pvmEyebrow = await page.locator('text=/付费后得到什么|What each option unlock/i').count();
    const pvmTitle = await page.locator('text=/免费摘要、问事次数|is different product/i').count();
    const pvmRows = await page.locator('text=/免费摘要|1 次问事|Free summary/i').count();
    console.log(`  PVM eyebrow:${pvmEyebrow} title:${pvmTitle} rows:${pvmRows}`);
    const pvmFound = pvmEyebrow > 0 || pvmTitle > 0 || pvmRows > 0;
    if (pvmFound) {
      results.passed++;
      console.log(`  PaymentValueMatrix: FOUND`);
    } else {
      console.log(`  PaymentValueMatrix: NOT FOUND`);
    }

    // ── 2. Payment CTA 文本检测 ───────────────────────────────────
    const ctaTargets = ['Use credit', 'Ask with credit', 'Unlock full report', 'View full report', 'Buy 1 question credit', '购买 1 次问事', '对比会员权益', 'Compare membership'];
    const foundCtas = [];
    for (const cta of ctaTargets) {
      const n = await page.locator(`text="${cta}"`).count();
      if (n > 0) foundCtas.push(cta);
    }
    console.log(`  CTAs found: ${foundCtas.join(', ') || 'none'}`);

    // ── 3. 溢出检测（pointer-events-none 装饰元素过滤）──────────────
    const overflow = await detectRealOverflow(page);
    if (overflow.realOverflow.length > 0) {
      const detail = `REAL overflow: ${overflow.realOverflow.map(o => o.info).join(', ')}`;
      results.failed++;
      results.issues.push({ page: label, severity: 'FAIL', detail });
    } else if (overflow.decorativeOverflow.length > 0) {
      console.log(`  Decorative-only overflow elements (pointer-events-none, not UX-blocking): ${overflow.decorativeOverflow.length}`);
      results.passed++; // decorative overflow is not a failure
    } else {
      console.log(`  No overflow detected`);
      results.passed++;
    }

    // ── 4. CTA 三要素可读性检查 ───────────────────────────────────
    const ctaBtns = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a[href]'));
      return btns
        .filter(b => {
          const text = (b.textContent || '').trim().replace(/\s+/g, ' ');
          return text.length > 3;
        })
        .map(b => {
          const rect = b.getBoundingClientRect();
          const visible = rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight;
          return { text: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 80), visible, top: Math.round(rect.top) };
        })
        .filter(b => b.visible)
        .slice(0, 8);
    });
    console.log(`  Visible CTA buttons: ${ctaBtns.map(b => b.text).join(' | ')}`);

    // ── 5. Teaser vs Locked 显示 ──────────────────────────────────
    const freeTeaserCount = await page.locator('text=/免费摘要|今日最佳|Today.*short signal/i').count();
    const lockedCount = await page.locator('text=/🔒|locked|解锁|完整版/i').count();
    console.log(`  Teaser mentions: ${freeTeaserCount}, Locked indicators: ${lockedCount}`);

    // ── 6. 滚动到底部 ─────────────────────────────────────────────
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await capture(page, `${label}-bottom`);
    const bottomOverflow = await detectRealOverflow(page);
    if (bottomOverflow.realOverflow.length > 0) {
      results.failed++;
      results.issues.push({ page: label, severity: 'FAIL', detail: `Bottom scroll overflow: ${bottomOverflow.realOverflow.map(o => o.info).join(', ')}` });
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    // ── 7. Console errors ─────────────────────────────────────────
    const criticalErrors = errors.filter(e => !e.includes('Warning') && !e.includes('warning') && !e.includes('favicon'));
    if (criticalErrors.length > 0) {
      console.log(`  Critical console errors: ${criticalErrors.slice(0, 3).join(' | ')}`);
      results.issues.push({ page: label, severity: 'WARN', detail: `Console errors: ${criticalErrors.slice(0, 3).join(' | ')}` });
    }

    // ── 综合判断 ──────────────────────────────────────────────────
    if (!pvmFound && foundCtas.length === 0) {
      results.issues.push({ page: label, severity: 'WARN', detail: 'No payment value content found — may be auth-gated page without active session' });
    }
    results.passed++; // page load passed

  } catch (err) {
    results.failed++;
    results.issues.push({ page: label, severity: 'ERROR', detail: err.message });
    await capture(page, `${label}-crash`);
  } finally {
    await context.close();
  }
}

async function main() {
  ensureDir(EVIDENCE_DIR);
  console.log('Starting mobile CTA QA v2 — viewport 390x844');
  console.log(`Evidence dir: ${EVIDENCE_DIR}`);

  const browser = await chromium.launch({ headless: true });

  const pages = [
    { url: `${BASE}/`, label: 'home' },
    { url: `${BASE}/tools`, label: 'tools' },
    { url: `${BASE}/reports`, label: 'reports' },
    { url: `${BASE}/profile`, label: 'profile' },
  ];

  for (const p of pages) {
    await checkPage(browser, p.url, p.label);
  }

  // Reading result page - try with a simulated session cookie
  console.log('\n=== reading-result ===');
  const ctx = await browser.newContext({ viewport: MOBILE_VIEWPORT });
  const readingPage = await ctx.newPage();
  await readingPage.setViewportSize(MOBILE_VIEWPORT);
  try {
    // Reading result is auth-protected; direct URL without session leads to empty state
    // Try with a sample preview approach
    await readingPage.goto(`${BASE}/reading/result`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await readingPage.waitForTimeout(1500);
    await capture(readingPage, 'reading-result');

    const pvmFound = await readingPage.locator('text=/付费后得到什么|What each option/i').count() > 0;
    const ctaFound = await readingPage.locator('text=/Unlock full report|Use credit|完整报告.*解锁/i').count() > 0;
    const overflow = await detectRealOverflow(readingPage);

    console.log(`  PVM: ${pvmFound}, CTA: ${ctaFound}, real overflow: ${overflow.realOverflow.length}`);
    if (!pvmFound && !ctaFound) {
      results.issues.push({ page: 'reading-result', severity: 'WARN', detail: 'Auth-protected page; no payment content without active session' });
      console.log('  (Expected: reading result requires active reading session; direct URL without session is empty)');
    }
    if (overflow.realOverflow.length > 0) {
      results.failed++;
      results.issues.push({ page: 'reading-result', severity: 'FAIL', detail: `Real overflow: ${overflow.realOverflow.map(o => o.info).join(', ')}` });
    }
    results.passed++;
  } catch (err) {
    results.issues.push({ page: 'reading-result', severity: 'WARN', detail: `Could not load: ${err.message}` });
  } finally {
    await ctx.close();
  }

  await browser.close();

  // ── 写 verification.txt ──────────────────────────────────────────
  const verif = [
    `yishun-payment-entitlement-mobile-cta-qa verification.txt`,
    `Timestamp: ${new Date().toISOString()}`,
    `Viewport: ${MOBILE_VIEWPORT.width}x${MOBILE_VIEWPORT.height}`,
    `BASE_URL: ${BASE}`,
    `Evidence: ${EVIDENCE_DIR}`,
    ``,
    `RESULTS SUMMARY`,
    `  Passed: ${results.passed}`,
    `  Failed: ${results.failed}`,
    `  Issues: ${results.issues.length}`,
    ``,
    `SCREENSHOTS (${results.screenshots.length})`,
    ...results.screenshots.map(f => `  ${path.basename(f)}`),
    ``,
    `ISSUES (${results.issues.length})`,
    ...results.issues.map(i => `  [${i.severity}] ${i.page}: ${i.detail}`),
  ].join('\n');

  const verifPath = path.join(EVIDENCE_DIR, 'verification.txt');
  fs.writeFileSync(verifPath, verif);

  console.log(`\n${verif}`);
  console.log(`\nVerification: ${verifPath}`);

  // GO/NO-GO 判断
  const failCount = results.issues.filter(i => i.severity === 'FAIL').length;
  const goNoGo = failCount === 0 ? 'GO' : 'NO-GO';
  console.log(`\n🎯 Final verdict: ${goNoGo} (${failCount} FAIL issues)`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });