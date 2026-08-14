# design-sync notes — trustcore.es

## What this repo is, for sync purposes

A static HTML + Tailwind marketing site (64 pages), **not** a React component library.
There is no `dist/`, no package exports, no Storybook. The converter therefore runs in its
**tokens-only path** (`[ZERO_MATCH] no component exports — treating as tokens-only DS`),
which is a supported outcome, not a failure: `_ds_bundle.js` is an empty IIFE and the
entire deliverable is the `styles.css` closure plus the README conventions header.

Value for the design agent lives in three places: the `tc-*` class vocabulary
(`site/assets/css/components.css`), the `--tc-*` tokens (`site/assets/css/tokens.css`),
and `.design-sync/conventions.md`.

## Build sequence (all of it is required, in this order)

```sh
node_modules/.bin/tailwindcss -c .design-sync/css/tailwind.ds.config.js \
  -i src/tailwind.css -o .design-sync/css/tailwind.ds.css --minify   # 1. expanded utilities
node .design-sync/build-css-entry.mjs                                # 2. consolidate cssEntry
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry ./.design-sync/ds-entry.js --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
node .design-sync/verify/shoot.mjs                                   # 3. real fidelity proof
```

Steps 1–2 are **not** optional on a re-sync: `package-build.mjs` reads
`.design-sync/css/trustcore-ds.css` as a plain file and will happily ship a stale one.
Re-run them whenever `components.css`, `tokens.css`, or any `site/**/*.html` changes.

## Repo-specific gotchas

- **`--entry` is mandatory.** npm never self-installs `node_modules/trustcore-site`, so
  without it the build dies on `ENOENT .../node_modules/trustcore-site/package.json`.
  `.design-sync/ds-entry.js` is an empty module whose only job is to give the converter a
  package root (it resolves `PKG_DIR` by walking up from the entry to `package.json`).
- **React is a build-only dependency.** The converter vendors React into `_vendor/` even
  with zero components. Installed via `npm i --no-save react react-dom` so `package.json`
  stays clean — `node_modules/` is gitignored, so **a fresh clone must re-run that**.
- **`copyTokens()` only reads from a node_modules package**, so `cfg.tokensGlob` cannot
  pick up repo-local `tokens.css`. That is why `ds-bundle/tokens/` is empty and tokens are
  inlined into `_ds_bundle.css` instead. The tokens still register in the app: they sit in
  a `:root` block inside the styles.css closure, which is what the app's scope filter reads.
- **Remote `@import` scraping is storybook-only**, so a Google-Fonts link could not enter
  the closure. Inter is self-hosted instead (`.design-sync/fetch-inter.mjs`, 5 weights ×
  latin/latin-ext = 668 KB). Re-run that script only if the weights in the site's
  `<link>` change.
- **Icons: the sprite does not work in designs.** The site renders icons as
  `<svg class="tc-icon"><use href="/assets/icons/sprite.svg#fa-name"/></svg>` — a
  site-absolute path that cannot resolve in a rendered design. Font Awesome 6 Free (the
  set the sprite was cut from) is bundled instead, and `conventions.md` tells the agent to
  write `<i class="fa-solid fa-*">`. Three components also depend on the webfont directly
  (`.tc-trusty-line`, `.tc-lesson-trigger`, and the answer-card bullet set
  `font-family:"Font Awesome 6 Free"` with `\fXXX` content) — they were plain tofu before
  this was wired.
- **Cascade footgun — the single most important thing in `conventions.md`.**
  `components.css` loads after Tailwind, so `.tc-display { color: var(--tc-navy) }` beats
  `text-white` and a heading on a navy section renders invisible. Caught by the proof
  render, not by any validator. The site's own fix is Tailwind's `!` modifier
  (`!text-white`), so `tailwind.ds.config.js` enumerates ~1,400 `!` utilities as literal
  safelist strings — `pattern` entries never emit the `!` variant.
- **Purged Tailwind would break new layouts.** The site's own `tailwind.min.css` (42 KB)
  contains only classes the existing pages use. The bundle ships a safelisted build
  (~600 KB) so utilities the agent invents actually resolve.
- **JS-dependent invisible states.** `site/assets/js/components.js` is deliberately NOT
  bundled (it fires `dataLayer`/`gtag` analytics). Two rules would otherwise leave content
  invisible, so `build-css-entry.mjs` appends a compat layer pinning `[data-reveal]`
  visible and showing the first `.tc-theater-panel` when none is `.is-active`.

## Known render warns

- `[FONT_MISSING] "Cambria"` — **benign, expected every run.** Cambria appears only in
  Tailwind preflight's generic `font-serif` fallback stack
  (`ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`). It is a system-font
  fallback, not a brand font. Do not chase it; do not add a webfont for it.
- `[RENDER_SKIPPED]` if playwright is absent — the converter's render check is vacuous
  here anyway (0 component cards). Real verification is `.design-sync/verify/shoot.mjs`.

## Verification approach

Because there are no component cards, the converter's render check proves nothing. The
actual gate is `.design-sync/verify/proof.html` + `shoot.mjs`: it links **only**
`ds-bundle/styles.css` (exactly the closure a design receives), renders real markup lifted
from the site, asserts Inter + Font Awesome actually loaded and that `[data-reveal]` is
visible, and writes `proof.png`. **Look at the PNG** — the cascade bug above was invisible
to every assertion and obvious in the image.

Playwright: chromium builds 1181/1217/1223 were already cached, and **1.60.0** is the
release pinning 1223. A mismatched playwright fails with
`browserType.launch: Executable doesn't exist`. It is installed into `.ds-sync/`, with
`.design-sync/verify/node_modules` symlinked there — both gitignored, so a fresh clone
re-runs `cd .ds-sync && npm i playwright@1.60.0`.

## Re-sync risks — what can silently go stale

- **Stale generated CSS.** The biggest one. `trustcore-ds.css` and `tailwind.ds.css` are
  gitignored build products, so a fresh clone cannot ship a stale one (the build fails
  loudly on the missing file instead). But **on a machine that has synced before**, editing
  `components.css` and skipping steps 1–2 ships the previous design system silently.
  Always run the full sequence, never `package-build.mjs` alone.
- **The `!`-utility safelist is a fixed enumeration.** New brand colors added to
  `tailwind.config.js` must be mirrored in `.design-sync/css/tailwind.ds.config.js`
  (`BRAND`), or `!text-<newcolor>` will silently not exist.
- **`conventions.md` names 38 `tc-*` classes and 65 tokens explicitly.** Renaming or
  deleting one in `components.css` makes the header lie to the design agent. Re-run the
  validation pass (extract names from the doc, grep `ds-bundle/_ds_bundle.css`) on every
  re-sync — that is a required step of the conventions-header stage, not optional.
- **Font Awesome version drift.** `build-css-entry.mjs` reads
  `node_modules/@fortawesome/fontawesome-free`, a devDependency (`^6.7.2`). A major bump
  changes the `"Font Awesome 6 Free"` family name that three components hardcode.
- **Only verified at 1280×900.** Responsive behaviour of `tc-bento` spans and the
  `md:`/`lg:` utilities was not checked at other widths.
- **Not verified in the real environment.** The proof render is local chromium against
  `file://`. Confirm the DS pane in claude.ai/design after the first upload.
