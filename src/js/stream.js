/* ==========================================================================
   TrustCore · motor "Flujo" · la corriente del hero (pieza autoral)
   Decenas de fibras sueltas —las tareas dispersas— bajan desde el borde, se
   ordenan y se trenzan en un solo punto: ahí nace el hilo que recorre la
   página. Reaccionan al puntero. Se detiene fuera de pantalla, con la pestaña
   oculta y con movimiento reducido (un único cuadro estático).
   Marcado: <div class="tc-sec__in tc-hero__in" data-hero data-intro>
              <canvas class="tc-hero__canvas" data-fibers aria-hidden="true"></canvas>
   ========================================================================== */
import { motion, fine, clamp, task, onLayout } from './core.js';

export function initStream() {
  const canvas = document.querySelector('[data-fibers]');
  if (!canvas || !canvas.getContext) return;
  const host = canvas.closest('[data-hero]') || canvas.parentElement;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0;
  let fibers = [];
  let grads = [];
  const SEG = 44;
  const TAU = Math.PI * 2;
  let px = -9999, py = -9999, tx = -9999, ty = -9999;
  let t0 = 0;
  let visible = true;

  /* azar con semilla: la composición es siempre la misma */
  let seed = 20260;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  const TONES = [
    [83, 205, 254],    /* cian */
    [179, 232, 255],   /* cian suave */
    [58, 140, 235],    /* royal aclarado */
    [255, 255, 255]
  ];

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = host.clientWidth; H = host.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const origin = host.querySelector('[data-flow-origin]');
    if (origin) { cx = origin.offsetLeft; cy = origin.offsetTop; } else { cx = W / 2; cy = H * 0.88; }

    const narrow = W < 760;
    const n = narrow ? 22 : W < 1200 ? 34 : 48;
    seed = 20260;
    fibers = [];
    for (let i = 0; i < n; i++) {
      const u = (i + rnd() * 0.9) / n;
      const fromSide = !narrow && rnd() < 0.28;
      fibers.push({
        sx: fromSide ? W + 40 : W * (narrow ? -0.15 + u * 1.3 : 0.34 + u * 0.78),
        sy: fromSide ? H * (0.04 + rnd() * 0.5) : -40 - rnd() * 80,
        amp: (narrow ? 14 : 26) + rnd() * (narrow ? 38 : 96),
        freq: 0.9 + rnd() * 2.1,
        ph: rnd() * TAU,
        sp: (0.12 + rnd() * 0.34) * (rnd() < 0.5 ? -1 : 1),
        pow: 1.9 + rnd() * 1.5,
        w: 0.6 + rnd() * 1.1,
        a: 0.22 + rnd() * 0.5,
        tone: (rnd() * TONES.length) | 0,
        drop: rnd(),
        dsp: 0.05 + rnd() * 0.09,
        delay: rnd() * 0.5
      });
    }
    grads = TONES.map((c) => {
      const g = ctx.createLinearGradient(0, 0, 0, cy);
      g.addColorStop(0, 'rgba(' + c + ',0)');
      g.addColorStop(0.28, 'rgba(' + c + ',.55)');
      g.addColorStop(0.82, 'rgba(' + c + ',1)');
      g.addColorStop(1, 'rgba(' + c + ',1)');
      return g;
    });
    if (!motion) draw(4.2, 1);
  }

  /* punto de la fibra f en t (0 arriba → 1 en el punto de unión) */
  const out = { x: 0, y: 0 };
  function at(f, t, time) {
    const conv = Math.pow(t, f.pow);
    const loose = 1 - conv;
    const open = Math.sin(Math.min(1, t * 2.6) * Math.PI / 2);
    let x = f.sx + (cx - f.sx) * conv + Math.sin(t * f.freq * TAU + f.ph + time * f.sp) * f.amp * loose * open;
    let y = f.sy + (cy - f.sy) * t + Math.cos(t * f.freq * 4.2 + f.ph * 1.7 + time * f.sp * 0.8) * f.amp * 0.28 * loose * open;
    /* el puntero aparta las fibras */
    const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
    if (d2 < 60000) {
      const push = Math.exp(-d2 / 14000) * 52 * loose;
      const d = Math.sqrt(d2) || 1;
      x += dx / d * push; y += dy / d * push;
    }
    out.x = x; out.y = y;
    return out;
  }

  function draw(time, grow) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    for (let i = 0; i < fibers.length; i++) {
      const f = fibers[i];
      let g = clamp((grow - f.delay) / (1 - f.delay * 0.6), 0, 1);
      if (g <= 0) continue;
      g = 1 - Math.pow(1 - g, 3);
      const lastSeg = Math.max(1, Math.round(SEG * g));
      ctx.beginPath();
      for (let s = 0; s <= lastSeg; s++) {
        const p = at(f, s / SEG, time);
        if (s === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.globalAlpha = f.a;
      ctx.lineWidth = f.w;
      ctx.strokeStyle = grads[f.tone];
      ctx.stroke();

      /* gota que viaja por la fibra */
      if (g >= 1) {
        const td = (f.drop + time * f.dsp) % 1;
        const q = at(f, td, time);
        ctx.globalAlpha = Math.sin(td * Math.PI) * 0.95;
        ctx.fillStyle = 'rgb(' + TONES[f.tone] + ')';
        ctx.beginPath(); ctx.arc(q.x, q.y, 1.2 + f.w * 0.9, 0, TAU); ctx.fill();
      }
    }

    /* el nudo donde todo se une */
    const k = clamp((grow - 0.75) / 0.25, 0, 1);
    if (k > 0) {
      const r = 58 + Math.sin(time * 1.4) * 8;
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      halo.addColorStop(0, 'rgba(83,205,254,' + (0.55 * k).toFixed(3) + ')');
      halo.addColorStop(0.4, 'rgba(32,113,213,' + (0.28 * k).toFixed(3) + ')');
      halo.addColorStop(1, 'rgba(32,113,213,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  const job = task((t) => {
    if (!visible) return false;
    if (!t0) t0 = t;
    const el = (t - t0) / 1000;
    px += (tx - px) * 0.12; py += (ty - py) * 0.12;
    draw(el + 4.2, clamp(el / 2.2, 0, 1));
    return true;
  });

  if (fine && motion) {
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (px < -9000) { px = tx; py = ty; }
    });
    host.addEventListener('pointerleave', () => { tx = -9999; ty = -9999; px = -9999; py = -9999; });
  }

  if (motion && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible) job.start(); else job.stop();
    }, { rootMargin: '40px 0px' }).observe(host);
  }

  onLayout(layout);
  layout();
  if (motion) job.start();
}
