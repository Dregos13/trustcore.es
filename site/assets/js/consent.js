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

  // Los estilos del banner viven en el bundle (src/css/06-chrome.css, bloque
  // "Banner de cookies"): aquí solo se genera el marcado.

  function closePanel() {
    if (root) {
      root.remove();
      root = null;
    }
  }

  function showPanel(openSettings) {
    closePanel();

    var current = readConsent() || { necessary: true, analytics: false, marketing: false };
    root = document.createElement('div');
    root.id = 'tc-cookie-consent';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');
    root.setAttribute('aria-label', 'Configuración de cookies');
    root.innerHTML =
      '<div class="tc-cookie-card">' +
        '<div class="tc-cookie-body">' +
          '<div>' +
            '<h2 class="tc-cookie-title">Cookies de TrustCore</h2>' +
            '<p class="tc-cookie-text">Usamos cookies técnicas necesarias y, solo si aceptas, Google Analytics para medir visitas. Puedes aceptar, rechazar o configurar por finalidad. <a href="/cookies">Ver política de cookies</a>.</p>' +
          '</div>' +
          '<div class="tc-cookie-actions" aria-label="Opciones de cookies">' +
            '<button type="button" class="tc-cookie-btn tc-cookie-btn-primary" data-cookie-accept>Aceptar</button>' +
            '<button type="button" class="tc-cookie-btn tc-cookie-btn-danger" data-cookie-reject>Rechazar</button>' +
            '<button type="button" class="tc-cookie-btn" data-cookie-config>Configurar</button>' +
          '</div>' +
        '</div>' +
        '<div class="tc-cookie-panel' + (openSettings ? ' is-open' : '') + '" data-cookie-panel>' +
          '<label class="tc-cookie-option">' +
            '<span><strong>Necesarias</strong><span>Seguridad, preferencias legales y funcionamiento básico del sitio. Siempre activas.</span></span>' +
            '<input class="tc-cookie-toggle" type="checkbox" checked disabled>' +
          '</label>' +
          '<label class="tc-cookie-option">' +
            '<span><strong>Analíticas</strong><span>Google Analytics 4 para estadísticas agregadas de navegación y conversiones.</span></span>' +
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

  // gtag.js son 184 KiB y ~94 ms de hilo principal. Cargarlo durante el render
  // inicial retrasaba el LCP sin necesidad: el modo de consentimiento ya está
  // declarado arriba (denied por defecto), así que la etiqueta puede llegar
  // después sin cambiar nada de lo que se le permite hacer.
  //
  // Se espera al evento `load`, no a una interacción: en ese punto la página ya
  // ha terminado de cargar y prácticamente toda visita real sigue registrando
  // su page_view. Solo se perdería una salida en el primer segundo.
  function loadAnalyticsWhenIdle() {
    if (window.requestIdleCallback) window.requestIdleCallback(initGoogleAnalytics, { timeout: 3000 });
    else setTimeout(initGoogleAnalytics, 1);
  }
  if (document.readyState === 'complete') loadAnalyticsWhenIdle();
  else window.addEventListener('load', loadAnalyticsWhenIdle, { once: true });
})();
