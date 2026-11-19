import { chromium } from 'playwright';
const [,, url, out, w='1440', h='900', mode='scroll'] = process.argv;
const b = await chromium.launch({ executablePath: process.env.EXE, args: ['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs=[]; p.on('pageerror', e=>errs.push(String(e))); p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);
const H = await p.evaluate(()=>document.documentElement.scrollHeight);
const sw = await p.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
let i=0;
const steps = mode==='top' ? [0] : Array.from({length: Math.min(14, Math.ceil(H/ +h))}, (_,k)=>k);
for (const k of steps) {
  const y = Math.round(k * (H - +h) / Math.max(1, steps.length-1));
  // scroll gradually so scroll-driven things trigger
  await p.evaluate(async (y)=>{ const s=window.scrollY; for(let t=1;t<=12;t++){ window.scrollTo(0, s+(y-s)*t/12); await new Promise(r=>requestAnimationFrame(r)); } }, y);
  await p.waitForTimeout(1100);
  await p.screenshot({ path: `${out}-${String(i++).padStart(2,'0')}.jpg`, type:'jpeg', quality: 60 });
}
console.log(JSON.stringify({ url, H, overflowX: sw, shots: i, errs: errs.slice(0,8) }));
await b.close();
