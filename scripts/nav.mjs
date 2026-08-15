#!/usr/bin/env node
/**
 * nav.mjs — navegación única para todas las páginas.
 *
 * Antes había 7-8 entradas planas (Productos, Gestorías, Clientes, Precios,
 * Nosotros, Blog, Aprende, Contacto). El brief pide que la navegación ayude a
 * decidir, no que reproduzca el mapa web: se agrupa en 4 entradas, dos de ellas
 * con submenú.
 *
 *   Producto ▾   Facturación · Control horario · TrusTy · Aprende
 *   Soluciones ▾ Gestorías · Ceuta y Melilla · Comparativa
 *   Precios
 *   Recursos ▾   Blog · Guías · Sobre nosotros · Contacto
 *   [Ver demo]
 *
 * No se incluye "Entrar": el sitio no enlaza ninguna aplicación. Cuando exista
 * la URL de login, añadirla aquí y volver a ejecutar.
 *
 * Es idempotente: sustituye el bloque entre <!--NAV--> y <!--/NAV--> si ya
 * existe, o el <nav> + menú móvil originales la primera vez.
 *
 * Uso: node scripts/nav.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const MENU = [
  { label: 'Producto', items: [
      ['Facturación VeriFactu', '/productos/trustinfacts'],
      ['Control horario', '/productos/trustintime'],
      ['IPSI Ceuta y Melilla', '/software-verifactu-ipsi-ceuta-melilla'],
  ]},
  { label: 'Soluciones', items: [
      ['Para gestorías', '/gestoria'],
      ['Comparativa con un ERP', '/comparativa/verifactu-ipsi-trustcore-vs-erp-generico'],
  ]},
  { label: 'Precios', href: '/precios' },
  // Aprende va a primer nivel, no dentro de "Producto": es el centro de
  // vídeos y se quiere visible sin desplegar nada.
  { label: 'Aprende', href: '/aprende' },
  { label: 'Recursos', items: [
      ['Blog', '/blog'],
      ['Guía de control horario', '/control-horario-obligatorio-guia-2026'],
      ['Guía de IPSI', '/ipsi-ceuta-melilla-guia-practica'],
      ['Sobre nosotros', '/quienes-somos'],
      ['Contacto', '/contacto'],
  ]},
];

const LINK = 'tc-nav-link text-sm font-medium text-gray-600 hover:text-[#040F3F] transition-colors';

function desktop() {
  const parts = MENU.map((m) => {
    if (m.href) return `          <a href="${m.href}" class="${LINK}">${m.label}</a>`;
    const id = `nav-${m.label.toLowerCase()}`;
    const items = m.items.map(([t, href]) => `              <a href="${href}" role="menuitem" class="tc-navmenu__item">${t}</a>`).join('\n');
    // El chevron se dibuja en CSS (::after): el sprite no trae fa-chevron-down
    // y no merece la pena ampliarlo por una flecha de 8px.
    return `          <div class="tc-navmenu">
            <button type="button" class="${LINK} tc-navmenu__trigger" aria-expanded="false" aria-controls="${id}" aria-haspopup="true">
              ${m.label}
            </button>
            <div class="tc-navmenu__panel" id="${id}" role="menu" hidden>
${items}
            </div>
          </div>`;
  }).join('\n');
  return `        <nav class="hidden md:flex items-center gap-1" aria-label="Navegación principal">\n${parts}\n        </nav>`;
}

function mobile() {
  const parts = MENU.map((m) => {
    if (m.href) return `      <a href="${m.href}" class="block py-2.5 text-sm font-semibold text-gray-800">${m.label}</a>`;
    const items = m.items.map(([t, href]) => `        <a href="${href}" class="block py-2 pl-3 text-sm text-gray-600">${t}</a>`).join('\n');
    return `      <p class="pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">${m.label}</p>\n${items}`;
  }).join('\n');
  return `    <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-100 px-4 pb-4 pt-2">\n${parts}\n    </div>`;
}

const BLOCK = `<!--NAV-->\n${desktop()}\n<!--/NAV-->`;
const MBLOCK = `<!--MNAV-->\n${mobile()}\n<!--/MNAV-->`;

const files = globSync('site/**/*.html');
let n = 0;
for (const f of files) {
  let h = readFileSync(f, 'utf8');
  const before = h;

  if (h.includes('<!--NAV-->')) {
    h = h.replace(/<!--NAV-->[\s\S]*?<!--\/NAV-->/, BLOCK);
  } else {
    h = h.replace(/[ \t]*<nav class="hidden md:flex[\s\S]*?<\/nav>/, BLOCK);
  }

  if (h.includes('<!--MNAV-->')) {
    h = h.replace(/<!--MNAV-->[\s\S]*?<!--\/MNAV-->/, MBLOCK);
  } else {
    h = h.replace(/[ \t]*<div id="mobile-menu"[\s\S]*?\n[ \t]*<\/div>/, MBLOCK);
  }

  if (h !== before) { writeFileSync(f, h); n++; }
}
console.log(`navegación aplicada a ${n} páginas`);
