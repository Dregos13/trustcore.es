/**
 * icons.mjs — iconos del sitio (trazo 1.6, extremos redondos, rejilla de 24).
 *
 * Una sola fuente: scripts/nav.mjs los inyecta como <symbol> en línea dentro del
 * bloque <!--NAV--> de cada página, y se usan así:
 *
 *   <svg class="tc-ico" aria-hidden="true"><use href="#i-arrow"/></svg>
 *
 * Para añadir uno: nueva entrada aquí (solo el interior del <svg>, sin fill ni
 * stroke: los pone .tc-ico) y `node scripts/nav.mjs`.
 */
export const ICONS = {
  // ---- flechas y controles
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  external: '<path d="M14 5h5v5M19 5l-8 8"/><path d="M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
  minus: '<path d="M6 12h12"/>',
  dl: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  filter: '<path d="M4 6h16l-6 7.5V19l-4-2v-3.5z"/>',
  refresh: '<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9"/><path d="M18.5 3.5v3.8h-3.8M5.5 20.5v-3.8h3.8"/>',
  swap: '<path d="M7 4v16M17 4v16M3 8l4-4 4 4M13 16l4 4 4-4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  spinner: '<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5"/>',
  // ---- estado
  alert: '<path d="M12 4l9 15.5H3z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.3"/>',
  shield: '<path d="M12 3.5l7.5 2.8v5.4c0 4.4-3 7.6-7.5 9-4.5-1.4-7.5-4.6-7.5-9V6.3z"/><path d="M8.8 12.2l2.3 2.3 4.2-4.4"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 6.5l2.5 2.5M13.5 9l2 2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  star: '<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
  award: '<circle cx="12" cy="9.5" r="5.5"/><path d="M8.5 14l-1.5 7 5-2.6 5 2.6-1.5-7"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.5H5a3 3 0 0 0 3 4M16 5.5h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  // ---- productos
  invoice: '<path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M15 3v4h4M9 12h6M9 16h4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  graph: '<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M11 7l-5 9M13 7l5 9M7.2 18h9.6"/>',
  filecheck: '<path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M15 3v4h4M9 14.5l2.2 2.2L15.5 12"/>',
  home: '<path d="M4 11.5L12 4l8 7.5"/><path d="M6.5 10v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-9"/><path d="M10 20v-5h4v5"/>',
  // ---- contacto y personas
  phone: '<path d="M6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2L21 15v3a3 3 0 0 1-3 3A15 15 0 0 1 3 6a3 3 0 0 1 3-3z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M4 8l8 5.5L20 8"/>',
  send: '<path d="M20.5 3.5L10 14M20.5 3.5l-6.3 17-4.2-6.5-6.5-4.2z"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  users: '<circle cx="9" cy="8.5" r="3.4"/><path d="M2.5 19.5a6.5 6.5 0 0 1 13 0"/><path d="M15.5 5.3a3.4 3.4 0 0 1 0 6.4M18 14.6a6.5 6.5 0 0 1 3.5 4.9"/>',
  headset: '<path d="M4.5 13.5V12a7.5 7.5 0 0 1 15 0v1.5"/><rect x="3.5" y="13" width="4" height="6" rx="1.5"/><rect x="16.5" y="13" width="4" height="6" rx="1.5"/><path d="M19.5 19v.5a2 2 0 0 1-2 2H13"/>',
  bot: '<rect x="4" y="8" width="16" height="11" rx="3.5"/><path d="M12 8V4.5M9 13v1.5M15 13v1.5"/><circle cx="12" cy="3.6" r="1"/>',
  pin: '<path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.9 5.2 3.9 8.5s-1.3 6.1-3.9 8.5c-2.6-2.4-3.9-5.2-3.9-8.5s1.3-6.1 3.9-8.5z"/>',
  // ---- negocio
  store: '<path d="M4 9.5l1.3-5h13.4l1.3 5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 12.5V20h13v-7.5M10 20v-4.5h4V20"/>',
  tool: '<path d="M14.5 6.2a4 4 0 0 0-5.3 5.2L3.8 16.8a1.9 1.9 0 0 0 2.7 2.7l5.4-5.4a4 4 0 0 0 5.2-5.3l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 13h17"/>',
  scale: '<path d="M12 4v16M7 20h10M5 8h14"/><path d="M5 8l-2.5 6a2.7 2.7 0 0 0 5 0zM19 8l-2.5 6a2.7 2.7 0 0 0 5 0z"/>',
  euro: '<path d="M17.5 6.5a6.5 6.5 0 1 0 0 11M5 10.5h8M5 13.5h8"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>',
  chart: '<path d="M4 20h16M7 16.5v-5M12 16.5v-9M17 16.5v-12"/>',
  box: '<path d="M12 3.5l8 4.2v8.6l-8 4.2-8-4.2V7.7z"/><path d="M4 7.7l8 4.3 8-4.3M12 12v8.5"/>',
  tag: '<path d="M3.5 12.3V5A1.5 1.5 0 0 1 5 3.5h7.3l8.2 8.2a1.5 1.5 0 0 1 0 2.1l-6.7 6.7a1.5 1.5 0 0 1-2.1 0z"/><circle cx="8" cy="8" r="1.2"/>',
  qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2.5v2.5M20 14v6h-3M14 20v-1"/>',
  // ---- contenido y técnica
  doc: '<path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M15 3v4h4M9 12h6M9 16h6"/>',
  book: '<path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7.5A2.5 2.5 0 0 1 5 17.5z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H18M9 8.5h5"/>',
  list: '<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>',
  quote: '<path d="M9.5 7C6.5 8 5 10.2 5 13v4h5v-5H7.5c0-1.6.8-2.6 2.5-3.2zM18.5 7c-3 1-4.5 3.2-4.5 6v4h5v-5h-2.5c0-1.6.8-2.6 2.5-3.2z"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10.5l5-3v9l-5-3"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l4.8-4.5 3.5 3 3-2.6 4.7 4.1"/>',
  megaphone: '<path d="M4 10v4a1 1 0 0 0 1 1h2l8 4.5v-15L7 9H5a1 1 0 0 0-1 1z"/><path d="M18.5 9.5a3.5 3.5 0 0 1 0 5M8 15l1 4.5h2.5"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/><path d="M8.2 10.8l7-3.6M8.2 13.2l7 3.6"/>',
  layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.5 1.5A3.75 3.75 0 0 1 17 18.5z"/>',
  cpu: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/><path d="M10 10h4v4h-4zM9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/>',
  code: '<path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14"/>',
  desktop: '<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M9 20h6M12 16.5V20"/>',
  mobile: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 17.5h2"/>',
  apple: '<path d="M15.5 3.5c0 1.6-1.3 3-3 3 0-1.7 1.4-3 3-3z"/><path d="M12.4 8.3c.9 0 1.7-.8 3.2-.8 1.4 0 2.6.7 3.3 1.8-2.8 1.6-2.3 5.4.5 6.5-.7 1.9-2.2 4.7-4 4.7-1.1 0-1.5-.7-2.9-.7s-1.9.7-3 .7c-2 0-4.5-4.2-4.5-7.6 0-3.2 2.1-5 4.1-5 1.4 0 2.4.4 3.3.4z"/>',
  windows: '<path d="M4 6.2l7-1v6.3H4zM12.5 5L20 3.9v7.6h-7.5zM4 13h7v6.3l-7-1zM12.5 13H20v7.6l-7.5-1.1z"/>',
};

export const SPRITE =
  '<svg class="tc-sprite" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
  Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') +
  '</defs></svg>';

export const ico = (name, cls = '') => `<svg class="tc-ico${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
