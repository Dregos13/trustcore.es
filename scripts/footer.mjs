#!/usr/bin/env node
/**
 * footer.mjs — un solo pie para todas las páginas (sistema "Flujo", 2026).
 *
 * Decisión de Rami (15/08/2026): el pie completo, en todas. Desde cualquier
 * artículo se llega a productos y a precios.
 *
 * Estructura:
 *   Marca + contacto + premios │ Productos │ Soluciones │ Recursos │ Legal + Trustpilot
 *   Avales institucionales
 *   Copyright · palabra gigante
 *
 * En las páginas nuevas va justo después de </main>, a continuación de la
 * cúpula del CTA final (.tc-pool): el navy de la cúpula termina en el mismo
 * color en que empieza el pie, sin costura.
 *
 * Los logos de aceleradoras y organismos van tal cual: no se redimensionan, no
 * se recortan y no se recolorean. El `filter: invert` de COF_Logo.png no es una
 * alteración de marca sino el modo de mostrar arte blanco sobre fondo oscuro,
 * y es el que ya venía usándose.
 *
 * Es idempotente: sustituye el bloque entre <!--FOOTER--> y <!--/FOOTER-->.
 * En una página nueva basta escribir `<!--FOOTER--><!--/FOOTER-->`.
 * Estilos: src/css/06-chrome.css (bloque "Pie").
 *
 * Uso: node scripts/footer.mjs
 */
import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ico } from './icons.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Páginas que no llevan pie: no son contenido.
const SKIP = new Set([
  'site/og-image.html',   // plantilla para generar la imagen OG
  'site/article.html',    // 301 → /blog en la CloudFront Function
  'site/comparativa.html' // 301 → /precios
]);

const COLS = [
  ['Productos', [
    ['TrustInFacts', '/productos/trustinfacts'],
    ['TrustInTime', '/productos/trustintime'],
    ['GenAI', '/productos/genai'],
    ['Orquesta', '/productos/orquesta'],
    ['Corrector Fiscal', '/productos/corrector-fiscal'],
    ['Nido', '/productos/nido'],
    ['Todos los productos', '/productos'],
    ['Precios', '/precios'],
  ]],
  ['Soluciones', [
    ['Para tiendas', '/facturacion-para-tiendas'],
    ['Para instaladores', '/facturacion-para-instaladores'],
    ['Para gestorías', '/gestoria'],
    ['IPSI Ceuta y Melilla', '/software-verifactu-ipsi-ceuta-melilla'],
    ['Comparativa con un ERP', '/comparativa/verifactu-ipsi-trustcore-vs-erp-generico'],
  ]],
  ['Recursos', [
    ['Clientes', '/clientes'],
    ['Blog', '/blog'],
    ['Aprende', '/aprende'],
    ['Funcionalidades', '/funcionalidades'],
    ['Cómo funciona', '/como-funciona'],
    ['Sobre nosotros', '/quienes-somos'],
    ['Contacto', '/contacto'],
  ]],
];

const LEGAL = [
  ['Aviso legal', '/aviso-legal'],
  ['Privacidad', '/privacidad'],
  ['Cookies', '/cookies'],
  ['Términos', '/terminos'],
];

const col = (title, items) => `      <nav aria-label="${title}">
        <p class="tc-foot__title">${title}</p>
        <ul>
${items.map(([t, h]) => `          <li><a href="${h}">${t}</a></li>`).join('\n')}
        </ul>
      </nav>`;

