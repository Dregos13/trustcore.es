#!/usr/bin/env node
/**
 * new-article.mjs — da de alta un artículo del blog con un solo comando.
 *
 *   node scripts/new-article.mjs --from <spec.json> [--blog-dir] [--force] [--dry-run] [--json]
 *   npm run new-article -- --from scripts/examples/articulo-ejemplo.json
 *
 * Qué hace, en orden:
 *   1. Valida el spec (formato en docs/new-article-spec.md): título ≤ 60,
 *      meta ≤ 155, slug, cuerpo en Markdown o HTML, FAQ opcional, enlaces
 *      internos a páginas que existen, fuentes.
 *   2. Rellena site/_templates/article.html → site/<slug>.html
 *      (o site/blog/<slug>.html con --blog-dir, para cuando exista la ruta /blog/).
 *   3. Añade o actualiza la tarjeta del hub site/blog.html.
 *   4. Añade la entrada en site/llms.txt y site/llms-full.txt.
 *   5. Ejecuta node scripts/seo-i18n.mjs (sitemap + hreflang).
 *
 * Es idempotente: ejecutarlo dos veces con el mismo spec deja los ficheros
 * igual que una sola vez. Cada pieza que genera lleva una marca para poder
 * localizarla y sustituirla:
 *   · la página:  <!--new-article:v1 …--> en el <head>
 *   · la tarjeta: <!--article:<slug>--> … <!--/article:<slug>--> en blog.html
 *   · llms.txt / llms-full.txt: la URL del artículo, una vez
 *
 * No valida nada contra la red: comprobar que una fuente sigue viva es cosa
 * de la revisión «Hechos» de quien publica.
 *
 * Nada de este script toca otros artículos. Las clases del cuerpo no
 * dependen del bundle de Tailwind (se purga contra site/**): el estilo del
 * cuerpo va en un <style> de la plantilla con los tokens del sitio.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(SCRIPTS_DIR, '..');
export const ORIGIN = 'https://www.trustcore.es';
const TEMPLATE = 'site/_templates/article.html';
const PAGE_MARK = '<!--new-article:v1';
const DEFAULT_OG = '/assets/og-image-1200x630.jpg';
const LLMS_SECTION = '## Artículos del blog';
const LLMS_SECTION_INTRO = 'Guías del blog, la más reciente primero. Cada una cita sus fuentes al final de la página.';
const LLMS_FULL_SECTION = '## Contenido estratégico';

export const LIMITS = {
  title: 60, description: 155, slug: 80, h1: 90, eyebrow: 40, lead: 260,
  question: 150, cardSummary: 160, sourceLabel: 120, authorName: 80, faq: 12, related: 6, sources: 25,
};

/**
 * Clústeres editoriales (docs/content-playbook.md). Son datos: para abrir una
 * serie nueva se añade aquí y se crea la píldora en el hub.
 *   label   → eyebrow y píldora de la tarjeta
 *   category→ data-category del filtro de blog.html
 *   icon    → icono del sprite por defecto para la tarjeta
 *   pill    → estilo de la píldora (los que ya usa blog.html)
 *   series  → cabecera «### Serie …» de llms-full.txt
 */
export const CLUSTERS = {
  'verifactu': {
    label: 'VeriFactu 2027', icon: 'fa-qrcode',
    pill: 'background:rgba(32,113,213,0.08);color:var(--tc-blue-eyebrow)',
    series: 'Serie VeriFactu 2027',
  },
  'ipsi': {
    label: 'IPSI', icon: 'fa-percent',
    pill: 'background:rgba(32,113,213,0.08);color:var(--tc-blue-eyebrow)',
    series: 'Serie IPSI y relación Ceuta/Melilla - península',
  },
  'control-horario': {
    label: 'Control horario', icon: 'fa-clock',
    pill: 'background:rgba(15,160,111,0.08);color:var(--tc-success-text)',
    series: 'Serie Control Horario',
  },
  'plan-lite': {
    label: 'Plan Lite', icon: 'fa-seedling',
    pill: 'background:rgba(212,162,61,0.1);color:var(--tc-gold-deep)',
    series: 'Serie Plan Lite',
  },
};

const DEFAULT_CTA = {
  title: 'Cómo lo enfoca TrustCore',
  text: 'TrustinFacts y TrustinTime cubren facturación preparada para VeriFactu, IPSI y control horario en una sola cuenta. Si quieres verlo con los datos de tu empresa, agenda una demo.',
  primary: { label: 'Agendar demo', href: '/contacto', icon: 'fa-calendar-check' },
  secondary: { label: 'Ver vídeos cortos', href: '/aprende', icon: 'fa-play-circle' },
};

// Rutas que existen como fichero pero no deben enlazarse: responden 301.
const REDIRECTED = new Map([
  ['/article', '/blog'],
  ['/comparativa', '/precios'],
]);

const KNOWN_KEYS = new Set([
  'slug', 'title', 'description', 'cluster', 'h1', 'eyebrow', 'lead', 'datePublished', 'dateModified',
  'author', 'ogImage', 'icon', 'body', 'faq', 'related', 'sources', 'cta', 'card',
]);

// ----------------------------------------------------------------- utilidades
export class SpecError extends Error {
  constructor(problems) {
    super(`Spec inválido:\n${problems.map((p) => `  · ${p}`).join('\n')}`);
    this.name = 'SpecError';
    this.problems = problems;
  }
}

const escapeHtml = (s) => String(s)
  .replace(/&(?![a-zA-Z][a-zA-Z0-9]*;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const stripTags = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const decodeBasic = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const len = (s) => [...String(s ?? '').trim()].length;
const isStr = (v) => typeof v === 'string';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export function fechaLarga(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}
const fechaCorta = (iso) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function slugify(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ------------------------------------------------------------------ Markdown
/**
 * Conversor de un subconjunto de Markdown suficiente para un artículo:
 * cabeceras (## y ###; nunca h1), párrafos, listas anidadas, citas, tablas,
 * código, imágenes, enlaces, negrita/cursiva, HTML en crudo por bloque o en
 * línea. Lo que no cubra se escribe en HTML dentro del propio Markdown o se
 * manda el cuerpo entero como HTML.
 */
export function markdownToHtml(src) {
  const html = renderBlocks(String(src).replace(/\r\n?/g, '\n').split('\n'));
  // Un id por cabecera, único dentro del documento.
  const seen = new Map();
  return html.replace(/<h([2-4]) id="([^"]*)"/g, (_, lvl, id) => {
    const n = (seen.get(id) ?? 0) + 1; seen.set(id, n);
    return `<h${lvl} id="${n === 1 ? id : `${id}-${n}`}"`;
  });
}

