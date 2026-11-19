// nojs.mjs <url> <out> [w] — captura de página completa SIN JavaScript (reducida), para comprobar que nada parte oculto.
import { chromium } from 'playwright';
const [,, url, out, w = '1440'] = process.argv;
const b = await chromium.launch({ executablePath: process.env.EXE });
const ctx = await b.newContext({ viewport: { width: +w, height: 900 }, javaScriptEnabled: false, deviceScaleFactor: 0.35 });
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'load' });
await p.waitForTimeout(1500);
await p.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 70 });
await b.close();
console.log('ok', out);
