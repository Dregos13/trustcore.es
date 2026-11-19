# Rediseño 2026 de trustcore.es — brief común

Repositorio: `/Users/dregos/Documents/Webs/trustcore.es` (rama `rediseno-2026`).
Sitio estático: HTML en `site/`, CSS/JS empaquetados con `node scripts/build-assets.mjs`.
**No hacer `git commit`, `git push` ni desplegar nada.** Un push a `main` publica en producción.

## Qué pide el fundador (Rami), con sus palabras resumidas

- Rediseño **completo** de imagen. De lo actual solo valen **los colores**. El CSS actual "no vale nada":
  le parece **muy cuadriculado**, hecho por una IA sin gusto.
- Debe provocar un "wow, esta empresa sabe usar la IA y la usa para mejorar la vida de las personas;
  en la web ya se nota". Boquiabierto.
- **Muchas animaciones**, bonitas, tecnológicas y **limpias**. Transiciones fluidas, cambios entre
  páginas/pestañas que impresionen.
- Es una web que **vende productos**: tiene que verse profesional y bien diseñada.
- Mostrar bien los productos: **TrustInFacts** y **TrustInTime** (los de siempre), **GenAI**
  ("nuestro mejor producto actualmente"), y además **Orquesta**, **Corrector Fiscal** y **Nido**.
  Nido (y las apps de escritorio) con **enlace de descarga**.

## Marca: lo único que se conserva

| Token | Valor |
|---|---|
| Navy | `#040F3F` |
| Navy profundo | `#020A2A` |
| Azul corporativo | `#0B2572` |
| Azul royal | `#2071D5` |
| Cian | `#53CDFE` |
| Cian suave | `#B3E8FF` |
| Oro (premios, acento escaso) | `#D4A23D` |
| Verde "validado" (solo confirma, nunca fondo de sección) | `#0FA06F` |

Logos en `site/assets/`: `trustcore-logo-white.png`, `trustcore.png`, `trustcore-icon.png`,
`trustcore-icon-white.png`, `trustcore-mark-512.png`, `trustinfacts-logo.png`,
`optimized-trustintime-logo.webp`. Capturas reales: `trustinfacts-dashboard-*.webp`,
`trustintime-dashboard-*.webp`, `trustintime-ausencias-*.webp`. Los logos no se redibujan.

## Productos (solo hechos verificables; lee el README antes de escribir copy)

| Producto | Qué es | Fuente de verdad |
|---|---|---|
| **TrustInFacts** | Facturación VeriFactu, IVA/IPSI (Ceuta y Melilla), presupuestos, stock, gastos, informes | `site/productos/trustinfacts.html` |
| **TrustInTime** | Control horario, fichaje, ausencias, evidencias exportables | `site/productos/trustintime.html` |
| **GenAI** | Genera y publica contenido para redes sociales a partir del material de una marca: investiga la marca, define guía visual, planifica campañas, genera textos, imágenes y vídeo, revisión humana, programación y publicación automática en Instagram, Facebook, TikTok, LinkedIn y X. Conector MCP para Claude. Nada se publica sin aprobación de una persona. | `/Users/dregos/Documents/Apps/GenAI/README.md`, `docs/` |
| **Orquesta** | App de escritorio (macOS y Windows) para dirigir un equipo de IAs (Claude, Codex, Antigravity, Copilot, Devin, Meta…): eliges quién orquesta, diseña, programa, prueba y revisa, lanzas una misión y un grafo muestra en vivo quién hace qué. Modo "Tengo una idea" para quien no programa. | `/Users/dregos/Documents/Orquesta/orquesta/README.md` |
| **Corrector Fiscal** | App de escritorio para revisar y corregir modelos tributarios de la AEAT con IA. Un modelo = una skill. Modelo 303 listo. | `/Users/dregos/Documents/Apps/CorrectorFiscal/README.md`, `docs/` |
| **Nido** | Buscador y cuaderno privado de vivienda. Busca a la vez en Idealista, Fotocasa, Habitaclia, pisos.com, Milanuncios, yaencontre y Green-Acres; une duplicados, detecta chollos, bajadas y trampas; visitas, hipoteca, comparador. Todo local, sin cuentas ni servidor. macOS y Windows. | `/Users/dregos/Documents/Apps/Nido/README.md`, capturas en `docs/screens/` |

El nombre del producto de redes es **GenAI** (Rami lo dicta como "Genaya").

## Reglas de contenido que no se negocian

1. **Nunca inventar** cifras, clientes, testimonios, logos, precios ni plataformas. Lo que falte se
   marca como provisional y se lista al final.
2. **Sin promesas absolutas** (riesgo legal): ver `.claude/skills/trustcore-home/references/copy-rules.md`.
   "Preparado para los requisitos de VeriFactu", nunca "100 % cumplimiento".
3. CTA principal de venta: **"Agendar demo"** (abre el calendario, atributo `data-calendar-open`).
   Nunca "Ver demo". "Contratar" solo si enlaza a Stripe (los enlaces existentes se conservan tal cual).
4. Español de España, tono llano, factual y cercano. Sin "revolucionario", "líder", "disruptivo".
5. **SEO/AEO se conserva**: `<title>`, meta description, canonical, Open Graph, JSON-LD, textos de las
   respuestas (FAQ) y URLs no cambian. El contenido largo puede plegarse, no borrarse.
6. Sin emojis como iconos. Iconos SVG en línea, trazo consistente.
7. Accesibilidad: contraste AA, foco visible, navegación por teclado, `prefers-reduced-motion`
   respetado (todo el contenido visible sin animación), sin scroll horizontal a 375 px.
8. Rendimiento: sin frameworks pesados. Vanilla JS, animar solo `transform`/`opacity`/`filter`,
   pausar bucles fuera de pantalla, imágenes con `width`/`height` y `loading="lazy"` bajo el pliegue.
