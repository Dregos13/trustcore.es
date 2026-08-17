#!/usr/bin/env node
/**
 * aprende-videos.mjs — VideoObject completo para /aprende.
 *
 * La página tiene ~26 lecciones en vídeo pero solo 9 llevaban VideoObject
 * (anidados en el HowTo). Google indexa vídeos por VideoObject con
 * thumbnailUrl; sin eso, las lecciones no existen para el buscador.
 *
 * Este script parsea los .tc-lesson-trigger del HTML (título, descripción y
 * src) y regenera:
 *   1. el bloque <script type="application/ld+json" data-generated="aprende-videos">
 *      con un ItemList de VideoObject, uno por lección;
 *   2. el atributo data-video-poster de cada botón, para que el reproductor
 *      abra con un fotograma real en vez de un rectángulo negro.
 * Idempotente: sustituye lo que ya exista.
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

const lessons = [...html.matchAll(
  /data-video-title="([^"]+)" data-video-src="([^"]+)"[^>]*>\s*<span>([^<]*)<small>([^<]*)<\/small>/g,
)].map(([, title, src, , desc]) => ({ title, src, desc: desc.trim(), slug: slugOf(src) }))
  .filter((l) => !NOT_YET_UPLOADED.includes(l.src));

if (!lessons.length) { console.error('No se encontraron lecciones — ¿cambió el markup?'); process.exit(1); }

const sinPoster = lessons.filter((l) => !meta[l.slug]).map((l) => l.slug);

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

if (html.includes('data-generated="aprende-videos"')) {
  html = html.replace(/<script type="application\/ld\+json" data-generated="aprende-videos">[\s\S]*?<\/script>/, block);
} else {
  html = html.replace('</head>', `${block}\n</head>`);
}

// El reproductor lee data-video-poster: el modal abre con el fotograma real en
// vez de esperar al primer frame descargado. El id da destino real al
// embedUrl del schema (#slug), que si no apuntaba a un ancla inexistente.
let posters = 0;
html = html.replace(
  /(<button type="button" class="tc-lesson-trigger")(?:\s+id="[^"]*")?(\s+data-video-title="[^"]+"\s+data-video-src="([^"]+)")(?:\s+data-video-poster="[^"]*")?/g,
  (all, head, mid, src) => {
    const slug = slugOf(src);
    const m = meta[slug];
    const posterAttr = m ? ` data-video-poster="${m.poster}"` : '';
    if (m) posters += 1;
    return `${head} id="${slug}"${mid}${posterAttr}`;
  },
);

writeFileSync(PATH, html);
console.log(`VideoObject: ${videos.length} lecciones indexables · ${posters} con póster y duración propios`);
if (sinPoster.length) console.log(`  sin metadatos todavía: ${sinPoster.join(', ')}`);
