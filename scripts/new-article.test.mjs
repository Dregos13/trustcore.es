/**
 * Pruebas de scripts/new-article.mjs sobre una copia temporal de site/.
 *
 *   npm test            (node --test scripts/*.test.mjs)
 *
 * Cada prueba que escribe parte de una copia fresca de site/ para que no
 * dependa del orden ni toque el repo.
 */
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  newArticle, markdownToHtml, upsertLlms, upsertLlmsFull, upsertCard, resolveInternal, SpecError, REPO_ROOT, ORIGIN,
} from './new-article.mjs';

const SCRIPT = fileURLToPath(new URL('./new-article.mjs', import.meta.url));
const EXAMPLE = join(REPO_ROOT, 'scripts', 'examples', 'articulo-ejemplo.json');
const roots = [];
after(() => { for (const r of roots) rmSync(r, { recursive: true, force: true }); });

function freshRoot() {
  const root = mkdtempSync(join(tmpdir(), 'tc-new-article-'));
  cpSync(join(REPO_ROOT, 'site'), join(root, 'site'), { recursive: true });
  roots.push(root);
  return root;
}

const BODY = `## Qué cambia

Un párrafo con **negrita**, *cursiva* y un [enlace interno](/precios) y otro [externo](https://www.boe.es/).

- Primer punto
- Segundo punto con \`código\`

## Qué hacer

1. Paso uno
2. Paso dos

| Dato | Uso |
|---|---|
| Base | Ver el tipo |
`;

