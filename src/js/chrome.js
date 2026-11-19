/* ==========================================================================
   TrustCore · motor "Flujo" · cromo del sitio
   Navegación (ocultar/mostrar, megamenú, hoja móvil, enlace activo),
   transición entre páginas, diálogos, toasts, agenda (calendario incrustado
   bajo demanda) y asistente TrusTy.
   ========================================================================== */
import { root, motion, fine, $, $$, esc, ico, store, track, onScroll } from './core.js';

/* ---------- Diálogos ---------- */
export function openDialog(d) {
  if (!d || d.open) return;
  d.__opener = document.activeElement;
  if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  requestAnimationFrame(() => { d.classList.add('is-open'); });
}
export function closeDialog(d) {
  if (!d || !d.open) return;
  d.classList.remove('is-open');
  setTimeout(() => {
    if (d.close) d.close(); else d.removeAttribute('open');
    d.dispatchEvent(new CustomEvent('tc:dialog-closed'));
    if (d.__opener && d.__opener.focus && document.contains(d.__opener)) d.__opener.focus();
  }, motion ? 280 : 0);
}
/* makeDialog({ id, cls, label, html }) → <dialog> ya en el documento */
export function makeDialog(o) {
  const d = document.createElement('dialog');
  d.className = 'tc-dialog' + (o.cls ? ' ' + o.cls : '');
  if (o.id) d.id = o.id;
  if (o.labelledby) d.setAttribute('aria-labelledby', o.labelledby);
  else if (o.label) d.setAttribute('aria-label', o.label);
  d.innerHTML = '<div class="tc-dialog__panel tone-light">' +
    '<button class="tc-dialog__close" type="button" data-dialog-close aria-label="Cerrar">' + ico('close') + '</button>' +
    o.html + '</div>';
  document.body.appendChild(d);
  wireDialog(d);
  return d;
}
function wireDialog(d) {
  if (d.__wired) return;
  d.__wired = true;
  d.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(d); });
  d.addEventListener('click', (e) => { if (e.target === d) closeDialog(d); });
}
function initDialogs() {
  $$('dialog.tc-dialog').forEach(wireDialog);
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-dialog-open]');
    if (opener) {
      const d = document.getElementById(opener.getAttribute('data-dialog-open'));
      if (d) { e.preventDefault(); wireDialog(d); openDialog(d); }
      return;
    }
    const closer = e.target.closest('[data-dialog-close]');
    if (closer) closeDialog(closer.closest('dialog'));
  });
}

/* ---------- Toasts ---------- */
let toastBox = null;
export function toast(text, opts) {
  opts = opts || {};
  if (!toastBox) {
    toastBox = document.createElement('div');
    toastBox.className = 'tc-toasts';
    toastBox.setAttribute('role', 'status');
    toastBox.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastBox);
  }
  const t = document.createElement('div');
  t.className = 'tc-toast' + (opts.tone ? ' tc-toast--' + opts.tone : '');
  t.innerHTML = ico(opts.icon || (opts.tone === 'err' ? 'alert' : 'check')) + '<span>' + esc(text) + '</span>';
  toastBox.appendChild(t);
  requestAnimationFrame(() => { requestAnimationFrame(() => { t.classList.add('is-in'); }); });
  setTimeout(() => {
    t.classList.remove('is-in');
    setTimeout(() => { t.remove(); }, motion ? 400 : 0);
  }, opts.ms || 4200);
}

