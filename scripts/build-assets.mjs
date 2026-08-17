#!/usr/bin/env node
/**
 * build-assets.mjs — un solo CSS y un solo JS, minificados y con hash.
 *
 * Qué arreglaba esto (PageSpeed, agosto 2026):
 *
 *   1. Cuatro peticiones bloqueaban el render: tailwind.min.css,
 *      components.css, tokens.css (que llegaba por @import DENTRO de
 *      components.css, o sea en cascada, no en paralelo) y la hoja de
 *      fonts.googleapis.com. 1020 ms + 750 ms en móvil.
 *   2. components.css y components.js iban sin minificar (6 + 3 KiB de más).
 *   3. Los assets se sirven `max-age=31536000, immutable` y con nombre fijo:
 *      un visitante que ya había estado en la web podía seguir viendo el CSS
 *      viejo durante un año. Era la trampa nº 6 del flujo de trabajo.
 *
 * Ahora: el nombre lleva el hash del contenido, así que cada despliegue
 * invalida la caché por sí solo y `immutable` deja de ser un riesgo.
 *
 * Orden de la cascada: se concatena Tailwind PRIMERO y los componentes
 * después, exactamente como estaban los dos <link>. Cambiar ese orden haría
 * que las utilidades ganasen a las clases .tc-* (trampa nº 1).
 *
 * Uso: node scripts/build-assets.mjs   (o `npm run build`)
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { glob } from 'node:fs/promises';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const CSS_DIR = join(SITE, 'assets', 'css');
const JS_DIR = join(SITE, 'assets', 'js');
const tmp = mkdtempSync(join(tmpdir(), 'tc-build-'));

const hash8 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const kib = (s) => `${(s / 1024).toFixed(1)} KiB`;

// ---------------------------------------------------------------- CSS
// 1. Tailwind, purgado contra site/**/*.html.
const tailwindOut = join(tmp, 'tailwind.css');
execFileSync(join(ROOT, 'node_modules/.bin/tailwindcss'),
  ['-i', join(ROOT, 'src/tailwind.css'), '-o', tailwindOut, '--minify'],
  { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });

// 2. Fuentes propias + tokens + componentes, resueltos los @import.
const componentsOut = join(tmp, 'components.css');
await build({
  entryPoints: [join(ROOT, 'src/site.css')],
  outfile: componentsOut,
  bundle: true,
  minify: true,
  loader: { '.woff2': 'copy' },
  external: ['/assets/*'], // las url() de fuentes se sirven tal cual
  logLevel: 'warning',
});

const css = readFileSync(tailwindOut, 'utf8') + '\n' + readFileSync(componentsOut, 'utf8');
const cssName = `site.${hash8(css)}.min.css`;

// ----------------------------------------------------------------- JS
// contact-form.js solo lo carga /contacto, pero entra en el mismo circuito:
// si se quedara sin hash habría que excluirlo del `--delete` del despliegue y
// seguiría sirviéndose con caché de un año.
const JS_ENTRIES = ['consent', 'components', 'contact-form'];
const jsNames = {};
for (const entry of JS_ENTRIES) {
  const out = join(tmp, `${entry}.js`);
  await build({
    entryPoints: [join(JS_DIR, `${entry}.js`)],
    outfile: out,
    minify: true,
    target: 'es2017',
    logLevel: 'warning',
  });
  const code = readFileSync(out, 'utf8');
  jsNames[entry] = `${entry}.${hash8(code)}.min.js`;
  writeFileSync(join(JS_DIR, jsNames[entry]), code);
}
writeFileSync(join(CSS_DIR, cssName), css);

// Fuera los artefactos de builds anteriores (el fuente sin hash se queda).
for (const [dir, re] of [[CSS_DIR, /^site\.[0-9a-f]{8}\.min\.css$/], [JS_DIR, /^[a-z-]+\.[0-9a-f]{8}\.min\.js$/]]) {
  for (const f of readdirSync(dir)) {
    if (re.test(f) && f !== cssName && !Object.values(jsNames).includes(f)) unlinkSync(join(dir, f));
  }
}

