#!/usr/bin/env node
/**
 * check-page.mjs — comprobaciones automáticas de una página rehecha con el sistema «Flujo».
 *
 *   node scripts/dev/check-page.mjs site/precios.html [site/otra.html …]
 *
 * No sustituye a mirar las capturas: caza lo que se cuela sin verse.
 *
 *   SEO       title, description, robots, canonical, hreflang, Open Graph, Twitter y JSON-LD
 *             idénticos a los de la versión publicada (git HEAD). En páginas nuevas, que existan.
 *   FAQ       cada pregunta y respuesta del JSON-LD FAQPage aparece tal cual en el texto visible.
 *   Esqueleto body.tc-body, main#main-content, marcadores de navegación y pie, scripts con defer.
 *   Marcado   un solo <h1>, sin saltos de nivel, <img> con width/height/alt.
 *   Sistema   clases tc-* que no existen en el CSS ni en el motor (erratas), clases p-* sin regla,
 *             iconos #i-* que no existen, hoja de estilos o scripts que el build no reconoce.
 *   Copy      «Ver demo», promesas absolutas, «Agendar demo» sin data-calendar-open, precios que
 *             no están en site/precios.html, emojis.
 *
 * Sale con código 1 si hay errores (✗). Los avisos (!) se leen y se deciden.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const files = process.argv.slice(2);
if (!files.length) { console.log('uso: node scripts/dev/check-page.mjs site/<pagina>.html […]'); process.exit(2); }

const read = (p) => readFileSync(p, 'utf8');
const cssDir = join(ROOT, 'src', 'css');
const sysCss = readdirSync(cssDir).filter((f) => f.endsWith('.css')).map((f) => read(join(cssDir, f))).join('\n');
const pagesDir = join(cssDir, 'pages');
const pagesCss = existsSync(pagesDir) ? readdirSync(pagesDir).filter((f) => f.endsWith('.css')).map((f) => read(join(pagesDir, f))).join('\n') : '';
const jsDir = join(ROOT, 'src', 'js');
const engine = readdirSync(jsDir).map((f) => read(join(jsDir, f))).join('\n')
  + read(join(ROOT, 'site/assets/js/consent.js')) + read(join(ROOT, 'site/assets/js/contact-form.js'))
  + read(join(ROOT, 'scripts/nav.mjs')) + read(join(ROOT, 'scripts/footer.mjs'));
const icons = new Set([...read(join(ROOT, 'scripts/icons.mjs')).matchAll(/^\s*'?([a-z0-9-]+)'?\s*:\s*['"`]</gm)].map((m) => m[1]));
const allowedPrices = new Set([...read(join(ROOT, 'site/precios.html')).matchAll(/(\d+(?:[.,]\d{2})?)\s*(?:&nbsp;)?(?:€|&euro;)/g)].map((m) => m[1]));

const ENT = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", euro: '€', laquo: '«', raquo: '»', middot: '·', iquest: '¿', iexcl: '¡',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü',
  ordm: 'º', ordf: 'ª', ndash: '–', mdash: '—', hellip: '…', rarr: '→', larr: '←', times: '×', deg: '°', copy: '©', reg: '®', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’' };
const decode = (s) => s.replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
  .replace(/&([a-zA-Z]+);/g, (m, n) => (n in ENT ? ENT[n] : m));
const text = (h) => decode(h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function head(h) {
  const one = (re) => { const m = h.match(re); return m ? decode(m[1]).trim() : null; };
  const many = (re) => [...h.matchAll(re)].map((m) => m[1] + ' = ' + decode(m[2])).sort();
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
    try { return JSON.stringify(JSON.parse(m[1])); } catch (e) { return 'JSON NO VÁLIDO: ' + e.message; }
  });
  return {
    title: one(/<title>([\s\S]*?)<\/title>/),
    description: one(/<meta name="description" content="([^"]*)"/),
    robots: one(/<meta name="robots" content="([^"]*)"/),
    canonical: one(/<link rel="canonical" href="([^"]*)"/),
    hreflang: many(/<link rel="alternate" hreflang="([^"]+)" href="([^"]*)"/g),
    og: many(/<meta property="(og:[^"]+)" content="([^"]*)"/g),
    twitter: many(/<meta name="(twitter:[^"]+)" content="([^"]*)"/g),
    'JSON-LD': ld,
  };
}

let failed = false;
for (const arg of files) {
  const file = resolve(arg);
  const rel = relative(ROOT, file);
  const errs = [], warns = [];
  if (!existsSync(file)) { console.log(`\n${rel}\n  ✗ no existe`); failed = true; continue; }
  const h = read(file);
  const main = (h.match(/<main[\s\S]*?<\/main>/) || [''])[0];

  // ---- SEO frente a lo publicado
  const now = head(h);
  let old = null;
  try { old = execFileSync('git', ['-C', ROOT, 'show', 'HEAD:' + rel], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32e6 }); } catch (e) { /* página nueva */ }
  if (old && !/<meta http-equiv="refresh"/.test(old)) {
    const was = head(old);
    for (const k of Object.keys(was)) {
      const a = JSON.stringify(was[k]), b = JSON.stringify(now[k]);
      if (a === b) continue;
      if (Array.isArray(was[k])) {
        const gone = was[k].filter((x) => !now[k].includes(x)), added = now[k].filter((x) => !was[k].includes(x));
        errs.push(`SEO · ${k} ha cambiado respecto a lo publicado` + (gone.length ? `\n      antes: ${gone.map((x) => x.slice(0, 160)).join('\n             ')}` : '') + (added.length ? `\n      ahora: ${added.map((x) => x.slice(0, 160)).join('\n             ')}` : ''));
      } else errs.push(`SEO · ${k} ha cambiado respecto a lo publicado\n      antes: ${was[k]}\n      ahora: ${now[k]}`);
    }
  } else {
    for (const k of ['title', 'description', 'canonical']) if (!now[k]) errs.push(`SEO · falta ${k} (página nueva)`);
    if (!now.og.length) warns.push('SEO · página nueva sin Open Graph');
    if (!now['JSON-LD'].length) warns.push('SEO · página nueva sin JSON-LD');
    if (now.title && now.title.length > 65) warns.push(`SEO · title de ${now.title.length} caracteres (máx. ~60)`);
    if (now.description && now.description.length > 165) warns.push(`SEO · description de ${now.description.length} caracteres (máx. ~155)`);
  }
  now['JSON-LD'].forEach((x) => { if (x.startsWith('JSON NO VÁLIDO')) errs.push('SEO · ' + x); });

  // ---- FAQ visible = JSON-LD
  // Si la versión publicada ya tenía el desajuste (hay páginas donde el JSON-LD y el FAQ visible nunca
  // coincidieron), es un aviso: no se arregla tocando el JSON-LD ni reescribiendo la respuesta publicada.
  const visible = text(main);
  const oldVisible = old ? text((old.match(/<main[\s\S]*?<\/main>/) || [old])[0]) : null;
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let d; try { d = JSON.parse(m[1]); } catch (e) { continue; }
    const items = Array.isArray(d) ? d : d['@graph'] || [d];
    for (const it of items) {
      if (it['@type'] !== 'FAQPage' || !Array.isArray(it.mainEntity)) continue;
      for (const q of it.mainEntity) {
        const name = text(String(q.name || '')), ans = text(String((q.acceptedAnswer || {}).text || ''));
        const before = oldVisible !== null && (!oldVisible.includes(name) || !oldVisible.includes(ans));
        const say = (msg) => (before ? warns.push(msg + ' (ya ocurría en la versión publicada: conserva el texto visible publicado y anótalo)') : errs.push(msg));
        if (!visible.includes(name)) say(`FAQ · la pregunta del JSON-LD no está en la página: «${name.slice(0, 90)}»`);
        else if (!visible.includes(ans)) say(`FAQ · la respuesta visible no coincide con el JSON-LD: «${name.slice(0, 70)}»`);
      }
    }
  }
  // preguntas visibles que estaban publicadas y han desaparecido
  if (old) {
    const qs = (s) => new Set([...s.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)].map((x) => text(x[1])).filter(Boolean));
    const was = qs(old);
    for (const q of was) if (!visible.includes(q)) errs.push(`FAQ · una pregunta publicada ya no está en la página: «${q.slice(0, 90)}»`);
  }

  // ---- Esqueleto
  if (!/<body[^>]*class="[^"]*\btc-body\b/.test(h)) errs.push('esqueleto · <body> sin la clase tc-body (la página sigue en el sistema antiguo)');
  if (!/<main[^>]*id="main-content"/.test(h)) errs.push('esqueleto · falta <main id="main-content">');
  if (!h.includes('<!--NAV-->') || !h.includes('<!--/NAV-->')) errs.push('esqueleto · faltan los marcadores <!--NAV--><!--/NAV-->');
  if (!h.includes('<!--FOOTER-->') || !h.includes('<!--/FOOTER-->')) errs.push('esqueleto · faltan los marcadores <!--FOOTER--><!--/FOOTER-->');
  if (h.includes('<!--NAV--><!--/NAV-->') || h.includes('<!--FOOTER--><!--/FOOTER-->')) errs.push('esqueleto · marcadores vacíos: ejecuta node scripts/nav.mjs && node scripts/footer.mjs');
  if (!/<link rel="stylesheet" href="\/assets\/css\/site\.[0-9a-f]{8}\.min\.css">/.test(h)) errs.push('esqueleto · no enlaza el bundle de CSS (compila con node scripts/build-assets.mjs)');
  if (!/<script src="\/assets\/js\/components\.[0-9a-f]{8}\.min\.js" defer>/.test(h)) errs.push('esqueleto · falta <script src="/assets/js/components.js" defer> (o no se ha compilado)');
  if (!/<script src="\/assets\/js\/consent\.[0-9a-f]{8}\.min\.js" defer>/.test(h)) errs.push('esqueleto · falta <script src="/assets/js/consent.js" defer>');
  if (/tailwind|fonts\.googleapis|sprite\.svg/.test(h)) errs.push('esqueleto · quedan restos del sistema antiguo (Tailwind, Google Fonts o el sprite de iconos)');
  if (/view-transition-name/.test(main)) warns.push('movimiento · view-transition-name escrito a mano: usa data-vt="nombre"');
  for (const m of main.matchAll(/<section\b[^>]*class="([^"]*\btc-sec\b[^"]*)"/g)) {
    if (!/\btone-(dark|light)\b/.test(m[1])) warns.push(`tono · sección sin tone-dark / tone-light: class="${m[1]}"`);
  }

  // ---- Marcado
  const hs = [...main.matchAll(/<(h[1-6])\b/g)].map((m) => +m[1][1]);
  const h1 = hs.filter((n) => n === 1).length;
  if (h1 !== 1) errs.push(`marcado · ${h1} <h1> (debe haber uno)`);
  let prev = 1;
  for (const n of hs) { if (n > prev + 1) { warns.push(`marcado · salto de encabezado h${prev} → h${n}`); break; } prev = n; }
  for (const m of main.matchAll(/<img\b[^>]*>/g)) {
    const t = m[0];
    if (!/\bwidth="\d+"/.test(t) || !/\bheight="\d+"/.test(t)) errs.push(`marcado · <img> sin width/height: ${t.slice(0, 110)}`);
    if (!/\balt="/.test(t)) errs.push(`marcado · <img> sin alt: ${t.slice(0, 110)}`);
  }

  // ---- Sistema: clases e iconos que no existen
  const used = new Set();
  for (const m of main.matchAll(/\bclass="([^"]*)"/g)) m[1].split(/\s+/).forEach((c) => { if (c) used.add(c); });
  for (const c of [...used].sort()) {
    const inCss = (css) => new RegExp('\\.' + esc(c) + '(?![\\w-])').test(css);
    if (c.startsWith('tc-')) { if (!inCss(sysCss) && !inCss(pagesCss) && !engine.includes(c)) errs.push(`sistema · la clase ${c} no existe (ni en src/css ni en el motor)`); }
    else if (c.startsWith('p-')) { if (!inCss(pagesCss)) warns.push(`sistema · la clase ${c} no tiene regla en src/css/pages/`); }
  }
  for (const m of new Set([...main.matchAll(/href="#i-([a-z0-9-]+)"/g)].map((x) => x[1]))) {
    if (!icons.has(m)) errs.push(`sistema · el icono #i-${m} no existe en scripts/icons.mjs`);
  }
  for (const m of main.matchAll(/\bstyle="([^"]*)"/g)) {
    if (/(^|;)\s*(color|background(-color)?)\s*:\s*(#|rgb)/.test(m[1])) { warns.push(`sistema · color escrito a mano en style="${m[1].slice(0, 80)}" (usa tokens o clases)`); break; }
  }

  // ---- Copy
  if (/ver demo/i.test(visible)) errs.push('copy · «Ver demo»: el CTA es «Agendar demo»');
  for (const [re, why] of [
    [/100\s?%\s+(de\s+)?(cumplimiento|legal|segur)/i, '«100 % …»'], [/\b0 sanciones\b/i, '«0 sanciones»'], [/\bblindar?\b/i, '«blindar»'],
    [/\bgarantizamos\b|\bgarantizado\b/i, '«garantizamos / garantizado»'], [/\brevolucionari[oa]s?\b/i, '«revolucionario»'],
    [/\bdisruptiv[oa]s?\b/i, '«disruptivo»'], [/\bl[ií]der(es)?\b/i, '«líder»'], [/\bfirma legal\b/i, '«firma legal»'],
  ]) if (re.test(visible)) warns.push(`copy · posible promesa absoluta o palabra vetada: ${why} (ver copy-rules.md)`);
  for (const m of main.matchAll(/<(a|button)\b([^>]*)>(?:(?!<\/\1>)[\s\S])*?Agendar demo(?:(?!<\/\1>)[\s\S])*?<\/\1>/g)) {
    if (!/data-calendar-open|data-bot-demo/.test(m[2])) errs.push(`copy · «Agendar demo» sin data-calendar-open: <${m[1]}${m[2].slice(0, 90)}>`);
  }
  for (const m of visible.matchAll(/(\d+(?:[.,]\d{2})?)\s?€\s?\/\s?(?:usuario\/)?(?:mes|año)/g)) {
    if (!allowedPrices.has(m[1])) errs.push(`copy · el precio «${m[0]}» no está en site/precios.html`);
  }
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(visible.replace(/[✓✔→←↗★·]/g, ''))) warns.push('copy · hay emojis o pictogramas en el texto (iconos: <svg class="tc-ico">)');

  console.log(`\n${rel}`);
  errs.forEach((e) => console.log('  ✗ ' + e));
  warns.forEach((w) => console.log('  ! ' + w));
  if (!errs.length && !warns.length) console.log('  ✓ sin incidencias');
  else if (!errs.length) console.log('  ✓ sin errores');
  if (errs.length) failed = true;
}
process.exit(failed ? 1 : 0);
