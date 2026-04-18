# TrustCore.es — Plan de Refactorización Web Integral

**Objetivo:** Elevar trustcore.es al nivel competitivo de Holded / Quipu, transmitir con claridad la propuesta de valor modular (VeriFactu + Control Horario + Cloud + IA + Dashboards), activar conversión (demo Google Calendar, formulario HubSpot, precios claros) y construir autoridad (blog, about, awards).

**Stack actual:** HTML estático + Tailwind CDN, GTM activo, multilingüe (ES/EN/FR), 9 artículos SEO ya publicados, productos: TrustinTime + TrustinFacts.

---

## Diagnóstico — Gaps vs. competencia

| Área | TrustCore hoy | Holded / Quipu | Gap |
|------|---------------|----------------|-----|
| Trust signals | 0 logos, 0 reviews visibles | Logos + Trustpilot + testimonios | **Alto** |
| Awards / PR | No menciona Alhambra Venture ni CeutaTech | — | **Alto — activo inutilizado** |
| Blog | Artículos sueltos, sin hub | Blog estructurado por categorías | **Alto** |
| About | Página débil | Historia + equipo + cultura | **Medio** |
| Demo booking | CTAs genéricas | Widget de calendario inline | **Alto** |
| Formulario contacto | Básico | HubSpot con routing | **Alto** |
| Pricing | Visible pero sin tiers claros | Tabla 3-tiers + toggle anual/mensual | **Alto** |
| Visual / animaciones | Estático, sin ilustraciones | Screenshots de dashboard + ilustraciones + microanimaciones | **Alto** |
| Analytics web | GTM activo, sin dashboard propio | Dashboards internos de producto | **Medio** |
| Mensaje Cloud / IA / Dashboards | No se transmite | Integrado en hero y features | **Alto** |

---

## Fases del plan (orden de ejecución)

### FASE 0 — Discovery & Brand Foundation
**Duración:** 1-2 sesiones
**Objetivo:** Establecer base de marca, tono y mensajes clave antes de diseñar.

| Tarea | Skill |
|-------|-------|
| Auditoría SEO completa del estado actual | `marketing:seo-audit` |
| Análisis competitivo estructurado Holded / Quipu / Sage / Sesame | `marketing:competitive-brief` |
| Generar brand voice guidelines (tono cercano + puntero) | `brand-voice:generate-guidelines` |
| Definir user personas (pyme gestora, autónomo, asesoría) | `design:user-research` |
| Síntesis de research → principios de diseño | `design:research-synthesis` |

**Entregables:**
- `docs/brand/voice-guidelines.md`
- `docs/brand/personas.md`
- `docs/competitive-brief.md`
- `docs/seo-baseline.md`

---

### FASE 1 — Design System & UX Foundation
**Duración:** 2-3 sesiones
**Objetivo:** Crear un sistema de diseño reutilizable (tokens, componentes, patrones) antes de tocar páginas.

| Tarea | Skill |
|-------|-------|
| Definir design tokens (colores, spacing, tipografía, radios, shadows) basado en `#040F3F` | `design:design-system` |
| Biblioteca de componentes (buttons, cards, nav, modals, forms, testimonial, pricing-card, feature-block) | `ui-ux-pro-max` |
| Patrones de layout inspirados en sitios premium (hero split, bento grid, feature showcase) | `designing-beautiful-websites` |
| Sistema tipográfico y jerarquía visual | `frontend-design` |
| Migrar de Tailwind CDN → Tailwind build local + config de tokens | `engineering:architecture` |

**Entregables:**
- `site/assets/css/tokens.css` (o `tailwind.config.js`)
- `site/components/` con partials HTML reutilizables
- `docs/design-system.md`

---

### FASE 2 — Home Redesign (landing hero-to-footer)
**Duración:** 3-4 sesiones
**Objetivo:** Homepage al nivel de Holded, mostrando cloud / IA / dashboards / modularidad.

**Estructura objetivo:**
1. **Hero split** con screenshot real de dashboard + headline + subheadline + 2 CTAs (demo / empezar gratis) + award badges (Alhambra + CeutaTech)
2. **Trust bar** con logos cliente + "Ganadores Pase de Oro Alhambra Venture" + "#1 CeutaTech Summit"
3. **Bento grid de módulos**: VeriFactu · Control Horario · Cloud · Asistente IA · Dashboards
4. **Showcase animado** de la app (video o sequence frames)
5. **Problema → solución** con ilustraciones
6. **Pricing teaser** (3 tiers) con link a pricing completo
7. **Testimonios** con foto, rol, métrica concreta
8. **Comparativa rápida** vs. Holded/Quipu (tabla)
9. **FAQ + AEO-optimizado** (bloque schema.org)
10. **CTA final** con formulario HubSpot embebido + widget Google Calendar

