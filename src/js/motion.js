/* ==========================================================================
   TrustCore · motor "Flujo" · movimiento
   Titulares por palabras, revelados al entrar en pantalla, escalonados, bucles
   que solo corren a la vista, texto que se enciende con el scroll, reserva JS
   de los efectos de scroll, microinteracciones y contadores.
   ========================================================================== */
import { root, motion, fine, clamp, $, $$, task, onScroll, ready } from './core.js';

/* ---------- Titulares cinéticos: partir en palabras ---------- */
export function splitWords(el, cls) {
  let i = 0;
  (function walk(node) {
    Array.prototype.slice.call(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          if (cls) { w.className = cls; w.textContent = p; }
          else {
            w.className = 'tc-w';
            const inner = document.createElement('span');
            inner.className = 'tc-w__i'; inner.textContent = p;
            w.appendChild(inner);
          }
          w.style.setProperty('--i', i++);
          frag.appendChild(w);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'SVG' && n.tagName !== 'svg' && !n.classList.contains('tc-glyph')) { walk(n); }
    });
  })(el);
  return i;
}
function prepareWords(el) {
  if (el.classList.contains('is-split')) return;
  if (motion) {
    splitWords(el);
    /* el degradado de .tc-hl no sobrevive a un span con transform: se aplica a cada palabra */
    $$('.tc-hl', el).forEach((h) => {
      h.classList.remove('tc-hl');
      $$('.tc-w__i', h).forEach((w) => { w.classList.add('tc-hl'); });
    });
  }
  el.classList.add('is-split');
}

/* ---------- Revelados ---------- */
let revealIO = null;
let pending = [];
let started = false;
const waiting = [];
function show(el) {
  el.classList.add('is-in');
  const i = pending.indexOf(el);
  if (i !== -1) pending.splice(i, 1);
}
function observe(el) {
  if (!motion || !revealIO) { show(el); return; }
  pending.push(el);
  revealIO.observe(el);
}
/* reveal(el): registra un elemento (también los que se añadan después) */
export function reveal(el) {
  if (el.getAttribute('data-reveal') === 'words') prepareWords(el);
  if (!started) { waiting.push(el); return; }
  if (el.closest('[data-intro]')) show(el); else observe(el);
}
export function scan(scope) {
  $$('[data-stagger]', scope).forEach((box) => {
    Array.prototype.forEach.call(box.children, (c, i) => {
      if (!c.style.getPropertyValue('--i')) c.style.setProperty('--i', i);
    });
  });
  $$('[data-reveal]', scope).forEach(reveal);
}

function start() {
  started = true;
  if (motion && 'IntersectionObserver' in window) {
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        /* top < 0: ya quedó por encima (carga con ancla o salto instantáneo) */
        if (e.isIntersecting || e.boundingClientRect.top < 0) { show(e.target); revealIO.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });
    /* red de seguridad: saltos que dejan elementos atrás sin cambiar su intersección */
    onScroll(() => {
      if (!pending.length) return;
      for (let i = pending.length - 1; i >= 0; i--) {
        const el = pending[i];
        if (el.getBoundingClientRect().bottom < 0) { revealIO.unobserve(el); show(el); }
      }
    });
  }
  waiting.splice(0).forEach(reveal);
}

/* Elementos con animación en bucle: solo corren mientras se ven (clase .is-live) */
let liveIO = null;
export function live(el) {
  if (!liveIO) { el.classList.add('is-live'); return; }
  liveIO.observe(el);
}

/* ---------- Texto que se enciende con el scroll (manifiesto) ---------- */
function scrub(el) {
  if (!motion) return;
  const n = splitWords(el, 'tc-sw');
  const words = $$('.tc-sw', el);
  el.classList.add('is-scrub');
  let lit = -1;
  function upd(y, vh) {
    const r = el.getBoundingClientRect();
    const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.34), 0, 1);
    const k = Math.round(p * n);
    if (k === lit) return;
    for (let i = 0; i < words.length; i++) words[i].classList.toggle('is-on', i < k);
    lit = k;
  }
  onScroll(upd);
  upd(window.scrollY, window.innerHeight);
}

