#!/usr/bin/env node
/**
 * aprende-videos.mjs — VideoObject completo para /aprende.
 *
 * La página tiene ~26 lecciones en vídeo pero solo 9 llevaban VideoObject
 * (anidados en el HowTo). Google indexa vídeos por VideoObject con
 * thumbnailUrl; sin eso, las lecciones no existen para el buscador.
 *
 * Este script parsea los .tc-lesson-trigger del HTML (título, descripción y
 * src) y regenera un bloque <script type="application/ld+json"
 * data-generated="aprende-videos"> con un ItemList de VideoObject, uno por
 * lección. Idempotente: sustituye el bloque si ya existe.
 *
 * Uso: node scripts/aprende-videos.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'site/aprende.html';
const ORIGIN = 'https://www.trustcore.es';
// Miniatura representativa por producto (Google exige thumbnailUrl).
const THUMBS = {
  trustinfacts: `${ORIGIN}/assets/trustinfacts-dashboard.png`,
  trustintime: `${ORIGIN}/assets/trustintime-dashboard.png`,
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

let html = readFileSync(PATH, 'utf8');

const lessons = [...html.matchAll(
  /data-video-title="([^"]+)" data-video-src="([^"]+)"[^>]*>\s*<span>([^<]*)<small>([^<]*)<\/small>/g,
)].map(([, title, src, , desc]) => ({ title, src, desc: desc.trim() }))
  .filter((l) => !NOT_YET_UPLOADED.includes(l.src));

if (!lessons.length) { console.error('No se encontraron lecciones — ¿cambió el markup?'); process.exit(1); }

const videos = lessons.map((l, i) => ({
  '@type': 'VideoObject',
  position: i + 1,
  name: l.title,
  description: l.desc,
  contentUrl: `${ORIGIN}${l.src}`,
  thumbnailUrl: l.src.includes('/trustintime/') ? THUMBS.trustintime : THUMBS.trustinfacts,
  uploadDate: UPLOAD_DATE,
  inLanguage: 'es',
  publisher: { '@type': 'Organization', name: 'TrustCore', url: ORIGIN },
}));

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
writeFileSync(PATH, html);
console.log(`VideoObject: ${videos.length} lecciones indexables (thumbnails: dashboards de producto)`);
