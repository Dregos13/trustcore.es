/* ==========================================================================
   TrustCore · motor "Flujo" · escenario fijado de productos
   En escritorio la sección queda fija y los productos se suceden con una
   transición continua ligada al scroll: cada [data-stage-panel] recibe
     --e  entrada 0→1   (sube desde abajo, se endereza)
     --x  salida 0→1    (se hunde hacia atrás)
   y el CSS calcula transform y opacity. El progreso lleva una pequeña inercia
   para que el relevo sea líquido. En móvil/tablet, sin JS o con movimiento
   reducido, los productos van apilados y se revelan al entrar.
   Marcado: <section class="tc-sec tc-stage" data-stage data-flow-stage> … (ver la guía)
   ========================================================================== */
import { root, motion, clamp, $$, docPos, task, onScroll, onLayout } from './core.js';
import { THREAD_K } from './thread.js';

export function initStage() {
  const stage = document.querySelector('[data-stage]');
  if (!stage) return;
  const panels = $$('[data-stage-panel]', stage);
  const railNodes = $$('[data-stage-node]', stage);
  const auras = $$('.tc-stage__aura i', stage);
  const counter = stage.querySelector('[data-stage-count]');
  const N = panels.length;
  if (!N) return;
  const SPAN = N + 0.6;            /* alto de la sección en pantallas (el CSS lo calcula con --stage-n) */
  const HOLD = 0.7;                /* parte de cada pantalla en la que el producto está quieto */
  let pinned = false, top = 0, vh = 0;
  let q = 0, qs = 0, active = -1;
  stage.style.setProperty('--stage-n', N);

  function mode() {
    const want = motion && window.innerWidth >= 1180 && window.innerHeight >= 680;
    if (want !== pinned) {
      pinned = want;
      root.classList.toggle('stage-pinned', pinned);
      if (!pinned) panels.forEach((p) => { p.style.removeProperty('--e'); p.style.removeProperty('--x'); p.classList.remove('is-active'); });
    }
  }

  function apply() {
    let now = 0;
    for (let i = 0; i < N; i++) {
      const e = i === 0 ? 1 : clamp((qs - (i - (1 - HOLD))) / (1 - HOLD), 0, 1);
      const x = i === N - 1 ? 0 : clamp((qs - (i + HOLD)) / (1 - HOLD), 0, 1);
      const p = panels[i];
      p.style.setProperty('--e', e.toFixed(4));
      p.style.setProperty('--x', x.toFixed(4));
      if (e >= 0.5) now = i;
      if (auras[i]) auras[i].style.setProperty('--o', (e * (1 - x)).toFixed(3));
    }
    if (now !== active) {
      active = now;
      panels.forEach((p, i) => { p.classList.toggle('is-active', i === active); });
      railNodes.forEach((n, i) => { n.classList.toggle('is-lit', i <= active); });
      if (counter) counter.textContent = (active + 1 < 10 ? '0' : '') + (active + 1);
    }
  }

  function layout() {
    mode();
    vh = window.innerHeight;
    top = docPos(stage).y;
    if (pinned) {
      /* cada nodo del raíl va justo donde estará la cabeza del hilo cuando entre su producto */
      railNodes.forEach((n, i) => { n.style.top = (((i - 0.15 + THREAD_K) / SPAN) * vh).toFixed(1) + 'px'; });
      q = clamp((window.scrollY - top) / vh, 0, N - 1 + HOLD);
      qs = q;
      apply();
    }
  }

  const job = task((t, dt) => {
    if (!pinned) return false;
    const d = q - qs;
    if (Math.abs(d) < 0.0006) { qs = q; apply(); return false; }
    qs += d * Math.min(1, dt / 16.7 * 0.14);
    apply();
    return true;
  });

  onScroll((y) => {
    if (!pinned) return;
    if (y < top - vh || y > top + vh * (SPAN + 0.2)) return;     /* lejos: nada que hacer */
    q = clamp((y - top) / vh, 0, N - 1 + HOLD);
    job.start();
  });
  onLayout(layout);

  /* sin fijar: revelado normal por producto */
  if (motion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });
    panels.forEach((p) => { io.observe(p); });
  } else panels.forEach((p) => { p.classList.add('is-in'); });

  /* enlaces #id de cada producto: llevar al punto exacto del recorrido */
  function goTo(i, smooth) {
    const y = pinned ? top + (i + 0.12) * vh : docPos(panels[i]).y - 90;
    window.scrollTo({ top: y, behavior: smooth && motion ? 'smooth' : 'auto' });
  }
  function indexOfHash(h) {
    if (!h || h.length < 2) return -1;
    return panels.findIndex((p) => '#' + p.id === h);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname) return;
    const i = indexOfHash(url.hash);
    if (i < 0) return;
    e.preventDefault();
    history.pushState(null, '', url.hash);
    goTo(i, true);
  });
  /* si el foco entra en un producto que no está en pantalla, se le lleva hasta él */
  panels.forEach((p, i) => {
    p.addEventListener('focusin', () => { if (pinned && i !== active) goTo(i, false); });
  });

  layout();
  const i0 = indexOfHash(location.hash);
  if (i0 >= 0) window.addEventListener('load', () => { layout(); goTo(i0, false); });
}
