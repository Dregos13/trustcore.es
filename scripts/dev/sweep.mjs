import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';
const engine = process.argv[2];
import { readFileSync } from 'node:fs'; const urls = readFileSync('urls.txt','utf8').trim().split('\n');
const bt = { chromium, firefox, webkit }[engine];
const b = await bt.launch(engine === 'chromium' ? { executablePath: process.env.EXE } : {});
const rep = [];
for (const vp of [{ n: 'm', width: 375, height: 812 }, { n: 'd', width: 1440, height: 900 }]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, ...(vp.n === 'm' && engine !== 'firefox' ? { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : {}) });
  for (const u of urls) {
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push('JS: ' + String(e).slice(0, 160)));
    p.on('console', m => { if (m.type() === 'error' && !/\.mp4|favicon|googletagmanager|google/.test(m.text())) errs.push('C: ' + m.text().slice(0, 140)); });
    p.on('requestfailed', r => { if (!/\.mp4|google|gtm/.test(r.url())) errs.push('REQ: ' + r.url().slice(-70)); });
    try {
      await p.goto('http://127.0.0.1:8473' + u, { waitUntil: 'load', timeout: 30000 });
      await p.waitForTimeout(1500);
      try { await p.getByRole('button', { name: 'Rechazar' }).first().click({ timeout: 1500 }); } catch {}
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += Math.round(vp.height * 0.8)) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(180); }
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(700);
      const m = await p.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const wide = [...document.querySelectorAll('main *')].filter(e => { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; if (r.right <= vw + 3 && r.left >= -3) return false; let a = e.parentElement; while (a && a !== document.body) { const s = getComputedStyle(a); if (/hidden|clip|auto|scroll/.test(s.overflowX)) return false; a = a.parentElement; } return true; }).slice(0, 4).map(e => (e.tagName + '.' + String(e.className).slice(0, 50)));
        const hid = [...document.querySelectorAll('[data-reveal]')].filter(e => !e.classList.contains('is-in') && e.offsetParent !== null).length;
        const zero = [...document.querySelectorAll('main h1,main h2,main h3,main p')].filter(e => e.offsetParent !== null && e.textContent.trim() && +getComputedStyle(e).opacity < 0.15).length;
        const img = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.currentSrc).map(i => i.currentSrc.slice(-50));
        return { ox: document.documentElement.scrollWidth - vw, wide, hid, zero, img, H: document.documentElement.scrollHeight };
      });
      rep.push({ u, vp: vp.n, ...m, errs: [...new Set(errs)].slice(0, 5) });
      if (process.env.SHOTS && vp.n === 'm') {
        await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
        await p.screenshot({ path: `sweep/${engine}-${u.replace(/\W+/g, '_') || 'home'}.jpg`, fullPage: true, type: 'jpeg', quality: 55, timeout: 60000 }).catch(e => errs.push('shot fail'));
      }
    } catch (e) { rep.push({ u, vp: vp.n, fatal: String(e).slice(0, 200) }); }
    await p.close();
  }
  await ctx.close();
}
writeFileSync(`sweep/report-${engine}.json`, JSON.stringify(rep, null, 1));
const bad = rep.filter(r => r.fatal || r.ox > 1 || r.wide?.length || r.hid || r.zero || r.img?.length || r.errs?.length);
console.log(engine, 'cargas', rep.length, 'con incidencias', bad.length);
await b.close();
