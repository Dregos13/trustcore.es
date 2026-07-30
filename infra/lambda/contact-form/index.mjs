const portalId = process.env.HUBSPOT_PORTAL_ID || '148252702';
const formGuid = process.env.HUBSPOT_FORM_GUID || '2b49a390-3c95-42a0-a687-c8a9da3a5034';
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://www.trustcore.es';
const secondaryOrigin = process.env.SECONDARY_ORIGIN || 'https://trustcore.es';

function responseHeaders(origin) {
  const corsOrigin = origin === secondaryOrigin ? secondaryOrigin : allowedOrigin;

  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': corsOrigin,
    'access-control-allow-methods': 'OPTIONS,POST',
    'access-control-allow-headers': 'content-type',
  };
}

function json(statusCode, body, origin) {
  return {
    statusCode,
    headers: responseHeaders(origin),
    body: JSON.stringify(body),
  };
}

function getHeader(event, name) {
  const target = name.toLowerCase();
  const headers = event.headers || {};
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === target);
  return key ? headers[key] : '';
}

function parseBody(event) {
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || '{}';
  return JSON.parse(raw);
}

function clean(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function buildFields(data) {
  return [
    ['firstname', data.firstname],
    ['email', data.email],
    ['phone', data.phone],
    ['company', data.company],
    ['message', data.message],
  ]
    .filter(([, value]) => value)
    .map(([name, value]) => ({ name, value }));
}

export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod || '';
  const origin = getHeader(event, 'origin') || allowedOrigin;

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: responseHeaders(origin), body: '' };
  }

  if (method !== 'POST') {
    return json(405, { ok: false, message: 'Metodo no permitido.' }, origin);
  }

  let data;
  try {
    data = parseBody(event);
  } catch (error) {
    return json(400, { ok: false, message: 'JSON invalido.' }, origin);
  }

  const submission = {
    firstname: clean(data.firstname, 120),
    email: clean(data.email, 180).toLowerCase(),
    phone: clean(data.phone, 80),
    company: clean(data.company, 160),
    message: clean(data.message, 4000),
    consent: data.consent === true,
    website: clean(data.website, 200),
    hutk: clean(data.hutk, 200),
    pageName: clean(data.pageName, 220),
    pageUri: clean(data.pageUri, 500),
  };

  if (submission.website) {
    return json(200, { ok: true }, origin);
  }

  if (!submission.firstname || !submission.email || !submission.consent) {
    return json(400, { ok: false, message: 'Faltan campos obligatorios.' }, origin);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    return json(400, { ok: false, message: 'Email no valido.' }, origin);
  }

  const hubspotPayload = {
    fields: buildFields(submission),
    context: {
      hutk: submission.hutk || undefined,
      pageName: submission.pageName || 'Contacto TrustCore',
      pageUri: submission.pageUri || allowedOrigin + '/contacto',
    },
    legalConsentOptions: {
      consent: {
        consentToProcess: true,
        text: 'Acepto que TrustCore trate mis datos para responder a mi solicitud.',
      },
    },
  };

  const hubspotEndpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`;
  const hubspotResponse = await fetch(hubspotEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(hubspotPayload),
  });

  if (!hubspotResponse.ok) {
    const body = await hubspotResponse.text();
    console.error('HubSpot submission failed', {
      status: hubspotResponse.status,
      body: body.slice(0, 1000),
    });
    return json(502, { ok: false, message: 'No se pudo enviar la solicitud.' }, origin);
  }

  return json(200, { ok: true }, origin);
}