const BLANK = (l) => l === undefined || /^\s*$/.test(l);
const indentOf = (l) => l.match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
const LIST_RE = /^([ \t]*)([-*+]|\d{1,3}[.)])[ \t]+(.*)$/;
const BLOCK_START = /^(?:#{1,6}[ \t]|```|>|\|)|^(?:-{3,}|\*{3,}|_{3,})[ \t]*$/;
const RAW_BLOCK_RE = /^<(?:\/?(?:address|article|aside|blockquote|details|dialog|div|dl|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|iframe|img|main|nav|ol|p|pre|section|summary|table|ul|video)\b|!--)/i;
const TABLE_DELIM_RE = /^\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;

function renderBlocks(lines) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (BLANK(line)) { i++; continue; }
    let m;

    if ((m = line.match(/^```[ \t]*([\w-]*)[ \t]*$/))) {
      const buf = []; i++;
      while (i < lines.length && !/^```[ \t]*$/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code${m[1] ? ` class="language-${escapeHtml(m[1])}"` : ''}>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    if ((m = line.match(/^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/))) {
      const level = Math.min(Math.max(m[1].length, 2), 4);
      const text = inline(m[2]);
      out.push(`<h${level} id="${slugify(stripTags(text))}">${text}</h${level}>`);
      i++; continue;
    }

    if (/^(?:-{3,}|\*{3,}|_{3,})[ \t]*$/.test(line)) { out.push('<hr>'); i++; continue; }

    if (/^>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^>[ ]?/, ''));
      out.push(`<blockquote>\n${renderBlocks(buf)}\n</blockquote>`);
      continue;
    }

    if (/^\|.*\|[ \t]*$/.test(line) && i + 1 < lines.length && TABLE_DELIM_RE.test(lines[i + 1])) {
      const header = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /^-+:$/.test(c) ? 'right' : null));
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(splitRow(lines[i++]));
      const al = (k) => (aligns[k] ? ` style="text-align:${aligns[k]}"` : '');
      const tr = (cells, tag) => `<tr>${cells.map((c, k) => `<${tag}${al(k)}>${inline(c)}</${tag}>`).join('')}</tr>`;
      out.push(`<div class="tc-table"><table>\n<thead>${tr(header, 'th')}</thead>\n<tbody>\n${rows.map((r) => tr(r, 'td')).join('\n')}\n</tbody>\n</table></div>`);
      continue;
    }

    if (LIST_RE.test(line)) {
      const base = indentOf(line);
      const block = [];
      let j = i;
      while (j < lines.length) {
        const l = lines[j];
        if (BLANK(l)) {
          const n = lines[j + 1];
          if (n !== undefined && !BLANK(n) && ((LIST_RE.test(n) && indentOf(n) >= base) || indentOf(n) > base)) { block.push(''); j++; continue; }
          break;
        }
        if ((LIST_RE.test(l) && indentOf(l) >= base) || indentOf(l) > base) { block.push(l); j++; continue; }
        // continuación perezosa: texto pegado al ítem sin sangría
        if (!BLOCK_START.test(l) && block.length && !BLANK(block[block.length - 1])) { block.push(' '.repeat(base + 2) + l); j++; continue; }
        break;
      }
      out.push(renderList(block, base));
      i = j; continue;
    }

    if (RAW_BLOCK_RE.test(line)) {
      const buf = [];
      while (i < lines.length && !BLANK(lines[i])) buf.push(lines[i++]);
      out.push(buf.join('\n'));
      continue;
    }

    const buf = [];
    while (i < lines.length && !BLANK(lines[i]) && !(buf.length && BLOCK_START.test(lines[i]))) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join('\n'))}</p>`);
  }
  return out.join('\n');
}

function splitRow(row) {
  let r = row.trim();
  if (r.startsWith('|')) r = r.slice(1);
  if (r.endsWith('|')) r = r.slice(0, -1);
  return r.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

function renderList(block, base) {
  const ordered = /^[ \t]*\d{1,3}[.)]/.test(block[0]);
  const items = [];
  for (const raw of block) {
    const m = raw.match(LIST_RE);
    if (m && indentOf(raw) === base) items.push({ text: m[3], rest: [] });
    else if (items.length) items[items.length - 1].rest.push(raw);
  }
  const li = items.map(({ text, rest }) => {
    const nonBlank = rest.filter((l) => !BLANK(l));
    if (!nonBlank.length) return `<li>${inline(text)}</li>`;
    const dedent = Math.min(...nonBlank.map(indentOf));
    const sub = rest.map((l) => (BLANK(l) ? '' : l.replace(/^[ \t]*/, (ws) => ' '.repeat(Math.max(0, ws.replace(/\t/g, '    ').length - dedent)))));
    const hasBlock = sub.some((l) => LIST_RE.test(l) || BLOCK_START.test(l) || BLANK(l));
    if (!hasBlock) return `<li>${inline([text, ...sub].join('\n'))}</li>`;
    // párrafo de cabecera + bloques anidados
    const lead = [text];
    let k = 0;
    while (k < sub.length && !BLANK(sub[k]) && !LIST_RE.test(sub[k]) && !BLOCK_START.test(sub[k])) lead.push(sub[k++]);
    return `<li>${inline(lead.join('\n'))}\n${renderBlocks(sub.slice(k))}</li>`;
  });
  const tag = ordered ? 'ol' : 'ul';
  const start = ordered ? block[0].match(/^[ \t]*(\d{1,3})/)[1] : '1';
  return `<${tag}${ordered && start !== '1' ? ` start="${start}"` : ''}>\n${li.join('\n')}\n</${tag}>`;
}

export function inline(text) {
  const stash = [];
  const keep = (html) => { stash.push(html); return `\u0000${stash.length - 1}\u0000`; };
  let s = String(text);
  s = s.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, _t, code) => keep(`<code>${escapeHtml(code.trim())}</code>`));
  s = s.replace(/<(https?:\/\/[^\s<>]+)>/g, (_, u) => keep(`<a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(u)}</a>`));
  s = s.replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*?)?\/?>/g, (t) => keep(t));
  s = escapeHtml(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, alt, src, title) =>
    keep(`<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''} loading="lazy">`));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, label, href, title) => {
    const external = /^https?:\/\//.test(href) && !href.startsWith(ORIGIN);
    return keep(`<a href="${href}"${title ? ` title="${title}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}>${emphasis(label)}</a>`);
  });
  s = emphasis(s);
  s = s.replace(/ {2,}\n/g, '<br>\n');
  return s.replace(/\u0000(\d+)\u0000/g, (_, k) => stash[k]);
}

