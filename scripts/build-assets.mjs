#!/usr/bin/env node
/**
 * build-assets.mjs — un solo CSS y un solo JS, minificados y con hash.
 *
 * Sistema "Flujo" (2026). Sin Tailwind: todo el CSS es propio.
 *
 *   CSS  src/css/00-fonts.css                      (fuera de capas)
 *        src/css/01…06-*.css        → @layer tc    (sistema, en orden numérico)
 *        src/css/pages/*.css        → @layer pages (CSS propio de cada página, orden alfabético)
 *        ⇒ site/assets/css/site.<hash>.min.css
 *
 *        Las capas hacen que el CSS de página gane SIEMPRE al del sistema, sea
 *        cual sea la especificidad: nadie necesita !important ni selectores
 *        largos para ajustar un componente en su página.
 *
 *   JS   site/assets/js/components.js (+ src/js/*.js, empaquetados)
 *        site/assets/js/consent.js · contact-form.js
 *        ⇒ site/assets/js/<nombre>.<hash>.min.js
 *
 *   HTML En todas las páginas de site/ (incluidas las nuevas de site/productos/):
 *        precarga de las dos fuentes de texto, <link> al bundle, el script de
 *        arranque en línea (clases js/motion antes del primer pintado) y los
 *        <script src> con hash.
 *
 * El nombre lleva el hash del contenido: los assets se sirven
 * `max-age=31536000, immutable`, así que cada despliegue invalida la caché
 * por sí solo.
 *
 * Varias personas (o agentes) pueden compilar a la vez: los bundles de los
 * últimos 30 minutos no se borran, de modo que una página que aún apunte al
 * hash anterior sigue viéndose. `--clean` deja solo el bundle actual y falla si
 * algún CSS de página no es válido (es lo que debe ejecutarse antes de publicar).
 *
 * Uso: node scripts/build-assets.mjs [--clean]      (o `npm run build`)
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, unlinkSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, transform } from 'esbuild';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const CSS_SRC = join(ROOT, 'src', 'css');
const CSS_DIR = join(SITE, 'assets', 'css');
const JS_DIR = join(SITE, 'assets', 'js');
const CLEAN = process.argv.includes('--clean');
const KEEP_MS = 30 * 60 * 1000;

const hash8 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const kib = (s) => `${(s / 1024).toFixed(1)} KiB`;
const rel = (p) => relative(ROOT, p);

// ---------------------------------------------------------------- CSS
const read = (p) => readFileSync(p, 'utf8');
const system = readdirSync(CSS_SRC).filter((f) => /^\d\d-.+\.css$/.test(f)).sort();
const pagesDir = join(CSS_SRC, 'pages');
const pageFiles = existsSync(pagesDir) ? readdirSync(pagesDir).filter((f) => f.endsWith('.css')).sort() : [];

// Cada CSS de página se valida por separado: si uno está roto se deja fuera y
// se avisa, para que no arrastre al resto del sitio.
const problems = [];
const pagesCss = [];
for (const f of pageFiles) {
  const src = read(join(pagesDir, f));
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
  const open = (stripped.match(/{/g) || []).length, close = (stripped.match(/}/g) || []).length;
  let err = open !== close ? `llaves desparejadas ({ ${open} / } ${close})` : '';
  if (!err && /@import\b/.test(stripped)) err = '@import no está permitido (el build ya concatena)';
  if (!err) {
    try { await transform(src, { loader: 'css', logLevel: 'silent' }); }
    catch (e) { err = (e.errors && e.errors[0] && e.errors[0].text) || String(e.message || e); }
  }
  if (err) { problems.push(`src/css/pages/${f}: ${err}`); continue; }
  pagesCss.push(`/* pages/${f} */\n${src}`);
}

const fonts = system.filter((f) => f.startsWith('00-')).map((f) => read(join(CSS_SRC, f))).join('\n');
const core = system.filter((f) => !f.startsWith('00-')).map((f) => `/* ${f} */\n${read(join(CSS_SRC, f))}`).join('\n');
const source = `${fonts}\n@layer tc, pages;\n@layer tc {\n${core}\n}\n@layer pages {\n${pagesCss.join('\n')}\n}\n`;

const cssOut = await transform(source, { loader: 'css', minify: true, logLevel: 'warning' });
const css = cssOut.code;
const cssName = `site.${hash8(css)}.min.css`;

// ----------------------------------------------------------------- JS
// `components` es el motor (bundle de src/js/). contact-form.js solo lo carga
// /contacto, pero entra en el mismo circuito para llevar hash.
const JS_ENTRIES = ['consent', 'components', 'contact-form'];
const jsNames = {};
const jsCode = {};
for (const entry of JS_ENTRIES) {
  const out = await build({
    entryPoints: [join(JS_DIR, `${entry}.js`)],
    bundle: true,
    format: 'iife',
    minify: true,
    target: 'es2019',
    write: false,
    logLevel: 'warning',
  });
  jsCode[entry] = out.outputFiles[0].text;
  jsNames[entry] = `${entry}.${hash8(jsCode[entry])}.min.js`;
}

mkdirSync(CSS_DIR, { recursive: true });
const writeIfNew = (p, data) => { if (!existsSync(p)) writeFileSync(p, data); };
writeIfNew(join(CSS_DIR, cssName), css);
for (const entry of JS_ENTRIES) writeIfNew(join(JS_DIR, jsNames[entry]), jsCode[entry]);

// Fuera los artefactos de builds anteriores (el fuente sin hash se queda).
const current = new Set([cssName, ...Object.values(jsNames)]);
const now = Date.now();
for (const [dir, re] of [[CSS_DIR, /^site\.[0-9a-f]{8}\.min\.css$/], [JS_DIR, /^[a-z-]+\.[0-9a-f]{8}\.min\.js$/]]) {
  for (const f of readdirSync(dir)) {
    if (!re.test(f) || current.has(f)) continue;
    if (CLEAN || now - statSync(join(dir, f)).mtimeMs > KEEP_MS) unlinkSync(join(dir, f));
  }
}

// --------------------------------------------------------------- HTML
// Rutas absolutas siempre: el sitio se sirve desde la raíz del dominio.
const PRELOAD = [
  `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/bricolage-grotesque-latin-opsz-normal.woff2">`,
  `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/instrument-sans-latin-wght-normal.woff2">`,
];
const LINK = `<link rel="stylesheet" href="/assets/css/${cssName}">`;

