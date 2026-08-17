(function () {
  var fallbackEmail = 'info@trustcore.es';
  var endpoint = '/api/contacto';

  function pushEvent(name, payload) {
    var eventPayload = Object.assign({
      event: name,
      form_provider: 'hubspot',
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
      window.gtag('event', name, gaPayload);
    }
  }

  function getCookie(name) {
    return document.cookie.split('; ').reduce(function (value, part) {
      var pieces = part.split('=');
      return pieces[0] === name ? decodeURIComponent(pieces.slice(1).join('=')) : value;
    }, '');
  }

  function getData(form) {
    var formData = new FormData(form);
    return {
      firstname: (formData.get('firstname') || '').toString().trim(),
      email: (formData.get('email') || '').toString().trim(),
      phone: (formData.get('phone') || '').toString().trim(),
      company: (formData.get('company') || '').toString().trim(),
      message: (formData.get('message') || '').toString().trim(),
      consent: formData.get('consent') === 'on',
      website: (formData.get('website') || '').toString().trim()
    };
  }

  function setStatus(form, state, text) {
    var status = form.querySelector('[data-contact-status]');
    if (!status) return;
    status.hidden = false;
    status.dataset.state = state;
    status.textContent = text;
  }

  function setLoading(form, isLoading) {
    var button = form.querySelector('[type="submit"]');
    if (!button) return;
    button.disabled = isLoading;
    button.dataset.originalText = button.dataset.originalText || button.innerHTML;
    button.innerHTML = isLoading ? '<svg class="tc-icon tc-spin" aria-hidden="true"><use href="/assets/icons/sprite.svg#fa-circle-notch"/></svg> Enviando...' : button.dataset.originalText;
  }

  function openMailFallback(data) {
    var subject = encodeURIComponent('Solicitud desde trustcore.es');
    var body = encodeURIComponent([
      'Nombre: ' + data.firstname,
      'Email: ' + data.email,
      'Telefono: ' + data.phone,
      'Empresa: ' + data.company,
      '',
      'Mensaje:',
      data.message
    ].join('\n'));
    window.location.href = 'mailto:' + fallbackEmail + '?subject=' + subject + '&body=' + body;
  }

  async function submitToHubSpot(form, data) {
    var payload = Object.assign({}, data, {
      formName: form.dataset.formName || 'contacto',
      hutk: getCookie('hubspotutk') || '',
      pageName: document.title,
      pageUri: window.location.href
    });

    var response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      var message = await response.text();
      throw new Error(message || 'HubSpot submission failed');
    }
  }

  document.querySelectorAll('[data-contact-form]').forEach(function (form) {
    pushEvent('form_init', { form_id: form.dataset.formName || 'contacto' });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var data = getData(form);
      var formId = form.dataset.formName || 'contacto';

      if (data.website) return;
      if (!data.firstname || !data.email || !data.consent) {
        setStatus(form, 'error', 'Completa nombre, email y aceptación de privacidad para enviarlo.');
        return;
      }

      setLoading(form, true);
      setStatus(form, 'success', 'Enviando tu solicitud...');
      pushEvent('form_submit_attempt', { form_id: formId });

      try {
        await submitToHubSpot(form, data);
        form.reset();
        setStatus(form, 'success', 'Solicitud enviada. Te responderemos en menos de 24h laborables.');
        pushEvent('form_submit', { form_id: formId });
        pushEvent('generate_lead', { form_id: formId, method: 'contact_form' });
      } catch (error) {
        setStatus(form, 'error', 'No hemos podido enviarlo automáticamente. Abrimos tu email con el mensaje preparado.');
        pushEvent('form_error', { form_id: formId, error_reason: 'contact_proxy_failed' });
        openMailFallback(data);
      } finally {
        setLoading(form, false);
      }
    });
  });
})();
