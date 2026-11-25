/* ==========================================================================
   TrustCore · motor "Flujo" · componentes con comportamiento
   Pestañas ARIA, acordeón sobre <details>, conmutador mensual/anual, descargas
   con detección de sistema, cinta, simuladores "Pruébalo", vídeos de Aprende,
   filtros e índice lateral de artículos.
   ========================================================================== */
import { motion, $, $$, esc, ico, track, onResize, emitLayout, ready } from './core.js';
import { makeDialog, openDialog, toast } from './chrome.js';

/* ---------- Pestañas (patrón ARIA tabs) ---------- */
function initTabs() {
  $$('[data-tabs]').forEach((box) => {
    const list = $('[role="tablist"]', box);
    const tabs = $$('[role="tab"]', box);
    if (!list || !tabs.length) return;
    let ink = $('.tc-tabs__ink', box);
    if (!ink && list.classList.contains('tc-tabs__list')) {
      ink = document.createElement('span');
      ink.className = 'tc-tabs__ink';
      ink.setAttribute('aria-hidden', 'true');
      list.insertBefore(ink, list.firstChild);
    }
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    function placeInk(t) {
      if (!ink) return;
      ink.style.width = t.offsetWidth + 'px';
      ink.style.height = t.offsetHeight + 'px';
      ink.style.transform = 'translate3d(' + t.offsetLeft + 'px,' + t.offsetTop + 'px,0)';
    }
    function select(i, focus, silent) {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (panels[j]) panels[j].hidden = !on;
      });
      placeInk(tabs[i]);
      if (focus) tabs[i].focus();
      if (!silent) {
        box.dispatchEvent(new CustomEvent('tabs:change', { detail: i }));
        track('platform_tab', { tab: (tabs[i].id || String(i)).replace('tab-', '') });
      }
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { select(i); });
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        else if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
        else if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
      });
    });
    const current = () => Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));
    /* estado inicial desde el marcado: sin JS se ven todos los paneles */
    select(current(), false, true);
    const fit = () => { placeInk(tabs[current()]); };
    onResize(fit);
    ready.then(fit);
    /* API mínima para piezas que acompañan a las pestañas */
    box.tcSelect = (i) => { select(i); };
  });
}

/* ---------- Acordeón sobre <details> ----------
   Nativo sin JS (y con movimiento reducido). Con movimiento, la altura se anima.
   <details name="grupo"> cierra a sus hermanos, también animado. */
function initAccordion() {
  if (!motion) return;
  const animating = new WeakMap();
  /* <details name="x">: el navegador cierra a los hermanos de golpe en cuanto otro se abre, así que el
     cierre animado no llegaba a verse y la página daba un salto. Con movimiento, el grupo lo lleva el
     motor (data-acc-group); sin JS o con movimiento reducido sigue mandando el atributo name. */
  $$('details.tc-acc__item[name]').forEach((d) => {
    d.setAttribute('data-acc-group', d.getAttribute('name'));
    d.removeAttribute('name');
  });
  function setOpen(d, open) {
    const body = $('.tc-acc__a', d);
    if (!body || !body.animate) { d.open = open; return; }
    const prev = animating.get(d);
    if (prev) prev.cancel();
    if (open) {
      d.open = true;
      d.classList.add('is-open');
      d.classList.remove('is-closing');
    } else {
      d.classList.add('is-closing');
    }
    const h = body.scrollHeight;
    const a = body.animate(
      open ? [{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }] : [{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
      { duration: Math.min(520, 260 + h * 0.5), easing: 'cubic-bezier(.65,0,.35,1)' }
    );
    animating.set(d, a);
    a.onfinish = () => {
      animating.delete(d);
      if (!open) { d.open = false; d.classList.remove('is-open', 'is-closing'); }
      emitLayout();
    };
    a.oncancel = () => { animating.delete(d); };
    if (open) track('faq_open', { question: ($('.tc-acc__q', d).textContent || '').trim().slice(0, 120) });
  }
  document.addEventListener('click', (e) => {
    const q = e.target.closest('.tc-acc__q');
    if (!q) return;
    const d = q.parentElement;
    if (!d || d.tagName !== 'DETAILS') return;
    if (e.target.closest('a')) return;
    e.preventDefault();
    const willOpen = !d.open || d.classList.contains('is-closing');
    const group = d.getAttribute('data-acc-group');
    if (willOpen && group) {
      $$('details.tc-acc__item[open]').forEach((o) => { if (o !== d && o.getAttribute('data-acc-group') === group) setOpen(o, false); });
    }
    setOpen(d, willOpen);
  });
  /* abierto por otra vía (buscar en la página, ancla): sincroniza la clase */
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (d.classList && d.classList.contains('tc-acc__item') && !animating.get(d)) d.classList.toggle('is-open', d.open);
  }, true);
}

