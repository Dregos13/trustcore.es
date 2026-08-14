/**
 * Bundle entry for the Claude Design import of trustcore.es.
 *
 * This design system is CSS-only: the site is static HTML + Tailwind + the tc-* class
 * vocabulary in site/assets/css/components.css. There is no React component library to
 * ship, so window.TrustCore is intentionally empty and the value of this sync lives
 * entirely in the styles.css closure (tokens, fonts, Tailwind, tc-* components) and the
 * README conventions the design agent reads.
 *
 * The site's runtime JS (site/assets/js/components.js) is deliberately excluded: it is
 * progressive enhancement bound to the real page and it pushes analytics events, which
 * must not run inside the design tool.
 */
export {};