// Script de arranque: corre antes del primer pintado.
//  · clases `js` y `motion` (esta solo sin prefers-reduced-motion): todo estado
//    oculto del CSS cuelga de .motion, así que sin JS nada parte oculto;
//  · si el motor no ha llegado en 4 s (bundle caído, error de red), se retiran
//    .motion, .js e .is-arriving: el contenido aparece, las pestañas enseñan
//    todos sus paneles y el telón de la transición no se queda puesto;
//  · reserva de la transición entre páginas (telón) y nombres de los elementos
//    compartidos [data-vt] en la View Transition de llegada.
const BOOT = `<script>/*tc-boot*/(function(d){var c=d.documentElement.classList;c.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)c.add('motion');setTimeout(function(){if(!window.TC){c.remove('motion','js','is-arriving');window.__tcLate=1}},4000);try{if(sessionStorage.getItem('tc:arrive')){sessionStorage.removeItem('tc:arrive');c.add('is-arriving')}}catch(e){}addEventListener('pagereveal',function(e){if(!e.viewTransition)return;c.add('vt-arrive');var s={},l=d.querySelectorAll('[data-vt]');l.forEach(function(el){var n=el.getAttribute('data-vt');if(n&&!s[n]){s[n]=1;el.style.viewTransitionName=n;el.style.viewTransitionClass=el.hasAttribute('data-vt-text')?'tc-vt-text':'tc-vt'}});var f=function(){c.remove('vt-arrive');l.forEach(function(el){el.style.viewTransitionName='';el.style.viewTransitionClass=''})};e.viewTransition.finished.then(f,f)})})(document);</script>`;

