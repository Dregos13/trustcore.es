#!/usr/bin/env node
/**
 * aprende-videos.mjs — VideoObject completo para /aprende.
 *
 * La página tiene ~26 lecciones en vídeo pero solo 9 llevaban VideoObject
 * (anidados en el HowTo). Google indexa vídeos por VideoObject con
 * thumbnailUrl; sin eso, las lecciones no existen para el buscador.
 *
 * Marcado que lee (sistema «Flujo», rediseño 2026): cada lección es un
 *   <button … class="tc-video …" id="slug" data-video-title="…" data-video-src="…mp4" [data-video-poster="…"]>
 *     <span class="tc-video__poster">…</span>
 *     <span class="tc-video__body">… <span class="tc-video__desc">Descripción</span> …</span>
 *   </button>
 * (también vale la fila compacta .tc-lesson, con la descripción en <small>).
 * El título sale de data-video-title, la descripción de .tc-video__desc y el
 * slug del nombre del .mp4. El orden del documento es el orden del ItemList.
 *
 * Regenera, de forma idempotente:
 *   1. el bloque <script type="application/ld+json" data-generated="aprende-videos">
 *      con un ItemList de VideoObject, uno por lección publicada;
 *   2. en cada botón: el id (ancla del embedUrl), data-video-poster (el
 *      reproductor abre con un fotograma real en vez de un rectángulo negro),
 *      la <img> del póster y la etiqueta de duración de la tarjeta;
 *   3. las cifras de la página que dependen de los clips publicados
 *      ([data-aprende-stat="published"] en el hero y [data-aprende-route-len]
 *      en la cabecera de cada ruta);
 *   4. el <noscript data-generated="aprende-videos"> con un enlace directo a
 *      cada MP4 publicado. Sirve a quien navega sin JavaScript (los botones no
 *      pueden abrir el reproductor) y es además de donde `scripts/seo-i18n.mjs`
 *      saca las entradas <video:video> del sitemap: su expresión regular espera
 *      `data-video-title="…" data-video-src="…"…><span>Título <small>Descripción</small>`,
 *      así que cada enlace conserva exactamente esa forma. No la cambies sin
 *      cambiar también seo-i18n.mjs.
 *
 * Miniatura y duración salen de `scripts/video-meta.json`, que genera
 * `node scripts/build-video-posters.mjs` a partir de los .mp4 de `VideosTF/`.
 * Antes las 23 lecciones compartían una única miniatura genérica (el dashboard
 * de producto) y ninguna declaraba duración: Google descarta así los vídeos
 * porque no puede mostrar ni preview ni tiempo en el resultado.
 *
 * Uso: node scripts/aprende-videos.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PATH = 'site/aprende.html';
const META = 'scripts/video-meta.json';
const ORIGIN = 'https://www.trustcore.es';
const PAGE = `${ORIGIN}/aprende`;
// Respaldo por producto para una lección sin fotograma extraído todavía.
const FALLBACK_THUMB = {
  trustinfacts: `${ORIGIN}/assets/trustinfacts-dashboard-1280.webp`,
  trustintime: `${ORIGIN}/assets/trustintime-dashboard-1280.webp`,
};
const UPLOAD_DATE = '2026-07-05'; // fecha de publicación del lote actual de clips

// Lecciones cuyo mp4 aún NO está subido a S3 (la página los muestra como
// "Próximamente"): fuera del schema hasta que existan — un VideoObject con
// contentUrl muerto hace que Google descarte el resto. Verificado 2026-08-14
// contra producción. Quitar de aquí cuando se suban los clips.
const NOT_YET_UPLOADED = [
  '/videos/aprende/trustintime/fichar-jornada.mp4',
  '/videos/aprende/trustintime/gestionar-ausencia.mp4',
  '/videos/aprende/trustintime/exportar-informe.mp4',
];

const meta = existsSync(META) ? JSON.parse(readFileSync(META, 'utf8')) : {};
if (!Object.keys(meta).length) {
  console.warn(`aviso: ${META} vacío o ausente — ejecuta primero build-video-posters.mjs`);
}

let html = readFileSync(PATH, 'utf8');

const slugOf = (src) => src.split('/').pop().replace(/\.mp4$/, '');
const ENT = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
const decode = (s) => s.replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&([a-z]+);/g, (m, n) => (n in ENT ? ENT[n] : m));
const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? m[1] : null; };
// 0:21 en la tarjeta · "3 min 20 s" en las cabeceras
const clock = (s) => { const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
const long = (s) => { const r = Math.round(s); const mm = Math.floor(r / 60); return (mm ? `${mm} min ` : '') + `${r % 60} s`; };

// Una lección = un <button> con data-video-src (los botones no se anidan).
const BUTTON = /<button\b[^>]*\sdata-video-src="[^"]+"[^>]*>[\s\S]*?<\/button>/g;
const isLive = (src) => !NOT_YET_UPLOADED.includes(src);
// Clip publicado con fotograma y duración conocidos.
const published = (src) => isLive(src) && meta[slugOf(src)];

function parse(block) {
  const open = block.slice(0, block.indexOf('>') + 1);
  const src = attr(open, 'data-video-src');
  const title = attr(open, 'data-video-title');
  const d = block.match(/class="tc-video__desc"[^>]*>([^<]*)</) || block.match(/<small>([^<]*)<\/small>/);
  if (!src || !title || !d) return null;
  return { title: decode(title), src, desc: decode(d[1]).trim(), slug: slugOf(src) };
}

const found = [...html.matchAll(BUTTON)].map(([block]) => parse(block));
if (!found.length || found.some((l) => !l)) {
  console.error(found.length ? 'Hay lecciones sin título o sin descripción — ¿cambió el markup?' : 'No se encontraron lecciones — ¿cambió el markup?');
  process.exit(1);
}
const lessons = found.filter((l) => isLive(l.src));
const sinPoster = lessons.filter((l) => !meta[l.slug]).map((l) => l.slug);

// --- 1. JSON-LD ------------------------------------------------------------
const videos = lessons.map((l, i) => {
  const m = meta[l.slug];
  const video = {
    '@type': 'VideoObject',
    position: i + 1,
    name: l.title,
    description: l.desc,
    contentUrl: `${ORIGIN}${l.src}`,
    // Miniatura propia del clip. Sin ella Google no genera preview y la
    // lección queda fuera del índice de vídeo.
    thumbnailUrl: m ? `${ORIGIN}${m.poster}` : (l.src.includes('/trustintime/') ? FALLBACK_THUMB.trustintime : FALLBACK_THUMB.trustinfacts),
    uploadDate: UPLOAD_DATE,
    inLanguage: 'es',
    isFamilyFriendly: true,
    // La página que hospeda el reproductor: sin esto el vídeo no se asocia a
    // ninguna URL indexable y no puede salir en resultados.
    embedUrl: `${PAGE}#${l.slug}`,
    publisher: { '@type': 'Organization', name: 'TrustCore', url: ORIGIN },
  };
  if (m) video.duration = m.duration; // ISO 8601, requerido para el rich result
  return video;
});

const jsonld = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Lecciones en vídeo de TrustCore',
  description: 'Micro-lecciones en vídeo para aprender TrustinFacts y TrustinTime tarea a tarea.',
  numberOfItems: videos.length,
  itemListElement: videos.map((v) => ({ '@type': 'ListItem', position: v.position, item: v })),
};

const block = `<script type="application/ld+json" data-generated="aprende-videos">\n${JSON.stringify(jsonld, null, 2)}\n</script>`;

if (html.includes('<script type="application/ld+json" data-generated="aprende-videos">')) {
  html = html.replace(/<script type="application\/ld\+json" data-generated="aprende-videos">[\s\S]*?<\/script>/, () => block);
} else {
  html = html.replace('</head>', () => `${block}\n</head>`);
}

// --- 2. Botones: id, póster y duración ---------------------------------------
// El reproductor lee data-video-poster: el modal abre con el fotograma real en
// vez de esperar al primer frame descargado. El id da destino real al
// embedUrl del schema (#slug), que si no apuntaba a un ancla inexistente.
let posters = 0;
html = html.replace(BUTTON, (all) => {
  const cut = all.indexOf('>') + 1;
  let open = all.slice(0, cut);
  let body = all.slice(cut);
  const slug = slugOf(attr(open, 'data-video-src'));
  const m = meta[slug];

  // id justo antes de data-video-title; data-video-poster justo después de data-video-src
  open = open.replace(/\s+id="[^"]*"/, '').replace(/\s+data-video-poster="[^"]*"/, '');
  open = open.replace(/(\sdata-video-title=")/, ` id="${slug}"$1`);
  if (m) {
    posters += 1;
    open = open.replace(/(\sdata-video-src="[^"]*")/, `$1 data-video-poster="${m.poster}"`);
    // póster visible de la tarjeta (.tc-video): la <img> y la etiqueta de duración
    const img = `<img src="${m.poster}" alt="" width="${m.width}" height="${m.height}" loading="lazy">`;
    const len = `<span class="tc-video__len">${clock(m.seconds)}</span>`;
    body = body.replace(/(<span class="tc-video__poster">)(?:<img\b[^>]*>|<span class="p-aprende-card__blank"[^>]*>[\s\S]*?<\/svg><\/span>)/, (x, a) => a + img);
    if (/<span class="tc-video__len">/.test(body)) body = body.replace(/<span class="tc-video__len">[^<]*<\/span>/, len);
    else body = body.replace(/(<span class="tc-video__play">[\s\S]*?<\/svg><\/span>)/, (x, a) => a + len);
  }
  return open + body;
});

// --- 3. Cifras que dependen de los clips publicados ---------------------------
const pub = found.filter((l) => published(l.src));
const total = pub.reduce((n, l) => n + meta[l.slug].seconds, 0);
html = html.replace(/(<span data-aprende-stat="published">)[^<]*(<\/span>)/, (x, a, b) => `${a}${pub.length} vídeos publicados · ${long(total)}${b}`);
html = html.replace(/(<span data-aprende-stat="lessons">)[^<]*(<\/span>)/, (x, a, b) => `${a}${found.length} lecciones${b}`);
html = html.replace(/<section class="p-aprende-route"[\s\S]*?<\/section>/g, (sec) => {
  const secs = [...sec.matchAll(BUTTON)].map(([b]) => attr(b.slice(0, b.indexOf('>') + 1), 'data-video-src'))
    .filter(published).reduce((n, src) => n + meta[slugOf(src)].seconds, 0);
  return sec.replace(/<span data-aprende-route-len(?: hidden)?>[^<]*<\/span>/, `<span data-aprende-route-len${secs ? '' : ' hidden'}>${secs ? long(secs) : ''}</span>`);
});

// --- 4. Enlaces directos sin JavaScript (y fuente del sitemap de vídeo) ---------
// OJO: `><span>Título <small>Descripción</small>` es la forma que lee seo-i18n.mjs.
const NOJS = /<noscript data-generated="aprende-videos">[\s\S]*?<\/noscript>/;
if (NOJS.test(html)) {
  const items = pub.map((l) => `              <li><a href="${l.src}" data-video-title="${escAttr(l.title)}" data-video-src="${l.src}"><span>${escText(l.title)} <small>${escText(l.desc)}</small></span></a></li>`);
  const nojs = `<noscript data-generated="aprende-videos">
          <div class="p-aprende-nojs">
            <p class="tc-mono tc-mono--hi">Sin JavaScript</p>
            <p class="tc-muted">El reproductor necesita JavaScript. Mientras tanto, cada lección publicada se abre directamente desde aquí:</p>
            <ul class="p-aprende-nojs__list">
${items.join('\n')}
            </ul>
          </div>
        </noscript>`;
  html = html.replace(NOJS, () => nojs);
} else {
  console.warn('aviso: falta <noscript data-generated="aprende-videos"> en la página — seo-i18n.mjs dejará el sitemap sin entradas de vídeo');
}

writeFileSync(PATH, html);
console.log(`VideoObject: ${videos.length} lecciones indexables · ${posters} con póster y duración propios`);
if (sinPoster.length) console.log(`  sin metadatos todavía: ${sinPoster.join(', ')}`);
