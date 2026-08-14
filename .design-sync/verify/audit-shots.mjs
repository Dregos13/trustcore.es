// Screenshot key pages of the locally-served site for the visual audit.
// Usage: node .design-sync/verify/audit-shots.mjs [outDir] [page1 page2 ...]
import { chromium } from './node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const outDir = process.argv[2] ?? '.design-sync/verify/audit';
const pages = process.argv.length > 3 ? process.argv.slice(3) : [
  'index.html', 'precios.html', 'productos/trustintime.html', 'productos/trustinfacts.html',
  'aprende.html', 'contacto.html', 'software-verifactu-ipsi-ceuta-melilla.html', 'gestoria.html',
];
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

for (const p of pages) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  try {
    await page.goto(`http://127.0.0.1:8471/${p}`, { waitUntil: 'networkidle', timeout: 20000 });
    // Force all reveals visible so the full-page shot shows real content.
    await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed')));
    await page.waitForTimeout(400);
    const name = p.replace(/\//g, '__').replace('.html', '');
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
    const h = await page.evaluate(() => document.body.scrollHeight);
    console.log(`${p}  height=${h}${errs.length ? '  ERRORS: ' + errs.join(' | ') : ''}`);
  } catch (e) {
    console.log(`${p}  FAILED: ${String(e).slice(0, 150)}`);
  }
  await page.close();
}
await browser.close();
