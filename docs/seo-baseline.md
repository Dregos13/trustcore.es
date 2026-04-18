# SEO Baseline — TrustCore (Abril 2026)

## Estado actual
- **Dominio:** trustcore.es (consolidado)
- **Tech:** HTML estático + Tailwind CDN → penaliza LCP
- **Indexación:** GTM activo, sitemap.xml presente, robots.txt OK, llms.txt presente (bien)
- **Multilingüe:** ES/EN/FR con hreflang correcto
- **Structured data:** Organization JSON-LD en home; faltan Product, FAQPage, BreadcrumbList, Review en resto

## Contenido actual
- 9 artículos SEO publicados en raíz (sin hub `/blog/`):
  - `article.html` (template)
  - `auditoria-control-horario-checklist.html`
  - `control-horario-fichaje-remoto-sin-riesgos.html`
  - `control-horario-obligatorio-guia-2026.html`
  - `cumplimiento-basico-en-30-dias.html`
  - `errores-ipsi-autonomos-y-pymes.html`
  - `ipsi-ceuta-melilla-guia-practica.html`
  - `ipsi-en-factura-ejemplo-completo.html`
  - `ipsi-quipu-alternativas-para-pymes.html`
  - `plan-lite-cumplimiento-basico-empresa.html`
  - `plan-lite-vs-plan-pro-cumplimiento.html`

## Targets semánticos identificados
**High priority (producto/conversión):**
- "software verifactu"
- "control horario pymes"
- "facturación electrónica verifactu"
- "registro jornada obligatorio 2026"
- "software IPSI Ceuta Melilla"

**AEO (respuestas directas para LLMs):**
- "qué es verifactu"
- "cuándo es obligatorio verifactu"
- "diferencias verifactu vs TicketBAI"
- "software verifactu más barato"
- "cómo calcular IPSI en factura"

## Issues técnicos a resolver (Fase 8)
1. Tailwind CDN → build local (LCP, FCP)
2. Imágenes sin `loading="lazy"` sistemático
3. No hay `<link rel="preload">` para hero fonts
4. Fuentes de Google Fonts cargando sin `display=swap`
5. Artículos sueltos → migrar a `/blog/[slug]` con breadcrumbs + Article schema
6. Internal linking pobre entre artículos
7. Falta FAQPage schema en landings de producto
8. No hay `aggregateRating` (necesitamos Trustpilot embed o similar)

## Quick wins (Fase 2)
- Añadir JSON-LD `AggregateRating` cuando tengamos reviews
- `BreadcrumbList` en todas las páginas que no son home
- `FAQPage` en home, pricing, productos
- `Organization.award` con los dos premios (Alhambra + CeutaTech)
- `sameAs` con LinkedIn, Twitter de la empresa
