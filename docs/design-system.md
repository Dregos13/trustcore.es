# TrustCore Design System v1

**Stack:** HTML estático + Tailwind CDN + CSS tokens + component library propia.

## Archivos fuente
- `site/assets/css/tokens.css` — Variables CSS (colores, tipografía, spacing, radios, sombras, transiciones).
- `site/assets/css/components.css` — Clases custom `tc-*` para patrones complejos.
- `site/assets/js/components.js` — Helpers JS: reveal on scroll, bento pointer, modal de calendar, tracking GTM.

## Cómo incluirlos en una página

```html
<link rel="stylesheet" href="/assets/css/components.css">
<script src="/assets/js/components.js" defer></script>
```

`components.css` ya hace `@import` de `tokens.css`, así que solo necesitas incluir uno.

## Tokens principales

### Colores
| Token | Valor | Uso |
|-------|-------|-----|
| `--tc-navy` | `#040F3F` | Texto principal, header, CTAs secundarios |
| `--tc-blue-corp` | `#0B2572` | CTAs principales, acentos |
| `--tc-blue-royal` | `#2071D5` | Enlaces, hovers, eyebrows |
| `--tc-cyan-light` | `#53CDFE` | Gradientes, highlights |
| `--tc-gold` | `#D4A23D` | Awards, badges premium |
| `--tc-success` / `--tc-warning` / `--tc-danger` | semánticos |

### Tipografía (fluid clamp)
`--tc-text-xs` → `--tc-text-5xl`. Escala fluida responsive automática.

### Espaciado
Base 8pt: `--tc-space-1` (4px) → `--tc-space-32` (128px).

## Componentes (`tc-*`)

### Layout
- `.tc-section` — padding vertical responsive.
- `.tc-container` — max-width 1280px centrado.

### Tipografía
- `.tc-eyebrow` — kicker en mayúsculas con barra de gradiente.
- `.tc-display-xl|lg|md` — headlines.
- `.tc-gradient-text` — texto con gradiente azul→cyan.

### Botones
- `.tc-btn` base + modificadores `.tc-btn-primary`, `.tc-btn-secondary`, `.tc-btn-ghost`.

### Destacados
- `.tc-award` + `.tc-award__icon` — badge de premio (oro).
- `.tc-metric` — KPI card.
- `.tc-testimonial` — tarjeta de testimonio.
- `.tc-pricing` + modificador `.tc-pricing--featured`.

### Grids
- `.tc-bento` + hijos `.tc-bento__card` (+ variantes `--hero`, `--half`, `--third`, `--two-thirds`).
  - Pointer highlight al hover (requiere `components.js`).

### Decoradores
- `.tc-showcase` — frame para screenshot/video de app con glow.
- `.tc-bg-grid` — fondo con rejilla sutil.
- `.tc-bg-orbs` — orbes de color difuminados de fondo.

### Marquee
- `.tc-marquee` + `.tc-marquee__track` — carrusel infinito de logos.

### Animaciones
- `[data-reveal]` — fade + slide-up al entrar en viewport.
- `[data-calendar-open]` — abre modal de Google Calendar embebido.
- `[data-track="label"]` — envía `cta_click` a GTM al hacer click.

## Patrones de composición recomendados

**Hero split con award:**
```html
<section class="tc-section tc-bg-orbs">
  <div class="tc-container grid md:grid-cols-2 gap-12 items-center">
    <div data-reveal>
      <span class="tc-award">
        <span class="tc-award__icon"><i class="fas fa-trophy"></i></span>
        #1 CeutaTech Summit · Pase de Oro Alhambra Venture
      </span>
      <h1 class="tc-display tc-display-xl mt-6">Tu empresa, <span class="tc-gradient-text">100% legal</span> y bajo control</h1>
      <p class="text-lg text-slate-600 mt-6">...</p>
      <div class="flex flex-wrap gap-3 mt-8">
        <button class="tc-btn tc-btn-primary" data-calendar-open data-track="hero_demo">Agendar demo 15 min</button>
        <a class="tc-btn tc-btn-secondary" href="#precios" data-track="hero_pricing">Ver precios</a>
      </div>
    </div>
    <div class="tc-showcase" data-reveal>
      <div class="tc-showcase__window"><img src="/assets/dashboard.png" alt="Dashboard TrustCore"></div>
    </div>
  </div>
</section>
```

**Bento de módulos:**
```html
<div class="tc-bento">
  <article class="tc-bento__card tc-bento--half"> ... </article>
  <article class="tc-bento__card tc-bento--half"> ... </article>
  <article class="tc-bento__card tc-bento--third"> ... </article>
  <article class="tc-bento__card tc-bento--third"> ... </article>
  <article class="tc-bento__card tc-bento--third"> ... </article>
</div>
```

## Accesibilidad
- `prefers-reduced-motion` respetado globalmente en `tokens.css`.
- Focus rings (`:focus-visible`) implementados en botones.
- Modal de calendar con `role=dialog`, `aria-modal`, cierre por ESC + backdrop click.
- Siempre añade `alt` en imágenes y `aria-label` en botones-icono.

## Próximos pasos (Fase 8)
Migrar de Tailwind CDN a build estático con los tokens integrados en `tailwind.config.js` (elimina FOUC y mejora LCP).