/* ---------- Conmutador mensual / anual ----------
   Marcado: <div class="tc-billing" data-billing>
              <span id="lbl-monthly" class="tc-billing__label tc-billing__label--monthly">Mensual</span>
              <button id="billing-toggle" class="tc-switch" role="switch" aria-checked="false" aria-labelledby="…"><span class="tc-switch__thumb"></span></button>
              <span id="lbl-annual" class="tc-billing__label tc-billing__label--annual">Anual</span></div>
   Y en la página: .price-monthly / .price-annual / .savings-note / .cta-monthly / .cta-annual
   (los anuales nacen con el atributo hidden). */
function initBilling() {
  const toggle = document.getElementById('billing-toggle') || $('[data-billing-toggle]');
  if (!toggle) return;
  const box = toggle.closest('.tc-billing') || toggle.parentElement;
  let isAnnual = false;
  function show(selector, visible) {
    $$(selector).forEach((el) => {
      el.hidden = !visible;
      el.classList.toggle('hidden', !visible);      /* páginas antiguas (Tailwind) */
    });
  }
  function apply(annual) {
    isAnnual = annual;
    toggle.setAttribute('aria-checked', annual ? 'true' : 'false');
    toggle.classList.toggle('is-annual', annual);
    if (box) box.classList.toggle('is-annual', annual);
    document.documentElement.classList.toggle('is-billing-annual', annual);
    show('.price-monthly', !annual);
    show('.price-annual', annual);
    show('.savings-note', annual);
    show('.cta-monthly', !annual);
    show('.cta-annual', annual);
  }
  toggle.addEventListener('click', () => { apply(!isAnnual); track('billing_toggle', { billing: isAnnual ? 'annual' : 'monthly' }); });
  toggle.addEventListener('keydown', (e) => {
    if (toggle.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); apply(!isAnnual); }
  });
  /* las etiquetas también conmutan */
  [['lbl-monthly', false], ['lbl-annual', true]].forEach((p) => {
    const l = document.getElementById(p[0]);
    if (l) { l.style.cursor = 'pointer'; l.addEventListener('click', () => { apply(p[1]); }); }
  });
  apply(false);
}

/* ---------- Descargas ----------
   Basta rellenar `url` en este mapa para activar una descarga: mientras esté
   vacía, el botón abre el diálogo "Instalador disponible bajo petición".
   Los instaladores pueden subirse a mano a s3://trustcore.es/descargas/ (el
   despliegue no borra esa carpeta) y enlazarse como "/descargas/archivo.dmg". */