// --------------------------------------------------------------- HTML
// Se normaliza a rutas absolutas: el sitio se sirve siempre desde la raíz del
// dominio y las relativas (`assets/…`, `../assets/…`) obligaban a mantener
// tres variantes de cada enlace.
const PRELOAD =
  `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/inter-v20-latin.woff2">`;
const LINK = `<link rel="stylesheet" href="/assets/css/${cssName}">`;

// Todo lo que sustituye el bundle. Se borran y se reinserta un único enlace en
// la posición del primero: así el orden de la cascada queda fijado aquí y deja
// de depender de cómo se escribiera cada página. (Seis páginas cargaban
// components.css ANTES que Tailwind, con lo que las utilidades ganaban a las
// clases .tc-* justo al revés que en el resto del sitio.)
const REPLACED = [
  /^[ \t]*<link rel="stylesheet" href="(?:\/|\.\.\/)?assets\/css\/tailwind\.min\.css">[ \t]*\n?/m,
  /^[ \t]*<link rel="stylesheet" href="(?:\/|\.\.\/)?assets\/css\/(?:components\.css|site\.[0-9a-f]{8}\.min\.css)">[ \t]*\n?/m,
  /^[ \t]*<link rel="preconnect" href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*>[ \t]*\n?/m,
  /^[ \t]*<link rel="preload" as="style" href="https:\/\/fonts\.googleapis\.com[^>]*>[ \t]*\n?/m,
  /^[ \t]*<link href="https:\/\/fonts\.googleapis\.com[^>]*>[ \t]*\n?/m,
  /^[ \t]*<link rel="preload" as="font"[^>]*>[ \t]*\n?/m,
];

let touched = 0;
for await (const file of glob(join(SITE, '**/*.html'))) {
  const before = readFileSync(file, 'utf8');
  let s = before;

  // Scripts con hash. Va primero porque hay páginas sin hoja de estilos
  // (comparativa.html es solo una redirección) que sí cargan consent.js.
  // El orden de JS_ENTRIES importa: `components` es prefijo de nada, pero
  // `contact-form` se sustituye antes de que ningún patrón más corto lo toque.
  for (const entry of JS_ENTRIES) {
    s = s.replace(
      new RegExp('src="(?:/|\\.\\./)?assets/js/' + entry + '(?:\\.[0-9a-f]{8}\\.min)?\\.js"', 'g'),
      `src="/assets/js/${jsNames[entry]}"`,
    );
  }

  // Posición e indentación del primer enlace sustituido.
  let at = Infinity;
  let indent = '    ';
  for (const re of REPLACED) {
    const m = s.match(new RegExp(re.source, 'gm'));
    if (!m) continue;
    const idx = s.indexOf(m[0]);
    if (idx < at) { at = idx; indent = m[0].match(/^[ \t]*/)[0]; }
    for (const hit of m) s = s.replace(hit, '');
  }
  if (at === Infinity) {
    // Página sin hojas de estilo (redirección). Solo se le tocan los scripts.
    if (s !== before) { writeFileSync(file, s); touched += 1; }
    continue;
  }

  s = s.slice(0, at) + `${indent}${PRELOAD}\n${indent}${LINK}\n` + s.slice(at);

  // Favicon: seis páginas no declaraban ninguno.
  if (!/rel="icon"/.test(s)) {
    s = s.replace(`${indent}${LINK}\n`,
      `${indent}${LINK}\n` +
      `${indent}<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">\n` +
      `${indent}<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon-180.png">\n`);
  }

  if (s !== before) { writeFileSync(file, s); touched += 1; }
}

rmSync(tmp, { recursive: true, force: true });
console.log(`CSS  /assets/css/${cssName}  ${kib(Buffer.byteLength(css))}  (era 28,9 KiB en 3 peticiones + Google Fonts)`);
for (const [k, v] of Object.entries(jsNames)) console.log(`JS   /assets/js/${v}`);
console.log(`HTML ${touched} páginas actualizadas`);
