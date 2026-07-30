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
    }
  }

  track('tc_page_ready');

  // ---------- Reveal on scroll ----------
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
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
})();
