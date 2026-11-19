/* ==========================================================================
   TrustCore · motor "Flujo" · el hilo de luz
   Un lienzo fijo a pantalla completa dibuja, cuadro a cuadro, solo el tramo
   visible de una corriente que recorre todo el documento.

   · El recorrido sale de los elementos [data-flow] (los coloca el CSS, así
     cambia solo en cada punto de corte) y de [data-flow-stage].
   · Lo que la página no declare se completa solo: origen en el hero, punto en
     la ola, columna por el margen en cada sección y final en la cúpula del CTA.
   · La cabeza va a un 58 % de la altura de pantalla y arrastra un rastro.
   · El color sigue al fondo: cian sobre oscuro, blanco a media luz, royal
     sobre claro. La luz de cada tramo sale de data-lum="a b" o, si falta, del
     degradado de la sección (--bg-a → --bg-b).
   · Solo se repinta si hubo scroll o hay un pulso viajando.
   ========================================================================== */
import { root, motion, clamp, $, $$, docPos, task, onScroll, onLayout } from './core.js';

export const THREAD_K = 0.58;          /* altura de la cabeza del hilo en pantalla */
const STEP = 7;
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/* ---------- Luz del fondo a partir de un color CSS ---------- */
const lumCache = {};
let probe = null;
function lumOf(css) {
  css = (css || '').trim();
  if (!css || css === 'transparent') return null;
  if (css in lumCache) return lumCache[css];
  if (!probe) { probe = document.createElement('i'); probe.style.display = 'none'; document.body.appendChild(probe); }
  probe.style.color = '';
  probe.style.color = css;
  const m = getComputedStyle(probe).color.match(/[\d.]+/g);
  let k = null;
  if (m && m.length >= 3) {
    const lin = m.slice(0, 3).map((v) => { v = v / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    const L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    k = clamp((Math.sqrt(L) - 0.08) * 1.2, 0, 1);
  }
  lumCache[css] = k;
  return k;
}

/* ---------- Puntos automáticos ---------- */
function pt(cls, attrs) {
  const i = document.createElement('i');
  i.className = 'tc-flow-pt ' + cls;
  i.setAttribute('data-flow', '');
  i.setAttribute('data-flow-auto', '');
  i.setAttribute('aria-hidden', 'true');
  (attrs || []).forEach((a) => { i.setAttribute(a, ''); });
  return i;
}
const returns = [];      /* puntos que devuelven el hilo al margen tras una lista de pasos */
function autoPoints() {
  const main = $('main');
  if (!main || main.getAttribute('data-thread') === 'off') return false;
  const manual = main.getAttribute('data-thread') === 'manual';
  /* pasos con nodo */
  $$('[data-flow-steps]').forEach((list) => {
    $$(':scope > .tc-step', list).forEach((s) => {
      if (!$('[data-flow]', s)) s.insertBefore(pt('tc-flow-node tc-step__node', ['data-flow-node']), s.firstChild);
    });
    const box = list.closest('.tc-sec__in');
    if (manual || !box || !list.lastElementChild) return;
    const back = pt('tc-flow-pt--spine');
    box.appendChild(back);
    returns.push({ el: back, list, box });
  });
  if (manual) return true;
  /* origen: el hero */
  const hero = $('.tc-hero__in, .tc-phero__in');
  if (hero && !$('[data-flow-origin]')) hero.appendChild(pt('tc-flow-node tc-flow-pt--origin', ['data-flow-node', 'data-flow-origin']));
  /* olas */
  $$('.tc-wave').forEach((w) => { if (!$('[data-flow]', w)) w.appendChild(pt('tc-flow-pt--wave')); });
  /* final: la cúpula del CTA */
  const pool = $('.tc-pool__in');
  if (pool && !$('[data-flow]', pool)) pool.insertBefore(pt('tc-flow-pt--end'), pool.firstChild);
  /* columna por el margen en las secciones que no declaran nada */
  $$('.tc-sec > .tc-sec__in', main).forEach((box) => {
    const sec = box.parentElement;
    if (sec.hasAttribute('data-flow-skip') || sec.hasAttribute('data-flow-stage')) return;
    if (box.classList.contains('tc-hero__in') || box.classList.contains('tc-phero__in')) return;
    if ($('[data-flow]:not([data-flow-auto])', box)) return;        /* la página ya ha colocado los suyos */
    /* con pasos, el hilo entra directo al primer nodo: sin nodo de cabecera */
    if (!$('[data-flow-steps]', box)) box.appendChild(pt('tc-flow-node tc-flow-pt--spine tc-flow-pt--head', ['data-flow-node']));
    box.appendChild(pt('tc-flow-pt--spine tc-flow-pt--foot'));
  });
  return true;
}

export function initThread() {
  if (!autoPoints()) return;
  if (!$('[data-flow]')) return;
  let canvas = $('.tc-thread');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'tc-thread';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
  }
  if (!canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  let pts = [];        /* {x, y, k, s}: posición en documento, luz del fondo (0..1), longitud acumulada */
  let nodes = [];      /* {y, el, lit} */
  let zones = [];      /* secciones fijadas: {top, h} */
  let secs = [];       /* tramos de luz: {top, h, a, m, b} */
  let head = 0, target = 0;
  const pulses = [];
  let nextPulse = 0;
  let dirty = true;

  function lumAt(y) {
    for (let i = 0; i < secs.length; i++) {
      const s = secs[i];
      if (y >= s.top && y <= s.top + s.h) {
        const t = (y - s.top) / (s.h || 1);
        if (s.m === null) return s.a + (s.b - s.a) * t;
        return t < 0.5 ? s.a + (s.m - s.a) * t * 2 : s.m + (s.b - s.m) * (t - 0.5) * 2;
      }
    }
    return secs.length && y > secs[secs.length - 1].top ? secs[secs.length - 1].b : 0;
  }

  function readSections() {
    secs = [];
    $$('.tc-sec, .tc-pool, .tc-foot').forEach((el) => {
      const top = docPos(el).y, h = el.offsetHeight;
      const attr = el.getAttribute('data-lum');
      let a, m = null, b;
      if (attr) {
        const v = attr.trim().split(/\s+/).map(parseFloat);
        a = v[0]; b = v[v.length - 1]; if (v.length > 2) m = v[1];
      } else if (el.classList.contains('tc-wave')) {
        a = el.classList.contains('tc-wave--from-dusk') ? 0.34 : 0; m = 0.42; b = 1.9;   /* la ola pasa por el blanco y sale a claro */
      } else if (el.classList.contains('tc-foot')) {
        a = 0; b = 0;
      } else if (el.classList.contains('tc-pool')) {
        const cs = getComputedStyle(el);
        a = lumOf(cs.getPropertyValue('--pool-from')) ?? 1; b = a;
        /* dentro de la cúpula el fondo vuelve a ser oscuro */
        const inn = $('.tc-pool__in', el);
        if (inn) { const it = docPos(inn).y; secs.push({ top, h: Math.max(0, it - top), a, m: null, b }); secs.push({ top: it, h: top + h - it, a: 0.12, m: null, b: 0 }); return; }
      } else {
        const cs = getComputedStyle(el);
        a = lumOf(cs.getPropertyValue('--bg-a'));
        b = lumOf(cs.getPropertyValue('--bg-b'));
        const mm = lumOf(cs.getPropertyValue('--bg-m'));
        if (a === null) a = lumOf(cs.backgroundColor) ?? (el.closest('.tone-light') ? 1 : 0);
        if (b === null) b = a;
        if (mm !== null) m = mm;
      }
      secs.push({ top, h, a, m, b });
    });
    secs.sort((p, q) => p.top - q.top);
  }

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    readSections();
    returns.forEach((r) => {
      const lastStep = r.list.lastElementChild;
      r.el.style.top = (docPos(lastStep).y + lastStep.offsetHeight - docPos(r.box).y + 36) + 'px';
    });

    let anchors = [];
    nodes = [];
    $$('[data-flow]').forEach((el) => {
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return;   /* dentro de algo oculto */
      const p = docPos(el);
      anchors.push({ x: p.x, y: p.y });
      if (el.hasAttribute('data-flow-node')) nodes.push({ y: p.y, el, lit: null, origin: el.hasAttribute('data-flow-origin') });
    });
    zones = [];
    const pinned = root.classList.contains('stage-pinned');
    $$('[data-flow-stage]').forEach((st) => {
      const top = docPos(st).y, h = st.offsetHeight;
      const rail = st.querySelector('[data-flow-rail]');
      let x;
      if (rail && rail.offsetParent !== null) x = rail.getBoundingClientRect().left;
      else {
        const wrap = st.querySelector('.tc-wrap') || st;
        x = wrap.getBoundingClientRect().left + parseFloat(getComputedStyle(wrap).paddingLeft || 0) / 2;
      }
      anchors.push({ x, y: top + 2, straight: true });
      anchors.push({ x, y: top + h - 2 });
      if (pinned) zones.push({ top, h });
    });
    anchors.sort((a, b) => a.y - b.y);
    /* descartar puntos casi a la misma altura */
    anchors = anchors.filter((a, i) => i === 0 || a.y - anchors[i - 1].y > 10);

    pts = [];
    let s = 0;
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i], b = anchors[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const n = Math.max(2, Math.ceil(Math.max(dy, Math.hypot(dx, dy)) / STEP));
      /* el vaivén se apaga cuando el hilo va pegado al borde (móvil): nunca se sale de la pantalla */
      const room = Math.max(0, Math.min(a.x, b.x, W - a.x, W - b.x) - 3);
      const sway = a.straight ? 0 : Math.min(16, 6 + Math.abs(dx) * 0.03, room);
      for (let j = (i === 0 ? 0 : 1); j <= n; j++) {
        const t = j / n;
        const y = a.y + dy * t;
        const x = a.x + dx * smoother(t) + Math.sin(t * Math.PI) * Math.sin(y * 0.006 + i) * sway;
        if (pts.length) { const q = pts[pts.length - 1]; s += Math.hypot(x - q.x, y - q.y); }
        pts.push({ x, y, k: clamp(lumAt(y), 0, 1), s });
      }
    }
    dirty = true;
    if (!motion) { lightNodes(Infinity); draw(window.scrollY); }
    else job.start();
  }

  /* y de documento → y de pantalla (comprimiendo las secciones fijadas) */
  function sy(y, scroll) {
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      if (y > z.top && y < z.top + z.h) {
        const o = clamp(scroll - z.top, 0, z.h - H);
        return z.top + o - scroll + ((y - z.top) / z.h) * H;
      }
    }
    return y - scroll;
  }
  /* primer índice con y >= valor (los puntos van ordenados por y) */
  function idxAt(y) {
    let lo = 0, hi = pts.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (pts[m].y < y) lo = m + 1; else hi = m; }
    return lo;
  }

  function color(k, a) {
    /* sobre oscuro: cian · a media luz: blanco · sobre claro: azul royal */
    let r, g, b;
    k = k < 0 ? 0 : k > 1 ? 1 : k;
    if (k < 0.4) { const t = k / 0.4; r = 83 + (255 - 83) * t; g = 205 + (255 - 205) * t; b = 254 + (255 - 254) * t; }
    else { const u = Math.min(1, (k - 0.4) / 0.25); r = 255 + (32 - 255) * u; g = 255 + (113 - 255) * u; b = 255 + (213 - 255) * u; }
    return 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + a.toFixed(3) + ')';
  }

  function draw(scroll) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (pts.length < 2) return;

    const full = !motion;                       /* sin movimiento: hilo completo y quieto */
    const first = pts[0].y, lastY = pts[pts.length - 1].y;
    const hy = full ? lastY : clamp(head, first, lastY);
    const hi = idxAt(hy);
    const hs = pts[hi].s;

    /* desde dónde hay que mirar */
    let y0 = scroll - 60;
    for (let z = 0; z < zones.length; z++) if (y0 > zones[z].top && y0 < zones[z].top + zones[z].h) y0 = zones[z].top;
    const i0 = Math.max(0, idxAt(y0) - 1);

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const CH = 10;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = i0; i < hi; i += CH) {
        const end = Math.min(hi, i + CH);
        const py0 = sy(pts[i].y, scroll);
        if (py0 > H + 60) break;
        if (sy(pts[end].y, scroll) < -60) continue;
        const mid = pts[(i + end) >> 1];
        const near = full ? 0.35 : Math.exp(-(hs - mid.s) / 520);
        const light = mid.k;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, py0);
        for (let j = i + 1; j <= end; j++) ctx.lineTo(pts[j].x, sy(pts[j].y, scroll));
        if (pass === 0) {
          ctx.lineWidth = 9;
          ctx.strokeStyle = color(light, (0.05 + 0.2 * near) * (1 - light * 0.35));
        } else {
          ctx.lineWidth = 1.4 + near * 1.1;
          ctx.strokeStyle = color(light, 0.42 + 0.58 * near);
        }
        ctx.stroke();
      }
    }
    if (full) return;

    /* pulsos: gotas de luz que bajan por lo ya dibujado */
    for (let p = 0; p < pulses.length; p++) {
      const pi = pulses[p].i | 0;
      if (pi >= hi || pi < 0) continue;
      const q = pts[pi], yy = sy(q.y, scroll);
      if (yy < -20 || yy > H + 20) continue;
      const g = ctx.createRadialGradient(q.x, yy, 0, q.x, yy, 14);
      g.addColorStop(0, color(q.k, 0.9)); g.addColorStop(1, color(q.k, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, yy, 14, 0, 6.2832); ctx.fill();
      ctx.fillStyle = q.k > 0.6 ? 'rgba(32,113,213,1)' : 'rgba(255,255,255,.95)';
      ctx.beginPath(); ctx.arc(q.x, yy, 2.1, 0, 6.2832); ctx.fill();
    }

    /* cabeza */
    const hp = pts[hi], hyS = sy(hp.y, scroll);
    if (hyS > -40 && hyS < H + 40) {
      const hg = ctx.createRadialGradient(hp.x, hyS, 0, hp.x, hyS, 34);
      hg.addColorStop(0, color(hp.k, hp.k > 0.6 ? 0.3 : 0.55)); hg.addColorStop(1, color(hp.k, 0));
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hp.x, hyS, 34, 0, 6.2832); ctx.fill();
      ctx.fillStyle = hp.k > 0.6 ? 'rgba(32,113,213,1)' : 'rgba(255,255,255,1)';
      ctx.beginPath(); ctx.arc(hp.x, hyS, 3.4, 0, 6.2832); ctx.fill();
    }
  }

  function lightNodes(hy) {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const lit = n.origin || !motion || hy >= n.y - 4;
      if (lit !== n.lit) { n.lit = lit; n.el.classList.toggle('is-lit', lit); }
    }
  }

  const job = task((t, dt) => {
    const scroll = window.scrollY;
    target = scroll + THREAD_K * H;
    const d = target - head;
    if (Math.abs(d) > 0.4) { head += d * Math.min(1, dt / 16.7 * 0.16); dirty = true; }
    else head = target;

    /* un pulso cada ~2,6 s mientras haya hilo en pantalla */
    if (pts.length && t > nextPulse) {
      nextPulse = t + 2600;
      const start = idxAt(Math.max(pts[0].y, scroll - 20));
      if (start < idxAt(head) - 12) pulses.push({ i: start });
    }
    if (pulses.length) {
      const limit = idxAt(head);
      for (let p = pulses.length - 1; p >= 0; p--) {
        pulses[p].i += dt * 0.085;
        if (pulses[p].i >= limit) pulses.splice(p, 1);
      }
      dirty = true;
    }
    lightNodes(head);
    if (dirty) { draw(scroll); dirty = false; }
    return true;
  });

  onLayout(layout);
  onScroll((y) => {
    dirty = true;
    if (!motion) { lightNodes(Infinity); draw(y); }
  });
  head = window.scrollY + THREAD_K * window.innerHeight;
  layout();
}
