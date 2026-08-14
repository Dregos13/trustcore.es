#!/usr/bin/env node
/**
 * seo-i18n.mjs — hreflang recíproco + sitemap con alternates ES/EN/FR.
 *
 * Problema que resuelve: las 14 páginas traducidas de /en/ y /fr/ no estaban en
 * el sitemap y cada página solo declaraba hreflang="es" + x-default, así que
 * Google no las veía como alternativas de idioma (hreflang exige reciprocidad).
 *
 * Qué hace, de forma idempotente:
 *   1. En cada página de un trío ES/EN/FR, sustituye el bloque de
 *      <link rel="alternate" hreflang="…"> por el clúster completo
 *      (es + en + fr + x-default→es), justo después del canonical.
 *   2. Regenera site/sitemap.xml: URLs ES existentes + todas las EN/FR
 *      traducidas, con xhtml:link alternates en cada <url> de un trío.
 *
 * Uso: node scripts/seo-i18n.mjs        (desde la raíz del repo)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://www.trustcore.es';
const SITE = 'site';
const TODAY = new Date().toISOString().slice(0, 10);

// Tríos: nombre de archivo ES → rutas públicas (extensionless, como sirve CloudFront).
const SAME_NAME = [
  'article', 'auditoria-control-horario-checklist', 'comparativa',
  'control-horario-fichaje-remoto-sin-riesgos', 'control-horario-obligatorio-guia-2026',
  'cumplimiento-basico-en-30-dias', 'errores-ipsi-autonomos-y-pymes',
  'ipsi-ceuta-melilla-guia-practica', 'ipsi-en-factura-ejemplo-completo',
  'ipsi-quipu-alternativas-para-pymes', 'plan-lite-cumplimiento-basico-empresa',
  'plan-lite-vs-plan-pro-cumplimiento',
];

/** @type {Array<{es:string,en:string,fr:string,files:{es:string,en:string,fr:string}}>} */
const TRIOS = [
  { es: '/', en: '/en/', fr: '/fr/', files: { es: 'index.html', en: 'en/index.html', fr: 'fr/index.html' } },
  { es: '/precios', en: '/en/pricing', fr: '/fr/tarifs', files: { es: 'precios.html', en: 'en/pricing.html', fr: 'fr/tarifs.html' } },
  ...SAME_NAME.map((n) => ({
    es: `/${n}`, en: `/en/${n}`, fr: `/fr/${n}`,
    files: { es: `${n}.html`, en: `en/${n}.html`, fr: `fr/${n}.html` },
  })),
];

// --- 1. hreflang por página -------------------------------------------------
const cluster = (trio) => [
  `  <link rel="alternate" hreflang="es" href="${ORIGIN}${trio.es}">`,
  `  <link rel="alternate" hreflang="en" href="${ORIGIN}${trio.en}">`,
  `  <link rel="alternate" hreflang="fr" href="${ORIGIN}${trio.fr}">`,
  `  <link rel="alternate" hreflang="x-default" href="${ORIGIN}${trio.es}">`,
].join('\n');

let patched = 0;
for (const trio of TRIOS) {
  for (const lang of ['es', 'en', 'fr']) {
    const path = join(SITE, trio.files[lang]);
    if (!existsSync(path)) { console.error(`! falta ${path} — trío incompleto, lo salto`); continue; }
    let html = readFileSync(path, 'utf8');
    const before = html;
    if (/<link rel="alternate" hreflang=/.test(html)) {
      // Sustituye el bloque contiguo de alternates existente por el clúster.
      html = html.replace(
        /(?:[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*\n)+/,
        cluster(trio) + '\n',
      );
    } else {
      // Sin alternates previos: insertar tras el canonical.
      html = html.replace(
        /([ \t]*<link rel="canonical"[^>]*>\n)/,
        `$1${cluster(trio)}\n`,
      );
    }
    if (html !== before) { writeFileSync(path, html); patched++; }
  }
}
console.log(`hreflang: ${patched} páginas actualizadas`);

// --- 2. sitemap -------------------------------------------------------------
// Fuente de verdad de indexables ES: el sitemap actual.
const current = readFileSync(join(SITE, 'sitemap.xml'), 'utf8');
const esUrls = [...current.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].replace(ORIGIN, '') || '/')
  .filter((u) => !u.startsWith('/en/') && !u.startsWith('/fr/'));

const trioByEs = new Map(TRIOS.map((t) => [t.es, t]));
const xhtml = (trio) => [
  `    <xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}${trio.es}"/>`,
  `    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${trio.en}"/>`,
  `    <xhtml:link rel="alternate" hreflang="fr" href="${ORIGIN}${trio.fr}"/>`,
  `    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${trio.es}"/>`,
].join('\n');

const urlEntry = (path, trio) => {
  const alt = trio ? '\n' + xhtml(trio) : '';
  return `  <url>\n    <loc>${ORIGIN}${path}</loc>\n    <lastmod>${TODAY}</lastmod>${alt}\n  </url>`;
};

const entries = [];
for (const es of esUrls) {
  const trio = trioByEs.get(es);
  entries.push(urlEntry(es, trio));
  if (trio) {
    entries.push(urlEntry(trio.en, trio));
    entries.push(urlEntry(trio.fr, trio));
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
writeFileSync(join(SITE, 'sitemap.xml'), sitemap);
console.log(`sitemap: ${entries.length} URLs (antes: ${esUrls.length} ES sin alternates)`);
