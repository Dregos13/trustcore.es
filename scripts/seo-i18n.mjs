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
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ES_URLS.map((u) => `  <url>\n    <loc>${ORIGIN}${u}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`).join('\n')}
</urlset>
`;
writeFileSync(join(SITE, 'sitemap.xml'), sitemap);
console.log(`sitemap: ${ES_URLS.length} URLs ES (sin /en/ ni /fr/: responden 301)`);
