const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseURL = process.env.BASE_URL || 'http://localhost:3312';
const evidenceDir = process.env.EVIDENCE_DIR || path.join(process.cwd(), 'reports', 'reading-start-real-click');
fs.mkdirSync(evidenceDir, { recursive: true });

async function dump(page, name) {
  await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: true });
  const text = await page.locator('body').innerText().catch(() => '');
  fs.writeFileSync(path.join(evidenceDir, `${name}.txt`), text);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const consoleEvents = [];
  page.on('console', (msg) => consoleEvents.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => consoleEvents.push({ type: 'pageerror', text: err.message }));

  await page.goto(`${baseURL}/reading/start`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByPlaceholder('YYYY-MM-DD').fill('1990-05-20');
  await page.getByPlaceholder('HH:MM').fill('08:30');
  await dump(page, '01-step1-filled');

  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('heading', { name: 'Where were you born?' }).waitFor({ timeout: 10000 });
  await dump(page, '02-step2');

  await page.getByPlaceholder('City, country').fill('Beijing, China');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('heading', { name: 'What do you want help timing today?' }).waitFor({ timeout: 10000 });
  await dump(page, '03-step3');

  await page.getByRole('button', { name: 'Reveal today’s signal' }).click();
  await page.waitForURL('**/reading/result', { timeout: 30000 });
  await page.getByRole('heading', { name: /Timing clarity:/ }).waitFor({ timeout: 10000 });
  await dump(page, '04-result');

  await page.getByRole('button', { name: 'Save history' }).click();
  await page.getByText('Saved on this device').waitFor({ timeout: 10000 });
  await page.getByRole('link', { name: 'View saved history' }).click();
  await page.waitForURL('**/reports', { timeout: 10000 });
  await page.getByText(/Daily Ritual|saved/i).first().waitFor({ timeout: 10000 });
  await dump(page, '05-reports');

  fs.writeFileSync(path.join(evidenceDir, 'console.json'), JSON.stringify(consoleEvents, null, 2));
  await browser.close();
  console.log(JSON.stringify({ ok: true, baseURL, evidenceDir }));
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
