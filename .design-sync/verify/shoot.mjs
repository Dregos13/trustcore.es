// Render .design-sync/verify/proof.html in chromium and screenshot it.
// The converter's own render check is vacuous for this DS (no component cards), so this
// is the real verification that the uploaded styles.css closure actually works:
// fonts load, icon glyphs resolve, tokens apply, tc-* components lay out.
//
// Run: node .design-sync/verify/shoot.mjs
import { chromium } from './node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const page = await (await (await chromium.launch()).newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
})).newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push(`REQUEST FAILED ${r.url()} — ${r.failure()?.errorText}`));

await page.goto(pathToFileURL(resolve('.design-sync/verify/proof.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

// Assert the things that silently degrade rather than throw.
const report = await page.evaluate(() => {
  const px = (el, prop) => getComputedStyle(el)[prop];
  const glyph = document.querySelector('.fa-solid');
  const reveal = document.querySelector('[data-reveal]');
  const btn = document.querySelector('.tc-btn-primary');
  const value = document.querySelector('.tc-metric__value');
  return {
    interLoaded: document.fonts.check('700 1rem Inter'),
    faLoaded: document.fonts.check('900 1rem "Font Awesome 6 Free"'),
    // A missing glyph collapses to ~0 width; a real one has advance width.
    glyphWidth: glyph ? glyph.getBoundingClientRect().width : -1,
    bodyFont: px(document.body, 'fontFamily'),
    revealOpacity: reveal ? px(reveal, 'opacity') : 'absent',
    btnBg: btn ? px(btn, 'backgroundColor') : 'absent',
    metricSize: value ? px(value, 'fontSize') : 'absent',
    navyToken: getComputedStyle(document.documentElement).getPropertyValue('--tc-navy').trim(),
    tokenCount: Array.from(document.styleSheets)
      .flatMap((s) => { try { return Array.from(s.cssRules); } catch { return []; } })
      .filter((r) => r.selectorText === ':root').length,
  };
});

await page.screenshot({ path: '.design-sync/verify/proof.png', fullPage: true });
console.log(JSON.stringify({ report, errors }, null, 2));
process.exit(0);
