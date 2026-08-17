#!/usr/bin/env node
/**
 * seo-i18n.mjs — mantiene hreflang y sitemap alineados con lo que el CDN sirve.
 *
 * ⚠️ CONTEXTO IMPORTANTE (verificado en producción el 2026-08-14):
 *
 * Las páginas /en/* y /fr/* EXISTEN en el repo y en S3, pero NO son accesibles:
 * la CloudFront Function `trustcore-es-canonical-redirect` (viewer-request)
 * devuelve un 301 permanente de toda /en/* y /fr/* hacia su equivalente en
 * español. Es una decisión deliberada de consolidación de dominio, recogida en
 * docs/domain-consolidation-seo-plan.md ("consolidar TrustCore como web
 * comercial unica").
 *
 * Consecuencia para SEO — y el motivo de que este script exista:
 *   · Un sitemap que liste URLs que responden 301 hace que Search Console
 *     marque "Página con redirección" y no indexe ninguna de ellas.
 *   · Un hreflang que apunte a URLs redirigidas es inválido: Google exige que
 *     cada alternate devuelva 200 y sea recíproco. Un clúster con enlaces
 *     muertos se descarta entero, incluido el x-default.
 *
 * Por eso el estado correcto AHORA es monolingüe:
 *   · sitemap.xml solo con URLs ES que devuelven 200
 *   · hreflang solo es + x-default (ambos apuntando a la propia URL ES)
 *
 * SI ALGÚN DÍA SE REACTIVA EL MULTIIDIOMA hay que hacer las dos cosas, en este
 * orden: (1) quitar /en/ y /fr/ de `legacyRedirectTarget` en la CloudFront
 * Function y desplegarla; (2) volver a poner aquí los clústeres completos
 * es/en/fr/x-default y las URLs traducidas en el sitemap. Cambiar solo esto
 * sin tocar el CDN reintroduce exactamente el problema que arregla.
 *
 * Uso: node scripts/seo-i18n.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://www.trustcore.es';
const SITE = 'site';
const TODAY = new Date().toISOString().slice(0, 10);

// Las rutas ES indexables se DERIVAN del disco: una lista fija se queda
// desactualizada en silencio en cuanto alguien añade una página (ya pasó).
// Solo se enumeran las exclusiones, cada una con su motivo.
const EXCLUDE = new Map([
  ['404', 'página de error'],
  ['og-image', 'plantilla para generar la imagen OG, no es contenido'],
  ['article', '301 → /blog en la CloudFront Function'],
  ['comparativa', '301 → /precios en la CloudFront Function'],
  // Legales: accesibles (200) y enlazadas desde el footer, pero fuera del
  // sitemap igual que antes — no son páginas de captación.
  ['aviso-legal', 'legal, fuera del sitemap por decisión previa'],
  ['cookies', 'legal, fuera del sitemap por decisión previa'],
  ['privacidad', 'legal, fuera del sitemap por decisión previa'],
  ['terminos', 'legal, fuera del sitemap por decisión previa'],
]);

function esRoutes() {
  const routes = [];
  const scan = (dir, prefix) => {
    for (const entry of readdirSync(join(SITE, dir), { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
      const slug = entry.name.replace(/\.html$/, '');
      if (EXCLUDE.has(slug)) continue;
      routes.push(slug === 'index' && !prefix ? '/' : `${prefix}/${slug}`);
    }
  };
  scan('.', '');                    // raíz
  scan('productos', '/productos');
  scan('comparativa', '/comparativa');
  return routes.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
}

const ES_URLS = esRoutes();

// --- 1. hreflang: es + x-default, nada más --------------------------------
// Se aplica a TODAS las páginas del sitio, incluidas /en/ y /fr/: aunque hoy
// sean inalcanzables, dejarlas con alternates a URLs redirigidas sería una
// trampa para el día que alguien las vuelva a servir.
function selfUrl(file) {
  let route = '/' + file.replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '');
  return ORIGIN + (route === '/' ? '/' : route);
}

function walk(dir, base = '') {
  const out = [];
  for (const entry of readdirSync(join(SITE, dir), { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (['assets', 'videos'].includes(entry.name)) continue;
      out.push(...walk(join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

let patched = 0;
for (const file of walk('.')) {
  const path = join(SITE, file);
  let html = readFileSync(path, 'utf8');
  if (!/<link rel="alternate" hreflang=/.test(html)) continue;

  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1] ?? selfUrl(file);
  const block =
    `  <link rel="alternate" hreflang="es" href="${canonical}">\n` +
    `  <link rel="alternate" hreflang="x-default" href="${canonical}">\n`;

  const next = html.replace(
    /(?:[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*\n)+/,
    block,
  );
  if (next !== html) { writeFileSync(path, next); patched++; }
}
console.log(`hreflang: ${patched} páginas → solo es + x-default`);

// --- 2. sitemap: solo URLs ES que responden 200 ----------------------------
// /aprende lleva además la extensión de vídeo. Las 23 lecciones vivían solo en
// un JSON-LD dentro de la página; sin entradas <video:video> en el sitemap,
// Search Console no tenía por dónde descubrirlas y ninguna llegaba al índice
// de vídeo. Los metadatos (miniatura, duración) salen de video-meta.json, que
// genera scripts/build-video-posters.mjs a partir de los .mp4 reales.
const XML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => XML_ESC[c]);

function videoEntries() {
  const metaPath = 'scripts/video-meta.json';
  if (!existsSync(metaPath)) return '';
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const html = readFileSync(join(SITE, 'aprende.html'), 'utf8');
  const lessons = [...html.matchAll(
    /data-video-title="([^"]+)" data-video-src="([^"]+)"[^>]*>\s*<span>[^<]*<small>([^<]*)<\/small>/g,
  )];

  const out = [];
  for (const [, title, src, desc] of lessons) {
    const m = meta[src.split('/').pop().replace(/\.mp4$/, '')];
    if (!m) continue; // lección sin clip subido todavía
    out.push([
      '    <video:video>',
      `      <video:thumbnail_loc>${ORIGIN}${m.poster}</video:thumbnail_loc>`,
      `      <video:title>${esc(title)}</video:title>`,
      `      <video:description>${esc(desc.trim())}</video:description>`,
      `      <video:content_loc>${ORIGIN}${src}</video:content_loc>`,
      `      <video:duration>${Math.round(m.seconds)}</video:duration>`,
      `      <video:publication_date>${VIDEO_UPLOAD_DATE}</video:publication_date>`,
      '      <video:family_friendly>yes</video:family_friendly>',
      '      <video:requires_subscription>no</video:requires_subscription>',
      '    </video:video>',
    ].join('\n'));
  }
  console.log(`sitemap: ${out.length} lecciones en vídeo con miniatura y duración`);
  return out.join('\n');
}

const VIDEO_UPLOAD_DATE = '2026-07-05'; // mismo lote que aprende-videos.mjs
const VIDEOS = videoEntries();

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${ES_URLS.map((u) => {
  const extra = u === '/aprende' && VIDEOS ? `\n${VIDEOS}` : '';
  return `  <url>\n    <loc>${ORIGIN}${u}</loc>\n    <lastmod>${TODAY}</lastmod>${extra}\n  </url>`;
}).join('\n')}
</urlset>
`;
writeFileSync(join(SITE, 'sitemap.xml'), sitemap);
console.log(`sitemap: ${ES_URLS.length} URLs ES (sin /en/ ni /fr/: responden 301)`);