export const DOWNLOADS = {
  'orquesta-mac-arm64':  { app: 'Orquesta', os: 'mac', label: 'macOS (Apple Silicon)', url: '' },
  'orquesta-mac-x64':    { app: 'Orquesta', os: 'mac', label: 'macOS (Intel)', url: '' },
  'orquesta-win':        { app: 'Orquesta', os: 'win', label: 'Windows', url: '' }
};
function detectOS() {
  const ua = navigator.userAgent || '';
  const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua) || (/mac/i.test(p) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/win/i.test(p) || /windows/i.test(ua)) return 'win';
  if (/mac/i.test(p) || /mac os x/i.test(ua)) return 'mac';
  if (/linux/i.test(p) || /linux/i.test(ua)) return 'linux';
  return 'other';
}
/* Intel o Apple Silicon: Chromium lo dice; en Safari se deduce de la GPU. Por defecto, Apple Silicon. */
function detectMacArch() {
  try {
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      return navigator.userAgentData.getHighEntropyValues(['architecture']).then((v) => (v.architecture === 'x86' ? 'x64' : 'arm64'), () => 'arm64');
    }
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    if (/intel|radeon|amd|nvidia/i.test(r) && !/apple m|apple gpu/i.test(r)) return Promise.resolve('x64');
  } catch (e) { /* sin WebGL */ }
  return Promise.resolve('arm64');
}
function variantsOf(app) { return Object.keys(DOWNLOADS).filter((k) => k === app || k.indexOf(app + '-') === 0); }
let dlDialog = null;
function askForInstaller(key) {
  const d = DOWNLOADS[key];
  const subject = 'Instalador de ' + d.app + ' · ' + d.label;
  const mailto = 'mailto:info@trustcore.es?subject=' + encodeURIComponent(subject);
  if (!dlDialog) {
    dlDialog = makeDialog({
      id: 'tc-download', labelledby: 'tc-download-t',
      html: '<p class="tc-mono tc-mono--hi" data-dl-kicker></p>' +
        '<h2 class="tc-dialog__title" id="tc-download-t">Instalador disponible bajo petición</h2>' +
        '<p data-dl-text></p>' +
        '<div class="tc-dialog__actions"><a class="tc-btn tc-btn--primary" data-dl-mail data-track="download_request"><span class="tc-btn__label">' + ico('mail') + ' Pedir el instalador ' + ico('arrow', 'tc-ico--go') + '</span></a></div>' +
        '<div class="tc-dialog__alt"><a href="tel:+34666609299">' + ico('phone') + ' 666 60 92 99</a><a data-dl-mail2>info@trustcore.es</a></div>'
    });
  }
  $('[data-dl-kicker]', dlDialog).textContent = d.app + ' · ' + d.label;
  $('[data-dl-text]', dlDialog).textContent = 'Todavía no publicamos aquí el instalador de ' + d.app + ' para ' + d.label + '. Escríbenos y te lo enviamos por correo.';
  $('[data-dl-mail]', dlDialog).href = mailto;
  $('[data-dl-mail2]', dlDialog).href = mailto;
  openDialog(dlDialog);
}
function initDownloads() {
  const btns = $$('[data-download]');
  if (!btns.length) return;
  const os = detectOS();
  detectMacArch().then((arch) => {
    function pick(app) {
      const keys = variantsOf(app);
      if (DOWNLOADS[app]) return app;                          /* clave exacta */
      let best = keys.find((k) => DOWNLOADS[k].os === os && (os !== 'mac' || !/-(arm64|x64)$/.test(k) || k.endsWith('-' + arch)));
      if (!best) best = keys.find((k) => DOWNLOADS[k].os === os);
      return best || keys[0] || null;
    }
    btns.forEach((a) => {
      const app = a.getAttribute('data-download');
      const key = pick(app);
      if (!key) return;
      const d = DOWNLOADS[key];
      const exact = !!DOWNLOADS[app];
      const match = d.os === os;
      a.setAttribute('data-download-key', key);
      if (d.url) { a.href = d.url; a.setAttribute('download', ''); }
      else { a.setAttribute('role', 'button'); if (!a.getAttribute('href')) a.href = 'mailto:info@trustcore.es?subject=' + encodeURIComponent('Instalador de ' + d.app + ' · ' + d.label); }
      const label = $('[data-download-label]', a);
      if (label && !exact) label.textContent = 'Descargar para ' + d.label;
      /* nota y variantes alternativas */
      const note = a.parentElement && $('[data-download-note]', a.parentElement);
      if (note && !exact) {
        const others = variantsOf(app).filter((k) => k !== key);
        const prefix = match ? 'También para ' : (os === 'ios' || os === 'android' ? 'App de escritorio. Disponible para ' : 'Disponible para ');
        const list = (match ? others : variantsOf(app)).map((k) => '<a href="#" data-download="' + k + '">' + esc(DOWNLOADS[k].label) + '</a>');
        note.innerHTML = list.length ? prefix + list.join(' · ') : '';
      }
    });
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-download]');
    if (!a) return;
    const key = a.getAttribute('data-download-key') || (DOWNLOADS[a.getAttribute('data-download')] ? a.getAttribute('data-download') : null);
    if (!key) return;
    const d = DOWNLOADS[key];
    track('download_click', { app: d.app, variant: key, available: !!d.url });
    if (d.url) {
      if (a.getAttribute('href') !== d.url) { e.preventDefault(); location.href = d.url; }
      toast('Descargando ' + d.app + ' para ' + d.label, { icon: 'dl' });
      return;
    }
    e.preventDefault();
    askForInstaller(key);
  });
}

