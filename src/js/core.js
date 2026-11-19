/* ==========================================================================
   TrustCore · motor "Flujo" · núcleo
   Entorno, utilidades, bucle compartido (un solo rAF), avisos de scroll /
   tamaño / maquetación y analítica. Sin dependencias.
   ========================================================================== */

export const root = document.documentElement;
export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
export const motion = !reduce.matches && !window.__tcLate;   /* __tcLate: el arranque ya retiró .motion por tardanza */
export const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* El script de arranque del <head> ya pone estas clases; aquí se garantizan
   por si una página se sirve sin él. */
root.classList.add('js');
root.classList.toggle('motion', motion);

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const $ = (s, c) => (c || document).querySelector(s);
export const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const ico = (name, cls) => '<svg class="tc-ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';

/* Posición en el documento sin contar transforms (los revelados mueven cosas) */
export function docPos(el) {
  let x = 0, y = 0;
  while (el) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
  return { x, y };
}

export const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* modo privado */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* modo privado */ } }
};

/* ---------- Bucle compartido: un solo rAF, parado con la pestaña oculta ---------- */
const tasks = [];
let running = false;
let last = 0;
function frame(t) {
  const dt = Math.min(64, t - last || 16);
  last = t;
  let alive = false;
  for (let i = 0; i < tasks.length; i++) {
    const k = tasks[i];
    if (k.on && k.fn(t, dt) !== false) alive = true; else k.on = false;
  }
  if (alive && !document.hidden) requestAnimationFrame(frame); else running = false;
}
function kick() {
  if (running || document.hidden) return;
  running = true; last = performance.now();
  requestAnimationFrame(frame);
}
/* task(fn) → { start, stop }. fn devuelve false cuando ya no necesita más cuadros */
export function task(fn) {
  const k = { fn, on: false };
  tasks.push(k);
  return {
    start() { k.on = true; kick(); },
    stop() { k.on = false; }
  };
}
let wasOn = [];
document.addEventListener('visibilitychange', () => {
  if (document.hidden) wasOn = tasks.filter((k) => k.on);
  else { wasOn.forEach((k) => { k.on = true; }); kick(); }
});

/* ---------- Scroll, tamaño y maquetación: avisos agrupados ---------- */
const scrollSubs = [], resizeSubs = [], layoutSubs = [];
let sTick = false;
export function emitScroll() {
  sTick = false;
  const y = window.scrollY, vh = window.innerHeight;
  for (let i = 0; i < scrollSubs.length; i++) scrollSubs[i](y, vh);
}
window.addEventListener('scroll', () => {
  if (!sTick) { sTick = true; requestAnimationFrame(emitScroll); }
}, { passive: true });
let rTimer = 0, lastW = window.innerWidth;
function emitResize() {
  for (let i = 0; i < resizeSubs.length; i++) resizeSubs[i]();
  emitLayout();
}
window.addEventListener('resize', () => { clearTimeout(rTimer); rTimer = setTimeout(emitResize, 120); });
export function emitLayout() {
  for (let i = 0; i < layoutSubs.length; i++) layoutSubs[i]();
  emitScroll();
}
export const onScroll = (fn) => { scrollSubs.push(fn); };
export const onResize = (fn) => { resizeSubs.push(fn); };
/* onLayout: cuando cambia la geometría del documento (fuentes, imágenes, tamaño, acordeones) */
export const onLayout = (fn) => { layoutSubs.push(fn); };

/* ---------- Arranque: esperar a las fuentes para que la entrada no salte ---------- */
const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
const cap = new Promise((r) => { setTimeout(r, 1200); });
export const ready = Promise.race([fontsReady, cap]).then(() => { root.classList.add('is-ready'); });
ready.then(emitLayout);
window.addEventListener('load', emitLayout);
if ('ResizeObserver' in window) {
  let roT = 0, lastH = 0;
  new ResizeObserver(() => {
    const h = root.scrollHeight, w = window.innerWidth;
    if (Math.abs(h - lastH) < 2 && w === lastW) return;
    lastH = h; lastW = w;
    clearTimeout(roT);
    roT = setTimeout(emitLayout, 140);
  }).observe(document.body);
}

/* ---------- Analítica: dataLayer siempre; GA4 solo con consentimiento ---------- */
export function track(eventName, payload) {
  const eventPayload = Object.assign({
    event: eventName,
    page_path: window.location.pathname,
    page_title: document.title
  }, payload || {});
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventPayload);
  if (typeof window.gtag === 'function' && typeof window.tcCanTrackAnalytics === 'function' && window.tcCanTrackAnalytics()) {
    const gaPayload = Object.assign({}, eventPayload);
    delete gaPayload.event;
    window.gtag('event', eventName, gaPayload);
    return true;
  }
  return false;
}