/* ---------- Reserva JS para los efectos de scroll hechos en CSS ---------- */
function scrollFallback() {
  const cssScroll = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  if (!motion || cssScroll) return;
  const plx = $$('[data-plx]').map((el) => {
    const cs = getComputedStyle(el);
    return { el, amt: parseFloat(cs.getPropertyValue('--plx')) || 60, rot: parseFloat(cs.getPropertyValue('--plx-r')) || 0, on: false };
  });
  if (plx.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { plx.forEach((p) => { if (p.el === e.target) p.on = e.isIntersecting; }); });
    }, { rootMargin: '120px 0px' });
    plx.forEach((p) => { io.observe(p.el); });
    onScroll((y, vh) => {
      plx.forEach((p) => {
        if (!p.on) return;
        const box = p.el.parentElement.getBoundingClientRect();
        const t = clamp((vh - box.top) / (vh + box.height), 0, 1);
        const d = 1 - 2 * t;
        p.el.style.transform = 'translate3d(0,' + (d * p.amt).toFixed(1) + 'px,0)' + (p.rot ? ' rotate(' + (d * p.rot).toFixed(2) + 'deg)' : '');
      });
    });
  }
  const bar = $('.tc-nav__progress');
  if (bar) onScroll((y, vh) => {
    const max = root.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
  });
  $$('.tc-phero__shot[data-rise]').forEach((el) => {
    onScroll((y, vh) => {
      const r = el.getBoundingClientRect();
      const t = clamp((vh - r.top) / (vh * 0.46 + r.height * 0.46), 0, 1);
      el.style.transform = 'rotateX(' + ((1 - t) * 18).toFixed(2) + 'deg) scale(' + (0.94 + 0.06 * t).toFixed(4) + ')';
    });
  });
}

/* ---------- Microinteracciones (solo con puntero fino y movimiento) ---------- */
function micro() {
  if (!fine || !motion) return;
  /* botones magnéticos */
  $$('[data-magnet]').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.classList.add('is-magnet');
      b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1) + 'px');
      b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.36).toFixed(1) + 'px');
    });
    b.addEventListener('pointerleave', () => {
      b.classList.remove('is-magnet');
      b.style.setProperty('--mx', '0px');
      b.style.setProperty('--my', '0px');
    });
  });
  /* foco de luz que sigue al puntero (delegado: vale para contenido añadido después) */
  document.addEventListener('pointermove', (e) => {
    const c = e.target.closest && e.target.closest('.tc-spot');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--sx', (e.clientX - r.left).toFixed(0) + 'px');
    c.style.setProperty('--sy', (e.clientY - r.top).toFixed(0) + 'px');
  }, { passive: true });
  /* inclinación 3D */
  $$('[data-tilt]').forEach((c) => {
    const max = parseFloat(c.getAttribute('data-tilt')) || 3.2;
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      c.classList.add('is-tilting');
      c.style.setProperty('--ry', (px * max * 2).toFixed(2) + 'deg');
      c.style.setProperty('--rx', (-py * max * 2).toFixed(2) + 'deg');
    });
    c.addEventListener('pointerleave', () => {
      c.classList.remove('is-tilting');
      c.style.setProperty('--rx', '0deg');
      c.style.setProperty('--ry', '0deg');
    });
  });
  /* paralaje con el puntero (tareas del hero) */
  $$('[data-pointer-parallax]').forEach((box) => {
    const host = box.closest('.tc-sec__in') || box;
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      box.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      box.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
  });
}

/* ---------- Contadores: data-count="1200" [data-decimals="2"] [data-thousands] ---------- */
function countUp(el) {
  const to = parseFloat(el.getAttribute('data-count'));
  const dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
  const thousands = el.hasAttribute('data-thousands');
  const fmt = (v) => {
    const parts = v.toFixed(dec).split('.');
    if (thousands) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
  };
  if (!motion || isNaN(to)) { if (!isNaN(to)) el.textContent = fmt(to); return; }
  let t0 = 0;
  const dur = 1500;
  task((t) => {
    if (!t0) t0 = t;
    const p = clamp((t - t0) / dur, 0, 1);
    el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)));
    if (p >= 1) { el.textContent = fmt(to); return false; }
    return true;
  }).start();
}
function counters() {
  const els = $$('[data-count]');
  if (!els.length || !('IntersectionObserver' in window) || !motion) return;
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      setTimeout(() => { countUp(e.target); }, 180);
    });
  }, { threshold: 0.6 });
  els.forEach((el) => {
    /* reserva el ancho final para que la cifra no empuje el texto al contar */
    el.style.minWidth = el.offsetWidth + 'px';
    el.textContent = '0';
    io.observe(el);
  });
}

export function initMotion() {
  /* partir los titulares cuanto antes: mientras no lo estén, el CSS los oculta */
  $$('[data-reveal="words"]').forEach(prepareWords);
  $$('[data-split]').forEach((el) => { if (el.getAttribute('data-reveal') !== 'words') prepareWords(el); });
  scan(document);
  if ('IntersectionObserver' in window) {
    liveIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { e.target.classList.toggle('is-live', e.isIntersecting); });
    }, { rootMargin: '80px 0px' });
  }
  $$('[data-live]').forEach(live);
  $$('[data-scrub-words]').forEach(scrub);
  scrollFallback();
  micro();
  counters();
  ready.then(start);
}