/* ---------- Cinta: duplica el contenido para que el bucle no tenga costura ---------- */
/* ---------- Zona de descargas de una app con versión completa (.tc-appdl) ----------
   Formulario `[data-appdl-form]` con `data-api` = función license-download del
   servidor de licencias de la app. Correo de la compra + clave → enlaces firmados
   del bucket privado (caducan a los 10 min). En Mac o Windows empieza sola la
   descarga del sistema del visitante y se enseñan los dos botones.
   Privacidad: los campos no tienen `name` (sin JS no se envía nada), y el correo
   y la clave solo van en el cuerpo de ese POST: ni analítica, ni URL, ni logs. */
function appdlPlatform() {
  const os = detectOS();
  return os === 'mac' ? 'mac' : os === 'win' ? 'windows' : null;
}
function initAppDownloads() {
  $$('[data-appdl-form]').forEach((form) => {
    const api = form.getAttribute('data-api');
    const zone = form.closest('.tc-appdl__card') || form.parentElement;
    const email = $('[data-appdl-email]', form), key = $('[data-appdl-key]', form);
    const btn = $('button[type="submit"]', form), label = $('[data-appdl-label]', form);
    const err = $('[data-appdl-err]', form), done = $('[data-appdl-done]', zone);
    const msg = $('[data-appdl-msg]', zone), exp = $('[data-appdl-exp]', zone);
    const links = { mac: $('[data-appdl-file="mac"]', zone), windows: $('[data-appdl-file="windows"]', zone) };
    if (!api || !email || !key || !btn || !label || !err || !done || !msg) return;
    const idle = label.textContent;
    let timer = 0;
    const showErr = (text) => {
      err.textContent = text || '';
      err.hidden = !text;
      [email, key].forEach((i) => {
        i.setAttribute('aria-invalid', text ? 'true' : 'false');
        if (text) i.setAttribute('aria-describedby', err.id); else i.removeAttribute('aria-describedby');
      });
    };
    const busy = (on) => { btn.disabled = on; label.textContent = on ? 'Preparando la descarga…' : idle; };
    const clearLinks = () => Object.keys(links).forEach((p) => { if (links[p]) { links[p].removeAttribute('href'); links[p].hidden = true; } });
    [email, key].forEach((i) => i.addEventListener('input', () => { if (!err.hidden) showErr(''); }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (btn.disabled) return;
      const em = email.value.trim(), k = key.value.trim();
      if (!em) { showErr('Escribe el correo con el que compraste.'); email.focus(); return; }
      if (!k) { showErr('Escribe tu clave de activación.'); key.focus(); return; }
      showErr(''); clearTimeout(timer); clearLinks(); done.hidden = true; busy(true);
      fetch(api, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: em, key: k }),
        credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer'
      })
        .then((r) => r.json().catch(() => ({ ok: false })))
        .then((data) => {
          busy(false);
          if (!data || data.ok !== true) { showErr((data && data.message) || 'No se ha podido preparar la descarga. Prueba en un momento.'); return; }
          const by = {};
          (Array.isArray(data.files) ? data.files : []).forEach((f) => { if (f && f.url && links[f.platform]) by[f.platform] = f; });
          Object.keys(links).forEach((p) => { const a = links[p], f = by[p]; if (!a) return; a.hidden = !f; if (f) a.href = f.url; });
          const plat = appdlPlatform(), mine = plat && by[plat];
          msg.textContent = mine ? 'Compra comprobada. Empieza la descarga de ' + mine.name + '. ¿Quieres el otro sistema?' : 'Compra comprobada. Elige tu sistema:';
          if (exp) exp.hidden = false;
          done.hidden = false;
          const ttl = (typeof data.expiresIn === 'number' && data.expiresIn > 0 ? data.expiresIn : 600) * 1000 - 5000;
          timer = setTimeout(() => { clearLinks(); if (exp) exp.hidden = true; msg.textContent = 'Los enlaces han caducado. Pulsa «Descargar» otra vez.'; }, ttl);
          if (mine) window.location = mine.url;
        })
        .catch(() => { busy(false); showErr('No hay conexión con el servidor. Prueba en un momento.'); });
    });
  });
}