| Tarea | Skill |
|-------|-------|
| Wireframe + layout del hero y secciones | `ui-ux-pro-max` |
| Dirección visual y estética | `designing-beautiful-websites` |
| Copy del hero + secciones | `design:ux-copy` |
| Optimización SEO + AEO del home | `seo-aeo-best-practices` |
| Embed Google Calendar + HubSpot form | `engineering:architecture` |
| Accessibility review del home | `design:accessibility-review` + `frontend-accessibility` |

**Entregables:**
- `site/index.html` refactorizado
- `site/en/index.html` + `site/fr/index.html`
- Screenshots reales de las apps en `site/assets/screenshots/`

---

### FASE 3 — Páginas de Producto (TrustinTime + TrustinFacts)
**Duración:** 2 sesiones
**Objetivo:** Producto = narrativa de valor, no listado de features.

**Estructura por producto:**
- Hero con screenshot + KPI ("ahorra 20h/mes")
- Feature deep-dive con capturas (ilustraciones)
- Casos de uso por persona
- Integraciones (logos)
- Pricing-card del producto
- Demo inline + CTA

| Tarea | Skill |
|-------|-------|
| Spec del contenido de cada producto | `product-management:write-spec` |
| Diseño visual de feature sections | `designing-beautiful-websites` |
| UX de navegación entre módulos | `ui-ux-pro-max` |
| Copy orientado a beneficio | `design:ux-copy` |

---

### FASE 4 — Pricing Page (al estilo Holded/Quipu)
**Duración:** 1 sesión
**Objetivo:** Pricing transparente, tabla comparativa de features por tier, toggle mensual/anual, FAQ.

| Tarea | Skill |
|-------|-------|
| Estructura de pricing tiers + packaging | `product-management:write-spec` |
| Diseño de tabla comparativa | `ui-ux-pro-max` |
| Copy de value props por tier | `design:ux-copy` |

---

### FASE 5 — About Us (visión, misión, equipo, awards)
**Duración:** 1 sesión
**Objetivo:** Dar la cara. Transmitir la historia, fundadores, visión a 5 años, valores, awards con contexto.

**Estructura:**
- Hero: "Nacimos en Ceuta, construimos el futuro del cumplimiento"
- Timeline: fundación 2024 → CeutaTech #1 → Alhambra Venture Pase de Oro → próximos hitos
- Visión + misión + valores
- Equipo (fotos + bio + LinkedIn)
- Manifesto / por qué existimos
- CTA: "Únete al equipo" / "Habla con nosotros"

| Tarea | Skill |
|-------|-------|
| Narrativa de marca y tono | `brand-voice:enforce-voice` |
| Diseño de timeline + team section | `designing-beautiful-websites` |
| Copy de visión/misión | `design:ux-copy` |

---

### FASE 6 — Blog Hub profesional
**Duración:** 2 sesiones
**Objetivo:** Hub de blog real, no artículos sueltos. Categorías, featured, buscador, feed.

**Estructura:**
- `/blog/` index con categorías: VeriFactu · Control Horario · Cumplimiento · IPSI Ceuta/Melilla · Casos de éxito · Producto
- Featured post
- Grid de últimos 9 posts
- Sidebar con suscripción email + posts populares
- Plantilla de post individual con TOC, tiempo de lectura, autor, compartir, related posts
- Schema.org Article + FAQPage en cada post

| Tarea | Skill |
|-------|-------|
| Arquitectura de contenido del blog | `engineering:architecture` |
| Plantilla visual de post y hub | `designing-beautiful-websites` |
| SEO + AEO de cada plantilla | `seo-aeo-best-practices` |
| Migrar artículos existentes a nueva estructura | `marketing:content-creation` |
| Calendario editorial 3 meses | `marketing:campaign-plan` |

**Entregables:**
- `site/blog/index.html`
- `site/blog/[categoria]/index.html`
- Migración de los 9 artículos actuales a `site/blog/[slug].html`

