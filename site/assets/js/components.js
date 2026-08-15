/* =========================================================================
 * TrustCore UI helpers — progressive enhancement
 * Reveal on scroll, bento pointer tracking, mobile menu, calendar modal.
 * No deps. Load with <script defer> at the end of <body>.
 * ========================================================================= */
(function () {
  'use strict';

  function track(eventName, payload) {
    var eventPayload = Object.assign({
      event: eventName,
      page_path: window.location.pathname,
      page_title: document.title
    }, payload || {});

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventPayload);

    if (
      typeof window.gtag === 'function' &&
      typeof window.tcCanTrackAnalytics === 'function' &&
      window.tcCanTrackAnalytics()
    ) {
      var gaPayload = Object.assign({}, eventPayload);
      delete gaPayload.event;
      window.gtag('event', eventName, gaPayload);
      return true;
    }
    return false;
  }

  // Dispara tc_page_ready al cargar. Si consent aún no está concedido, reintenta una
  // única vez cuando el usuario acepte analytics (evento emitido desde consent.js).
  var pageReadySent = track('tc_page_ready');
  if (!pageReadySent) {
    window.addEventListener('tc:consent:analytics-granted', function retry() {
      window.removeEventListener('tc:consent:analytics-granted', retry);
      track('tc_page_ready');
    });
  }

  // ---------- Reveal on scroll ----------
  // Además de [data-reveal] explícitos, marcamos automáticamente los bloques
  // habituales para que TODAS las páginas tengan aparición al hacer scroll sin
  // tocar su HTML. Solo elementos por debajo del primer viewport (nada del hero
  // parpadea) y con stagger corto entre hermanos.
  var AUTO_REVEAL_SELECTOR = [
    '.tc-bento__card', '.tc-answer-card', '.tc-pricing', '.tc-metric',
    '.tc-testimonial', '.tc-client-card', '.tc-webinar-card', '.tc-flow-step',
    '.tc-learning-module', '.tc-award', '.tc-tldr',
    '.tc-section h2', '.tc-section .tc-eyebrow'
  ].join(',');

  var foldLimit = window.innerHeight * 0.9;
  document.querySelectorAll(AUTO_REVEAL_SELECTOR).forEach(function (el) {
    if (el.hasAttribute('data-reveal') || el.closest('[data-reveal]')) return;
    if (el.getBoundingClientRect().top < foldLimit) return; // visible al cargar: no animar
    el.classList.add('tc-auto-reveal');
    // Stagger: retraso según posición entre hermanos animados (máx 4 pasos).
    var parent = el.parentElement;
    if (parent) {
      var idx = 0, sib = el;
      while ((sib = sib.previousElementSibling) && idx < 4) {
        if (sib.classList.contains('tc-auto-reveal') || sib.hasAttribute('data-reveal')) idx++;
      }
      if (idx) el.style.setProperty('--tc-reveal-delay', (idx * 90) + 'ms');
    }
  });

  var revealEls = document.querySelectorAll('[data-reveal], .tc-auto-reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var pending = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // isIntersecting: entra en viewport. top < 0: ya quedó por encima
        // (carga con ancla #seccion o salto instantáneo) — sin esto quedaría
        // invisible para siempre, porque el estado de intersección no cambia.
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
          var i = pending.indexOf(e.target);
          if (i !== -1) pending.splice(i, 1);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); pending.push(el); });

    // Red de seguridad para saltos que dejan elementos atrás sin cambiar su
    // estado de intersección (scroll instantáneo, restauración del historial).
    var revealTick = false;
    window.addEventListener('scroll', function () {
      if (revealTick || !pending.length) return;
      revealTick = true;
      requestAnimationFrame(function () {
        revealTick = false;
        for (var i = pending.length - 1; i >= 0; i--) {
          if (pending[i].getBoundingClientRect().bottom < 0) {
            pending[i].classList.add('is-revealed');
            io.unobserve(pending[i]);
            pending.splice(i, 1);
          }
        }
      });
    }, { passive: true });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-revealed'); });
  }

  // ---------- Bento pointer highlight ----------
  document.querySelectorAll('.tc-bento__card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // ---------- Pestañas de la plataforma (patrón ARIA tabs) ----------
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    if (!tabs.length) return;

    function select(idx, focus) {
      tabs.forEach(function (t, i) {
        var on = i === idx;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (focus) tabs[idx].focus();
      track('platform_tab', { tab: tabs[idx].id.replace('tab-', '') });
    }

    // Estado inicial desde el marcado: sin JS se ve el primer panel, así que
    // aquí solo hay que ocultar los demás.
    tabs.forEach(function (t, i) {
      if (panels[i]) panels[i].hidden = t.getAttribute('aria-selected') !== 'true';
      t.addEventListener('click', function () { select(i, false); });
    });

    root.querySelector('[role="tablist"]').addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      var next = e.key === 'ArrowRight' ? i + 1
               : e.key === 'ArrowLeft'  ? i - 1
               : e.key === 'Home'       ? 0
               : e.key === 'End'        ? tabs.length - 1 : null;
      if (next === null) return;
      e.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });
  });

  // ---------- Navegación con submenú (accesible) ----------
  (function () {
    var menus = [].slice.call(document.querySelectorAll('.tc-navmenu'));
    if (!menus.length) return;

    function close(menu) {
      var t = menu.querySelector('.tc-navmenu__trigger');
      var p = menu.querySelector('.tc-navmenu__panel');
      if (!t || !p) return;
      t.setAttribute('aria-expanded', 'false');
      p.hidden = true;
    }
    function closeAll(except) {
      menus.forEach(function (m) { if (m !== except) close(m); });
    }

    menus.forEach(function (menu) {
      var trigger = menu.querySelector('.tc-navmenu__trigger');
      var panel = menu.querySelector('.tc-navmenu__panel');
      if (!trigger || !panel) return;
      var items = [].slice.call(panel.querySelectorAll('[role="menuitem"]'));

      function open() {
        closeAll(menu);
        trigger.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
      }

      trigger.addEventListener('click', function () {
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';
        // Con ratón, mouseenter ya lo ha abierto antes de que llegue el click:
        // un toggle normal lo cerraría en el mismo gesto. Si el puntero está
        // encima, el click solo confirma la apertura.
        if (isOpen && menu.matches(':hover')) return;
        if (isOpen) close(menu); else open();
      });

      // Flecha abajo abre y enfoca el primer elemento: es lo que espera un
      // lector de pantalla en un menú.
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); open(); if (items[0]) items[0].focus();
        }
      });

      panel.addEventListener('keydown', function (e) {
        var i = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
        else if (e.key === 'Escape') { close(menu); trigger.focus(); }
        else if (e.key === 'Tab' && i === items.length - 1 && !e.shiftKey) close(menu);
      });

      // En escritorio con ratón, abrir al pasar por encima es lo esperado;
      // el click sigue funcionando para teclado y táctil.
      if (window.matchMedia('(hover: hover) and (min-width: 768px)').matches) {
        menu.addEventListener('mouseenter', open);
        menu.addEventListener('mouseleave', function () { close(menu); });
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.tc-navmenu')) closeAll(null);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll(null);
    });
  })();

  // ---------- Mobile menu toggle (idempotent, safe if button absent) ----------
  var mb = document.getElementById('mobile-menu-btn');
  var mm = document.getElementById('mobile-menu');
  if (mb && mm) {
    mb.addEventListener('click', function () {
      mm.classList.toggle('hidden');
      var open = !mm.classList.contains('hidden');
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ---------- Calendar modal (Google Appointments embed on demand) ----------
  // Any element with [data-calendar-open] triggers the modal.
  var CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3Ow7HzstHH5pm8DcEiS39JHxT7YvijSbM2Hj_nvTOuebcpR1fXVL8Yrecyp4xJ4i8SfZogboFA';
  var overlay = null;

  function openCalendar(e) {
    if (e) e.preventDefault();
    // Evento de conversión dedicado para Google Ads. Se dispara en el click,
    // independientemente de si el iframe termina cargando.
    var trigger = e && e.currentTarget;
    var source = (trigger && trigger.dataset && trigger.dataset.track) || 'programmatic';
    track('tc_demo_click', { source: source });
    if (overlay) { overlay.hidden = false; return; }
    overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Agendar demo');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;' +
      'background:rgba(4,15,63,0.6);backdrop-filter:blur(4px);padding:1rem;';
    overlay.innerHTML =
      '<div style="position:relative;width:100%;max-width:960px;height:min(80vh,720px);' +
      'background:#fff;border-radius:1.25rem;overflow:hidden;' +
      'box-shadow:0 40px 80px -20px rgba(4,15,63,0.4);">' +
        '<button type="button" aria-label="Cerrar" ' +
          'style="position:absolute;top:0.75rem;right:0.75rem;z-index:2;' +
          'width:36px;height:36px;border-radius:50%;border:0;cursor:pointer;' +
          'background:rgba(255,255,255,0.95);color:#040F3F;font-size:1.25rem;' +
          'box-shadow:0 2px 8px rgba(4,15,63,0.15);">&times;</button>' +
        '<iframe src="' + CALENDAR_URL + '?gv=true" ' +
          'style="border:0;width:100%;height:100%;" loading="lazy" ' +
          'title="Agendar demo TrustCore"></iframe>' +
      '</div>';
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay || ev.target.tagName === 'BUTTON') closeCalendar();
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    track('demo_modal_open');
  }
  function closeCalendar() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = '';
  }
  function onKey(e) { if (e.key === 'Escape') closeCalendar(); }

  document.querySelectorAll('[data-calendar-open]').forEach(function (btn) {
    btn.addEventListener('click', openCalendar);
  });

  // ---------- Simulador "Pruébalo": factura IPSI/IVA ----------
  (function () {
    var sim = document.querySelector('[data-sim="factura"]');
    if (!sim) return;

    var state = { base: 1200, concepto: 'Servicios de consultoría', tax: 'ipsi-servicios' };
    var TAXES = {
      'ipsi-servicios': { label: 'IPSI servicios 4%', rate: 0.04 },
      'ipsi-comercio': { label: 'IPSI comercio 0,5%', rate: 0.005 },
      'ipsi-obras': { label: 'IPSI obras 10%', rate: 0.10 },
      'iva': { label: 'IVA 21%', rate: 0.21 }
    };
    var fmt = function (n) {
      // Formato factura española: punto de miles SIEMPRE (CLDR es-ES no agrupa
      // los números de 4 cifras, pero en una factura se espera "9.350,00 €").
      var parts = n.toFixed(2).split('.');
      var entero = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return entero + ',' + parts[1] + ' €';
    };

    function render() {
      var t = TAXES[state.tax];
      var cuota = state.base * t.rate;
      sim.querySelector('[data-sim-doc-concepto]').textContent = state.concepto;
      sim.querySelector('[data-sim-base]').textContent = fmt(state.base);
      sim.querySelector('[data-sim-taxlabel]').textContent = t.label;
      sim.querySelector('[data-sim-cuota]').textContent = fmt(cuota);
      sim.querySelector('[data-sim-total]').textContent = fmt(state.base + cuota);
      var stamp = sim.querySelector('[data-sim-stamp]');
      stamp.classList.remove('is-on'); // cambiar datos "des-emite" la factura
    }

    sim.querySelectorAll('[data-sim-producto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sim.querySelectorAll('[data-sim-producto]').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        state.base = parseFloat(btn.dataset.simProducto);
        state.concepto = btn.dataset.simConcepto;
        render();
      });
    });
    sim.querySelectorAll('[data-sim-tax]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sim.querySelectorAll('[data-sim-tax]').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        state.tax = btn.dataset.simTax;
        render();
      });
    });
    sim.querySelector('[data-sim-emitir]').addEventListener('click', function () {
      sim.querySelector('[data-sim-stamp]').classList.add('is-on');
      var serie = sim.querySelector('[data-sim-serie]');
      if (serie) serie.textContent = '#2026-' + String(Math.floor(1000 + Math.random() * 9000));
      track('sim_factura_emitida', { tax: state.tax, base: state.base });
    });
    render();
  })();

  // ---------- Simulador "Pruébalo": fichaje con firma ----------
  (function () {
    var sim = document.querySelector('[data-sim="fichaje"]');
    if (!sim) return;

    var log = sim.querySelector('[data-sim-log]');
    var empty = sim.querySelector('[data-sim-empty]');
    var btn = sim.querySelector('[data-sim-fichar]');
    var exportBtn = sim.querySelector('[data-sim-export]');
    var summary = sim.querySelector('[data-sim-summary]');
    var entrada = null;

    function fakeHash() {
      var s = '';
      for (var i = 0; i < 8; i++) s += Math.floor(Math.random() * 16).toString(16);
      return s;
    }

    btn.addEventListener('click', function () {
      var now = new Date();
      var hhmm = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      var isEntrada = entrada === null;
      if (empty) empty.hidden = true;

      var li = document.createElement('li');
      li.innerHTML =
        '<span><strong>' + (isEntrada ? 'Entrada' : 'Salida') + '</strong> · ' + hhmm +
        ' · <svg class="tc-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#fa-map-marker-alt"/></svg> Oficina Ceuta</span>' +
        '<span class="tc-sim__hash">firmado · sha256:' + fakeHash() + '…</span>';
      log.appendChild(li);

      if (isEntrada) {
        entrada = now;
        btn.textContent = 'Fichar salida';
      } else {
        var mins = Math.max(1, Math.round((now - entrada) / 60000));
        entrada = null;
        btn.textContent = 'Fichar entrada';
        if (summary) {
          summary.hidden = false;
          summary.querySelector('[data-sim-jornada]').textContent =
            mins < 60 ? mins + ' min' : (mins / 60).toFixed(1).replace('.', ',') + ' h';
        }
        if (exportBtn) exportBtn.hidden = false;
      }
      track('sim_fichaje', { tipo: isEntrada ? 'entrada' : 'salida' });
    });

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        exportBtn.outerHTML =
          '<span class="tc-sim__stamp is-on"><svg class="tc-icon"><use href="/assets/icons/sprite.svg#fa-check-circle"/></svg>' +
          ' Informe generado · conservación 4 años</span>';
        track('sim_fichaje_export');
      });
    }
  })();

  // ---------- Active nav highlight (auto-detects current page) ----------
  (function () {
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    document.querySelectorAll('.tc-nav-link').forEach(function (a) {
      var href = (a.getAttribute('href') || '').replace(/\/+$/, '') || '/';
      var isActive = href !== '/' && path === href;
      if (isActive) {
        a.style.color = 'var(--tc-navy)';
        a.style.fontWeight = '700';
        a.style.borderBottom = '2px solid var(--tc-blue-royal)';
        a.style.paddingBottom = '2px';
      }
    });
  })();

  // ---------- GTM tracking for primary CTAs ----------
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () {
      track('cta_click', {
        cta_label: el.dataset.track,
        cta_href: el.getAttribute('href') || '',
        cta_text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120)
      });
    });
  });

  // ---------- Learning videos: auto-enable when MP4 exists in CloudFront ----------
  (function () {
    var lessonButtons = document.querySelectorAll('[data-video-src]');
    if (!lessonButtons.length) return;

    var videoOverlay = null;

    function setVideoState(button, state) {
      var status = button.querySelector('[data-video-state]');
      button.classList.remove('is-checking', 'is-ready', 'is-pending');
      button.classList.add('is-' + state);

      if (state === 'ready') {
        button.disabled = false;
        button.setAttribute('aria-disabled', 'false');
        if (status) status.textContent = 'Disponible';
        return;
      }

      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      if (status) status.textContent = state === 'checking' ? 'Comprobando vídeo' : 'Próximamente';
    }

    function closeVideo() {
      if (!videoOverlay) return;
      videoOverlay.remove();
      videoOverlay = null;
      document.removeEventListener('keydown', onVideoKey);
      document.body.style.overflow = '';
    }

    function onVideoKey(event) {
      if (event.key === 'Escape') closeVideo();
    }

    function openVideo(button) {
      var src = button.dataset.videoSrc;
      var title = button.dataset.videoTitle || (button.textContent || 'Vídeo TrustCore').trim();
      if (!src || !button.classList.contains('is-ready')) return;

      closeVideo();
      videoOverlay = document.createElement('div');
      videoOverlay.setAttribute('role', 'dialog');
      videoOverlay.setAttribute('aria-modal', 'true');
      videoOverlay.setAttribute('aria-label', title);
      videoOverlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:10000',
        'display:grid',
        'place-items:center',
        'background:rgba(2,10,42,.72)',
        'backdrop-filter:blur(6px)',
        'padding:1rem'
      ].join(';');
      videoOverlay.innerHTML =
        '<div style="position:relative;width:min(100%,860px);background:#020A2A;border:1px solid rgba(255,255,255,.14);border-radius:18px;overflow:hidden;box-shadow:0 34px 90px rgba(2,10,42,.44)">' +
          '<button type="button" aria-label="Cerrar vídeo" data-video-close style="position:absolute;top:.75rem;right:.75rem;z-index:2;width:40px;height:40px;border:0;border-radius:999px;background:rgba(255,255,255,.94);color:#040F3F;font-size:1.35rem;font-weight:800;cursor:pointer">&times;</button>' +
          '<video src="' + src + '" controls autoplay muted playsinline style="display:block;width:100%;aspect-ratio:16/9;background:#020A2A"></video>' +
          '<div style="padding:1rem 1.1rem;color:white;font-weight:800">' + title + '</div>' +
        '</div>';
      videoOverlay.addEventListener('click', function (event) {
        if (event.target === videoOverlay || event.target.closest('[data-video-close]')) closeVideo();
      });
      document.addEventListener('keydown', onVideoKey);
      document.body.appendChild(videoOverlay);
      var activeVideo = videoOverlay.querySelector('video');
      if (activeVideo) {
        activeVideo.defaultMuted = true;
        activeVideo.muted = true;
        activeVideo.volume = 0;
      }
      document.body.style.overflow = 'hidden';
      track('learn_video_open', { video_src: src, video_title: title });
    }

    lessonButtons.forEach(function (button) {
      var src = button.dataset.videoSrc;
      setVideoState(button, 'checking');

      button.addEventListener('click', function () {
        openVideo(button);
      });

      if (!src || !window.fetch) {
        setVideoState(button, 'pending');
        return;
      }

      fetch(src, { method: 'HEAD', cache: 'no-store' })
        .then(function (response) {
          setVideoState(button, response.ok ? 'ready' : 'pending');
        })
        .catch(function () {
          setVideoState(button, 'pending');
        });
    });
  })();

  // ---------- TrusTy: asistente de dudas con respuestas preparadas ----------
  // No es IA en vivo: preguntas frecuentes con respuestas del equipo y enlaces
  // a fuentes oficiales (AEAT/BOE) y a la propia web. Se inyecta en todas las
  // páginas desde aquí para no tocar 64 HTML.
  (function () {
    if (window.__tcBotMounted) return;
    window.__tcBotMounted = true;

    var lang = location.pathname.indexOf('/en/') === 0 ? 'en'
             : location.pathname.indexOf('/fr/') === 0 ? 'fr' : 'es';

    var AEAT_VERIFACTU = 'https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/nota-informativa-ampliacion-plazo-adaptacion-facturacion.html';
    var AEAT_CEUTA = 'https://sede.agenciatributaria.gob.es/Sede/aduanas/islas-canarias-ciudades-ceuta-melilla/ceuta-melilla.html';
    var BOE_RD1007 = 'https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840';
    var BOE_IPSI = 'https://www.boe.es/buscar/act.php?id=BOE-A-1991-7645';
    var BOE_RDL8 = 'https://www.boe.es/buscar/act.php?id=BOE-A-2019-3481';

    function link(href, label, external) {
      return '<a href="' + href + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + label +
        (external ? ' ↗' : '') + '</a>';
    }

    var I18N = {
      es: {
        open: '¿Dudas? Pregunta a TrusTy',
        title: 'TrusTy · dudas al instante',
        note: 'Respuestas preparadas por el equipo, con fuentes. Para tu caso concreto, agenda una demo.',
        hello: 'Hola 👋 Soy TrusTy. Elige una pregunta y te contesto con fuentes oficiales.',
        more: '¿Otra duda? Escríbenos desde ' + link('/contacto', 'contacto') + '.',
        qa: [
          { q: '¿Cuánto cuesta TrustCore?',
            a: 'Control horario desde <strong>2 €/usuario/mes</strong> y facturación VeriFactu desde <strong>19,99 €/mes</strong>. Sin permanencia y con 14 días de prueba.<br>' + link('/precios', 'Ver todos los planes') },
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
        hello: 'Hi 👋 I\'m TrusTy. Pick a question and I\'ll answer with official sources.',
        more: 'Something else? Write to us via ' + link('/contacto', 'contact') + '.',
        qa: [
          { q: 'How much does TrustCore cost?',
            a: 'Time tracking from <strong>€2/user/month</strong> and VeriFactu invoicing from <strong>€19.99/month</strong>. No lock-in, 14-day trial.<br>' + link('/en/pricing', 'See all plans') },
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
        hello: 'Bonjour 👋 Je suis TrusTy. Choisissez une question, je réponds avec des sources officielles.',
        more: 'Autre chose ? Écrivez-nous via ' + link('/contacto', 'contact') + '.',
        qa: [
          { q: 'Combien coûte TrustCore ?',
            a: 'Pointage dès <strong>2 €/utilisateur/mois</strong> et facturation VeriFactu dès <strong>19,99 €/mois</strong>. Sans engagement, essai de 14 jours.<br>' + link('/fr/tarifs', 'Voir les tarifs') },
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
    var t = I18N[lang];

    var root = document.createElement('div');
    root.className = 'tc-bot';
    root.innerHTML =
      '<button type="button" class="tc-bot__fab" aria-expanded="false" aria-controls="tc-bot-panel">' +
        '<svg class="tc-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#fa-robot"/></svg>' +
        '<span>' + t.open + '</span>' +
      '</button>' +
      '<section id="tc-bot-panel" class="tc-bot__panel" role="dialog" aria-label="' + t.title + '" hidden>' +
        '<header class="tc-bot__head">' +
          '<span class="tc-bot__avatar"><svg class="tc-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#fa-robot"/></svg></span>' +
          '<div><strong>' + t.title + '</strong><small>' + t.note + '</small></div>' +
          '<button type="button" class="tc-bot__close" aria-label="Cerrar">' +
            '<svg class="tc-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#fa-times"/></svg>' +
          '</button>' +
        '</header>' +
        '<div class="tc-bot__body">' +
          '<div class="tc-bot__msg tc-bot__msg--bot">' + t.hello + '</div>' +
          '<div class="tc-bot__chips"></div>' +
        '</div>' +
      '</section>';
    document.body.appendChild(root);

    var fab = root.querySelector('.tc-bot__fab');
    var panel = root.querySelector('.tc-bot__panel');
    var body = root.querySelector('.tc-bot__body');
    var chips = root.querySelector('.tc-bot__chips');

    t.qa.forEach(function (item, i) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tc-bot__chip';
      chip.textContent = item.q;
      chip.addEventListener('click', function () {
        var q = document.createElement('div');
        q.className = 'tc-bot__msg tc-bot__msg--user';
        q.textContent = item.q;
        var a = document.createElement('div');
        a.className = 'tc-bot__msg tc-bot__msg--bot';
        a.innerHTML = item.a;
        body.insertBefore(q, chips);
        body.insertBefore(a, chips);
        chip.remove();
        if (!chips.children.length) {
          var bye = document.createElement('div');
          bye.className = 'tc-bot__msg tc-bot__msg--bot';
          bye.innerHTML = t.more;
          body.insertBefore(bye, chips);
        }
        var demoBtn = a.querySelector('[data-bot-demo]');
        if (demoBtn) demoBtn.addEventListener('click', openCalendar);
        body.scrollTop = body.scrollHeight;
        track('trusty_question', { q_index: i, lang: lang });
      });
      chips.appendChild(chip);
    });

    function toggle(open) {
      panel.hidden = !open;
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      root.classList.toggle('is-open', open);
      if (open) { track('trusty_open'); panel.querySelector('.tc-bot__close').focus(); }
    }
    fab.addEventListener('click', function () { toggle(panel.hidden); });
    root.querySelector('.tc-bot__close').addEventListener('click', function () { toggle(false); fab.focus(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) toggle(false);
    });
  })();
})();
