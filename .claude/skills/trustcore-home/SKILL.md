---
name: trustcore-home
description: "Rediseño por fases de la home de trustcore.es: de once bloques apilados con el mismo peso visual a un recorrido comercial jerarquizado (hero con producto → confianza → problema → plataforma por pestañas → beneficios → vídeo → caso real → precios resumidos → FAQ plegable → CTA). Incluye el brief del fundador, el sistema visual, las reglas de copy y promesas legales, y el flujo de build/verificación/despliegue del repo. Úsala para cualquier trabajo sobre la portada, la navegación, la jerarquía visual o el tono comercial de TrustCore."
---

# Rediseño de la home de TrustCore

## Qué problema resuelve

La home no tiene un problema de contenido, tiene un problema de jerarquía.
Presenta **once momentos conceptuales** con casi el mismo peso visual, y cada
cambio de fondo anuncia "otra sección más" en lugar de continuar una historia.
El visitante entiende que TrustCore hace muchas cosas, pero tarda demasiado en
saber cuál es el beneficio principal y qué debería hacer ahora.

El objetivo no es que lea durante un minuto. Es que durante ese minuto **avance
hacia una decisión**:

> Entiendo qué es → lo veo → reconozco mi problema → compruebo que lo resuelve
> → confío → conozco el precio → pido una demo.

## Antes de tocar nada

Leer, en este orden:

1. **`references/brief.md`** — la valoración del fundador. **Es la
   especificación.** Está en sus palabras a propósito. Ante cualquier duda de
   criterio, manda este documento.
2. **`references/visual-system.md`** — cómo se traduce el brief a los tokens y
   clases que ya existen en el repo.
3. **`references/copy-rules.md`** — promesas prohibidas, disciplina de CTAs,
   presupuesto de vocabulario, coherencia de precios.
4. **`references/workflow.md`** — build, verificación, despliegue y las siete
   trampas conocidas del repositorio.

## Principios que no se negocian

1. **Editar, no añadir.** Cada fase debería dejar la home más corta. Si una
   fase la alarga, hay que justificarlo.
2. **El protagonista es el software.** Capturas reales, grandes y superpuestas.
   Nada de fotos de archivo ni ilustraciones abstractas.
3. **Una base clara continua.** Solo dos superficies oscuras en toda la página:
   hero y CTA final.
4. **El verde solo confirma.** Nunca es fondo de sección; es "factura
   validada", "jornada registrada".
5. **Dos CTAs en toda la página:** "Ver demo" y "Explorar la plataforma".
6. **Ninguna promesa absoluta.** Ver la tabla de sustitución en `copy-rules.md`.
   Esto es riesgo legal, no preferencia de estilo.
7. **El contenido de AEO no se borra, se pliega.** Las respuestas siguen en el
   DOM dentro de acordeones.
8. **Mirar las capturas.** El peor bug de este repo (titulares invisibles) pasó
   todas las aserciones automáticas y solo se vio en una imagen.

---

## Fases

Cada fase es un commit. Cada fase se verifica con capturas a **1440 / 768 /
375** antes de pasar a la siguiente. Se puede desplegar al final de cada fase o
acumular varias — pero nunca desplegar sin haber mirado las imágenes.

### Fase 0 · Inventario y línea base

No cambia nada todavía. Deja el material para medir si el rediseño funciona.

- Capturar la home actual completa a los tres anchos y guardarla como
  referencia "antes".
- Anotar: altura total en px, número de secciones, número de etiquetas de CTA
  distintas, conteo de "cumplimiento"/"VeriFactu"/"Inspección"/"legal".
- Listar qué activos reales existen ya: capturas de dashboard en
  `site/assets/`, vídeos en S3 (`/videos/aprende/...`), logos de cliente,
  testimonios atribuibles.

**Gate:** existe la tabla de métricas "antes". Sin ella no se puede demostrar
la mejora.

> **Bloqueante para las fases 3, 5 y 6:** hacen falta activos que quizá no
> existan — captura del dashboard en alta resolución, vídeo de producto de
> 20–30s, permiso de uso de logos de cliente, y un caso real con cifras. Si
> faltan, **preguntar a Rami en la fase 0**, no al llegar a la fase. Nunca
> inventar cifras, testimonios ni logos.

### Fase 1 · Base visual continua

La que más impacto tiene y la que menos riesgo trae, porque es casi todo CSS.

- Unificar superficies: toda la página sobre `--tc-surface-alt`, tarjetas en
  blanco. Eliminar la alternancia `bg-white` / `bg-slate-50` (son el mismo
  color y solo generan costuras).
- Dejar exactamente dos bloques oscuros: hero y CTA final, ambos con
  `.tc-blend`.
- Retirar cualquier fondo verde o celeste de sección.
- Revisar que la escala tipográfica y `.tc-section-head` se aplican en todas las
  secciones que sobrevivan.

**Gate:** la home tiene ≤2 superficies oscuras y ninguna sección verde. Sin
regresiones de contraste.

### Fase 2 · Navegación

- Reducir a: **Producto · Soluciones · Precios · Recursos · Entrar** + botón
  "Ver demo".
