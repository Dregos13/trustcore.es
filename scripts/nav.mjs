#!/usr/bin/env node
/**
 * nav.mjs — navegación única para todas las páginas (sistema "Flujo", 2026).
 *
 * Genera el bloque entre <!--NAV--> y <!--/NAV-->:
 *
 *   · los iconos del sitio como <symbol> en línea (scripts/icons.mjs)
 *   · el enlace "Saltar al contenido" (apunta a #main-content)
 *   · la píldora flotante con megamenú de productos y dos menús cortos
 *   · la hoja móvil a pantalla completa
 *
 *   Productos ▾   Para tu empresa: TrustInFacts · TrustInTime · GenAI
 *                 Apps del estudio: Orquesta · Corrector Fiscal · Nido      [Ver todos]
 *   Soluciones ▾  Tiendas · Instaladores · Gestorías · IPSI Ceuta y Melilla · Comparativa con un ERP
 *   Precios
 *   Aprende
 *   Recursos ▾    Clientes · Blog · Funcionalidades · Cómo funciona · Sobre nosotros · Contacto
 *   [Agendar demo]
 *
 * No se incluye "Entrar": el sitio no enlaza ninguna aplicación. Cuando exista
 * la URL de acceso, añadirla aquí y volver a ejecutar.
 *
 * En una página nueva basta escribir `<!--NAV--><!--/NAV-->` justo después de
 * <body> y ejecutar el script. Es idempotente. En las páginas antiguas (las
 * que aún traen <header id="header"> con los marcadores dentro) sustituye la
 * cabecera entera, menú móvil incluido.
 *
 * Los estilos están en src/css/06-chrome.css y el comportamiento en
 * src/js/chrome.js (initNav).
 *
 * Uso: node scripts/nav.mjs
 */
import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITE, ico } from './icons.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PRODUCTS = [
  { label: 'Para tu empresa', items: [
    { name: 'TrustInFacts', href: '/productos/trustinfacts', icon: 'invoice', desc: 'Facturación VeriFactu, IVA e IPSI', tag: 'Facturación' },
    { name: 'TrustInTime', href: '/productos/trustintime', icon: 'clock', desc: 'Control horario, fichaje y ausencias', tag: 'Control horario' },
    { name: 'GenAI', href: '/productos/genai', icon: 'spark', desc: 'Contenido para redes, con tu aprobación', tag: 'Redes sociales' },
  ]},
  { label: 'Apps del estudio', items: [
    { name: 'Orquesta', href: '/productos/orquesta', icon: 'graph', desc: 'Dirige un equipo de IAs', tag: 'Escritorio' },
    { name: 'Corrector Fiscal', href: '/productos/corrector-fiscal', icon: 'filecheck', desc: 'Revisa modelos de la AEAT', tag: 'Escritorio' },
    { name: 'Nido', href: '/productos/nido', icon: 'home', desc: 'Buscador privado de vivienda', tag: 'Escritorio' },
  ]},
];
const ALL_PRODUCTS = { label: 'Ver todos los productos', href: '/productos' };

// No hay segmentación por sectores: TrustCore vende a todo tipo de empresa.
// Estas entradas son los perfiles que mejor encajan hoy, no una taxonomía.
const SOLUTIONS = [
  ['Para tiendas', '/facturacion-para-tiendas'],
  ['Para instaladores', '/facturacion-para-instaladores'],
  ['Para gestorías', '/gestoria'],
  ['IPSI Ceuta y Melilla', '/software-verifactu-ipsi-ceuta-melilla'],
  ['Comparativa con un ERP', '/comparativa/verifactu-ipsi-trustcore-vs-erp-generico'],
];
const RESOURCES = [
  ['Clientes', '/clientes'],
  ['Blog', '/blog'],
  ['Funcionalidades', '/funcionalidades'],
  ['Cómo funciona', '/como-funciona'],
  ['Sobre nosotros', '/quienes-somos'],
  ['Contacto', '/contacto'],
];

const chev = ico('chev');

function mega() {
  let i = 0;
  const groups = PRODUCTS.map((g) => `          <div class="tc-menu__group">
            <p class="tc-menu__label">${g.label}</p>
${g.items.map((p) => `            <a class="tc-menu__item" style="--i:${i++}" href="${p.href}"><span class="tc-menu__ico">${ico(p.icon)}</span><span><span class="tc-menu__name">${p.name}</span><span class="tc-menu__desc">${p.desc}</span></span></a>`).join('\n')}
          </div>`).join('\n');
  return `        <li class="tc-nav__item tc-nav__item--mega">
          <button class="tc-nav__link" type="button" aria-expanded="false" aria-controls="tc-menu-productos" data-menu-toggle>Productos ${chev}</button>
          <div class="tc-menu tc-menu--mega" id="tc-menu-productos">
${groups}
            <a class="tc-menu__all" style="--i:${i}" href="${ALL_PRODUCTS.href}">${ALL_PRODUCTS.label} ${ico('arrow')}</a>
          </div>
        </li>`;
}