function emphasis(s) {
  return s
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<![\w\\])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?=\S)([^*\n]*?\S)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<![\w\\])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '<em>$1</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<s>$1</s>');
}

// ---------------------------------------------------------------- validación
function loadSprite(site) {
  const p = join(site, 'assets', 'icons', 'sprite.svg');
  if (!existsSync(p)) return null;
  return new Set([...readFileSync(p, 'utf8').matchAll(/id="(fa-[a-z0-9-]+)"/g)].map((m) => m[1]));
}

/**
 * Resuelve una ruta interna (`/foo`, `/productos/x`, `/assets/a.png`, `/`) al
 * fichero de site/. Devuelve null si no existe.
 */
export function resolveInternal(site, href, { selfPath } = {}) {
  let path = href.startsWith(ORIGIN) ? href.slice(ORIGIN.length) || '/' : href;
  if (/^https?:\/\/trustcore\.es/.test(path)) path = path.replace(/^https?:\/\/trustcore\.es/, '') || '/';
  path = path.replace(/[?#].*$/, '');
  if (path === '') return { ok: true };
  if (!path.startsWith('/')) return { ok: false, why: 'usa rutas absolutas que empiecen por /' };
  if (REDIRECTED.has(path)) return { ok: false, why: `redirige a ${REDIRECTED.get(path)}; enlaza al destino` };
  if (/^\/(en|fr)(\/|$)/.test(path)) return { ok: false, why: 'las rutas /en y /fr están retiradas (301 al español)' };
  if (/\.html$/.test(path)) return { ok: false, why: 'quita la extensión .html (el sitio sirve URLs limpias)' };
  if (selfPath && path === selfPath) return { ok: true };
  const rel = path.replace(/^\/+/, '');
  const candidates = path === '/' || path.endsWith('/')
    ? [join(site, rel, 'index.html')]
    : [join(site, `${rel}.html`), join(site, rel), join(site, rel, 'index.html')];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return { ok: true, file: relative(site, c) };
  }
  return { ok: false, why: 'no existe en site/' };
}

function collectHrefs(html) {
  return [...html.matchAll(/\b(?:href|src)="([^"]*)"/g)].map((m) => decodeBasic(m[1]));
}

function checkLinks(html, where, site, selfPath, problems) {
  for (const href of new Set(collectHrefs(html))) {
    if (/^(mailto:|tel:|#|data:)/.test(href)) continue;
    if (/^https?:\/\//.test(href) && !/^https?:\/\/(www\.)?trustcore\.es/.test(href)) {
      if (!/^https:\/\//.test(href)) problems.push(`${where}: enlace externo sin https: ${href}`);
      continue;
    }
    const r = resolveInternal(site, href, { selfPath });
    if (!r.ok) problems.push(`${where}: enlace interno ${href} — ${r.why}`);
  }
}

function str(v, key, max, problems, { required = false, min = 1 } = {}) {
  if (v === undefined || v === null) { if (required) problems.push(`${key}: obligatorio`); return undefined; }
  if (!isStr(v)) { problems.push(`${key}: debe ser texto`); return undefined; }
  const n = len(v);
  if (n < min) problems.push(`${key}: vacío`);
  if (max && n > max) problems.push(`${key}: ${n} caracteres, máximo ${max}`);
  return v.trim();
}

/**
 * Valida y normaliza el spec. Devuelve { spec, warnings } o lanza SpecError.
 * `specDir` resuelve body.file; `site` sirve para comprobar enlaces y activos.
 */
export function validateSpec(raw, { specDir, site, blogDir = false }) {
  const problems = [];
  const warnings = [];
  if (!isObj(raw)) throw new SpecError(['el spec debe ser un objeto JSON']);
  for (const k of Object.keys(raw)) if (!KNOWN_KEYS.has(k)) problems.push(`campo desconocido: ${k}`);

  const s = {};
  s.slug = str(raw.slug, 'slug', LIMITS.slug, problems, { required: true });
  if (s.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.slug)) problems.push('slug: solo minúsculas, dígitos y guiones (ej. ipsi-en-presupuestos)');
  s.title = str(raw.title, 'title', LIMITS.title, problems, { required: true });
  if (s.title && /\|\s*TrustCore\s*$/i.test(s.title)) problems.push('title: no incluyas el sufijo « | TrustCore», se añade solo');
  s.description = str(raw.description, 'description', LIMITS.description, problems, { required: true });
  if (s.description && len(s.description) < 70) warnings.push(`description: ${len(s.description)} caracteres; entre 70 y 155 aprovecha mejor el snippet`);

  s.cluster = str(raw.cluster, 'cluster', 40, problems, { required: true });
  if (s.cluster && !CLUSTERS[s.cluster]) problems.push(`cluster: «${s.cluster}» no existe; usa uno de ${Object.keys(CLUSTERS).join(', ')}`);
  const cluster = CLUSTERS[s.cluster] ?? CLUSTERS.ipsi;

  s.h1 = str(raw.h1, 'h1', LIMITS.h1, problems) ?? s.title;
  s.eyebrow = str(raw.eyebrow, 'eyebrow', LIMITS.eyebrow, problems) ?? cluster.label;
  s.lead = str(raw.lead, 'lead', LIMITS.lead, problems) ?? s.description;

  s.datePublished = str(raw.datePublished, 'datePublished', 10, problems, { required: true });
  if (s.datePublished && !isValidDate(s.datePublished)) problems.push('datePublished: usa AAAA-MM-DD (ej. 2026-10-18)');
  s.dateModified = str(raw.dateModified, 'dateModified', 10, problems) ?? s.datePublished;
  if (s.dateModified && !isValidDate(s.dateModified)) problems.push('dateModified: usa AAAA-MM-DD');
  if (s.datePublished && s.dateModified && s.dateModified < s.datePublished) problems.push('dateModified: anterior a datePublished');

  // autor
  const a = raw.author ?? { name: 'TrustCore', type: 'Organization' };
  if (!isObj(a)) problems.push('author: debe ser un objeto { name, type, url? }');
  else {
    s.author = {
      name: str(a.name, 'author.name', LIMITS.authorName, problems, { required: true }),
      type: a.type ?? 'Organization',
      url: str(a.url, 'author.url', 300, problems),
    };
    if (!['Organization', 'Person'].includes(s.author.type)) problems.push('author.type: Organization o Person');
  }

  // imagen OG
  s.ogImage = str(raw.ogImage, 'ogImage', 300, problems) ?? DEFAULT_OG;
  if (s.ogImage && !/^https:\/\//.test(s.ogImage)) {
    if (!s.ogImage.startsWith('/')) problems.push('ogImage: ruta absoluta (/assets/…) o URL https');
    else if (!resolveInternal(site, s.ogImage).ok) problems.push(`ogImage: ${s.ogImage} no existe en site/`);
  }

  // icono de la tarjeta
  const sprite = loadSprite(site);
  s.icon = str(raw.icon, 'icon', 40, problems) ?? cluster.icon;
  if (sprite && s.icon && !sprite.has(s.icon)) problems.push(`icon: «${s.icon}» no está en assets/icons/sprite.svg`);

  // cuerpo
  let bodyHtml = '';
  const b = isStr(raw.body) ? { format: 'markdown', content: raw.body } : raw.body;
  if (!isObj(b)) problems.push('body: obligatorio; { "format": "markdown"|"html", "content": "…" } o { …, "file": "ruta.md" }');
  else {
    if (!['markdown', 'html'].includes(b.format)) problems.push('body.format: markdown o html');
    let content;
    if (isStr(b.content) && isStr(b.file)) problems.push('body: content o file, no los dos');
    else if (isStr(b.content)) content = b.content;
    else if (isStr(b.file)) {
      const p = isAbsolute(b.file) ? b.file : resolve(specDir, b.file);
      if (!existsSync(p)) problems.push(`body.file: no encuentro ${b.file} (relativo a la carpeta del spec)`);
      else content = readFileSync(p, 'utf8');
    } else problems.push('body: falta content o file');
    if (content !== undefined) {
      if (!content.trim()) problems.push('body: vacío');
      bodyHtml = b.format === 'html' ? content.trim() : markdownToHtml(content);
      if (/<h1[\s>]/i.test(bodyHtml)) problems.push('body: no uses <h1>; el título ya es el h1 de la página (empieza por ##)');
      const words = stripTags(bodyHtml).split(/\s+/).filter(Boolean).length;
      if (words < 300) warnings.push(`body: ${words} palabras; por debajo de 300 es difícil que posicione`);
    }
  }
  s.bodyHtml = bodyHtml;

  // FAQ
  s.faq = [];
  if (raw.faq !== undefined) {
    if (!Array.isArray(raw.faq)) problems.push('faq: debe ser una lista');
    else {
      if (raw.faq.length > LIMITS.faq) problems.push(`faq: máximo ${LIMITS.faq} preguntas`);
      raw.faq.forEach((q, k) => {
        if (!isObj(q)) { problems.push(`faq[${k}]: debe ser { question, answer, sources? }`); return; }
        const question = str(q.question, `faq[${k}].question`, LIMITS.question, problems, { required: true });
        const answer = str(q.answer, `faq[${k}].answer`, 0, problems, { required: true });
        const sources = q.sources ?? [];
        if (!Array.isArray(sources) || sources.some((u) => !isStr(u) || !/^https:\/\//.test(u))) problems.push(`faq[${k}].sources: lista de URLs https`);
        s.faq.push({ question, answer, answerHtml: markdownToHtml(answer ?? ''), sources });
      });
    }
  }

  // relacionados
  s.related = [];
  if (raw.related !== undefined) {
    if (!Array.isArray(raw.related)) problems.push('related: lista de slugs o de { slug, label?, title?, summary? }');
    else {
      if (raw.related.length > LIMITS.related) problems.push(`related: máximo ${LIMITS.related}`);
      raw.related.forEach((r, k) => {
        const item = isStr(r) ? { slug: r } : r;
        if (!isObj(item) || !isStr(item.slug)) { problems.push(`related[${k}]: slug obligatorio`); return; }
        if (item.slug === s.slug) { problems.push(`related[${k}]: el artículo no puede relacionarse consigo mismo`); return; }
        const hit = resolveInternal(site, `/${item.slug}`);
        const hitBlog = hit.ok ? hit : resolveInternal(site, `/blog/${item.slug}`);
        if (!hitBlog.ok) { problems.push(`related[${k}]: /${item.slug} no existe en site/`); return; }
        const info = pageInfo(join(site, hitBlog.file), site, item.slug);
        s.related.push({
          slug: item.slug,
          href: hit.ok ? `/${item.slug}` : `/blog/${item.slug}`,
          label: str(item.label, `related[${k}].label`, LIMITS.eyebrow, problems) ?? info.label,
          title: str(item.title, `related[${k}].title`, LIMITS.h1, problems) ?? info.title,
          summary: str(item.summary, `related[${k}].summary`, LIMITS.cardSummary, problems) ?? info.description,
        });
      });
    }
  }
  if (!s.related.length) warnings.push('related: sin artículos relacionados; el enlazado interno es parte de la estrategia');

  // fuentes
  s.sources = [];
  if (!Array.isArray(raw.sources)) problems.push('sources: obligatorio, lista de { label, url, accessed? } (puede ir vacía si el artículo no afirma nada legal, fiscal ni numérico)');
  else {
    if (raw.sources.length > LIMITS.sources) problems.push(`sources: máximo ${LIMITS.sources}`);
    raw.sources.forEach((f, k) => {
      if (!isObj(f)) { problems.push(`sources[${k}]: debe ser { label, url, accessed? }`); return; }
      const label = str(f.label, `sources[${k}].label`, LIMITS.sourceLabel, problems, { required: true });
      const url = str(f.url, `sources[${k}].url`, 500, problems, { required: true });
      if (url && !/^https:\/\//.test(url)) problems.push(`sources[${k}].url: debe empezar por https://`);
      const accessed = str(f.accessed, `sources[${k}].accessed`, 10, problems);
      if (accessed && !isValidDate(accessed)) problems.push(`sources[${k}].accessed: usa AAAA-MM-DD`);
      s.sources.push({ label, url, accessed });
    });
    if (!raw.sources.length) warnings.push('sources: vacío; solo válido si el artículo no contiene afirmaciones legales, fiscales ni numéricas');
  }

  // CTA
  const c = raw.cta ?? {};
  if (!isObj(c)) problems.push('cta: objeto { title?, text?, primary?, secondary? }');
  else {
    const btn = (v, key, def) => {
      if (v === undefined) return def;
      if (v === null) return null;
      if (!isObj(v)) { problems.push(`${key}: { label, href }`); return def; }
      return {
        label: str(v.label, `${key}.label`, 40, problems, { required: true }),
        href: str(v.href, `${key}.href`, 300, problems, { required: true }),
        icon: str(v.icon, `${key}.icon`, 40, problems) ?? def.icon,
      };
    };
    s.cta = {
      title: str(c.title, 'cta.title', LIMITS.h1, problems) ?? DEFAULT_CTA.title,
      text: str(c.text, 'cta.text', 400, problems) ?? DEFAULT_CTA.text,
      primary: btn(c.primary, 'cta.primary', DEFAULT_CTA.primary),
      secondary: btn(c.secondary, 'cta.secondary', DEFAULT_CTA.secondary),
    };
    for (const k of ['primary', 'secondary']) {
      const bt = s.cta[k];
      if (bt?.icon && sprite && !sprite.has(bt.icon)) problems.push(`cta.${k}.icon: «${bt.icon}» no está en el sprite`);
    }
  }

  // tarjeta del hub
  const card = raw.card ?? {};
  if (!isObj(card)) problems.push('card: objeto { summary? }');
  else s.card = { summary: str(card.summary, 'card.summary', LIMITS.cardSummary, problems) ?? s.description };

  // enlaces internos de todo lo que se renderiza
  const selfPath = blogDir ? `/blog/${s.slug}` : `/${s.slug}`;
  if (bodyHtml) checkLinks(bodyHtml, 'body', site, selfPath, problems);
  s.faq.forEach((q, k) => checkLinks(q.answerHtml, `faq[${k}].answer`, site, selfPath, problems));
  if (s.cta) for (const k of ['primary', 'secondary']) if (s.cta[k]?.href) checkLinks(`href="${s.cta[k].href}"`, `cta.${k}.href`, site, selfPath, problems);
  if (s.author?.url) checkLinks(`href="${s.author.url}"`, 'author.url', site, selfPath, problems);

  if (problems.length) throw new SpecError(problems);
  return { spec: s, warnings, selfPath };
}

/** Título, descripción y etiqueta de un artículo existente, para «Sigue leyendo». */
function pageInfo(file, site, slug) {
  const html = readFileSync(file, 'utf8');
  const og = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
  const t = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? slug;
  const title = decodeBasic(og ?? t.replace(/\s*\|\s*TrustCore\s*$/i, ''));
  const description = decodeBasic(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  let label = 'Guía';
  const hub = join(site, 'blog.html');
  if (existsSync(hub)) {
    const cat = readFileSync(hub, 'utf8').match(new RegExp(`<a href="/(?:blog/)?${escapeRe(slug)}"[^>]*data-category="([^"]+)"`))?.[1];
    if (cat && CLUSTERS[cat]) label = CLUSTERS[cat].label;
  }
  return { title, description, label };
}

// -------------------------------------------------------------------- render
const ICON = (name, cls = 'tc-icon') => `<svg class="${cls}" aria-hidden="true"><use href="/assets/icons/sprite.svg#${name}"/></svg>`;

function renderBreadcrumbs(spec) {
  return `        <nav aria-label="Migas de pan">
          <ol class="tc-crumbs">
            <li><a href="/">Inicio</a></li>
            <li><a href="/blog">Blog</a></li>
            <li aria-current="page">${escapeHtml(spec.title)}</li>
          </ol>
        </nav>`;
}

function renderFaq(spec) {
  if (!spec.faq.length) return '';
  const items = spec.faq.map((q) => `          <details class="tc-faq">
            <summary class="tc-faq__q">${inline(q.question)}</summary>
            <div class="tc-faq__a text-slate-700 leading-relaxed">
${q.answerHtml.split('\n').map((l) => `              ${l}`).join('\n')}${q.sources.length ? `
              <p class="tc-faq__src">Fuente: ${q.sources.map((u) => `<a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0])}</a>`).join(' · ')}</p>` : ''}
            </div>
          </details>`).join('\n');
  return `        <section id="faq" class="mt-10" aria-labelledby="faq-title">
          <h2 id="faq-title" class="text-2xl font-extrabold mb-4" style="color:var(--tc-navy)">Preguntas frecuentes</h2>
${items}
        </section>`;
}

function renderCta(spec) {
  const c = spec.cta;
  const btn = (b, cls) => (b ? `            <a href="${escapeHtml(b.href)}" class="tc-btn ${cls}" data-track="article_cta">${b.icon ? `${ICON(b.icon)} ` : ''}${escapeHtml(b.label)}</a>` : '');
  return `        <section class="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-6" aria-labelledby="cta-title">
          <h2 id="cta-title" class="text-xl font-extrabold mb-3" style="color:var(--tc-navy)">${escapeHtml(c.title)}</h2>
          <p class="text-slate-700 leading-relaxed">${inline(c.text)}</p>
          <div class="mt-5 flex flex-wrap gap-3">
${[btn(c.secondary, 'tc-btn-secondary'), btn(c.primary, 'tc-btn-primary')].filter(Boolean).join('\n')}
          </div>
        </section>`;
}

function renderSources(spec) {
  if (!spec.sources.length) return '';
  const items = spec.sources.map((f) => `            <li><a class="font-bold text-blue-700" href="${escapeHtml(f.url)}" target="_blank" rel="noopener">${escapeHtml(f.label)}</a>${f.accessed ? ` <span class="text-sm text-slate-500">· consultada el ${fechaCorta(f.accessed)}</span>` : ''}</li>`).join('\n');
  return `        <section class="mt-10" aria-labelledby="fuentes-title">
          <h2 id="fuentes-title" class="text-2xl font-extrabold mb-3" style="color:var(--tc-navy)">Fuentes</h2>
          <ul class="space-y-2 text-slate-700">
${items}
          </ul>
        </section>`;
}

function renderRelated(spec) {
  if (!spec.related.length) return '';
  const cards = spec.related.map((r) => `          <a href="${r.href}" class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <p class="text-xs font-semibold uppercase" style="color:var(--tc-blue-eyebrow)">${escapeHtml(r.label)}</p>
            <h3 class="mt-2 font-bold leading-snug" style="color:var(--tc-navy)">${escapeHtml(r.title)}</h3>
            <p class="mt-2 text-sm text-slate-500 leading-relaxed">${escapeHtml(r.summary)}</p>
          </a>`).join('\n');
  return `      <section class="mt-10" aria-labelledby="relacionados-title">
        <h2 id="relacionados-title" class="text-2xl font-extrabold mb-4" style="color:var(--tc-navy)">Sigue leyendo</h2>
        <div class="grid md:grid-cols-${Math.min(spec.related.length, 3)} gap-4">
${cards}
        </div>
      </section>`;
}

function renderJsonLd(spec, url) {
  const abs = (p) => (/^https?:\/\//.test(p) ? p : ORIGIN + p);
  const author = { '@type': spec.author.type, name: spec.author.name };
  if (spec.author.url) author.url = abs(spec.author.url);
  const graph = [
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: spec.title,
      description: spec.description,
      datePublished: spec.datePublished,
      dateModified: spec.dateModified,
      inLanguage: 'es-ES',
      articleSection: CLUSTERS[spec.cluster].label,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author,
      publisher: {
        '@type': 'Organization',
        name: 'TrustCore',
        logo: { '@type': 'ImageObject', url: `${ORIGIN}/assets/trustcore-mark-512.png` },
      },
      image: abs(spec.ogImage),
      isPartOf: { '@type': 'Blog', '@id': `${ORIGIN}/blog`, name: 'Blog TrustCore' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'TrustCore', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${ORIGIN}/blog` },
        { '@type': 'ListItem', position: 3, name: spec.title, item: url },
      ],
    },
  ];
  if (spec.sources.length) graph[0].citation = spec.sources.map((f) => f.url);
  if (spec.faq.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: spec.faq.map((q) => {
        const answer = { '@type': 'Answer', text: stripTags(q.answerHtml) };
        if (q.sources.length) answer.citation = q.sources;
        return { '@type': 'Question', name: q.question, acceptedAnswer: answer };
      }),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)
    .replace(/<\//g, '<\\/')
    .split('\n').map((l) => `  ${l}`).join('\n');
}

export function renderCard(spec, href) {
  const cl = CLUSTERS[spec.cluster];
  return `        <a href="${href}" class="blog-card group bg-white rounded-2xl border border-gray-200 p-7 transition-all hover:shadow-lg hover:-translate-y-0.5" data-category="${spec.cluster}" data-reveal>
          <span class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-4" style="${cl.pill}">
            ${ICON(spec.icon, 'tc-icon text-xs')} ${escapeHtml(spec.eyebrow)}
          </span>
          <h2 class="font-bold text-lg leading-snug mb-3 group-hover:text-blue-700 transition-colors" style="color:var(--tc-navy)">${escapeHtml(spec.title)}</h2>
          <p class="text-gray-500 text-sm leading-relaxed">${escapeHtml(spec.card.summary)}</p>
          <span class="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold" style="color:var(--tc-blue-eyebrow)">Leer artículo ${ICON('fa-arrow-right', 'tc-icon transition-transform group-hover:translate-x-1')}</span>
        </a>`;
}

export function renderPage(template, spec, { url, site }) {
  const authorDisplay = spec.author.type === 'Organization' && /^trustcore$/i.test(spec.author.name) ? 'Equipo TrustCore' : spec.author.name;
  const dateline = spec.dateModified !== spec.datePublished
    ? `Actualizado el ${fechaLarga(spec.dateModified)} · Publicado el ${fechaLarga(spec.datePublished)} · ${escapeHtml(authorDisplay)}`
    : `Publicado el ${fechaLarga(spec.datePublished)} · ${escapeHtml(authorDisplay)}`;
  const values = {
    title: escapeHtml(spec.title),
    description: escapeHtml(spec.description),
    slug: spec.slug,
    url,
    author: escapeHtml(spec.author.name),
    datePublished: spec.datePublished,
    dateModified: spec.dateModified,
    section: escapeHtml(CLUSTERS[spec.cluster].label),
    ogImage: escapeHtml(/^https?:\/\//.test(spec.ogImage) ? spec.ogImage : ORIGIN + spec.ogImage),
    jsonld: renderJsonLd(spec, url),
    breadcrumbs: renderBreadcrumbs(spec),
    eyebrow: escapeHtml(spec.eyebrow),
    h1: inline(spec.h1),
    lead: inline(spec.lead),
    dateline,
    body: spec.bodyHtml.split('\n').map((l) => (l ? `          ${l}` : l)).join('\n'),
    faq: renderFaq(spec),
    cta: renderCta(spec),
    sources: renderSources(spec),
    related: renderRelated(spec),
  };
  const missing = [...new Set([...template.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))].filter((k) => !(k in values));
  if (missing.length) throw new Error(`plantilla: huecos sin dato: ${missing.join(', ')}`);
  let html = template.replace(/\{\{(\w+)\}\}/g, (_, k) => values[k]);
  // Las líneas de huecos opcionales vacíos no dejan hueco en blanco.
  html = html.replace(/\n{2,}(?=\s*<\/div>|\s*<\/article>)/g, '\n');
  return freshenBundles(html, site);
}

/**
 * Si la plantilla apunta a un bundle con hash que ya no existe (se reconstruyó
 * el CSS sin volver a pasar por la plantilla), usa el que haya en disco.
 */
function freshenBundles(html, site) {
  const swap = (dir, re, current) => {
    if (!existsSync(join(site, dir))) return;
    const onDisk = readdirSync(join(site, dir)).filter((f) => re.test(f));
    for (const m of html.matchAll(current)) {
      const name = m[1];
      if (existsSync(join(site, dir, name))) continue;
      const base = name.split('.')[0];
      const fresh = onDisk.find((f) => f.startsWith(`${base}.`));
      if (fresh) html = html.replaceAll(name, fresh);
    }
  };
  swap('assets/css', /^site\.[0-9a-f]{8}\.min\.css$/, /\/assets\/css\/(site\.[0-9a-f]{8}\.min\.css)/g);
  swap('assets/js', /^[a-z-]+\.[0-9a-f]{8}\.min\.js$/, /\/assets\/js\/([a-z-]+\.[0-9a-f]{8}\.min\.js)/g);
  return html;
}

// ------------------------------------------------------------ hub y llms.txt
/** Índice del inicio de la línea «heading» (también si es la primera del fichero), o -1. */
function headingAt(txt, heading) {
  const m = txt.match(new RegExp(`(^|\\n)${escapeRe(heading)}[ \\t]*(?=\\n|$)`));
  return m ? m.index + m[1].length : -1;
}

export function upsertCard(html, slug, card, href) {
  const start = `<!--article:${slug}-->`;
  const end = `<!--/article:${slug}-->`;
  const block = `${start}\n${card}\n        ${end}`;
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i !== -1 && j !== -1) return html.slice(0, i) + block + html.slice(j + end.length);

  const grid = html.match(/<div id="articles-grid"[^>]*>/);
  if (!grid) throw new Error('site/blog.html: no encuentro <div id="articles-grid">; el hub cambió de estructura');
  const gridStart = grid.index + grid[0].length;
  const gridEnd = html.indexOf('</div>', gridStart);
  const inner = html.slice(gridStart, gridEnd);
  // Tarjeta escrita a mano para el mismo artículo: se sustituye.
  const manual = inner.match(new RegExp(`[ \\t]*<a href="${escapeRe(href)}"[\\s\\S]*?<\\/a>`));
  if (manual) {
    return html.slice(0, gridStart) + inner.replace(manual[0], `        ${block}`) + html.slice(gridEnd);
  }
  // Nueva: la primera del grid (la más reciente arriba).
  return `${html.slice(0, gridStart)}\n\n        ${block}${html.slice(gridStart)}`;
}

export function upsertLlms(txt, { url, title, description }) {
  const line = `- [${title}](${url}): ${description}`;
  const existing = new RegExp(`^- \\[[^\\]]*\\]\\(${escapeRe(url)}\\):.*$`, 'm');
  if (existing.test(txt)) return txt.replace(existing, line);

  let at = headingAt(txt, LLMS_SECTION);
  if (at === -1) {
    const anchor = ['\n## Fuentes oficiales', '\n## Opcional'].map((a) => txt.indexOf(a)).find((k) => k !== -1);
    const section = `\n${LLMS_SECTION}\n\n${LLMS_SECTION_INTRO}\n\n${line}\n`;
    if (anchor === undefined) return `${txt.replace(/\s*$/, '\n')}${section}`;
    return `${txt.slice(0, anchor)}${section}${txt.slice(anchor)}`;
  }
  const next = txt.indexOf('\n## ', at);
  const sectionEnd = next === -1 ? txt.length : next;
  const section = txt.slice(at, sectionEnd);
  const firstItem = section.search(/^- /m);
  if (firstItem !== -1) return `${txt.slice(0, at + firstItem)}${line}\n${txt.slice(at + firstItem)}`;
  return `${txt.slice(0, sectionEnd).replace(/\s*$/, '\n\n')}${line}\n${next === -1 ? '' : '\n'}${txt.slice(sectionEnd).replace(/^\n+/, '')}`;
}

export function upsertLlmsFull(txt, { url, series }) {
  if (new RegExp(`^- ${escapeRe(url)}\\s*$`, 'm').test(txt)) return txt;
  const heading = `### ${series}`;
  const secAt = headingAt(txt, LLMS_FULL_SECTION);
  if (secAt === -1) {
    return `${txt.replace(/\s*$/, '\n')}\n${LLMS_FULL_SECTION}\n\n${heading}\n- ${url}\n`;
  }
  const nextSec = txt.indexOf('\n## ', secAt);
  let secEnd = nextSec === -1 ? txt.length : nextSec;
  const sepAt = txt.lastIndexOf('\n---', secEnd);
  if (sepAt > secAt) secEnd = sepAt;
  const section = txt.slice(secAt, secEnd);
  const h = section.indexOf(`\n${heading}\n`);
  if (h === -1) {
    return `${txt.slice(0, secEnd).replace(/\s*$/, '\n')}\n${heading}\n- ${url}\n${txt.slice(secEnd)}`;
  }
  // final de la lista de esa serie
  let k = secAt + h + heading.length + 2;
  while (k < secEnd) {
    const eol = txt.indexOf('\n', k);
    const line = txt.slice(k, eol === -1 ? secEnd : eol);
    if (!line.startsWith('- ')) break;
    k = eol === -1 ? secEnd : eol + 1;
  }
  return `${txt.slice(0, k)}- ${url}\n${txt.slice(k)}`;
}

// ----------------------------------------------------------------- ejecución
function writeIfChanged(file, next, dryRun) {
  const prev = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (prev === next) return 'sin cambios';
  if (!dryRun) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, next); }
  return prev === null ? 'creado' : 'actualizado';
}

/**
 * Da de alta (o actualiza) el artículo descrito en `specPath`.
 * Devuelve un resumen; lanza SpecError si el spec no es válido.
 */
export function newArticle({ specPath, root = REPO_ROOT, blogDir = false, force = false, dryRun = false, log = () => {} }) {
  const site = join(root, 'site');
  const templatePath = join(root, TEMPLATE);
  if (!existsSync(templatePath)) throw new Error(`falta la plantilla ${TEMPLATE}`);
  if (!existsSync(specPath)) throw new Error(`no encuentro el spec ${specPath}`);
  let raw;
  try { raw = JSON.parse(readFileSync(specPath, 'utf8')); } catch (e) { throw new SpecError([`JSON inválido: ${e.message}`]); }

  const { spec, warnings, selfPath } = validateSpec(raw, { specDir: dirname(resolve(specPath)), site, blogDir });
  const url = ORIGIN + selfPath;
  const outFile = join(site, blogDir ? 'blog' : '.', `${spec.slug}.html`);

  if (existsSync(join(site, spec.slug)) && statSync(join(site, spec.slug)).isDirectory()) {
    throw new SpecError([`slug: «${spec.slug}» es una carpeta de site/`]);
  }
  if (existsSync(outFile) && !readFileSync(outFile, 'utf8').includes(PAGE_MARK) && !force) {
    throw new SpecError([`slug: ${relative(root, outFile)} ya existe y no lo generó este script; usa --force para sustituirlo`]);
  }

  const page = renderPage(readFileSync(templatePath, 'utf8'), spec, { url, site });
  const hubPath = join(site, 'blog.html');
  const hub = upsertCard(readFileSync(hubPath, 'utf8'), spec.slug, renderCard(spec, selfPath), selfPath);
  const llmsPath = join(site, 'llms.txt');
  const llms = upsertLlms(readFileSync(llmsPath, 'utf8'), { url, title: spec.title, description: spec.description });
  const llmsFullPath = join(site, 'llms-full.txt');
  const llmsFull = upsertLlmsFull(readFileSync(llmsFullPath, 'utf8'), { url, series: CLUSTERS[spec.cluster].series });

  const changes = {
    [relative(root, outFile)]: writeIfChanged(outFile, page, dryRun),
    'site/blog.html': writeIfChanged(hubPath, hub, dryRun),
    'site/llms.txt': writeIfChanged(llmsPath, llms, dryRun),
    'site/llms-full.txt': writeIfChanged(llmsFullPath, llmsFull, dryRun),
  };
  for (const [f, st] of Object.entries(changes)) log(`${st === 'sin cambios' ? '=' : '✔'} ${f}  ${st}`);

  let seo = 'omitido (--dry-run)';
  if (!dryRun) {
    const out = execFileSync(process.execPath, [join(SCRIPTS_DIR, 'seo-i18n.mjs')], { cwd: root, encoding: 'utf8' });
    seo = out.trim();
    log(seo.split('\n').map((l) => `  seo-i18n: ${l}`).join('\n'));
  }
  for (const w of warnings) log(`⚠ ${w}`);
  return { ok: true, slug: spec.slug, url, file: relative(root, outFile), changes, warnings, seo };
}

function usage() {
  return `Uso: node scripts/new-article.mjs --from <spec.json> [opciones]

  --from <spec.json>  Spec del artículo (formato: docs/new-article-spec.md)
  --blog-dir          Genera site/blog/<slug>.html y URL /blog/<slug> (cuando exista la ruta /blog/)
  --force             Sustituye una página existente que no generó este script
  --dry-run           Valida y renderiza sin escribir nada ni ejecutar seo-i18n
  --root <dir>        Raíz del repo (por defecto, la del script)
  --json              Imprime el resultado como JSON
  -h, --help          Esta ayuda`;
}

export function parseArgs(argv) {
  const o = { from: null, blogDir: false, force: false, dryRun: false, root: REPO_ROOT, json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from') o.from = argv[++i];
    else if (a.startsWith('--from=')) o.from = a.slice(7);
    else if (a === '--blog-dir') o.blogDir = true;
    else if (a === '--force') o.force = true;
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '--json') o.json = true;
    else if (a === '--root') o.root = resolve(argv[++i]);
    else if (a.startsWith('--root=')) o.root = resolve(a.slice(7));
    else if (a === '-h' || a === '--help') o.help = true;
    else throw new Error(`opción desconocida: ${a}`);
  }
  return o;
}

export function main(argv = process.argv.slice(2)) {
  let o;
  try { o = parseArgs(argv); } catch (e) { console.error(e.message); console.error(usage()); return 2; }
  if (o.help) { console.log(usage()); return 0; }
  if (!o.from) { console.error('falta --from <spec.json>'); console.error(usage()); return 2; }
  try {
    const r = newArticle({ specPath: resolve(o.from), root: o.root, blogDir: o.blogDir, force: o.force, dryRun: o.dryRun, log: o.json ? () => {} : console.log });
    if (o.json) console.log(JSON.stringify(r, null, 2));
    else console.log(`→ ${r.url}`);
    return 0;
  } catch (e) {
    if (o.json) console.log(JSON.stringify({ ok: false, error: e.message, problems: e.problems ?? [] }, null, 2));
    else console.error(e instanceof SpecError ? e.message : `Error: ${e.message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = main();
}