---

### FASE 7 — Conversión: Demo booking + HubSpot + Analytics
**Duración:** 1-2 sesiones
**Objetivo:** Activar el funnel.

| Tarea | Skill |
|-------|-------|
| Embed Google Calendar booking widget (o Calendly fallback) | `engineering:architecture` |
| Embed HubSpot form en `/contacto` + modal global | `engineering:architecture` |
| Configurar GTM: eventos de conversión (demo_booked, form_submit, pricing_click, scroll_depth, outbound_click) | `engineering:architecture` |
| Dashboard GA4 con funnel + páginas top/bottom | `product-management:metrics-review` |
| Heatmap (Microsoft Clarity o Hotjar) | `engineering:architecture` |

**Entregables:**
- Widget calendario en home, producto, pricing, about
- Form HubSpot en contacto
- GA4 + Clarity activos
- `docs/analytics-dashboard.md` con KPIs a trackear

---

### FASE 8 — SEO técnico, AEO y performance
**Duración:** 1-2 sesiones
**Objetivo:** Core Web Vitals en verde + dominio en top para queries clave + AEO para ChatGPT/Perplexity.

| Tarea | Skill |
|-------|-------|
| Core Web Vitals (LCP, INP, CLS) optimization | `seo-aeo-best-practices` |
| Internal linking audit + refactor | `marketing:seo-audit` |
| Structured data: Product, FAQPage, BreadcrumbList, Review, Organization, Article | `seo-aeo-best-practices` |
| AEO: H2/H3 en formato pregunta-respuesta directa, tablas comparativas, TL;DR en cada post | `seo-aeo-best-practices` |
| Actualizar `llms.txt` y `sitemap.xml` | `seo-aeo-best-practices` |
| Migrar Tailwind CDN → build estático (reduce LCP) | `engineering:architecture` |

---

### FASE 9 — Accesibilidad + QA cross-browser
**Duración:** 1 sesión
**Objetivo:** WCAG 2.1 AA en todo el sitio.

| Tarea | Skill |
|-------|-------|
| Audit WCAG completo | `design:accessibility-review` |
| Fix de issues (contraste, focus, aria, keyboard nav) | `frontend-accessibility` |
| Crítica final de diseño | `design:design-critique` |
| Simplificar código y eliminar duplicación | `simplify` |

---

### FASE 10 — Launch + iteración
**Duración:** ongoing
**Objetivo:** Deploy + ciclo semanal de mejora.

- Checklist de deploy (`engineering:deploy-checklist`)
- Review de PR de refactor (`engineering:code-review`)
- Standup semanal de métricas (`engineering:standup`)
- A/B tests de hero y CTAs
- Refresco mensual de contenido

---

## Resumen de skills por frecuencia de uso

| Skill | Fases en las que aparece |
|-------|--------------------------|
| `ui-ux-pro-max` | 1, 2, 3, 4 |
| `designing-beautiful-websites` | 1, 2, 3, 5, 6 |
| `seo-aeo-best-practices` | 2, 6, 8 |
| `frontend-accessibility` | 2, 9 |
| `design:ux-copy` | 2, 3, 4, 5 |
| `design:accessibility-review` | 2, 9 |
| `engineering:architecture` | 1, 2, 6, 7, 8 |
| `marketing:seo-audit` | 0, 8 |
| `marketing:content-creation` | 6 |
| `marketing:competitive-brief` | 0 |
| `marketing:campaign-plan` | 6 |
| `brand-voice:generate-guidelines` | 0 |
| `brand-voice:enforce-voice` | 5 |
| `design:user-research` | 0 |
| `design:research-synthesis` | 0 |
| `design:design-system` | 1 |
| `design:design-critique` | 9 |
| `product-management:write-spec` | 3, 4 |
| `product-management:metrics-review` | 7 |
| `engineering:deploy-checklist` | 10 |
| `engineering:code-review` | 10 |
| `simplify` | 9 |

---

## Siguiente paso sugerido

Empezar por **FASE 0** (`marketing:seo-audit` + `marketing:competitive-brief` + `brand-voice:generate-guidelines`) en paralelo para no tocar código hasta tener base sólida. Luego atacar FASE 1 (design system) y FASE 2 (home) como primer entregable visible.

¿Arrancamos por FASE 0, o prefieres saltar directo a FASE 2 (home redesign) con los inputs que ya tenemos?