/* ---------- Agenda: calendario real de Google Appointments, incrustado al abrir ---------- */
const CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3Ow7HzstHH5pm8DcEiS39JHxT7YvijSbM2Hj_nvTOuebcpR1fXVL8Yrecyp4xJ4i8SfZogboFA';
let agenda = null;
export function openCalendar(e, source) {
  if (e && e.preventDefault) e.preventDefault();
  /* Evento de conversión dedicado para Google Ads. Se dispara en el clic,
     independientemente de si el iframe termina cargando. */
  track('tc_demo_click', { source: source || 'programmatic' });
  if (!agenda) {
    agenda = makeDialog({
      id: 'tc-agenda', cls: 'tc-dialog--agenda', labelledby: 'tc-agenda-t',
      html:
        '<header class="tc-agenda__head"><p class="tc-mono tc-mono--hi">Videollamada · eliges tú el hueco</p>' +
        '<h2 class="tc-dialog__title" id="tc-agenda-t">Agendar demo</h2></header>' +
        '<div class="tc-agenda__frame" data-agenda-frame></div>' +
        '<footer class="tc-agenda__foot">' +
          '<a href="tel:+34666609299" data-track="agenda_tel">' + ico('phone') + ' 666 60 92 99</a>' +
          '<a href="mailto:info@trustcore.es" data-track="agenda_mail">' + ico('mail') + ' info@trustcore.es</a>' +
          '<a href="' + CALENDAR_URL + '" target="_blank" rel="noopener" data-track="agenda_newtab">' + ico('external') + ' Abrir en una pestaña</a>' +
          '<span class="tc-mono">Respuesta en menos de 1 h en horario laboral</span>' +
        '</footer>'
    });
    /* al cerrar se descarga el calendario: la próxima vez empieza limpio */
    agenda.addEventListener('tc:dialog-closed', () => { $('[data-agenda-frame]', agenda).innerHTML = ''; });
  }
  const frame = $('[data-agenda-frame]', agenda);
  frame.classList.remove('is-loaded');
  frame.innerHTML = '<p class="tc-agenda__loading">Cargando el calendario</p>' +
    '<iframe src="' + CALENDAR_URL + '?gv=true" title="Calendario para agendar una demo con TrustCore"></iframe>';
  frame.querySelector('iframe').addEventListener('load', () => { frame.classList.add('is-loaded'); });
  openDialog(agenda);
  track('demo_modal_open');
}
function initCalendar() {
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-calendar-open]');
    if (opener) openCalendar(e, opener.dataset.track || 'programmatic');
  });
}

/* ---------- Seguimiento de CTAs (delegado: sirve para contenido añadido después) ---------- */
function initTracking() {
  const sent = track('tc_page_ready');
  if (!sent) {
    window.addEventListener('tc:consent:analytics-granted', function retry() {
      window.removeEventListener('tc:consent:analytics-granted', retry);
      track('tc_page_ready');
    });
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (!el) return;
    track('cta_click', {
      cta_label: el.dataset.track,
      cta_href: el.getAttribute('href') || '',
      cta_text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120)
    });
  });
}