function spec(root, over = {}) {
  const s = {
    slug: 'prueba-articulo-nuevo',
    title: 'Prueba: artículo nuevo de control horario',
    description: 'Descripción de prueba con la longitud suficiente para no dar aviso, sobre control horario y fichajes en pymes.',
    cluster: 'control-horario',
    datePublished: '2026-10-18',
    body: { format: 'markdown', content: BODY },
    related: ['control-horario-obligatorio-guia-2026'],
    sources: [{ label: 'BOE: RDL 8/2019', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2019-3481' }],
    faq: [{ question: '¿Es obligatorio?', answer: 'Sí, desde 2019.', sources: ['https://www.boe.es/buscar/act.php?id=BOE-A-2019-3481'] }],
    ...over,
  };
  const p = join(root, 'spec.json');
  writeFileSync(p, JSON.stringify(s, null, 2));
  return p;
}

const read = (root, f) => readFileSync(join(root, 'site', f), 'utf8');
const count = (hay, needle) => hay.split(needle).length - 1;

describe('alta de un artículo', () => {
  test('genera la página, la tarjeta, llms y el sitemap', () => {
    const root = freshRoot();
    const r = newArticle({ specPath: spec(root), root });
    assert.equal(r.ok, true);
    assert.equal(r.url, `${ORIGIN}/prueba-articulo-nuevo`);
    assert.equal(r.changes['site/prueba-articulo-nuevo.html'], 'creado');
    assert.equal(r.changes['site/blog.html'], 'actualizado');

    const page = read(root, 'prueba-articulo-nuevo.html');
    assert.match(page, /<title>Prueba: artículo nuevo de control horario \| TrustCore<\/title>/);
    assert.match(page, /<link rel="canonical" href="https:\/\/www\.trustcore\.es\/prueba-articulo-nuevo">/);
    assert.doesNotMatch(page, /\{\{\w+\}\}/, 'quedan huecos sin rellenar');
    assert.match(page, /<h2 id="que-cambia">Qué cambia<\/h2>/);
    assert.match(page, /<table>/);
    assert.match(page, /<details class="tc-faq">/);
    assert.match(page, /aria-label="Migas de pan"/);
    assert.match(page, /Sigue leyendo/);
    assert.match(page, /<!--NAV-->[\s\S]*<!--\/NAV-->/);
    assert.match(page, /<!--FOOTER-->[\s\S]*<!--\/FOOTER-->/);

    const ld = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(ld['@graph'].map((g) => g['@type']), ['Article', 'BreadcrumbList', 'FAQPage']);
    assert.equal(ld['@graph'][0].datePublished, '2026-10-18');
    assert.equal(ld['@graph'][1].itemListElement.length, 3);
    assert.equal(ld['@graph'][2].mainEntity[0].acceptedAnswer.text, 'Sí, desde 2019.');

    const hub = read(root, 'blog.html');
    assert.equal(count(hub, '<!--article:prueba-articulo-nuevo-->'), 1);
    assert.match(hub, /href="\/prueba-articulo-nuevo"[^>]*data-category="control-horario"/);
    assert.ok(hub.indexOf('<!--article:prueba-articulo-nuevo-->') < hub.indexOf('/verifactu-2027-calendario-empresas-autonomos'), 'la tarjeta nueva va la primera');

    assert.equal(count(read(root, 'llms.txt'), `${ORIGIN}/prueba-articulo-nuevo`), 1);
    const full = read(root, 'llms-full.txt');
    const serie = full.indexOf('### Serie Control Horario');
    assert.ok(serie > -1 && full.indexOf(`- ${ORIGIN}/prueba-articulo-nuevo`) > serie, 'entra en su serie de llms-full.txt');
    assert.match(read(root, 'sitemap.xml'), /<loc>https:\/\/www\.trustcore\.es\/prueba-articulo-nuevo<\/loc>/);
  });

  test('--blog-dir genera bajo site/blog/ con URL /blog/<slug> y entra en el sitemap', () => {
    const root = freshRoot();
    const r = newArticle({ specPath: spec(root), root, blogDir: true });
    assert.equal(r.file, 'site/blog/prueba-articulo-nuevo.html');
    const page = read(root, 'blog/prueba-articulo-nuevo.html');
    assert.match(page, /<link rel="canonical" href="https:\/\/www\.trustcore\.es\/blog\/prueba-articulo-nuevo">/);
    assert.match(read(root, 'blog.html'), /href="\/blog\/prueba-articulo-nuevo"/);
    assert.match(read(root, 'sitemap.xml'), /<loc>https:\/\/www\.trustcore\.es\/blog\/prueba-articulo-nuevo<\/loc>/);
  });

  test('el ejemplo del repo valida y se genera', () => {
    const root = freshRoot();
    const r = newArticle({ specPath: EXAMPLE, root });
    assert.equal(r.ok, true);
    assert.equal(r.warnings.length, 0, `avisos: ${r.warnings.join(' | ')}`);
  });
});

describe('idempotencia', () => {
  test('dos ejecuciones con el mismo spec dejan los ficheros idénticos', () => {
    const root = freshRoot();
    const p = spec(root);
    newArticle({ specPath: p, root });
    const files = ['prueba-articulo-nuevo.html', 'blog.html', 'llms.txt', 'llms-full.txt', 'sitemap.xml'];
    const before = files.map((f) => read(root, f));
    const r = newArticle({ specPath: p, root });
    assert.deepEqual(Object.values(r.changes), ['sin cambios', 'sin cambios', 'sin cambios', 'sin cambios']);
    assert.deepEqual(files.map((f) => read(root, f)), before);
    assert.equal(count(read(root, 'blog.html'), 'href="/prueba-articulo-nuevo"'), 1);
    assert.equal(count(read(root, 'llms.txt'), '/prueba-articulo-nuevo'), 1);
    assert.equal(count(read(root, 'llms-full.txt'), '/prueba-articulo-nuevo'), 1);
    assert.equal(count(read(root, 'sitemap.xml'), '/prueba-articulo-nuevo<'), 1);
  });

  test('un spec cambiado actualiza en sitio sin duplicar', () => {
    const root = freshRoot();
    newArticle({ specPath: spec(root), root });
    const r = newArticle({ specPath: spec(root, { title: 'Prueba: título revisado' }), root });
    assert.equal(r.changes['site/prueba-articulo-nuevo.html'], 'actualizado');
    const hub = read(root, 'blog.html');
    assert.equal(count(hub, '<!--article:prueba-articulo-nuevo-->'), 1);
    assert.match(hub, /Prueba: título revisado/);
    assert.doesNotMatch(hub, /artículo nuevo de control horario/);
    const llms = read(root, 'llms.txt');
    assert.equal(count(llms, '/prueba-articulo-nuevo'), 1);
    assert.match(llms, /\[Prueba: título revisado\]/);
  });

  test('el ejemplo del repo ya generado no cambia nada', () => {
    const root = freshRoot();
    // site/ del repo ya lleva el artículo de ejemplo dado de alta
    if (!existsSync(join(root, 'site', 'ipsi-en-presupuestos-convertir-a-factura.html'))) return;
    const r = newArticle({ specPath: EXAMPLE, root });
    assert.deepEqual(Object.values(r.changes), ['sin cambios', 'sin cambios', 'sin cambios', 'sin cambios']);
  });
});

describe('validación', () => {
  const rejects = (root, over, re) => {
    assert.throws(() => newArticle({ specPath: spec(root, over), root }), (e) => e instanceof SpecError && re.test(e.problems.join('\n')));
    assert.equal(existsSync(join(root, 'site', `${over.slug ?? 'prueba-articulo-nuevo'}.html`)), false, 'no debe escribir nada');
  };

  test('rechaza un título de más de 60 caracteres', () => {
    rejects(freshRoot(), { title: 'Un título larguísimo que se pasa de los sesenta caracteres permitidos' }, /title: \d+ caracteres, máximo 60/);
  });

  test('rechaza una meta description de más de 155 caracteres', () => {
    rejects(freshRoot(), { description: 'x'.repeat(156) }, /description: 156 caracteres, máximo 155/);
  });

  test('rechaza enlaces internos a páginas que no existen', () => {
    rejects(freshRoot(), { body: { format: 'markdown', content: '## Hola\n\nMira [esta página](/no-existe) y [esta](/tampoco-existe).\n' } }, /body: enlace interno \/no-existe — no existe en site\/[\s\S]*\/tampoco-existe/);
  });

  test('rechaza enlaces a rutas que redirigen o con .html', () => {
    rejects(freshRoot(), { body: '## Hola\n\n[a](/article) [b](/precios.html) [c](precios)\n' }, /\/article — redirige a \/blog[\s\S]*\.html[\s\S]*rutas absolutas/);
  });

  test('rechaza related inexistente y slug inválido', () => {
    rejects(freshRoot(), { related: ['pagina-que-no-existe'] }, /related\[0\]: \/pagina-que-no-existe no existe/);
    rejects(freshRoot(), { slug: 'Con Mayúsculas' }, /slug: solo minúsculas/);
  });

  test('rechaza fechas mal formadas, cluster desconocido y campos desconocidos', () => {
    rejects(freshRoot(), { datePublished: '18/10/2026' }, /datePublished: usa AAAA-MM-DD/);
    rejects(freshRoot(), { cluster: 'otro' }, /cluster: «otro» no existe/);
    rejects(freshRoot(), { tags: ['x'] }, /campo desconocido: tags/);
  });

  test('exige sources y rechaza fuentes sin https', () => {
    rejects(freshRoot(), { sources: undefined }, /sources: obligatorio/);
    rejects(freshRoot(), { sources: [{ label: 'x', url: 'http://inseguro.es' }] }, /sources\[0\]\.url: debe empezar por https/);
  });

  test('no sobrescribe una página hecha a mano sin --force', () => {
    const root = freshRoot();
    const before = read(root, 'precios.html');
    assert.throws(() => newArticle({ specPath: spec(root, { slug: 'precios' }), root }), (e) => e instanceof SpecError && /ya existe y no lo generó este script; usa --force/.test(e.message));
    assert.equal(read(root, 'precios.html'), before, 'la página manual queda intacta');
    const r = newArticle({ specPath: spec(root, { slug: 'precios' }), root, force: true });
    assert.equal(r.changes['site/precios.html'], 'actualizado');
  });
});

describe('línea de comandos', () => {
  test('--dry-run valida y no escribe; --json devuelve el resumen', () => {
    const root = freshRoot();
    const out = execFileSync(process.execPath, [SCRIPT, '--from', spec(root), '--root', root, '--dry-run', '--json'], { encoding: 'utf8' });
    const r = JSON.parse(out);
    assert.equal(r.ok, true);
    assert.equal(r.changes['site/prueba-articulo-nuevo.html'], 'creado');
    assert.equal(existsSync(join(root, 'site', 'prueba-articulo-nuevo.html')), false);
    assert.doesNotMatch(read(root, 'blog.html'), /prueba-articulo-nuevo/);
  });

  test('spec inválido: código 1 y los problemas en stderr', () => {
    const root = freshRoot();
    const r = spawnSync(process.execPath, [SCRIPT, '--from', spec(root, { title: 'x'.repeat(61) }), '--root', root], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /title: 61 caracteres, máximo 60/);
  });

  test('sin --from: código 2 y ayuda', () => {
    const r = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /--from <spec\.json>/);
  });
});

describe('markdownToHtml', () => {
  test('cabeceras nunca son h1 y llevan id único', () => {
    assert.equal(markdownToHtml('# Uno\n\n## Dos\n\n## Dos'), '<h2 id="uno">Uno</h2>\n<h2 id="dos">Dos</h2>\n<h2 id="dos-2">Dos</h2>');
  });
  test('listas anidadas, citas y tablas', () => {
    const html = markdownToHtml('- a\n  - b\n- c\n\n> cita\n\n| x | y |\n|---|:-:|\n| 1 | 2 |');
    assert.equal(html, '<ul>\n<li>a\n<ul>\n<li>b</li>\n</ul></li>\n<li>c</li>\n</ul>\n<blockquote>\n<p>cita</p>\n</blockquote>\n<div class="tc-table"><table>\n<thead><tr><th>x</th><th style="text-align:center">y</th></tr></thead>\n<tbody>\n<tr><td>1</td><td style="text-align:center">2</td></tr>\n</tbody>\n</table></div>');
  });
  test('enlaces externos abren en pestaña nueva; los internos no', () => {
    assert.equal(markdownToHtml('[a](/precios) y [b](https://boe.es/x)'), '<p><a href="/precios">a</a> y <a href="https://boe.es/x" target="_blank" rel="noopener">b</a></p>');
  });
  test('escapa HTML suelto pero deja pasar etiquetas y código', () => {
    assert.equal(markdownToHtml('a < b & c **d** `x<y` <strong>ok</strong>'), '<p>a &lt; b &amp; c <strong>d</strong> <code>x&lt;y</code> <strong>ok</strong></p>');
  });
  test('bloques HTML en crudo pasan tal cual', () => {
    assert.equal(markdownToHtml('<div class="tc-callout">\n<p>Hola</p>\n</div>\n\nTexto'), '<div class="tc-callout">\n<p>Hola</p>\n</div>\n<p>Texto</p>');
  });
  test('código con cerca', () => {
    assert.equal(markdownToHtml('```js\nconst a = 1 < 2;\n```'), '<pre><code class="language-js">const a = 1 &lt; 2;</code></pre>');
  });
});

describe('utilidades', () => {
  test('upsertLlms crea la sección antes de Fuentes oficiales y no duplica', () => {
    const base = '# T\n\n## Páginas\n\n- [a](https://x/a): a\n\n## Fuentes oficiales\n\n- [f](https://x/f): f\n';
    const once = upsertLlms(base, { url: 'https://x/n', title: 'N', description: 'd' });
    assert.ok(once.indexOf('## Artículos del blog') < once.indexOf('## Fuentes oficiales'));
    assert.equal(count(once, 'https://x/n'), 1);
    const twice = upsertLlms(once, { url: 'https://x/n', title: 'N2', description: 'd' });
    assert.equal(count(twice, 'https://x/n'), 1);
    assert.match(twice, /\[N2\]/);
    const third = upsertLlms(twice, { url: 'https://x/m', title: 'M', description: 'd' });
    assert.ok(third.indexOf('https://x/m') < third.indexOf('https://x/n'), 'la nueva va primero');
  });
  test('upsertLlmsFull añade a la serie o la crea', () => {
    const base = '## Contenido estratégico\n\n### Serie IPSI\n- https://x/a\n\n---\n\n## Otra\n';
    const a = upsertLlmsFull(base, { url: 'https://x/b', series: 'Serie IPSI' });
    assert.equal(a, '## Contenido estratégico\n\n### Serie IPSI\n- https://x/a\n- https://x/b\n\n---\n\n## Otra\n');
    const b = upsertLlmsFull(a, { url: 'https://x/c', series: 'Serie Plan Lite' });
    assert.ok(b.includes('### Serie Plan Lite\n- https://x/c\n') && b.indexOf('Serie Plan Lite') < b.indexOf('\n---'));
    assert.equal(upsertLlmsFull(b, { url: 'https://x/c', series: 'Serie Plan Lite' }), b);
  });
  test('upsertCard sustituye una tarjeta manual con el mismo href', () => {
    const hub = '<div id="articles-grid" class="grid">\n\n        <a href="/x" class="blog-card">viejo</a>\n\n      </div>';
    const out = upsertCard(hub, 'x', '        <a href="/x">nuevo</a>', '/x');
    assert.equal(count(out, 'href="/x"'), 1);
    assert.match(out, /<!--article:x-->[\s\S]*nuevo[\s\S]*<!--\/article:x-->/);
    assert.doesNotMatch(out, /viejo/);
  });
  test('resolveInternal entiende las rutas del sitio', () => {
    const site = join(REPO_ROOT, 'site');
    assert.equal(resolveInternal(site, '/').ok, true);
    assert.equal(resolveInternal(site, '/productos/trustinfacts').ok, true);
    assert.equal(resolveInternal(site, `${ORIGIN}/precios#planes`).ok, true);
    assert.equal(resolveInternal(site, '/assets/og-image-1200x630.jpg').ok, true);
    assert.equal(resolveInternal(site, '/en/pricing').ok, false);
    assert.equal(resolveInternal(site, '/nada').ok, false);
  });
});