function dropdown(label, id, items, end = false) {
  return `        <li class="tc-nav__item">
          <button class="tc-nav__link" type="button" aria-expanded="false" aria-controls="${id}" data-menu-toggle>${label} ${chev}</button>
          <div class="tc-menu${end ? ' tc-menu--end' : ''}" id="${id}">
${items.map(([t, href], i) => `            <a class="tc-menu__item tc-menu__item--plain" style="--i:${i}" href="${href}">${t}</a>`).join('\n')}
          </div>
        </li>`;
}

const link = (label, href) => `        <li class="tc-nav__item"><a class="tc-nav__link" href="${href}">${label}</a></li>`;

function sheet() {
  const rows = [];
  for (const g of PRODUCTS) {
    rows.push(`  <p class="tc-sheet__label">${g.label}</p>`);
    for (const p of g.items) rows.push(`  <a class="tc-sheet__link" href="${p.href}">${p.name} <small>${p.tag}</small></a>`);
  }
  rows.push(`  <a class="tc-sheet__link tc-sheet__link--sm" href="${ALL_PRODUCTS.href}">${ALL_PRODUCTS.label}</a>`);
  rows.push(`  <p class="tc-sheet__label">Soluciones</p>`);
  for (const [t, href] of SOLUTIONS) rows.push(`  <a class="tc-sheet__link tc-sheet__link--sm" href="${href}">${t}</a>`);
  rows.push(`  <p class="tc-sheet__label">TrustCore</p>`);
  rows.push(`  <a class="tc-sheet__link tc-sheet__link--sm" href="/precios">Precios</a>`);
  rows.push(`  <a class="tc-sheet__link tc-sheet__link--sm" href="/aprende">Aprende</a>`);
  for (const [t, href] of RESOURCES) rows.push(`  <a class="tc-sheet__link tc-sheet__link--sm" href="${href}">${t}</a>`);
  rows.push(`  <button class="tc-btn tc-btn--primary" type="button" data-calendar-open data-track="mobile_menu_demo"><span class="tc-btn__label">Agendar demo ${ico('arrow', 'tc-ico--go')}</span></button>`);
  return `<div class="tc-sheet" id="tc-sheet" data-sheet role="dialog" aria-modal="true" aria-label="Menú">\n${rows.join('\n')}\n</div>`;
}

const BLOCK = `<!--NAV-->
${SPRITE}
<a class="tc-skip" href="#main-content">Saltar al contenido</a>
<header class="tc-nav" data-nav>
  <div class="tc-nav__pill">
    <a class="tc-brand" href="/" aria-label="TrustCore, inicio">
      <img src="/assets/trustcore-mark-120.png" alt="" width="110" height="120">
      <span class="tc-brand__word">TrustCore</span>
    </a>
    <nav aria-label="Principal">
      <ul class="tc-nav__links">
${mega()}
${dropdown('Soluciones', 'tc-menu-soluciones', SOLUTIONS)}
${link('Precios', '/precios')}
${link('Aprende', '/aprende')}
${dropdown('Recursos', 'tc-menu-recursos', RESOURCES, true)}
      </ul>
    </nav>
    <button class="tc-btn tc-btn--primary tc-btn--sm tc-nav__cta" type="button" data-calendar-open data-magnet data-track="header_demo">
      <span class="tc-btn__label">${ico('cal')} <span>Agendar<span class="tc-nav__cta-more"> demo</span></span></span>
    </button>
    <button class="tc-nav__burger" type="button" aria-expanded="false" aria-controls="tc-sheet" aria-label="Abrir menú" data-sheet-toggle>
      <span></span><span></span>
    </button>
    <span class="tc-nav__progress" aria-hidden="true"></span>
  </div>
</header>
${sheet()}
<!--/NAV-->`;

// Cabecera antigua: <header …> que contiene los marcadores (con su comentario previo, si lo hay).
const OLD_HEADER = /(?:[ \t]*<!--\s*HEADER\s*-->\s*\n)?[ \t]*<header\b[^>]*>(?:(?!<\/header>)[\s\S])*?<!--NAV-->[\s\S]*?<\/header>/;
// Enlace de salto antiguo (clases de Tailwind): lo sustituye el del bloque.
const OLD_SKIP = /[ \t]*<a href="#main-content" class="sr-only[^"]*"[^>]*>[^<]*<\/a>[ \t]*\n?/;

let n = 0;
const untouched = [];
for (const f of globSync('site/**/*.html', { cwd: ROOT })) {
  const file = join(ROOT, f);
  const before = readFileSync(file, 'utf8');
  let h = before;

  if (OLD_HEADER.test(h)) {
    h = h.replace(OLD_HEADER, () => BLOCK).replace(OLD_SKIP, '');
  } else if (h.includes('<!--NAV-->')) {
    h = h.replace(/<!--NAV-->[\s\S]*?<!--\/NAV-->/, () => BLOCK);
  } else {
    untouched.push(f);
    continue;
  }
  // el enlace de salto necesita un destino: se le da al primer <main> que no lo tenga
  if (!/id="main-content"/.test(h)) h = h.replace(/<main(?![^>]*\bid=)/, '<main id="main-content"');

  if (h !== before) { writeFileSync(file, h); n++; }
}
console.log(`navegación aplicada a ${n} páginas`);
if (untouched.length) console.log('sin marcadores <!--NAV-->, no tocadas:', untouched.join(', '));