/* ---------- Navegación ---------- */
function initNav() {
  const nav = $('[data-nav]');
  const sheet = $('[data-sheet]');
  const sheetBtn = $('[data-sheet-toggle]');
  const toggles = $$('[data-menu-toggle]');
  const menus = toggles.map((b) => document.getElementById(b.getAttribute('aria-controls')));

  function setMenu(i, open) {
    const m = menus[i], b = toggles[i];
    if (!m) return;
    m.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', String(open));
  }
  function closeMenus(except) { toggles.forEach((b, i) => { if (i !== except) setMenu(i, false); }); }
  const anyOpen = () => menus.some((m) => m && m.classList.contains('is-open'));

  toggles.forEach((b, i) => {
    const m = menus[i];
    if (!m) return;
    const items = () => $$('a', m);
    let closeT = 0;
    b.addEventListener('click', () => {
      const open = m.classList.contains('is-open');
      /* con ratón, el hover ya lo abrió: el clic solo confirma */
      if (open && fine && b.matches(':hover') && !b.__kbd) return;
      closeMenus(i);
      setMenu(i, !open);
    });
    b.addEventListener('keydown', (e) => {
      b.__kbd = true;
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); closeMenus(i); setMenu(i, true);
        const first = items()[0];
        if (first) setTimeout(() => { first.focus(); }, 60);
      }
    });
    b.addEventListener('pointerdown', () => { b.__kbd = false; });
    m.addEventListener('keydown', (e) => {
      const list = items();
      const k = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); (list[k + 1] || list[0]).focus(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); (list[k - 1] || list[list.length - 1]).focus(); }
      else if (e.key === 'Home') { e.preventDefault(); list[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); list[list.length - 1].focus(); }
    });
    m.addEventListener('focusout', (e) => {
      if (!m.contains(e.relatedTarget) && e.relatedTarget !== b) setMenu(i, false);
    });
    m.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(i, false); });
    if (fine) {
      /* 220 ms de margen antes de cerrar: mover el ratón en diagonal no cierra el menú */
      const over = () => { clearTimeout(closeT); closeMenus(i); setMenu(i, true); };
      const out = () => { clearTimeout(closeT); closeT = setTimeout(() => { setMenu(i, false); }, 220); };
      [b, m].forEach((el) => { el.addEventListener('pointerenter', over); el.addEventListener('pointerleave', out); });
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-menu-toggle], .tc-menu')) closeMenus(-1);
  });

  /* Hoja móvil */
  function setSheet(open) {
    if (!sheet) return;
    sheet.classList.toggle('is-open', open);
    sheetBtn.setAttribute('aria-expanded', String(open));
    sheetBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    root.classList.toggle('is-sheet-open', open);
    if (open) {
      if (nav) nav.classList.remove('is-hidden');
      sheet.scrollTop = 0;
    }
    $$('main, .tc-foot').forEach((el) => { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
  }
  if (sheet && sheetBtn) {
    $$(':scope > *', sheet).forEach((el, i) => { el.style.setProperty('--i', i); });
    sheetBtn.addEventListener('click', () => { setSheet(!sheet.classList.contains('is-open')); });
    sheet.addEventListener('click', (e) => { if (e.target.closest('a, button')) setSheet(false); });
    /* el foco no sale de la hoja + la píldora mientras está abierta */
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !sheet.classList.contains('is-open')) return;
      const f = [sheetBtn].concat($$('a, button', sheet));
      const first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      else if (!f.includes(document.activeElement)) { e.preventDefault(); first.focus(); }
    });
    window.matchMedia('(min-width: 1001px)').addEventListener('change', (m) => { if (m.matches) setSheet(false); });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    toggles.forEach((b, i) => { if (menus[i] && menus[i].classList.contains('is-open')) { setMenu(i, false); b.focus(); } });
    if (sheet && sheet.classList.contains('is-open')) { setSheet(false); sheetBtn.focus(); }
  });

  /* La píldora se esconde al bajar y vuelve al subir */
  if (nav) {
    let lastY = window.scrollY, acc = 0;
    onScroll((y) => {
      const d = y - lastY; lastY = y;
      if ((d > 0) !== (acc > 0)) acc = 0;
      acc += d;
      const busy = anyOpen() || (sheet && sheet.classList.contains('is-open')) || nav.contains(document.activeElement);
      if (y < 240 || acc < -24 || busy) nav.classList.remove('is-hidden');
      else if (acc > 60) nav.classList.add('is-hidden');
    });
  }

  /* Enlace activo: aria-current en la píldora, los menús, la hoja y el pie */
  const path = (location.pathname.replace(/\/+$/, '').replace(/\.html$/, '')) || '/';
  $$('.tc-nav a[href], .tc-sheet a[href], .tc-foot a[href]').forEach((a) => {
    const href = (a.getAttribute('href') || '').replace(/\/+$/, '') || '/';
    if (href === '/' || href !== path) return;
    a.setAttribute('aria-current', 'page');
    const menu = a.closest('.tc-menu');
    if (menu) { const b = $('[aria-controls="' + menu.id + '"]'); if (b) b.classList.add('is-current'); }
  });
  /* las páginas de producto marcan "Productos" aunque no estén en el menú */
  if (/^\/productos(\/|$)/.test(path)) { const b = $('[aria-controls="tc-menu-productos"]'); if (b) b.classList.add('is-current'); }
}

