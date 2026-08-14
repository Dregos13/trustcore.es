# TrustCore — how to build with this design system

TrustCore is the compliance-software brand behind TrustinTime (control horario) and
TrustInFacts (facturación / VeriFactu / IPSI). Its public site is Spanish-first, with
English and French variants. Copy should stay plain and factual — see
`guidelines/docs/brand-voice.md`.

**This is a CSS design system, not a component library.** `window.TrustCore` is
intentionally empty — there are no React components to import. You build with ordinary
JSX elements and two class vocabularies: the `tc-*` component classes and Tailwind
utilities. Both ship in `styles.css`.

## Setup

No provider, no theme wrapper. Link the one stylesheet and set the base font class:

```jsx
<body className="font-sans text-gray-800 antialiased">
```

Inter (400/500/600/700/800) and Font Awesome 6 Free are self-hosted in the bundle — no
network fonts, nothing to configure.

## The one rule that will bite you

`components.css` loads **after** Tailwind, so a `tc-*` class beats a plain utility for
any property it sets. `.tc-display` sets `color: var(--tc-navy)`, so:

```jsx
<h2 className="tc-display tc-display-lg text-white">   {/* ✗ invisible navy-on-navy */}
<h2 className="tc-display tc-display-lg !text-white">  {/* ✓ */}
```

Use Tailwind's `!` modifier whenever you override a property a `tc-*` class already
sets — colors above all. This is the site's own idiom (`!text-white`, `!px-8`,
`!text-cyan-light`, `!font-bold`). Plain utilities are fine for anything `tc-*` does not
set: layout, spacing, sizing, grid.

## The `tc-*` vocabulary

| Family | Classes |
|---|---|
| Layout | `tc-container`, `tc-section` |
| Type | `tc-display` + `tc-display-md/-lg/-xl`, `tc-eyebrow`, `tc-gradient-text` |
| Buttons | `tc-btn` + `tc-btn-primary` / `tc-btn-secondary` / `tc-btn-ghost` |
| Bento grid | `tc-bento`, `tc-bento__card`, `tc-bento__icon/__title/__desc`, spans `tc-bento--half/--third/--two-thirds/--hero` |
| Cards | `tc-answer-card` (`--accent`), `tc-client-card`, `tc-webinar-card`, `tc-tldr` |
| Pricing | `tc-pricing` (`--featured`), `tc-pricing__name/__price/__features` |
| Proof | `tc-metric` + `__value/__label`, `tc-testimonial` + `__quote/__author/__avatar/__name/__role`, `tc-trust-bar`, `tc-award` |
| Process | `tc-flow-map`, `tc-flow-step` (`<b>` + `<small>` children), `tc-learn-roadmap`, `tc-learning-steps` |
| Surfaces | `tc-bg-grid`, `tc-bg-orbs`, `tc-showcase`, `tc-tech-panel`, `tc-marquee` |
| Icons | `tc-icon` (SVG sprite — see below), `tc-spin` |

Buttons must always carry the base: `tc-btn tc-btn-primary`, never `tc-btn-primary` alone.

## Icons

The production site uses an SVG sprite (`<svg class="tc-icon"><use href="/assets/icons/
sprite.svg#fa-name"/></svg>`). That path is site-absolute and does **not** resolve here,
so in designs use Font Awesome markup instead — same icon set, fully bundled:

```jsx
<i className="fa-solid fa-shield-halved" />   {/* also fa-regular, fa-brands */}
```

## Tokens

65 CSS variables on `:root`, the source of truth for brand values. Reach for them in
inline styles when no utility fits — the site does this constantly:

```jsx
<h3 className="text-xl font-extrabold" style={{ color: 'var(--tc-navy)' }}>
```

- Brand: `--tc-navy`, `--tc-navy-deep`, `--tc-blue-corp`, `--tc-blue-royal`,
  `--tc-blue-soft`, `--tc-cyan-light`, `--tc-cyan-glow`, `--tc-gold` (`-soft`/`-deep`)
- Semantic: `--tc-success`, `--tc-warning`, `--tc-danger`, `--tc-info`
- Neutrals: `--tc-ink`, `--tc-ink-mute`, `--tc-slate`, `--tc-slate-soft`, `--tc-line`,
  `--tc-line-soft`, `--tc-surface`, `--tc-surface-alt`
- Scales: `--tc-text-xs…-5xl` (fluid `clamp()`), `--tc-space-1…-32`,
  `--tc-radius-sm/-md/-lg/-xl/-2xl/-pill`, `--tc-shadow-xs…-xl` plus `-glow`/`-gold`

The brand colors are also Tailwind colors: `bg-navy`, `text-blue-royal`, `bg-cyan-light`,
`text-gold`, `bg-blue-corp`, `bg-navy-deep`.

## Where the truth lives

- `styles.css` — the single entry; `@import`s the fonts and `_ds_bundle.css` (tokens →
  Tailwind → `tc-*` components → Font Awesome). Read it before styling.
- `guidelines/docs/design-system.md` — the team's own design notes.
- `guidelines/docs/brand-voice.md`, `guidelines/docs/content-playbook.md` — voice and copy.

## A representative section

```jsx
<section className="tc-section" style={{ background: 'var(--tc-navy)' }}>
  <div className="tc-container">
    <span className="tc-eyebrow" style={{ color: 'var(--tc-cyan-light)' }}>Suite modular</span>
    <h2 className="tc-display tc-display-lg !text-white mt-4 mb-6">
      Cumplimiento sin <span className="tc-gradient-text">fricción</span>
    </h2>
    <div className="tc-bento">
      <div className="tc-bento__card tc-bento--half">
        <div className="tc-bento__icon"><i className="fa-solid fa-fingerprint" /></div>
        <h3 className="tc-bento__title">Confianza clara</h3>
        <p className="tc-bento__desc">Nombre, producto y territorio en una misma historia.</p>
      </div>
      <div className="tc-bento__card tc-bento--half">
        <div className="tc-bento__icon"><i className="fa-solid fa-shield-halved" /></div>
        <h3 className="tc-bento__title">Prueba legal</h3>
        <p className="tc-bento__desc">Logs firmados y cuatro años de conservación.</p>
      </div>
    </div>
    <a href="#" className="tc-btn tc-btn-primary !px-8 !py-3.5 mt-8">
      <i className="fa-solid fa-rocket" /> Ver planes
    </a>
  </div>
</section>
```

Note: `data-reveal` is a scroll-animation hook on the real site. Its JS is not bundled
here, so the stylesheet pins those elements visible — safe to use, but it does nothing.