const FOOTER = `<!--FOOTER-->
<footer class="tc-foot tone-dark">
  <div class="tc-wrap">
    <div class="tc-foot__grid">
      <div class="tc-foot__brand">
        <a class="tc-brand" href="/" aria-label="TrustCore, inicio">
          <img src="/assets/trustcore-mark-120.png" alt="" width="110" height="120" loading="lazy">
          <span class="tc-brand__word">TrustCore</span>
        </a>
        <p>Software con IA hecho en Ceuta para quitar trabajo repetido a empresas y personas.</p>
        <ul class="tc-foot__contact">
          <li><a href="tel:+34666609299" data-track="footer_tel">${ico('phone')} 666 60 92 99</a></li>
          <li><a href="mailto:info@trustcore.es" data-track="footer_mail">${ico('mail')} info@trustcore.es</a></li>
        </ul>
        <p class="tc-foot__note">Respuesta en menos de 1 h en horario laboral</p>
        <div class="tc-foot__awards">
          <span class="tc-chip tc-chip--gold">${ico('trophy')} Alhambra Venture 2026</span>
          <span class="tc-chip tc-chip--hi">${ico('award')} #1 CeutaTech 2026</span>
        </div>
      </div>
${COLS.map(([t, i]) => col(t, i)).join('\n')}
      <nav aria-label="Legal">
        <p class="tc-foot__title">Legal</p>
        <ul>
${LEGAL.map(([t, h]) => `          <li><a href="${h}">${t}</a></li>`).join('\n')}
          <li><button type="button" data-cookie-settings>Configurar cookies</button></li>
        </ul>
        <div class="tc-foot__trust trustpilot-widget" data-locale="es-ES" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="69ccd4d8492775765d89c81b" data-style-height="52px" data-style-width="100%" data-token="210d26f3-dae6-47ce-9378-aa7d0c10d633">
          <a href="https://es.trustpilot.com/review/trustcore.es" target="_blank" rel="noopener" data-track="footer_trustpilot" aria-label="Reséñanos en Trustpilot"><span class="tc-foot__trust-pre">Reséñanos en</span> ${ico('star')} Trustpilot</a>
        </div>
      </nav>
    </div>

    <div class="tc-foot__backers">
      <p class="tc-foot__title">Acelerado y respaldado por</p>
      <div class="tc-foot__backers-row">
        <img class="tc-foot__cof" src="/COF_Logo.png" alt="Acelerado por Ceuta Open Future y El Ángulo" width="1000" height="355" loading="lazy">
        <div class="tc-foot__tile">
          <img src="/assets/logo-impulsa-startup.png" alt="Impulsa Startup" width="297" height="128" loading="lazy" style="--w:107px">
          <img src="/assets/logos-camara-fondos-europeos.png" alt="Cofinanciado por la Unión Europea, Ministerio de Trabajo y Economía Social, Fondos Europeos y Cámara de Comercio de España" width="1299" height="79" loading="lazy" style="--w:756px">
        </div>
      </div>
    </div>

    <div class="tc-foot__base">
      <span>© 2026 TrustCore · Ceuta, España</span>
      <span>Hecho en Ceuta · Cloud europeo · RGPD</span>
    </div>
    <p class="tc-foot__word" aria-hidden="true">TrustCore</p>
  </div>
</footer>
<!--/FOOTER-->`;

let n = 0, skipped = 0;
const missing = [];
for (const f of globSync('site/**/*.html', { cwd: ROOT })) {
  if (SKIP.has(f.replace(/\\/g, '/'))) { skipped++; continue; }
  const file = join(ROOT, f);
  const before = readFileSync(file, 'utf8');
  let h = before;

  if (h.includes('<!--FOOTER-->')) {
    h = h.replace(/(?:[ \t]*<!--\s*FOOTER\s*-->[ \t]*\n)?<!--FOOTER-->[\s\S]*?<!--\/FOOTER-->/, () => FOOTER);
  } else if (/<footer[\s>]/.test(h)) {
    h = h.replace(/[ \t]*<footer[\s\S]*?<\/footer>/, () => FOOTER);
  } else {
    missing.push(f);
    continue;
  }

  if (h !== before) { writeFileSync(file, h); n++; }
}
console.log(`pie aplicado a ${n} páginas (${skipped} excluidas)`);
if (missing.length) console.log('sin <footer> previo, no tocadas:', missing.join(', '));
