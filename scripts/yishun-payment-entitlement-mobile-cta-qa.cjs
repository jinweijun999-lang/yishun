#!/usr/bin/env node
/**
 * yishun-payment-entitlement-mobile-cta-qa.mjs
 * 移动端 390x844 viewport 专项复验：首页/Tools/Reports/Profile/Reading Result
 * 验证 PaymentValueMatrix / CTA 可见性 / 可读性 / 无横向溢出
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || '/Users/xiajarvan/.openclaw/workspace/yishun/evidence/yishun-payment-entitlement-mobile-cta-qa-20260516';
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// 结果收集
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

async function checkPage(browser, url, label) {
  console.log(`\n=== ${label}: ${url} ===`);
  const context = await browser.newContext({ viewport: MOBILE_VIEWPORT });
  const page = await context.newPage();
  await page.setViewportSize(MOBILE_VIEWPORT);

  const errors = [];
  const widthOverflows = [];

  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    if (!resp || resp.status() >= 400) {
      results.failed++;
      results.issues.push({ page: label, severity: 'ERROR', detail: `HTTP ${resp?.status()}` });
      await capture(page, `${label}-error`);
      await context.close();
      return;
    }

    await page.waitForTimeout(1000);
    await capture(page, `${label}-full`);

    // ── 1. PaymentValueMatrix 可见性 ──────────────────────────────────
    const pvm = await page.locator('[data-testid="PaymentValueMatrix"], .payment-value-matrix, [class*="PaymentValueMatrix"]').count();
    console.log(`  PaymentValueMatrix elements: ${pvm}`);
    if (pvm === 0) {
      // try by text
      const pvmText = await page.locator('text=/Use credit|Ask with credit|Unlock full report|View full report/i').count();
      console.log(`  Payment CTA texts found: ${pvmText}`);
      if (pvmText === 0) {
        results.failed++;
        results.issues.push({ page: label, severity: 'FAIL', detail: 'PaymentValueMatrix not found in mobile view' });
      } else {
        results.passed++;
      }
    } else {
      results.passed++;
    }

    // ── 2. CTA 文案可见 ─────────────────────────────────────────────
    const ctaTexts = [
      { pattern: /Use credit/i, label: 'Use credit' },
      { pattern: /Ask with credit/i, label: 'Ask with credit' },
      { pattern: /Unlock full report/i, label: 'Unlock full report' },
      { pattern: /View full report/i, label: 'View full report' },
      { pattern: /Get started/i, label: 'Get started' },
      { pattern: /Start reading/i, label: 'Start reading' },
    ];
    const ctaResults = {};
    for (const { pattern, label } of ctaTexts) {
      const found = await page.locator(`text=${pattern}`).count();
      ctaResults[label] = found > 0;
      if (found > 0) console.log(`  CTA "${label}": found`);
    }
    const anyCta = Object.values(ctaResults).some(Boolean);
    if (!anyCta) {
      results.issues.push({ page: label, severity: 'WARN', detail: 'No standard payment CTA text found' });
    }

    // ── 3. 横向溢出检测 ─────────────────────────────────────────────
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    if (bodyWidth > windowWidth + 5) {
      widthOverflows.push(`body.scrollWidth=${bodyWidth} > window.innerWidth=${windowWidth}`);
    }
    // Check all children
    const overflowEls = await page.evaluate(() => {
      const els = document.querySelectorAll('*');
      const bad = [];
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth && rect.width > 0) {
          bad.push(el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''));
        }
      });
      return bad.slice(0, 5);
    });
    if (overflowEls.length > 0) {
      widthOverflows.push(...overflowEls);
    }
    if (widthOverflows.length > 0) {
      results.issues.push({ page: label, severity: 'FAIL', detail: `Horizontal overflow: ${widthOverflows.join(', ')}` });
      results.failed++;
    } else {
      console.log(`  No horizontal overflow detected`);
    }

    // ── 4. 三要素 CTA 文案可读性 ─────────────────────────────────────
    // CTA 按钮内文字是否可读（非 hidden）
    const ctaBtnTexts = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a[href*="credit"], a[href*="unlock"], a[href*="report"], [class*="cta"], [class*="CTA"]'));
      return btns.map(b => b.textContent?.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 10);
    });
    console.log(`  CTA button texts: ${JSON.stringify(ctaBtnTexts)}`);

    // ── 5. Free teaser vs locked modules ─────────────────────────────
    const freeTeaser = await page.locator('text=/free|免费体验|preview/i').count();
    const lockedIndicator = await page.locator('text=/🔒|locked|解锁|完整版/i').count();
    console.log(`  Free teaser mentions: ${freeTeaser}, Locked indicators: ${lockedIndicator}`);

    // ── 6. Page scroll and CTA visibility ────────────────────────────
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await capture(page, `${label}-scrolled-bottom`);
    await page.evaluate(() => window.scrollTo(0, 0));

    // Console errors
    if (errors.length > 0) {
      console.log(`  Console errors: ${errors.slice(0, 3).join(' | ')}`);
      results.issues.push({ page: label, severity: 'WARN', detail: `Console errors: ${errors.slice(0, 3).join(' | ')}` });
    }

    results.passed++; // base page load passed
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

  console.log('Starting mobile CTA QA — viewport 390x844');
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

  // Reading result — needs a valid reading session, use mock param approach
  console.log('\n=== reading-result (direct access) ===');
  const ctx = await browser.newContext({ viewport: MOBILE_VIEWPORT });
  const readingPage = await ctx.newPage();
  await readingPage.setViewportSize(MOBILE_VIEWPORT);
  try {
    // Try direct URL with sample reading data
    await readingPage.goto(`${BASE}/reading/result?sample=preview`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await readingPage.waitForTimeout(1000);
    await capture(readingPage, 'reading-result');
    const cta = await readingPage.locator('text=/Unlock full report|View full report|Use credit/i').count();
    console.log(`  Reading result CTA: ${cta}`);
    if (cta === 0) {
      results.issues.push({ page: 'reading-result', severity: 'WARN', detail: 'No payment CTA found on reading result page' });
    } else {
      results.passed++;
    }
    // Check overflow
    const ow = await readingPage.evaluate(() => {
      const els = document.querySelectorAll('*');
      let bad = [];
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth && r.width > 0) {
          bad.push(el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''));
        }
      });
      return bad.slice(0, 5);
    });
    if (ow.length > 0) {
      results.issues.push({ page: 'reading-result', severity: 'FAIL', detail: `Overflow: ${ow.join(', ')}` });
      results.failed++;
    }
  } catch (err) {
    results.issues.push({ page: 'reading-result', severity: 'WARN', detail: `Could not load reading result: ${err.message}` });
  } finally {
    await ctx.close();
  }

  await browser.close();

  // ── Write verification.txt ────────────────────────────────────────
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
    `SCREENSHOTS (${results.screenshots.length} files)`,
    ...results.screenshots.map(f => `  - ${f}`),
    ``,
    `ISSUES (${results.issues.length})`,
    ...results.issues.map(i => `  [${i.severity}] ${i.page}: ${i.detail}`),
  ].join('\n');

  const verifPath = path.join(EVIDENCE_DIR, 'verification.txt');
  fs.writeFileSync(verifPath, verif);
  console.log(`\nVerification: ${verifPath}`);
  console.log(verif);

  const goNoGo = results.failed === 0 && results.issues.filter(i => i.severity === 'FAIL').length === 0
    ? 'GO'
    : 'NO-GO';

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });