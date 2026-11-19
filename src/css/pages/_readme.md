# CSS propio de página

Un archivo por página o familia de páginas: `src/css/pages/<slug>.css`
(`precios.css`, `producto-genai.css`, `blog.css`, `guias.css`…).

- El build (`node scripts/build-assets.mjs`) concatena **todos** los `.css` de esta carpeta, en orden
  alfabético, dentro de `@layer pages`. Esa capa va después de la del sistema, así que una regla de
  página gana siempre a una del sistema sin `!important` ni selectores largos.
- **Prefijo obligatorio**: todas las clases de un archivo empiezan por `p-<slug>-`
  (`.p-precios-nota`, `.p-genai-maqueta`). Nunca se redefine una clase `tc-*` a secas: se le añade
  una clase propia (`<div class="tc-leaf p-precios-plan">`) o se limita con el `body`
  (`.p-precios .tc-plan { … }`, con `<body class="tc-body p-precios">`).
- Solo tokens del sistema (`var(--navy)`, `var(--r-lg)`, `var(--e-out)`, `var(--d-3)`…); ni colores
  ni radios ni duraciones nuevos. Si falta algo que servirá a más páginas, va al sistema, no aquí.
- Animar solo `transform`, `opacity` y `filter`. Todo estado oculto cuelga de `.motion`
  (`.motion .p-x-cosa { opacity: 0 }`) para que sin JS o con movimiento reducido se vea.
- Nada de `@import`, ni reglas sobre `html`, `body`, `main`, `.tc-nav`, `.tc-foot`.
- Un archivo con llaves desparejadas se excluye del bundle y el build avisa.

La guía completa está en `docs/design-system-2026.md`.
