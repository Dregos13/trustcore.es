// check-overflow.mjs <url> [anchos=1440,768,375] — texto y controles que se salen o quedan cortados por un lado.
//
// Por qué existe: html y body llevan `overflow-x: clip`, así que `overflowX` (scrollWidth − clientWidth)
// da SIEMPRE 0 aunque un botón se salga de la pantalla: lo que desborda queda recortado, no desplaza.
// Este script recorre la página con movimiento reducido (sin transforms de entrada) y lista los
// elementos con texto o interactivos cuyo borde queda fuera de la ventana o de su contenedor recortado.
// No mira lo decorativo (aria-hidden), las cintas, ni lo que vive en un contenedor con scroll propio.
//
// Se ejecuta desde la carpeta de trabajo que tiene Playwright (allí hay una copia):
//   cd <scratchpad> && . ./env.sh && node check-overflow.mjs http://127.0.0.1:8473/precios
import { chromium } from 'playwright';
const [,, url, widths = '1440,768,375'] = process.argv;
if (!url) { console.log('uso: node check-overflow.mjs <url> [anchos]'); process.exit(2); }
const b = await chromium.launch({ executablePath: process.env.EXE });
let bad = 0;
for (const w of widths.split(',').map(Number)) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 600 ? 812 : w < 1000 ? 1024 : 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('tc_cookie_consent_v1', JSON.stringify({ version: 1, necessary: true, analytics: false, marketing: false, updatedAt: new Date().toISOString() })); } catch (e) {} });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const found = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    const skip = '[aria-hidden="true"], .sr-only, [data-belt], .tc-sheet, .tc-menu, dialog, .tc-bot__panel, [hidden]';
    const clips = (el) => { const o = getComputedStyle(el).overflowX; return o === 'hidden' || o === 'clip'; };
    const scrolls = (el) => { const o = getComputedStyle(el).overflowX; return o === 'auto' || o === 'scroll'; };
    for (const el of document.querySelectorAll('main *, .tc-foot *, .tc-nav__pill *')) {
      if (el.closest(skip)) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      let left = 0, right = vw, inScroller = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        if (scrolls(a)) { inScroller = true; break; }
        if (clips(a)) { const ar = a.getBoundingClientRect(); left = Math.max(left, ar.left); right = Math.min(right, ar.right); }
      }
      if (inScroller) continue;
      const over = Math.max(r.right - right, left - r.left);
      if (over > 2) out.push({ over: Math.round(over), side: r.right - right > left - r.left ? 'derecha' : 'izquierda', what: (el.tagName.toLowerCase() + '.' + String(el.className.baseVal ?? el.className).trim().split(/\s+/).slice(0, 3).join('.')).replace(/\.$/, ''), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60), y: Math.round(r.top + scrollY) });
    }
    return out;
  });
  console.log(`\n${w} px · ${found.length ? found.length + ' elemento(s) cortado(s)' : 'nada cortado'}`);
  found.slice(0, 25).forEach((f) => console.log(`  ✗ ${f.over} px por la ${f.side} · y=${f.y} · ${f.what} · «${f.text}»`));
  bad += found.length;
  await ctx.close();
}
await b.close();
process.exit(bad ? 1 : 0);