/* ---------- Transición entre páginas ----------
   Con soporte: View Transitions entre documentos (el CSS hace el trabajo; aquí
   solo se decide qué elementos compartidos viajan). Sin soporte, o con ?vt=off
   para probarla, un telón curvo cubre la salida y descubre la llegada. */
function initTransitions() {
  const q = new URLSearchParams(location.search).get('vt');
  if (q === 'off') store.set('tc:novt', '1');
  if (q === 'on') store.del('tc:novt');
  const forced = store.get('tc:novt') === '1';
  const nativeVT = 'PageRevealEvent' in window && !forced;

  if (forced) {
    window.addEventListener('pageswap', (e) => { if (e.viewTransition) e.viewTransition.skipTransition(); });
    window.addEventListener('pagereveal', (e) => { if (e.viewTransition) e.viewTransition.skipTransition(); });
  }

  function isVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight || r.width === 0) return false;
    let o = 1, n = el;
    while (n && n !== document.body) { o *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; }
    return o > 0.5;
  }
  /* data-vt="nombre": el elemento viaja a la página siguiente si allí hay otro con el mismo nombre.
     Solo se nombra lo que está a la vista en el momento del clic, y un nombre no se repite. */
  function tagShared() {
    const seen = {};
    $$('[data-vt]').forEach((el) => {
      const name = el.getAttribute('data-vt');
      const ok = name && !seen[name] && isVisible(el);
      if (ok) seen[name] = 1;
      el.style.viewTransitionName = ok ? name : 'none';
      if (ok) el.style.viewTransitionClass = el.hasAttribute('data-vt-text') ? 'tc-vt-text' : 'tc-vt';
    });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.hasAttribute('data-download') || a.hasAttribute('data-no-transition')) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return;              /* ancla de la misma página */
    if (/\.(pdf|zip|dmg|exe|msi|pkg|csv|xml|txt|mp4)$/i.test(url.pathname)) return;
    if (nativeVT) { tagShared(); return; }                       /* el navegador hace el resto */
    if (!motion) return;
    if (!document.body.classList.contains('tc-body')) return;    /* páginas sin migrar: navegación normal */
    e.preventDefault();
    store.set('tc:arrive', '1');
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 640);
  });
  if (root.classList.contains('is-arriving')) {
    const arrive = () => {
      requestAnimationFrame(() => { requestAnimationFrame(() => {
        root.classList.add('is-arrived');
        setTimeout(() => { root.classList.remove('is-arriving', 'is-arrived'); }, 900);
      }); });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrive); else arrive();
  }
  window.addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('is-leaving', 'is-arriving', 'is-arrived'); });
}

/* ---------- TrusTy: asistente de dudas con respuestas preparadas ----------
   No es IA en vivo: preguntas frecuentes con respuestas del equipo y enlaces a
   fuentes oficiales (AEAT/BOE) y a la propia web. Se inyecta desde aquí en
   todas las páginas. */