function initBelt() {
  $$('[data-belt]').forEach((belt) => {
    const trackEl = $('.tc-belt__track', belt);
    if (!trackEl || !motion) return;
    Array.prototype.slice.call(trackEl.children).forEach((c) => {
      const clone = c.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      $$('a, button', clone).forEach((f) => { f.tabIndex = -1; });
      trackEl.appendChild(clone);
    });
    belt.classList.add('is-ready');
  });
}

/* ---------- Simulador "Pruébalo": factura IPSI/IVA ---------- */
function initSimFactura() {
  const sim = $('[data-sim="factura"]');
  if (!sim) return;
  const state = { base: 1200, concepto: 'Servicios de consultoría', tax: 'ipsi-servicios' };
  const TAXES = {
    'ipsi-servicios': { label: 'IPSI servicios 4%', rate: 0.04 },
    'ipsi-comercio': { label: 'IPSI comercio 0,5%', rate: 0.005 },
    'ipsi-obras': { label: 'IPSI obras 10%', rate: 0.10 },
    'iva': { label: 'IVA 21%', rate: 0.21 }
  };
  /* Formato factura española: punto de miles SIEMPRE (CLDR es-ES no agrupa los
     números de 4 cifras, pero en una factura se espera "9.350,00 €"). */
  const fmt = (n) => {
    const parts = n.toFixed(2).split('.');
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + parts[1] + ' €';
  };
  const set = (sel, text) => { const el = $(sel, sim); if (el) el.textContent = text; };
  function render() {
    const t = TAXES[state.tax];
    const cuota = state.base * t.rate;
    set('[data-sim-doc-concepto]', state.concepto);
    set('[data-sim-base]', fmt(state.base));
    set('[data-sim-taxlabel]', t.label);
    set('[data-sim-cuota]', fmt(cuota));
    set('[data-sim-total]', fmt(state.base + cuota));
    const stamp = $('[data-sim-stamp]', sim);
    if (stamp) stamp.classList.remove('is-on');      /* cambiar datos "des-emite" la factura */
  }
  function group(attr, onPick) {
    const all = $$('[' + attr + ']', sim);
    all.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.classList.contains('is-active')));
      btn.addEventListener('click', () => {
        all.forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-active'); btn.setAttribute('aria-pressed', 'true');
        onPick(btn);
        render();
      });
    });
    const active = all.find((b) => b.classList.contains('is-active'));
    if (active) onPick(active);
  }
  group('data-sim-producto', (btn) => { state.base = parseFloat(btn.dataset.simProducto); state.concepto = btn.dataset.simConcepto; });
  group('data-sim-tax', (btn) => { state.tax = btn.dataset.simTax; });
  const emit = $('[data-sim-emitir]', sim);
  if (emit) emit.addEventListener('click', () => {
    const stamp = $('[data-sim-stamp]', sim);
    if (stamp) stamp.classList.add('is-on');
    set('[data-sim-serie]', '#2026-' + String(Math.floor(1000 + Math.random() * 9000)));
    track('sim_factura_emitida', { tax: state.tax, base: state.base });
  });
  render();
}

/* ---------- Simulador "Pruébalo": fichaje con firma ---------- */
function initSimFichaje() {
  const sim = $('[data-sim="fichaje"]');
  if (!sim) return;
  const log = $('[data-sim-log]', sim);
  const empty = $('[data-sim-empty]', sim);
  const btn = $('[data-sim-fichar]', sim);
  const exportBtn = $('[data-sim-export]', sim);
  const summary = $('[data-sim-summary]', sim);
  if (!log || !btn) return;
  let entrada = null;
  const label = $('[data-sim-fichar-label]', btn) || btn;
  const place = sim.getAttribute('data-sim-place') || 'Oficina Ceuta';
  function fakeHash() {
    let s = '';
    for (let i = 0; i < 8; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }
  btn.addEventListener('click', () => {
    const now = new Date();
    const hhmm = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const isEntrada = entrada === null;
    if (empty) empty.hidden = true;
    const li = document.createElement('li');
    li.innerHTML = '<span><strong>' + (isEntrada ? 'Entrada' : 'Salida') + '</strong> · ' + hhmm + ' · ' + esc(place) + '</span>' +
      '<span class="tc-sim__hash">firmado · sha256:' + fakeHash() + '…</span>';
    log.appendChild(li);
    if (isEntrada) {
      entrada = now;
      label.textContent = 'Fichar salida';
    } else {
      const mins = Math.max(1, Math.round((now - entrada) / 60000));
      entrada = null;
      label.textContent = 'Fichar entrada';
      if (summary) {
        summary.hidden = false;
        const j = $('[data-sim-jornada]', summary);
        if (j) j.textContent = mins < 60 ? mins + ' min' : (mins / 60).toFixed(1).replace('.', ',') + ' h';
      }
      if (exportBtn) exportBtn.hidden = false;
    }
    track('sim_fichaje', { tipo: isEntrada ? 'entrada' : 'salida' });
  });
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const s = document.createElement('span');
      s.className = 'tc-sim__stamp is-on';
      s.innerHTML = ico('check') + ' Informe generado · conservación 4 años';
      exportBtn.replaceWith(s);
      track('sim_fichaje_export');
    });
  }
}

/* ---------- Vídeos de Aprende: se activan solos cuando el MP4 existe ---------- */
function initVideos() {
  const buttons = $$('[data-video-src]');
  if (!buttons.length) return;
  let dialog = null;
  function setState(button, state) {
    const status = $('[data-video-state]', button);
    button.classList.remove('is-checking', 'is-ready', 'is-pending');
    button.classList.add('is-' + state);
    const readyNow = state === 'ready';
    button.disabled = !readyNow;
    button.setAttribute('aria-disabled', String(!readyNow));
    if (status) status.textContent = readyNow ? 'Disponible' : state === 'checking' ? 'Comprobando vídeo' : 'Próximamente';
  }
  function open(button) {
    const src = button.dataset.videoSrc;
    const title = button.dataset.videoTitle || (button.textContent || 'Vídeo TrustCore').trim();
    /* Fotograma real de la lección (scripts/build-video-posters.mjs): sin él el
       diálogo abría en negro hasta que llegaba el primer cuadro del mp4. */
    const poster = button.dataset.videoPoster;
    if (!src || !button.classList.contains('is-ready')) return;
    if (!dialog) {
      dialog = makeDialog({ id: 'tc-video', cls: 'tc-dialog--wide tc-dialog--media', label: 'Vídeo', html: '<div data-video-slot></div><p class="tc-dialog__caption" data-video-caption></p>' });
      dialog.addEventListener('tc:dialog-closed', () => { $('[data-video-slot]', dialog).innerHTML = ''; });
    }
    dialog.setAttribute('aria-label', title);
    $('[data-video-caption]', dialog).textContent = title;
    $('[data-video-slot]', dialog).innerHTML = '<video src="' + esc(src) + '"' + (poster ? ' poster="' + esc(poster) + '"' : '') + ' controls autoplay muted playsinline></video>';
    const v = $('video', dialog);
    v.defaultMuted = true; v.muted = true; v.volume = 0;
    openDialog(dialog);
    track('learn_video_open', { video_src: src, video_title: title });
  }
  buttons.forEach((button) => {
    const src = button.dataset.videoSrc;
    setState(button, 'checking');
    button.addEventListener('click', () => { open(button); });
    if (!src || !window.fetch) { setState(button, 'pending'); return; }
    fetch(src, { method: 'HEAD', cache: 'no-store' })
      .then((r) => { setState(button, r.ok && !/text\/html/i.test(r.headers.get('content-type') || '') ? 'ready' : 'pending'); })
      .catch(() => { setState(button, 'pending'); });
  });
}

/* ---------- Filtros: <div data-filter-group="#lista"> <button data-filter="cat"> … ----------
   Filtra los hijos de la lista por su data-category (admite varias separadas por espacio). */
function initFilters() {
  $$('[data-filter-group]').forEach((group) => {
    const target = $(group.getAttribute('data-filter-group'));
    const btns = $$('[data-filter]', group);
    if (!target || !btns.length) return;
    function apply(cat) {
      btns.forEach((b) => { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === cat)); });
      let shown = 0;
      $$('[data-category]', target).forEach((item) => {
        const ok = cat === 'all' || item.getAttribute('data-category').split(/\s+/).indexOf(cat) !== -1;
        item.classList.toggle('is-filtered-out', !ok);
        if (ok) { shown++; item.classList.add('is-in'); }
      });
      const empty = $('[data-filter-empty]', target.parentElement || document);
      if (empty) empty.hidden = shown > 0;
      emitLayout();
    }
    btns.forEach((b) => { b.addEventListener('click', () => { apply(b.getAttribute('data-filter')); track('filter', { category: b.getAttribute('data-filter') }); }); });
    const start = btns.find((b) => b.getAttribute('aria-pressed') === 'true') || btns[0];
    apply(start.getAttribute('data-filter'));
  });
}

/* ---------- Índice lateral: <nav class="tc-toc" data-toc="#articulo"> ----------
   Si está vacío se genera con los <h2 id> del artículo; resalta la sección en lectura. */
function initToc() {
  $$('[data-toc]').forEach((nav) => {
    const scope = $(nav.getAttribute('data-toc')) || document;
    let list = $('ol, ul', nav);
    const heads = $$('h2', scope).filter((h) => !h.closest('.tc-toc, .tc-answer, .tc-note'));
    if (!heads.length) { nav.hidden = true; return; }
    heads.forEach((h, i) => { if (!h.id) h.id = 'seccion-' + (i + 1); });
    if (!list) {
      list = document.createElement('ol');
      heads.forEach((h) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + h.id; a.textContent = h.textContent.trim();
        li.appendChild(a); list.appendChild(li);
      });
      nav.appendChild(list);
    }
    const links = $$('a[href^="#"]', nav);
    if (!('IntersectionObserver' in window)) return;
    const seen = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) seen.add(e.target.id); else seen.delete(e.target.id); });
      let current = heads.find((h) => seen.has(h.id));
      if (!current) current = heads.filter((h) => h.getBoundingClientRect().top < 120).pop();
      links.forEach((a) => {
        if (current && a.getAttribute('href') === '#' + current.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-90px 0px -60% 0px' });
    heads.forEach((h) => { io.observe(h); });
  });
}

/* Tablas anchas: el contenedor con scroll debe poder recibir el foco */
function initTables() {
  $$('.tc-table-wrap').forEach((w) => {
    if (w.scrollWidth > w.clientWidth + 2 && !w.hasAttribute('tabindex')) {
      w.tabIndex = 0;
      if (!w.getAttribute('aria-label') && !w.getAttribute('aria-labelledby')) { w.setAttribute('role', 'region'); w.setAttribute('aria-label', 'Tabla desplazable'); }
    }
  });
}

export function initUI() {
  initTabs();
  initAccordion();
  initBilling();
  initDownloads();
  initAppDownloads();
  initBelt();
  initSimFactura();
  initSimFichaje();
  initVideos();
  initFilters();
  initToc();
  ready.then(initTables);
}
