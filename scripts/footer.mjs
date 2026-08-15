#!/usr/bin/env node
/**
 * footer.mjs — un solo pie para todas las páginas.
 *
 * Antes había tres pies distintos repartidos por el sitio: uno completo de 4
 * columnas (home, precios, productos…), uno intermedio y uno ligero de 4
 * enlaces en los artículos. Desde un artículo del blog el visitante no tenía
 * por dónde llegar a productos ni a precios.
 *
 * Decisión de Rami (15/08/2026): el completo, en todas.
 *
 * Estructura:
 *   Marca + premios │ Producto │ Soluciones │ Empresa │ Legal + Trustpilot
 *   Avales institucionales
 *   Copyright
 *
 * Los logos de aceleradoras y organismos van tal cual: no se redimensionan, no
 * se recortan y no se recolorean. El `filter: invert` de COF_Logo.png no es una
 * alteración de marca sino el modo de mostrar arte blanco sobre fondo oscuro,
 * y es el que ya venía usándose.
 *
 * Es idempotente: sustituye el bloque entre <!--FOOTER--> y <!--/FOOTER--> si
 * ya existe, o el <footer> original la primera vez.
 *
 * Uso: node scripts/footer.mjs
 */
import { readFileSync, writeFileSync, globSync } from 'node:fs';

// Páginas que no llevan pie: no son contenido.
const SKIP = new Set([
  'site/og-image.html',   // plantilla para generar la imagen OG
  'site/article.html',    // 301 → /blog en la CloudFront Function
  'site/comparativa.html' // 301 → /precios
]);

const COLS = [
  ['Producto', [
    ['Facturación VeriFactu', '/productos/trustinfacts'],
    ['Control horario', '/productos/trustintime'],
    ['Funcionalidades', '/funcionalidades'],
    ['Cómo funciona', '/como-funciona'],
    ['Precios', '/precios'],
  ]],
  ['Soluciones', [
    ['Para tiendas', '/facturacion-para-tiendas'],
    ['Para instaladores', '/facturacion-para-instaladores'],
    ['Para gestorías', '/gestoria'],
    ['IPSI Ceuta y Melilla', '/software-verifactu-ipsi-ceuta-melilla'],
    ['Comparativa con un ERP', '/comparativa/verifactu-ipsi-trustcore-vs-erp-generico'],
  ]],
  ['Empresa', [
    ['Quiénes somos', '/quienes-somos'],
    ['Clientes', '/clientes'],
    ['Blog', '/blog'],
    ['Aprende', '/aprende'],
    ['Contacto', '/contacto'],
  ]],
];

const LEGAL = [
  ['Aviso legal', '/aviso-legal'],
  ['Privacidad', '/privacidad'],
  ['Cookies', '/cookies'],
  ['Términos', '/terminos'],
];

const col = (title, items) => `        <div>
          <p class="text-white font-semibold text-sm mb-4">${title}</p>
          <ul class="space-y-2.5 text-sm">
${items.map(([t, h]) => `            <li><a href="${h}" class="hover:text-white transition-colors">${t}</a></li>`).join('\n')}
          </ul>
        </div>`;