// Todo lo que sustituye el bundle. Se borra y se reinserta en la posición del
// primero: así el orden queda fijado aquí y no depende de cada página.
const REPLACED = [
  /^[ \t]*<link rel="stylesheet" href="(?:\/|\.\.\/)?assets\/css\/tailwind\.min\.css">[ \t]*\n?/m,
  /^[ \t]*<link rel="stylesheet" href="(?:\/|\.\.\/)?assets\/css\/(?:components\.css|site\.[0-9a-f]{8}\.min\.css)">[ \t]*\n?/m,
  /^[ \t]*<link rel="preconnect" href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*>[ \t]*\n?/m,
  /^[ \t]*<link rel="preload" as="style" href="https:\/\/fonts\.googleapis\.com[^>]*>[ \t]*\n?/m,
  /^[ \t]*<link href="https:\/\/fonts\.googleapis\.com[^>]*>[ \t]*\n?/m,
  /^[ \t]*<link rel="preload" as="font"[^>]*>[ \t]*\n?/m,
  /^[ \t]*<script>\/\*tc-boot\*\/[\s\S]*?<\/script>[ \t]*\n?/m,
  /^[ \t]*<!-- Tailwind \(build local[^>]*-->[ \t]*\n?/m,
];

let touched = 0, total = 0;
for await (const file of glob(join(SITE, '**/*.html'))) {
  total += 1;
  const before = read(file);
  let s = before;

  // Scripts con hash. Va primero porque hay páginas sin hoja de estilos
  // (comparativa.html es solo una redirección) que sí cargan consent.js.
  for (const entry of JS_ENTRIES) {
    s = s.replace(
      new RegExp('src="(?:/|\\.\\./)?assets/js/' + entry + '(?:\\.[0-9a-f]{8}\\.min)?\\.js"', 'g'),
      `src="/assets/js/${jsNames[entry]}"`,
    );
  }

  // Posición e indentación del primer enlace sustituido.
  let at = Infinity;
  let indent = '  ';
  for (const re of REPLACED) {
    const m = s.match(new RegExp(re.source, 'gm'));
    if (!m) continue;
    const idx = s.indexOf(m[0]);
    if (idx < at) { at = idx; indent = m[0].match(/^[ \t]*/)[0]; }
    for (const hit of m) s = s.replace(hit, '');
    if (at > s.length) at = s.length;
  }
  if (at === Infinity) {
    // Página sin hojas de estilo (redirección). Solo se le tocan los scripts.
    if (s !== before) { writeFileSync(file, s); touched += 1; }
    continue;
  }

  s = s.slice(0, at) + PRELOAD.map((l) => `${indent}${l}\n`).join('') + `${indent}${LINK}\n${indent}${BOOT}\n` + s.slice(at);

  // Favicon: algunas páginas no declaraban ninguno.
  if (!/rel="icon"/.test(s)) {
    s = s.replace(`${indent}${LINK}\n`,
      `${indent}${LINK}\n` +
      `${indent}<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">\n` +
      `${indent}<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon-180.png">\n`);
  }

  if (s !== before) { writeFileSync(file, s); touched += 1; }
}

console.log(`CSS  /assets/css/${cssName}  ${kib(Buffer.byteLength(css))}  (${system.length} del sistema + ${pagesCss.length} de página)`);
for (const [k, v] of Object.entries(jsNames)) console.log(`JS   /assets/js/${v}  ${kib(Buffer.byteLength(jsCode[k]))}`);
console.log(`HTML ${touched} de ${total} páginas actualizadas`);
if (problems.length) {
  console.log('\nAVISO · CSS de página excluido del bundle (corrígelo y vuelve a compilar):');
  for (const p of problems) console.log('  ✗ ' + p);
  if (CLEAN) process.exit(1);
}
