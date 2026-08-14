// Prueba interactiva: simuladores + bot TrusTy + reveals.
import { chromium } from './node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const OUT = '.design-sync/verify/interact';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];

// --- TrustinFacts: simulador de factura ---
let page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('TF: ' + String(e).slice(0, 160)));
await page.goto('http://127.0.0.1:8471/productos/trustinfacts.html', { waitUntil: 'networkidle' });
await page.locator('#pruebalo').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
// cambiar producto y territorio → total recalcula
await page.click('[data-sim-producto="8500"]');
await page.click('[data-sim-tax="ipsi-obras"]');
const total = await page.textContent('[data-sim-total]');
console.log('TF total reforma+obras10%:', total.trim(), total.includes('9.350,00') ? 'OK' : 'MAL (esperado 9.350,00 €)');
await page.click('[data-sim-emitir]');
await page.waitForTimeout(400);
const stampOn = await page.locator('[data-sim-stamp].is-on').count();
console.log('TF sello VeriFactu tras emitir:', stampOn === 1 ? 'OK' : 'MAL');
await page.locator('#pruebalo').screenshot({ path: `${OUT}/tf-sim.png` });

// --- TrustinTime: simulador de fichaje ---
let page2 = await ctx.newPage();
page2.on('pageerror', (e) => errors.push('TT: ' + String(e).slice(0, 160)));
await page2.goto('http://127.0.0.1:8471/productos/trustintime.html', { waitUntil: 'networkidle' });
await page2.locator('#pruebalo').scrollIntoViewIfNeeded();
await page2.waitForTimeout(600);
await page2.click('[data-sim-fichar]');            // entrada
await page2.waitForTimeout(250);
const btnTxt = await page2.textContent('[data-sim-fichar]');
console.log('TT botón tras entrada:', btnTxt.trim() === 'Fichar salida' ? 'OK' : 'MAL: ' + btnTxt.trim());
await page2.click('[data-sim-fichar]');            // salida
await page2.waitForTimeout(250);
const rows = await page2.locator('[data-sim-log] li:not([data-sim-empty])').count();
const exportVisible = await page2.locator('[data-sim-export]:not([hidden])').count();
console.log('TT log:', rows === 2 ? 'OK (2 fichajes)' : 'MAL: ' + rows, '| export visible:', exportVisible === 1 ? 'OK' : 'MAL');
await page2.click('[data-sim-export]');
await page2.waitForTimeout(300);
await page2.locator('#pruebalo').screenshot({ path: `${OUT}/tt-sim.png` });

// --- Bot TrusTy (en index, ES) ---
let page3 = await ctx.newPage();
page3.on('pageerror', (e) => errors.push('BOT: ' + String(e).slice(0, 160)));
await page3.goto('http://127.0.0.1:8471/index.html', { waitUntil: 'networkidle' });
const fab = await page3.locator('.tc-bot__fab').count();
console.log('Bot FAB presente:', fab === 1 ? 'OK' : 'MAL');
await page3.click('.tc-bot__fab');
await page3.waitForTimeout(300);
await page3.click('.tc-bot__chip >> nth=1');        // plazos VeriFactu
await page3.waitForTimeout(300);
const answer = await page3.textContent('.tc-bot__body');
console.log('Bot respuesta plazos:', answer.includes('1 de enero de 2027') ? 'OK' : 'MAL');
const aeatLink = await page3.locator('.tc-bot__msg--bot a[href*="agenciatributaria"]').count();
console.log('Bot enlace AEAT:', aeatLink >= 1 ? 'OK' : 'MAL');
await page3.screenshot({ path: `${OUT}/bot-open.png` });
// accesibilidad básica: Escape cierra
await page3.keyboard.press('Escape');
const closed = await page3.locator('.tc-bot__panel[hidden]').count();
console.log('Bot Escape cierra:', closed === 1 ? 'OK' : 'MAL');

// --- Bot en EN ---
let page4 = await ctx.newPage();
await page4.goto('http://127.0.0.1:8471/en/index.html', { waitUntil: 'networkidle' });
const fabTxt = await page4.textContent('.tc-bot__fab');
console.log('Bot EN:', fabTxt.includes('Ask TrusTy') ? 'OK' : 'MAL: ' + fabTxt.trim());

// --- Auto-reveal aplicado ---
const autoCount = await page3.evaluate(() => document.querySelectorAll('.tc-auto-reveal').length);
console.log('Auto-reveal en index:', autoCount > 10 ? `OK (${autoCount} elementos)` : 'POCOS: ' + autoCount);

console.log(errors.length ? 'ERRORES: ' + errors.join(' || ') : 'Sin errores JS');
await browser.close();