function initAssistant() {
  if (window.__tcBotMounted || !document.body) return;
  if (root.hasAttribute('data-no-assistant') || document.body.hasAttribute('data-no-assistant')) return;
  window.__tcBotMounted = true;

  const lang = location.pathname.indexOf('/en/') === 0 ? 'en' : location.pathname.indexOf('/fr/') === 0 ? 'fr' : 'es';

  const AEAT_VERIFACTU = 'https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/nota-informativa-ampliacion-plazo-adaptacion-facturacion.html';
  const AEAT_CEUTA = 'https://sede.agenciatributaria.gob.es/Sede/aduanas/islas-canarias-ciudades-ceuta-melilla/ceuta-melilla.html';
  const BOE_RD1007 = 'https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840';
  const BOE_IPSI = 'https://www.boe.es/buscar/act.php?id=BOE-A-1991-7645';
  const BOE_RDL8 = 'https://www.boe.es/buscar/act.php?id=BOE-A-2019-3481';
  const link = (href, label, external) => '<a href="' + href + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + label + (external ? ' ↗' : '') + '</a>';

  const I18N = {
    es: {
      open: '¿Dudas? Pregunta a TrusTy',
      hint: 'Hola, soy TrusTy. ¿Te resuelvo una duda?',
      title: 'TrusTy · dudas al instante',
      note: 'Respuestas preparadas por el equipo, con fuentes. Para tu caso concreto, agenda una demo.',
      hello: 'Hola, soy TrusTy. Elige una pregunta y te contesto con fuentes oficiales.',
      more: '¿Otra duda? Escríbenos desde ' + link('/contacto', 'contacto') + '.',
      close: 'Cerrar',
      qa: [
        { q: '¿Cuánto cuesta TrustCore?',
          a: 'Control horario desde <strong>5,99 €/usuario/mes</strong> y facturación VeriFactu desde <strong>19,99 €/mes</strong>. Sin permanencia y con 14 días de prueba.<br>' + link('/precios', 'Ver todos los planes') },
        { q: '¿Qué plazos tiene VeriFactu?',
          a: 'Según la AEAT: empresas con Impuesto de Sociedades, <strong>1 de enero de 2027</strong>; el resto de obligados, <strong>1 de julio de 2027</strong>. Adaptarse antes evita el atasco de última hora.<br>' + link(AEAT_VERIFACTU, 'AEAT · plazos oficiales', true) + ' · ' + link(BOE_RD1007, 'BOE · RD 1007/2023', true) + ' · ' + link('/software-verifactu-ipsi-ceuta-melilla', 'Nuestra guía') },
        { q: '¿IVA o IPSI en Ceuta y Melilla?',
          a: 'En Ceuta y Melilla no se aplica IVA sino <strong>IPSI</strong> (Ley 8/1991), con tipos distintos por actividad. TrustinFacts lo aplica automáticamente en cada factura.<br>' + link(AEAT_CEUTA, 'AEAT · Ceuta y Melilla', true) + ' · ' + link(BOE_IPSI, 'BOE · Ley 8/1991', true) + ' · ' + link('/ipsi-ceuta-melilla-guia-practica', 'Guía práctica IPSI') },
        { q: '¿Qué exige el control horario?',
          a: 'El <strong>RDL 8/2019</strong> obliga a registrar la jornada diaria de cada persona, conservar los registros <strong>4 años</strong> y tenerlos disponibles para la Inspección — incluso con 1 solo empleado.<br>' + link(BOE_RDL8, 'BOE · RDL 8/2019', true) + ' · ' + link('/control-horario-obligatorio-guia-2026', 'Guía 2026') },
        { q: '¿Puedo probarlo antes de pagar?',
          a: 'Sí: demo guiada de 15 minutos y <strong>14 días de prueba gratis</strong>, sin tarjeta.<br><button type="button" class="tc-bot__cta" data-bot-demo>Agendar demo de 15 min</button>' },
        { q: '¿Mis datos están seguros?',
          a: 'Cloud <strong>100% europeo</strong> con cifrado AES-256, RGPD nativo y conservación legal de evidencias. Sin transferencias fuera de la UE.<br>' + link('/privacidad', 'Política de privacidad') }
      ]
    },
    en: {
      open: 'Questions? Ask TrusTy',
      title: 'TrusTy · instant answers',
      note: 'Prepared answers with official sources. For your specific case, book a demo.',
      hello: 'Hi, I\'m TrusTy. Pick a question and I\'ll answer with official sources.',
      more: 'Something else? Write to us via ' + link('/contacto', 'contact') + '.',
      close: 'Close',
      qa: [
        { q: 'How much does TrustCore cost?',
          a: 'Time tracking from <strong>€5.99/user/month</strong> and VeriFactu invoicing from <strong>€19.99/month</strong>. No lock-in, 14-day trial.<br>' + link('/en/pricing', 'See all plans') },
        { q: 'What are the VeriFactu deadlines?',
          a: 'Per the Spanish Tax Agency: corporate taxpayers by <strong>January 1, 2027</strong>; everyone else by <strong>July 1, 2027</strong>.<br>' + link(AEAT_VERIFACTU, 'AEAT · official deadlines', true) + ' · ' + link(BOE_RD1007, 'BOE · RD 1007/2023', true) },
        { q: 'VAT or IPSI in Ceuta & Melilla?',
          a: 'Ceuta and Melilla use <strong>IPSI</strong> instead of VAT (Law 8/1991). TrustinFacts applies it automatically on every invoice.<br>' + link(AEAT_CEUTA, 'AEAT · Ceuta & Melilla', true) + ' · ' + link('/en/ipsi-ceuta-melilla-guia-practica', 'Practical IPSI guide') },
        { q: 'What does Spanish time-tracking law require?',
          a: '<strong>RDL 8/2019</strong> requires daily working-time records for every employee, kept for <strong>4 years</strong> and available to the Labour Inspectorate.<br>' + link(BOE_RDL8, 'BOE · RDL 8/2019', true) + ' · ' + link('/en/control-horario-obligatorio-guia-2026', '2026 guide') },
        { q: 'Can I try it before paying?',
          a: 'Yes: a guided 15-minute demo and a <strong>14-day free trial</strong>, no card required.<br><button type="button" class="tc-bot__cta" data-bot-demo>Book a 15-min demo</button>' }
      ]
    },
    fr: {
      open: 'Des questions ? Demandez à TrusTy',
      title: 'TrusTy · réponses immédiates',
      note: 'Réponses préparées avec sources officielles. Pour votre cas précis, réservez une démo.',
      hello: 'Bonjour, je suis TrusTy. Choisissez une question, je réponds avec des sources officielles.',
      more: 'Autre chose ? Écrivez-nous via ' + link('/contacto', 'contact') + '.',
      close: 'Fermer',
      qa: [
        { q: 'Combien coûte TrustCore ?',
          a: 'Pointage dès <strong>5,99 €/utilisateur/mois</strong> et facturation VeriFactu dès <strong>19,99 €/mois</strong>. Sans engagement, essai de 14 jours.<br>' + link('/fr/tarifs', 'Voir les tarifs') },
        { q: 'Quels sont les délais VeriFactu ?',
          a: 'Selon l\'administration fiscale espagnole : sociétés à l\'IS avant le <strong>1er janvier 2027</strong> ; les autres avant le <strong>1er juillet 2027</strong>.<br>' + link(AEAT_VERIFACTU, 'AEAT · délais officiels', true) + ' · ' + link(BOE_RD1007, 'BOE · RD 1007/2023', true) },
        { q: 'TVA ou IPSI à Ceuta et Melilla ?',
          a: 'Ceuta et Melilla appliquent l\'<strong>IPSI</strong> au lieu de la TVA (loi 8/1991). TrustinFacts l\'applique automatiquement.<br>' + link(AEAT_CEUTA, 'AEAT · Ceuta et Melilla', true) + ' · ' + link('/fr/ipsi-ceuta-melilla-guia-practica', 'Guide pratique IPSI') },
        { q: 'Qu\'exige le pointage en Espagne ?',
          a: 'Le <strong>RDL 8/2019</strong> impose l\'enregistrement quotidien du temps de travail, conservé <strong>4 ans</strong> à disposition de l\'Inspection du travail.<br>' + link(BOE_RDL8, 'BOE · RDL 8/2019', true) + ' · ' + link('/fr/control-horario-obligatorio-guia-2026', 'Guide 2026') },
        { q: 'Puis-je essayer avant de payer ?',
          a: 'Oui : démo guidée de 15 minutes et <strong>14 jours d\'essai gratuit</strong>, sans carte.<br><button type="button" class="tc-bot__cta" data-bot-demo>Réserver une démo</button>' }
      ]
    }
  };
  const t = I18N[lang];

  /* TrusTy tiene cuerpo: una gota de luz con ojos que parpadean y siguen al puntero,
     una antena que es el hilo de la página y un halo que respira. Todo SVG + CSS. */
  const avatar = (id) =>
    '<span class="tc-trusty" aria-hidden="true">' +
      '<svg viewBox="0 0 64 64" focusable="false">' +
        '<defs>' +
          '<radialGradient id="tcty-b' + id + '" cx="34%" cy="26%" r="85%"><stop offset="0" stop-color="#E3F7FF"/><stop offset=".38" stop-color="#53CDFE"/><stop offset="1" stop-color="#2071D5"/></radialGradient>' +
          '<radialGradient id="tcty-h' + id + '" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#53CDFE" stop-opacity=".0"/><stop offset=".8" stop-color="#53CDFE" stop-opacity=".35"/><stop offset="1" stop-color="#53CDFE" stop-opacity="0"/></radialGradient>' +
        '</defs>' +
        '<circle class="tc-trusty__halo" cx="32" cy="36" r="30" fill="url(#tcty-h' + id + ')"/>' +
        '<g class="tc-trusty__float">' +
          '<path class="tc-trusty__antenna" d="M32 15 C32 9 37 9 38 5" fill="none" stroke="#B3E8FF" stroke-width="2" stroke-linecap="round"/>' +
          '<circle class="tc-trusty__tip" cx="38.4" cy="4.6" r="2.6" fill="#fff"/>' +
          '<path class="tc-trusty__body" d="M32 14c11.6 0 21 9.4 21 21s-9.4 21-21 21H19a8 8 0 0 1-8-8V35c0-11.6 9.4-21 21-21z" fill="url(#tcty-b' + id + ')"/>' +
          '<path d="M19 27c3-6 9-9 15-8.6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>' +
          '<g class="tc-trusty__face">' +
            '<g class="tc-trusty__eyes">' +
              '<ellipse cx="25" cy="35" rx="4.6" ry="5.4" fill="#fff"/><ellipse cx="40" cy="35" rx="4.6" ry="5.4" fill="#fff"/>' +
              '<g class="tc-trusty__pupils"><circle cx="25.6" cy="35.6" r="2.5" fill="#040F3F"/><circle cx="40.6" cy="35.6" r="2.5" fill="#040F3F"/><circle cx="26.5" cy="34.6" r=".8" fill="#fff"/><circle cx="41.5" cy="34.6" r=".8" fill="#fff"/></g>' +
            '</g>' +
            '<path class="tc-trusty__mouth" d="M28 45.5c2.6 2.4 6.4 2.4 9 0" fill="none" stroke="#040F3F" stroke-width="2" stroke-linecap="round"/>' +
          '</g>' +
        '</g>' +
      '</svg>' +
    '</span>';

  const box = document.createElement('div');
  box.className = 'tc-bot';
  box.innerHTML =
    '<button type="button" class="tc-bot__fab" aria-expanded="false" aria-controls="tc-bot-panel" aria-label="' + t.open + '">' +
      avatar('f') + '<span class="tc-bot__label" aria-hidden="true">' + t.open + '</span>' +
    '</button>' +
    '<section id="tc-bot-panel" class="tc-bot__panel" role="dialog" aria-label="' + t.title + '" hidden>' +
      '<header class="tc-bot__head">' +
        '<span class="tc-bot__avatar">' + avatar('p') + '</span>' +
        '<div><strong>' + t.title + '</strong><small>' + t.note + '</small></div>' +
        '<button type="button" class="tc-bot__close" aria-label="' + t.close + '">' + ico('close') + '</button>' +
      '</header>' +
      '<div class="tc-bot__body" aria-live="polite">' +
        '<div class="tc-bot__msg tc-bot__msg--bot">' + t.hello + '</div>' +
        '<div class="tc-bot__chips"></div>' +
      '</div>' +
    '</section>';
  document.body.appendChild(box);

  const fab = box.querySelector('.tc-bot__fab');
  const panel = box.querySelector('.tc-bot__panel');
  const body = box.querySelector('.tc-bot__body');
  const chips = box.querySelector('.tc-bot__chips');

  t.qa.forEach((item, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tc-bot__chip';
    chip.textContent = item.q;
    chip.addEventListener('click', () => {
      const qEl = document.createElement('div');
      qEl.className = 'tc-bot__msg tc-bot__msg--user';
      qEl.textContent = item.q;
      const aEl = document.createElement('div');
      aEl.className = 'tc-bot__msg tc-bot__msg--bot';
      aEl.innerHTML = item.a;
      body.insertBefore(qEl, chips);
      chip.remove();
      const last = !chips.children.length;
      const answer = () => {
        body.insertBefore(aEl, chips);
        if (last) {
          const bye = document.createElement('div');
          bye.className = 'tc-bot__msg tc-bot__msg--bot';
          bye.innerHTML = t.more;
          body.insertBefore(bye, chips);
        }
        const demoBtn = aEl.querySelector('[data-bot-demo]');
        if (demoBtn) demoBtn.addEventListener('click', (ev) => { openCalendar(ev, 'trusty'); });
        box.classList.remove('is-thinking');
        chips.hidden = false;
        /* la respuesta empieza a la vista: se lleva la pregunta arriba, no el final abajo */
        body.scrollTop = Math.max(0, qEl.offsetTop - 12);
      };
      if (calm) { answer(); }
      else {
        const dots = document.createElement('div');
        dots.className = 'tc-bot__msg tc-bot__msg--bot tc-bot__typing';
        dots.innerHTML = '<i></i><i></i><i></i>';
        body.insertBefore(dots, chips);
        chips.hidden = true;
        box.classList.add('is-thinking');
        body.scrollTop = body.scrollHeight;
        setTimeout(() => { dots.remove(); answer(); }, 720);
      }
      track('trusty_question', { q_index: i, lang });
    });
    chips.appendChild(chip);
  });

  const calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fine = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  if (!calm && fine) {
    let raf = 0, px = 0, py = 0;
    const look = () => {
      raf = 0;
      box.querySelectorAll('.tc-trusty').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 220);
        el.style.setProperty('--lx', ((dx / d) * 2.4 * k).toFixed(2) + 'px');
        el.style.setProperty('--ly', ((dy / d) * 2.2 * k).toFixed(2) + 'px');
      });
    };
    window.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(look); }, { passive: true });
  }

  /* Saludo: una sola vez por sesión, solo en pantallas con sitio, y nunca sobre el banner de cookies. */
  let hint = null;
  const dropHint = () => { if (hint) { hint.remove(); hint = null; } };
  try {
    if (!sessionStorage.getItem('tc_trusty_hi') && window.innerWidth > 720) {
      setTimeout(() => {
        if (!panel.hidden || document.getElementById('tc-cookie-consent')) return;
        sessionStorage.setItem('tc_trusty_hi', '1');
        hint = document.createElement('button');
        hint.type = 'button';
        hint.className = 'tc-bot__hint';
        hint.textContent = t.hint || t.open;
        hint.addEventListener('click', () => { dropHint(); toggle(true); });
        box.insertBefore(hint, fab);
        box.classList.add('is-waving');
        setTimeout(() => { box.classList.remove('is-waving'); }, 2400);
        setTimeout(dropHint, 9000);
      }, 7000);
    }
  } catch (e) { /* sin sessionStorage no hay saludo */ }

  function toggle(open) {
    dropHint();
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    box.classList.toggle('is-open', open);
    if (open) { track('trusty_open'); panel.querySelector('.tc-bot__close').focus(); }
  }
  fab.addEventListener('click', () => { toggle(panel.hidden); });
  /* pasada media pantalla la burbuja se queda en el icono: deja de tapar tarjetas y texto */
  onScroll((y, vh) => { box.classList.toggle('is-compact', y > vh * 0.5); });
  box.querySelector('.tc-bot__close').addEventListener('click', () => { toggle(false); fab.focus(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden && box.contains(document.activeElement)) { toggle(false); fab.focus(); }
  });
}

export function initChrome() {
  initTracking();
  initDialogs();
  initCalendar();
  initNav();
  initTransitions();
  initAssistant();
}
