const { chromium } = require('playwright');
const fs = require('fs');
const outDir = '/Users/xiajarvan/.openclaw/workspace/opc/evidence/yishun-11263-mobile-390-coder';
const routes = ['/', '/daily-ritual', '/profile-card', '/compatibility', '/ask-master', '/paywall'];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const results = [];
  for (const route of routes) {
    const url = `http://127.0.0.1:3220${route}`;
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const status = res ? res.status() : 0;
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    const ctaCount = await page.locator('a,button').count().catch(() => 0);
    const screenshot = `${outDir}/${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}-390.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    const hasConsumerCopy = /ritual|profile|compatibility|ask|paywall|unlock|share|free|report|fortune|today|match|question|daily|relationship/i.test(bodyText);
    results.push({ route, status, ctaCount, hasConsumerCopy, screenshot, ok: status === 200 && ctaCount > 0 && hasConsumerCopy });
  }
  await browser.close();
  fs.writeFileSync(`${outDir}/mobile-390-results.json`, JSON.stringify({ ok: results.every(r => r.ok), viewport: { width: 390, height: 844 }, results }, null, 2));
  if (!results.every(r => r.ok)) process.exit(1);
})();