const FOOTER = `<!--FOOTER-->
  <footer style="background:var(--tc-navy-deep);color:rgba(255,255,255,0.6)" class="py-16">
    <div class="tc-container">
      <div class="grid gap-10 md:grid-cols-3 lg:grid-cols-5">
        <div>
          <a href="/" class="flex items-center gap-2 mb-4">
            <img src="/assets/trustcore-icon.png" alt="TrustCore" class="h-9 w-auto" loading="lazy">
            <span class="text-white font-extrabold text-lg">TrustCore</span>
          </a>
          <p class="text-sm leading-relaxed">Facturaci&oacute;n preparada para VeriFactu, IPSI y control horario en una sola cuenta. Para pymes y aut&oacute;nomos.</p>
          <ul class="mt-5 space-y-2 text-sm">
            <li><a href="tel:+34666609299" class="inline-flex items-center gap-2 hover:text-white transition-colors" data-track="footer_tel">
              <svg class="tc-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#fa-phone"/></svg> 666 60 92 99
            </a></li>
            <li><a href="mailto:info@trustcore.es" class="inline-flex items-center gap-2 hover:text-white transition-colors" data-track="footer_mail">
              <svg class="tc-icon" aria-hidden="true"><use href="/assets/icons/sprite.svg#fa-envelope"/></svg> info@trustcore.es
            </a></li>
          </ul>
          <p class="mt-2 text-xs" style="color:rgba(255,255,255,0.45)">Respuesta en menos de 1 h en horario laboral</p>
          <div class="flex flex-wrap gap-2 mt-5">
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style="background:rgba(212,162,61,0.15);color:var(--tc-gold);border:1px solid rgba(212,162,61,0.3)">
              <svg class="tc-icon"><use href="/assets/icons/sprite.svg#fa-trophy"/></svg> Alhambra Venture 2026
            </span>
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style="background:rgba(32,113,213,0.15);color:var(--tc-cyan-light);border:1px solid rgba(32,113,213,0.3)">
              <svg class="tc-icon"><use href="/assets/icons/sprite.svg#fa-award"/></svg> #1 CeutaTech 2026
            </span>
          </div>
        </div>
${COLS.map(([t, i]) => col(t, i)).join('\n')}
        <div>
          <p class="text-white font-semibold text-sm mb-4">Legal</p>
          <ul class="space-y-2.5 text-sm">
${LEGAL.map(([t, h]) => `            <li><a href="${h}" class="hover:text-white transition-colors">${t}</a></li>`).join('\n')}
            <li><button type="button" data-cookie-settings class="hover:text-white transition-colors text-left">Configurar cookies</button></li>
          </ul>
          <div class="mt-5">
            <div class="trustpilot-widget" data-locale="es-ES" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="69ccd4d8492775765d89c81b" data-style-height="52px" data-style-width="100%" data-token="210d26f3-dae6-47ce-9378-aa7d0c10d633">
              <a href="https://es.trustpilot.com/review/trustcore.es" target="_blank" rel="noopener" class="inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded border border-[#00B67A] bg-white px-4 text-sm font-medium text-slate-800 hover:bg-green-50 transition-colors">
                Rese&ntilde;anos en <svg class="tc-icon" style="color:#00B67A"><use href="/assets/icons/sprite.svg#fa-star"/></svg> <strong class="text-slate-900">Trustpilot</strong>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t border-white/10 text-center">
        <p class="text-xs uppercase tracking-widest opacity-50 mb-4">Acelerado y respaldado por</p>
        <div class="flex flex-col items-center gap-4">
          <img src="/COF_Logo.png" alt="Acelerado por Ceuta Open Future y El &Aacute;ngulo" style="max-width:480px;width:100%;height:auto;filter:brightness(0) invert(1);" loading="lazy">
          <div class="inline-flex max-w-full flex-col sm:flex-row items-center justify-center gap-4 rounded-xl bg-white px-5 py-4 shadow-sm">
            <img src="/assets/logo-impulsa-startup.png" alt="Impulsa Startup" class="h-8 w-auto object-contain" loading="lazy">
            <span class="hidden sm:block h-8 w-px bg-slate-200" aria-hidden="true"></span>
            <img src="/assets/logos-camara-fondos-europeos.png" alt="Cofinanciado por la Uni&oacute;n Europea, Ministerio de Trabajo y Econom&iacute;a Social, Fondos Europeos y C&aacute;mara de Comercio de Espa&ntilde;a" class="max-h-12 w-auto max-w-full object-contain" loading="lazy">
          </div>
        </div>
      </div>

      <div class="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p>&copy; 2026 TrustCore &mdash; Ceuta, Espa&ntilde;a</p>
        <p>Hecho con <span style="color:#f87171">&#9829;</span> en Ceuta &middot; Cloud europeo &middot; RGPD compliant</p>
      </div>
    </div>
  </footer>
<!--/FOOTER-->`;

let n = 0, skipped = 0, missing = [];
for (const f of globSync('site/**/*.html')) {
  if (SKIP.has(f.replace(/\\/g, '/'))) { skipped++; continue; }
  const before = readFileSync(f, 'utf8');
  let h = before;

  if (h.includes('<!--FOOTER-->')) {
    h = h.replace(/<!--FOOTER-->[\s\S]*?<!--\/FOOTER-->/, FOOTER);
  } else if (/<footer[\s>]/.test(h)) {
    h = h.replace(/[ \t]*<footer[\s\S]*?<\/footer>/, FOOTER);
  } else {
    missing.push(f);
    continue;
  }

  if (h !== before) { writeFileSync(f, h); n++; }
}
console.log(`pie aplicado a ${n} páginas (${skipped} excluidas)`);
if (missing.length) console.log('sin <footer> previo, no tocadas:', missing.join(', '));
