// shoot2.mjs <url> <prefix> <w> <h> [cols] [scale] — recorre TODA la página y monta una hoja de contacto.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const [,, url, out, w='1440', h='900', cols='4', scale='0.33', extra=''] = process.argv;
const b = await chromium.launch({ executablePath: process.env.EXE, args: ['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, reducedMotion: extra.includes('reduce') ? 'reduce' : 'no-preference', javaScriptEnabled: !extra.includes('nojs') });
await ctx.addInitScript(() => { try { localStorage.setItem('tc_cookie_consent_v1', JSON.stringify({version:1,necessary:true,analytics:false,marketing:false,updatedAt:new Date().toISOString()})); } catch(e){} });
const p = await ctx.newPage();
const errs=[]; p.on('pageerror', e=>errs.push(String(e))); p.on('console', m=>{ if(m.type()==='error' && !/404/.test(m.text())) errs.push(m.text()); });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
const H = await p.evaluate(()=>document.documentElement.scrollHeight);
const sw = await p.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
const n = Math.ceil(H / +h);
const imgs=[];
for (let k=0;k<n;k++) {
  const y = Math.min(k * +h, H - +h);
  await p.evaluate(async (y)=>{ const s=window.scrollY; for(let t=1;t<=10;t++){ window.scrollTo(0, s+(y-s)*t/10); await new Promise(r=>requestAnimationFrame(r)); } }, y);
  await p.waitForTimeout(900);
  imgs.push((await p.screenshot({ type:'jpeg', quality: 70 })).toString('base64'));
}
const hidden = await p.evaluate(()=>[...document.querySelectorAll('[data-reveal]')].filter(e=>!e.classList.contains('is-in') && e.offsetParent!==null).length);
const cw = Math.round(+w * +scale);
const perSheet = +cols * 3;
const sheet = await ctx.newPage();
let si = 0;
for (let i=0;i<imgs.length;i+=perSheet) {
  const part = imgs.slice(i,i+perSheet);
  await sheet.setViewportSize({ width: +cols*cw + (+cols+1)*6, height: 600 });
  await sheet.setContent(`<body style="margin:6px;background:#777;display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:6px">${part.map(s=>`<img src="data:image/jpeg;base64,${s}" style="width:${cw}px;display:block">`).join('')}</body>`);
  await sheet.waitForTimeout(400);
  await sheet.screenshot({ path: `${out}-sheet${si++}.jpg`, fullPage: true, type:'jpeg', quality: 78 });
}
console.log(JSON.stringify({ url, H, overflowX: sw, shots: n, sheets: si, hiddenReveals: hidden, errs: errs.slice(0,8) }));
await b.close();
