(function () {
  'use strict';

  var GA_ID = 'G-X51VCZEP30';
  var STORAGE_KEY = 'tc_cookie_consent_v1';
  var CONSENT_VERSION = 1;
  var root = null;
  var initialConsent = readConsent();

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: initialConsent && initialConsent.analytics ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.version === CONSENT_VERSION ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function writeConsent(values) {
    var record = {
      version: CONSENT_VERSION,
      necessary: true,
      analytics: !!values.analytics,
      marketing: !!values.marketing,
      updatedAt: new Date().toISOString()
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (error) {
      return;
    }
    applyConsent(record, true);
    closePanel();
  }

  function updateGoogleConsent(consent) {
    window.gtag('consent', 'update', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied'
    });
  }

  function loadScript(id, src) {
    if (document.getElementById(id)) return;
    var script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  function initGoogleAnalytics() {
    if (window.__tcGa4Loaded) return;
    window.__tcGa4Loaded = true;
    loadScript('tc-ga4', 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID));
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=Lax;Secure'
    });
  }

  function expireCookie(name, domain) {
    var cookie = name + '=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax; Secure';
    document.cookie = domain ? cookie + '; domain=' + domain : cookie;
  }

  function clearAnalyticsCookies() {
    var hostname = window.location.hostname;
    var rootDomain = hostname.split('.').slice(-2).join('.');
    document.cookie.split(';').forEach(function (part) {
      var name = part.split('=')[0].trim();
      if (!/^(_ga|_gid|_gat)/.test(name)) return;
      expireCookie(name);
      expireCookie(name, hostname);
      if (rootDomain && rootDomain !== hostname) expireCookie(name, '.' + rootDomain);
    });
  }

  function applyConsent(consent, sendConsentPageView) {
    updateGoogleConsent(consent);

    if (!consent.analytics) {
      clearAnalyticsCookies();
      return;
    }

    if (sendConsentPageView) {
      window.gtag('event', 'page_view', {
        send_to: GA_ID,
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }

    // Notifica a otros scripts (components.js) que analytics acaba de habilitarse,
    // para que puedan disparar eventos pendientes (p. ej. tc_page_ready).
    try {
      window.dispatchEvent(new CustomEvent('tc:consent:analytics-granted'));
    } catch (error) { /* IE11 no soporta CustomEvent constructor: ignoramos */ }
  }

  window.tcCanTrackAnalytics = function () {
    var consent = readConsent();
    return !!(consent && consent.analytics);
  };

  window.tcOpenCookieSettings = function () {
    showPanel(true);
  };

  function styles() {
    if (document.getElementById('tc-cookie-styles')) return;
    var style = document.createElement('style');
    style.id = 'tc-cookie-styles';
    style.textContent = [
      '#tc-cookie-consent{position:fixed;inset:auto 16px 16px 16px;z-index:10000;display:flex;justify-content:center;pointer-events:none}',
      '#tc-cookie-consent *{box-sizing:border-box}',
      '.tc-cookie-card{pointer-events:auto;width:min(100%,920px);background:#fff;border:1px solid rgba(15,23,42,.16);border-radius:12px;box-shadow:0 24px 80px rgba(4,15,63,.28);color:#0f172a;overflow:hidden}',
      '.tc-cookie-body{padding:18px;display:grid;gap:14px}',
      '.tc-cookie-title{margin:0;color:#040F3F;font-size:18px;line-height:1.25;font-weight:800}',
      '.tc-cookie-text{margin:0;color:#475569;font-size:14px;line-height:1.55}',
      '.tc-cookie-text a{color:#2071D5;font-weight:700;text-decoration:none}',
      '.tc-cookie-actions{display:flex;flex-wrap:wrap;gap:10px}',
      '.tc-cookie-btn{appearance:none;border:1px solid rgba(32,113,213,.24);border-radius:8px;padding:10px 14px;font-size:14px;font-weight:800;cursor:pointer;background:#fff;color:#040F3F;min-height:42px}',
      '.tc-cookie-btn:hover{border-color:#2071D5}',
      '.tc-cookie-btn-primary{background:#2071D5;border-color:#2071D5;color:#fff}',
      '.tc-cookie-btn-danger{background:#0f172a;border-color:#0f172a;color:#fff}',
      '.tc-cookie-panel{border-top:1px solid rgba(15,23,42,.12);background:#f8fafc;padding:0 18px 18px;display:none}',
      '.tc-cookie-panel.is-open{display:block}',
      '.tc-cookie-option{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;margin-top:14px;padding:14px;border:1px solid rgba(15,23,42,.12);border-radius:10px;background:#fff}',
      '.tc-cookie-option strong{display:block;color:#040F3F;font-size:14px}',
      '.tc-cookie-option span{display:block;margin-top:4px;color:#64748b;font-size:13px;line-height:1.45}',
      '.tc-cookie-toggle{width:48px;height:28px;accent-color:#2071D5}',
      '@media (max-width:640px){#tc-cookie-consent{inset:auto 10px 10px 10px}.tc-cookie-actions{display:grid}.tc-cookie-btn{width:100%}.tc-cookie-option{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(style);
  }

  function closePanel() {
    if (root) {
      root.remove();
      root = null;
    }
  }

  function showPanel(openSettings) {
    styles();
    closePanel();

    var current = readConsent() || { necessary: true, analytics: false, marketing: false };
    root = document.createElement('div');
    root.id = 'tc-cookie-consent';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');
    root.setAttribute('aria-label', 'Configuracion de cookies');
    root.innerHTML =
      '<div class="tc-cookie-card">' +
        '<div class="tc-cookie-body">' +
          '<div>' +
            '<h2 class="tc-cookie-title">Cookies de TrustCore</h2>' +
            '<p class="tc-cookie-text">Usamos cookies tecnicas necesarias y, solo si aceptas, Google Analytics para medir visitas y mejorar la web. Puedes aceptar, rechazar o configurar por finalidad. <a href="/cookies">Ver politica de cookies</a>.</p>' +
          '</div>' +
          '<div class="tc-cookie-actions" aria-label="Opciones de cookies">' +
            '<button type="button" class="tc-cookie-btn tc-cookie-btn-primary" data-cookie-accept>Aceptar</button>' +
            '<button type="button" class="tc-cookie-btn tc-cookie-btn-danger" data-cookie-reject>Rechazar</button>' +
            '<button type="button" class="tc-cookie-btn" data-cookie-config>Configurar</button>' +
          '</div>' +
        '</div>' +
        '<div class="tc-cookie-panel' + (openSettings ? ' is-open' : '') + '" data-cookie-panel>' +
          '<label class="tc-cookie-option">' +
            '<span><strong>Necesarias</strong><span>Seguridad, preferencias legales y funcionamiento basico del sitio. Siempre activas.</span></span>' +
            '<input class="tc-cookie-toggle" type="checkbox" checked disabled>' +
          '</label>' +
          '<label class="tc-cookie-option">' +
            '<span><strong>Analiticas</strong><span>Google Analytics 4 para estadisticas agregadas de navegacion y conversiones.</span></span>' +
            '<input class="tc-cookie-toggle" type="checkbox" data-cookie-analytics' + (current.analytics ? ' checked' : '') + '>' +
          '</label>' +
          '<label class="tc-cookie-option">' +
            '<span><strong>Marketing y terceros</strong><span>Reservado para futuras integraciones publicitarias o embebidos de terceros no necesarios.</span></span>' +
            '<input class="tc-cookie-toggle" type="checkbox" data-cookie-marketing' + (current.marketing ? ' checked' : '') + '>' +
          '</label>' +
          '<div class="tc-cookie-actions" style="margin-top:14px">' +
            '<button type="button" class="tc-cookie-btn tc-cookie-btn-primary" data-cookie-save>Guardar preferencias</button>' +
            '<button type="button" class="tc-cookie-btn" data-cookie-close>Cancelar</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    root.querySelector('[data-cookie-accept]').addEventListener('click', function () {
      writeConsent({ analytics: true, marketing: false });
    });
    root.querySelector('[data-cookie-reject]').addEventListener('click', function () {
      writeConsent({ analytics: false, marketing: false });
    });
    root.querySelector('[data-cookie-config]').addEventListener('click', function () {
      root.querySelector('[data-cookie-panel]').classList.add('is-open');
    });
    root.querySelector('[data-cookie-save]').addEventListener('click', function () {
      writeConsent({
        analytics: !!root.querySelector('[data-cookie-analytics]').checked,
        marketing: !!root.querySelector('[data-cookie-marketing]').checked
      });
    });
    root.querySelector('[data-cookie-close]').addEventListener('click', function () {
      if (readConsent()) closePanel();
      else root.querySelector('[data-cookie-panel]').classList.remove('is-open');
    });

    document.body.appendChild(root);
  }

  document.addEventListener('click', function (event) {
    if (!event.target || typeof event.target.closest !== 'function') return;
    var trigger = event.target.closest('[data-cookie-settings]');
    if (!trigger) return;
    event.preventDefault();
    showPanel(true);
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (initialConsent) {
      applyConsent(initialConsent, false);
      return;
    }

    showPanel(false);
  });

  initGoogleAnalytics();
})();
