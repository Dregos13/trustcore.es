/**
 * Tailwind config for the Claude Design bundle ONLY — never used by the site build.
 *
 * The site's own build (tailwind.config.js) purges against ./site/**\/*.html, so it
 * emits only the utilities the existing pages happen to use. A design agent composing
 * NEW layouts needs the standard scales available, otherwise classes it writes resolve
 * to nothing and the layout silently collapses. This config keeps the site's real theme
 * (brand colors + Inter) and safelists the utility families a layout author actually
 * reaches for, at their common scales.
 *
 * @type {import('tailwindcss').Config}
 */

// Applied to layout/spacing/sizing/type families — the ones that need to respond.
const RESPONSIVE = ['sm', 'md', 'lg', 'xl'];
// Applied to color/elevation families — the ones that need interaction states.
const INTERACTIVE = ['hover', 'focus', 'group-hover'];

const SPACE_VALUES = [
  '0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '14', '16', '20', '24', '28', '32', '40', '48', '56', '64',
];
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
const BRAND = ['navy', 'navy-deep', 'blue-corp', 'blue-royal', 'cyan-light', 'gold'];
const BASE_COLORS = ['white', 'black', 'transparent', 'current'];
const SCALES = ['gray', 'slate', 'red', 'amber', 'emerald', 'green', 'sky', 'blue', 'indigo'];
const TEXT_SIZES = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'];
const WEIGHTS = ['thin', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'];

const ALL_COLORS = [
  ...BRAND,
  ...BASE_COLORS,
  ...SCALES.flatMap((s) => SHADES.map((sh) => `${s}-${sh}`)),
];

const SPACE = `(${SPACE_VALUES.map((v) => v.replace('.', '\\.')).join('|')})`;
const PALETTE = `(${ALL_COLORS.join('|').replace(/\./g, '\\.')})`;

/**
 * Important-modifier utilities (`!text-white`, `!px-8`).
 *
 * These are NOT optional sugar — they are how this design system overrides itself.
 * The site loads Tailwind BEFORE components.css, so a plain `text-white` loses to
 * `.tc-display { color: var(--tc-navy) }` and a heading on a navy section renders
 * navy-on-navy (invisible). The site's own markup solves it with `!text-white`.
 *
 * Safelist `pattern` entries never emit the `!` variant, so without this list only the
 * handful of `!` classes literally present in site/**\/*.html would exist, and any other
 * override an author writes would silently no-op. Enumerated as literal strings.
 */
const IMPORTANT = [
  ...ALL_COLORS.flatMap((c) => [`!text-${c}`, `!bg-${c}`, `!border-${c}`]),
  ...SPACE_VALUES.flatMap((v) =>
    ['p', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr'].map(
      (side) => `!${side}-${v}`,
    ),
  ),
  ...TEXT_SIZES.map((s) => `!text-${s}`),
  ...WEIGHTS.map((w) => `!font-${w}`),
  ...['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'].map((r) => `!rounded-${r}`),
  ...['none', 'sm', 'md', 'lg', 'xl', '2xl'].map((s) => `!shadow-${s}`),
  '!bg-transparent', '!border-0', '!bg-white/10', '!bg-white/5', '!text-left', '!text-center',
];

module.exports = {
  content: ['./site/**/*.html'],
  safelist: [
    // ---- important overrides (see IMPORTANT above — required for dark surfaces) ----
    ...IMPORTANT,

    // ---- spacing ----
    { pattern: new RegExp(`^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-${SPACE}$`), variants: RESPONSIVE },
    { pattern: /^(mx|my|ml|mr|mt|mb)-auto$/, variants: RESPONSIVE },
    { pattern: new RegExp(`^gap(-x|-y)?-${SPACE}$`), variants: RESPONSIVE },
    { pattern: new RegExp(`^space-(x|y)-${SPACE}$`), variants: RESPONSIVE },

    // ---- sizing ----
    { pattern: new RegExp(`^(w|h)-(full|screen|auto|fit|min|max|px|1/2|1/3|2/3|1/4|3/4|${SPACE})$`), variants: RESPONSIVE },
    { pattern: /^(min-w|min-h)-(0|full|screen|fit)$/, variants: RESPONSIVE },
    { pattern: /^max-w-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|none|prose|screen-sm|screen-md|screen-lg|screen-xl)$/, variants: RESPONSIVE },
    { pattern: /^aspect-(square|video|auto)$/ },

    // ---- display / flex / grid ----
    { pattern: /^(flex|inline-flex|grid|inline-grid|block|inline-block|inline|hidden|contents)$/, variants: RESPONSIVE },
    { pattern: /^flex-(row|col|row-reverse|col-reverse|wrap|nowrap|1|auto|initial|none|shrink|grow)$/, variants: RESPONSIVE },
    { pattern: /^(shrink|grow|basis)-(0|full|auto)?$/, variants: RESPONSIVE },
    { pattern: /^grid-cols-(1|2|3|4|5|6|7|8|9|10|11|12)$/, variants: RESPONSIVE },
    { pattern: /^grid-rows-(1|2|3|4|5|6)$/, variants: RESPONSIVE },
    { pattern: /^col-span-(1|2|3|4|5|6|7|8|9|10|11|12|full)$/, variants: RESPONSIVE },
    { pattern: /^row-span-(1|2|3|4|5|6|full)$/, variants: RESPONSIVE },
    { pattern: /^order-(1|2|3|4|5|6|first|last|none)$/, variants: RESPONSIVE },
    { pattern: /^(items|self)-(start|end|center|stretch|baseline|auto)$/, variants: RESPONSIVE },
    { pattern: /^(justify|content)-(start|end|center|between|around|evenly|stretch)$/, variants: RESPONSIVE },
    { pattern: /^place-(items|content)-(start|end|center|between|stretch)$/, variants: RESPONSIVE },

    // ---- position ----
    { pattern: /^(static|relative|absolute|fixed|sticky)$/, variants: RESPONSIVE },
    { pattern: /^(top|bottom|left|right|inset|inset-x|inset-y)-(0|px|auto|full|1|2|3|4|5|6|8|10|12|16|20|24)$/, variants: RESPONSIVE },
    { pattern: /^z-(0|10|20|30|40|50|auto)$/ },

    // ---- typography ----
    { pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/, variants: RESPONSIVE },
    { pattern: /^text-(left|center|right|justify)$/, variants: RESPONSIVE },
    { pattern: /^font-(thin|light|normal|medium|semibold|bold|extrabold|black|sans|serif|mono)$/, variants: RESPONSIVE },
    { pattern: /^leading-(none|tight|snug|normal|relaxed|loose|3|4|5|6|7|8|9|10)$/, variants: RESPONSIVE },
    { pattern: /^tracking-(tighter|tight|normal|wide|wider|widest)$/ },
    { pattern: /^(uppercase|lowercase|capitalize|normal-case|italic|not-italic|underline|line-through|no-underline|truncate|antialiased|whitespace-nowrap|break-words)$/, variants: INTERACTIVE },
    { pattern: /^(list-disc|list-decimal|list-none|list-inside|list-outside)$/ },

    // ---- color ----
    { pattern: new RegExp(`^(bg|text|border|ring|decoration|divide)-${PALETTE}$`), variants: INTERACTIVE },
    { pattern: new RegExp(`^(from|via|to)-${PALETTE}$`) },
    { pattern: /^bg-gradient-to-(t|tr|r|br|b|bl|l|tl)$/ },
    { pattern: /^bg-(white|black)\/(5|10|20|30|40|50|60|70|80|90|95)$/ },
    { pattern: /^(bg|object)-(cover|contain|center|fill|none|no-repeat)$/ },

    // ---- borders / elevation ----
    { pattern: /^rounded(-(t|b|l|r|tl|tr|bl|br))?(-(none|sm|md|lg|xl|2xl|3xl|full))?$/, variants: RESPONSIVE },
    { pattern: /^border(-(0|2|4|8|t|b|l|r|x|y))?$/, variants: INTERACTIVE },
    { pattern: /^shadow(-(sm|md|lg|xl|2xl|inner|none))?$/, variants: INTERACTIVE },
    { pattern: /^ring(-(0|1|2|4|8|inset))?$/, variants: INTERACTIVE },
    { pattern: /^opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)$/, variants: INTERACTIVE },

    // ---- behaviour ----
    { pattern: /^overflow(-x|-y)?-(auto|hidden|visible|scroll|clip)$/ },
    { pattern: /^(cursor)-(pointer|default|not-allowed|wait|text|move)$/ },
    { pattern: /^(select)-(none|text|all|auto)$/ },
    { pattern: /^(pointer-events)-(none|auto)$/ },
    { pattern: /^transition(-(all|colors|opacity|shadow|transform|none))?$/ },
    { pattern: /^duration-(75|100|150|200|300|500|700|1000)$/ },
    { pattern: /^ease-(linear|in|out|in-out)$/ },
    { pattern: /^(scale|rotate|translate-x|translate-y)-(0|1|2|3|6|12|45|90|95|100|105|110|180)$/, variants: INTERACTIVE },
    { pattern: /^(sr-only|not-sr-only)$/ },
  ],
  theme: {
    extend: {
      colors: {
        navy: '#040F3F',
        'navy-deep': '#020A2A',
        'blue-corp': '#0B2572',
        'blue-royal': '#2071D5',
        'cyan-light': '#53CDFE',
        gold: '#D4A23D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