- "Producto" agrupa Facturación, Control horario, Trusty y próximos módulos.
- "Recursos" agrupa Blog, Aprende y preguntas legales.
- Aplicar el mismo header a **todas** las páginas, no solo a la home.

**Gate:** ninguna página queda huérfana (sin enlace desde la navegación) sin
que sea una decisión consciente. Comprobar que no quedan enlaces rotos.

### Fase 3 · Hero con producto

- Nuevo mensaje (propuesta del brief): "Gestiona tu empresa desde un solo
  lugar" + subtítulo. La amenaza (Hacienda, Inspección) deja de ir por delante
  de la solución.
- Dos botones: "Ver TrustCore en acción" y "Explorar la plataforma".
- Línea de apoyo: `Desde 19,99 €/mes · Sin permanencia · Configuración guiada`.
- Composición: mensaje a la izquierda, **captura real grande del dashboard** a
  la derecha, con tres tarjetas flotantes de datos reales encima.
- Retirar del hero los indicadores sueltos ("0 sanciones", "247 facturas") que
  no construyen una demostración coherente.

**Gate:** en la primera pantalla se ve producto real. El titular ocupa como
mucho dos líneas a 1440px.

### Fase 4 · Confianza inmediata (franja, no sección)

- Franja discreta bajo el hero: "Empresas que ya gestionan su día a día con
  TrustCore" + logos (solo con permiso).
- Una línea pequeña con los premios. **No** una sección entera.
- Aquí muere la barra de métricas actual: las cifras sin referencia clara se
  retiran (ver `copy-rules.md` §1).

**Gate:** los premios ocupan una línea, no un bloque.

### Fase 5 · Problema → transformación

- Sección clara, sin color propio.
- "Antes" (Excel dispersos, datos duplicados, errores de IVA/IPSI) frente a
  "Con TrustCore" (una cuenta, datos conectados, evidencias organizadas).
- **No dos listas estáticas.** Representarlo como transformación visual:
  documentos dispersos que acaban dentro de un dashboard central.

**Gate:** se entiende sin leer las listas completas.

### Fase 6 · Plataforma por pestañas — el núcleo

La fase con más carga técnica y la que más reduce la página: **fusiona las dos
secciones actuales** (los seis módulos del bento + el teatro de dos productos)
en un solo bloque.

- Pestañas: Facturación · Equipo · Trusty · Información.
- Al cambiar de pestaña cambian captura y texto.
- Accesibilidad obligatoria: `role="tablist"`, `role="tab"`, `aria-selected`,
  `aria-controls`, navegación con flechas, foco visible.
- Sin JS debe verse la primera pestaña (no dejar contenido inaccesible).

**Gate:** navegable solo con teclado. Las cuatro pestañas cargan captura real.

### Fase 7 · Beneficios, vídeo, caso real y precios

Cuatro secciones cortas que sustituyen a seis largas.

- **Tres beneficios** (no un inventario de funciones): cumple sin perseguir
  papeles / controla el negocio / empieza pequeño y amplía.
- **Vídeo de producto** de 20–30s, silenciado, en bucle, con `poster`.
  CTA: "Quiero verlo con los datos de mi empresa".
- **Un caso real** (mejor uno bueno que seis nombres): logo, sector, tamaño,
  problema, resultado, producto. Solo si es verificable.
- **Precios resumidos**: tres rutas + "Comparar todos los planes". **No** otra
  tabla completa: ya existe `/precios`.

**Gate:** los importes coinciden con `/precios` (comprobar con el `grep` de
`copy-rules.md` §5).

### Fase 8 · FAQ plegable y cierre

- Cinco preguntas en acordeones, con 2–3 líneas visibles cada una.
- El contenido largo y las fuentes legales **siguen en el DOM** (AEO) o se
  enlazan a guía especializada. Mantener el `FAQPage` JSON-LD.
- CTA final sobre azul marino: "Tu empresa puede estar funcionando con
  TrustCore esta misma semana" + demo/WhatsApp + la nota humana sobre Rami.

**Gate final de todo el rediseño:**

- [ ] Altura de la home reducida de forma medible frente a la fase 0.
- [ ] ≤3 etiquetas de CTA distintas en toda la página.
- [ ] Ninguna promesa de la tabla prohibida.
- [ ] Presupuesto de vocabulario respetado.
- [ ] Contraste, foco y área táctil correctos.
- [ ] JSON-LD válido (FAQPage, Organization, SoftwareApplication).
- [ ] Sin scroll horizontal a 375px.
- [ ] Capturas revisadas a mano a los tres anchos.
- [ ] Precios coherentes con `/precios`.

---

## Cómo trabajar con Rami

- **Enseñar, no describir.** Al cerrar cada fase, mostrar la captura del antes
  y el después. El feedback más útil que ha dado ha venido siempre de mirar una
  imagen.
- **Preguntar por los activos pronto** (fase 0), no cuando bloqueen.
- **Nunca inventar** cifras, testimonios, logos ni casos de cliente.
- **Decir lo que se ha dejado fuera.** Si una fase se entrega parcial, decirlo
  explícitamente en vez de dejarlo pasar.
- El `git push` lo hace él: desde este entorno no hay clave SSH.
