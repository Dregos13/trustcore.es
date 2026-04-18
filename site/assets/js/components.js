/* =========================================================================
 * TrustCore UI helpers — progressive enhancement
 * Reveal on scroll, bento pointer tracking, mobile menu, calendar modal.
 * No deps. Load with <script defer> at the end of <body>.
 * ========================================================================= */
(function () {
  'use strict';

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
    // GTM event
    if (window.dataLayer) window.dataLayer.push({ event: 'demo_modal_open' });
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

  // ---------- GTM tracking for primary CTAs ----------
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'cta_click',
          cta_label: el.dataset.track,
          cta_href: el.getAttribute('href') || ''
        });
      }
    });
  });
})();
