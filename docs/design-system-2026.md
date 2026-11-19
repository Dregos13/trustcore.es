# Sistema de diseño 2026 · «Flujo»

Guía para rehacer cualquier página de trustcore.es con el sistema nuevo. Sustituye a
`docs/design-system.md` (sistema antiguo, con Tailwind: ya no existe).

- **Referencia viva (interior):** `site/_plantilla.html` → <http://127.0.0.1:8473/_plantilla>. Todos los
  componentes con su marcado real. Copia de ahí.
- **Referencia viva (portada):** `site/_plantilla-portada.html` → `/_plantilla-portada`. Hero con la
  corriente, manifiesto, cifras y escenario fijado.
- **Reglas de marca y de contenido:** `docs/rediseno-2026-brief.md` (no se repiten aquí; se cumplen).
- **Concepto:** `proto/flujo/NOTAS.md`. La página empieza en navy y amanece hasta el blanco; un hilo de
  luz la recorre entera; titulares cinéticos; tarjetas con una esquina «hoja»; nada de rejilla de cajas.

---

## 1. Mapa de archivos

| Qué | Dónde | Quién lo toca |
|---|---|---|
| Tokens, base, estructura, componentes, movimiento, cromo | `src/css/00…06-*.css` | solo el sistema |
| CSS propio de una página | `src/css/pages/<slug>.css` | quien rehace esa página |
| Motor JS (módulos) | `src/js/*.js` + entrada `site/assets/js/components.js` | solo el sistema |
| Consentimiento y formulario | `site/assets/js/consent.js`, `contact-form.js` | solo el sistema |
| Iconos | `scripts/icons.mjs` | solo el sistema (pide el que falte) |
| Navegación y pie | `scripts/nav.mjs`, `scripts/footer.mjs` | solo el sistema |
| Build | `scripts/build-assets.mjs` | solo el sistema |
| Comprobaciones | `scripts/dev/check-page.mjs` (SEO, FAQ, clases, copy) · `scripts/dev/check-overflow.mjs` (cortes laterales) | se ejecutan, no se editan |
| Páginas | `site/**/*.html` | cada cual, la suya |

Para no pisarse trabajando en paralelo: **cada agente edita solo su HTML y su
`src/css/pages/<slug>.css`**. Si un componente del sistema no alcanza, se resuelve con CSS de página;
si de verdad falta algo general, se anota como pendiente en vez de editar `src/css/0*.css`.

## 2. Flujo de trabajo

1. Escribe la página partiendo del esqueleto (§3). Conserva de la página antigua **todo el `<head>` SEO**
   (title, description, canonical, hreflang, Open Graph, JSON-LD), las URL, los `data-track`, los enlaces
   de Stripe y el texto de las respuestas (FAQ). El contenido largo se pliega en acordeones, no se borra.
2. Si necesitas estilos propios, crea `src/css/pages/<slug>.css` (§10).
3. Coloca los marcadores y genera navegación y pie:
   ```bash
   cd /Users/dregos/Documents/Webs/trustcore.es
   node scripts/nav.mjs && node scripts/footer.mjs      # idempotentes
   ```
4. Compila:
   ```bash
   node scripts/build-assets.mjs
   ```
   Empaqueta el CSS (sistema + **todos** los `pages/*.css`) y el JS, les pone hash y reescribe en todas
   las páginas el `<link>`, las precargas de fuentes, el script de arranque y los `<script src>`.
   Es seguro compilar varias veces y a la vez que otros: los bundles de los últimos 30 minutos no se
   borran. Si tu CSS de página tiene llaves desparejadas, el build lo **excluye y avisa**: léelo.
   Antes de publicar: `node scripts/build-assets.mjs --clean`.
   - En tu HTML basta `<link rel="stylesheet" href="/assets/css/site.00000000.min.css">` y
     `<script src="/assets/js/components.js" defer>`: el build pone los nombres reales.
   - Otro agente puede recompilar mientras editas: el build solo cambia esas líneas del `<head>` y los
     `<script src>`. Si tu editor avisa de que el archivo cambió, vuelve a leerlo y sigue; no reescribas
     el archivo entero con una copia vieja.
5. Captura y mira (servidor local ya en marcha en `http://127.0.0.1:8473`, raíz = `site/`, URL limpias):
   ```bash
   cd <scratchpad> && . ./env.sh
   node shoot.mjs http://127.0.0.1:8473/<url> shots/<prefijo> 1440 900     # 14 capturas repartidas
   node shoot2.mjs http://127.0.0.1:8473/<url> shots/<prefijo> 375 812 6 0.8   # TODA la página en hojas de contacto
   node nojs.mjs  http://127.0.0.1:8473/<url> shots/<prefijo>-nojs.jpg     # sin JavaScript
   ```
   (`shoot2.mjs` y `nojs.mjs` están también en `scripts/dev/shoot-all.mjs` y `scripts/dev/shoot-nojs.mjs`.
   `shoot2` acepta un 7.º argumento `reduce` para probar `prefers-reduced-motion`; devuelve
   `overflowX`, errores de consola y `hiddenReveals`, que debe ser 0 al llegar al final.)
   Comprueba siempre 1440, 768 y 375.
   - Guarda tus capturas con un prefijo propio (`shots/<slug>/…`): la carpeta es compartida y el disco no
     distingue mayúsculas (`H1440-00.jpg` pisa a `h1440-00.jpg`).
   - **`overflowX` da siempre 0 y no prueba nada**: `html` y `body` llevan `overflow-x: clip`, así que lo
     que se sale queda recortado en vez de desplazar. Un botón cortado por la derecha solo lo ves en la
     captura… o con el paso 6.
6. Pasa las dos comprobaciones automáticas y deja ambas limpias:
   ```bash
   node scripts/dev/check-page.mjs site/<pagina>.html          # SEO intacto, FAQ = JSON-LD, clases e iconos que no existen, copy, precios
   cd <scratchpad> && . ./env.sh && node check-overflow.mjs http://127.0.0.1:8473/<url> 1440,1024,768,375,320   # texto y controles cortados
   ```
   `check-page` compara el `<head>` con la versión publicada (`git show HEAD:site/<pagina>.html`): si
   cambió el `<title>`, la descripción, Open Graph, Twitter o el JSON-LD, falla. No se «mejoran»: se
   restauran. También falla con una clase `tc-…` que no existe (errata) o un icono `#i-…` inventado.

### Páginas nuevas (no existían en producción)

- **Rutas.** Producción sirve `/x` desde `site/x.html` y `/x/` desde `site/x/index.html` (función de
  CloudFront en `infra/main.tf`). La navegación y el pie ya enlazan estas, con este archivo exacto:

  | URL | Archivo |
  |---|---|
  | `/productos` | `site/productos.html` (**no** `site/productos/index.html`) |
  | `/productos/genai` · `/orquesta` · `/corrector-fiscal` · `/nido` | `site/productos/<slug>.html` |
  | `/productos/trustinfacts` · `/trustintime` | ya existen: se rehacen en su sitio |

  Mientras una de esas páginas no exista, su enlace da 404: es lo esperado hasta que se cree.
- **`<head>`.** No hay nada que conservar, así que se escribe entero: `<title>` (≤ 60 caracteres, con el
  nombre del producto y «TrustCore»), `description` (≤ 155), `canonical` absoluto con `www`
  (`https://www.trustcore.es/productos/genai`, sin `.html` ni barra final), Open Graph (`og:type`,
  `og:url`, `og:title`, `og:description`, `og:image` = `https://www.trustcore.es/assets/og-image-1200x630.jpg`,
  `og:locale` `es_ES`, `og:site_name`), `twitter:card` `summary_large_image` y JSON-LD
  (`SoftwareApplication` + `BreadcrumbList`) **solo con hechos verificables**: sin `aggregateRating`, sin
  reseñas, y sin `offers` si el producto no tiene precio público. Copia la forma de
  `site/productos/trustinfacts.html`.
- **`sitemap.xml`, `llms.txt`, `robots.txt`: no los edites** (los tocaría todo el mundo a la vez). Anota la
  URL nueva en tu informe y se añaden al integrar.
- **Imágenes de producto**: `site/assets/products/` (iconos de GenAI, Orquesta y Nido; capturas reales de
  Nido en claro, oscuro y móvil). TrustInFacts y TrustInTime: `site/assets/trustinfacts-dashboard-*.webp`,
  `trustintime-dashboard-*.webp`, `trustintime-ausencias-*.webp`. GenAI, Orquesta y Corrector Fiscal no
  tienen capturas: se ilustran con maquetas HTML (§7, «Ventana de maqueta»), nunca con una captura falsa.

## 3. Esqueleto de una página interior

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <!-- ↓ SE CONSERVA TAL CUAL de la página antigua: title, description, robots, canonical, hreflang,
         Open Graph y todos los <script type="application/ld+json"> -->
  <title>…</title>
  <meta name="description" content="…">
  <link rel="canonical" href="https://www.trustcore.es/…">
  <meta name="theme-color" content="#020A2A">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon-180.png">
  <!-- ↓ el build sustituye esta línea por: precarga de fuentes + bundle con hash + script de arranque -->
  <link rel="stylesheet" href="/assets/css/site.00000000.min.css">
</head>
<body class="tc-body p-<slug>">
<!--NAV--><!--/NAV-->

<main id="main-content">

  <!-- 1 · Hero interior: oscuro y corto -->
  <section class="tc-sec tc-sec--night tc-phero tone-dark" aria-labelledby="hero-t">
    <div class="tc-sec__in tc-phero__in" data-intro>
      <div class="tc-glow tc-glow--a" aria-hidden="true"></div>
      <div class="tc-glow tc-glow--b" aria-hidden="true"></div>
      <div class="tc-wrap tc-phero__top">
        <div class="tc-phero__copy">
          <nav class="tc-mono tc-crumbs" aria-label="Migas de pan" data-reveal="rise" style="--delay:80ms">
            <ol><li><a href="/">Inicio</a></li><li><span aria-current="page">Precios</span></li></ol>
          </nav>
          <h1 class="tc-display tc-phero__title" id="hero-t" data-reveal="words" style="--delay:140ms">Titular con <span class="tc-hl">énfasis.</span></h1>
        </div>
        <div class="tc-phero__side">
          <p class="tc-lead" data-reveal="focus" style="--delay:520ms">Entradilla.</p>
          <div class="tc-cta-row" data-stagger style="--base:720ms;--step:110ms">
            <button class="tc-btn tc-btn--primary" type="button" data-calendar-open data-magnet data-track="<slug>_hero_demo" data-reveal="pop">
              <span class="tc-btn__label">Agendar demo <svg class="tc-ico tc-ico--go" aria-hidden="true"><use href="#i-arrow"/></svg></span></button>
          </div>
        </div>
      </div>
      <!-- opcional: maqueta o captura bajo el texto
      <div class="tc-wrap tc-phero__stage"><div class="tc-phero__shot" data-rise><figure class="tc-win">…</figure></div></div> -->
    </div>
  </section>

  <!-- 2 · Puente de olas: de oscuro a claro -->
  <div class="tc-sec tc-wave" aria-hidden="true"><i data-plx></i><i data-plx></i><i data-plx></i></div>

  <!-- 3 · Secciones claras, encadenadas (mist → paper → white → day …) -->
  <section class="tc-sec tc-sec--mist tone-light" aria-labelledby="s1">
    <div class="tc-sec__in tc-pad tc-pad--top-0">       <!-- top-0 solo en la primera tras la ola -->
      <div class="tc-wrap tc-wrap--spine">
        <header class="tc-head">
          <p class="tc-mono tc-mono--hi" data-reveal="rise">Etiqueta</p>
          <h2 class="tc-display tc-h2" id="s1" data-reveal="words">Titular de sección.</h2>
          <p class="tc-lead" data-reveal="focus" style="--delay:160ms">Entradilla.</p>
        </header>
        <!-- contenido -->
      </div>
    </div>
  </section>

  <section class="tc-sec tc-sec--paper tone-light" aria-labelledby="s2">
    <div class="tc-sec__in tc-pad"> <div class="tc-wrap"> … </div> </div>
  </section>

  <section class="tc-sec tc-sec--day tone-light" aria-labelledby="s3">   <!-- la última acaba en mist -->
    <div class="tc-sec__in tc-pad"> <div class="tc-wrap"> … </div> </div>
  </section>

  <!-- 4 · CTA final: la cúpula navy donde desemboca el hilo -->
  <section class="tc-pool" id="contacto" data-live aria-labelledby="cta-t">
    <div class="tc-pool__in tone-dark">
      <div class="tc-pool__rings" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="tc-wrap tc-pool__copy">
        <p class="tc-mono tc-mono--hi" data-reveal="rise">Etiqueta</p>
        <h2 class="tc-display tc-pool__title" id="cta-t" data-reveal="words">Titular del cierre.</h2>
        <p class="tc-lead" data-reveal="focus" style="--delay:200ms">Qué pasa en la demo.</p>
        <button class="tc-btn tc-btn--primary tc-btn--xl" type="button" data-calendar-open data-magnet data-track="<slug>_cta_demo" data-reveal="pop" style="--delay:320ms">
          <span class="tc-btn__label">Agendar demo <svg class="tc-ico tc-ico--go" aria-hidden="true"><use href="#i-arrow"/></svg></span></button>
        <div class="tc-pool__contact" data-reveal="rise" style="--delay:420ms">
          <a href="tel:+34666609299" data-track="<slug>_cta_tel"><svg class="tc-ico" aria-hidden="true"><use href="#i-phone"/></svg> <span class="tc-num">666 60 92 99</span></a>
          <a href="mailto:info@trustcore.es" data-track="<slug>_cta_mail"><svg class="tc-ico" aria-hidden="true"><use href="#i-mail"/></svg> info@trustcore.es</a>
        </div>
        <p class="tc-mono" data-reveal="rise" style="--delay:480ms">Respuesta en menos de 1 h en horario laboral</p>
      </div>
    </div>
  </section>
</main>

<!--FOOTER--><!--/FOOTER-->

<script src="/assets/js/consent.js" defer></script>
<!-- solo en /contacto: <script src="/assets/js/contact-form.js" defer></script> -->
<script src="/assets/js/components.js" defer></script>
</body>
</html>
```

Imprescindible: `<body class="tc-body">`, `<main id="main-content">`, los marcadores `<!--NAV-->` y
`<!--FOOTER-->`, y los dos scripts con `defer`. El motor añade solo el lienzo del hilo, el diálogo de
agenda, el asistente TrusTy y el banner de cookies: no se escriben en la página.

Lo que **no** va en la página: iconos `<symbol>` (los inyecta `nav.mjs`), cabecera, pie, script de
arranque, `<canvas>` del hilo, `<dialog>` de agenda.

**Cromo fijo que convive con tu página** (no lo tapes ni dependas de él):

- La píldora de navegación flota arriba (64 px + 14 px de margen) y se esconde al bajar. Los héroes ya
  reservan su hueco (`padding-top: calc(var(--nav-h) + …)`); las anclas, también (`scroll-padding-top`).
- En la primera visita el banner de cookies ocupa la **esquina inferior derecha** (400 × ~205 px en
  escritorio; todo el ancho en móvil). No pongas ahí el único CTA de la primera pantalla.
- La burbuja de TrusTy vive en esa misma esquina: no aparece mientras el banner está abierto y, pasada
  media pantalla de scroll, se queda en un círculo de 52 px.
- Las capturas de `shoot2`/`check-overflow` aceptan las cookies por ti; `shoot.mjs` no (verás el banner).

## 4. Fondo y tono

### Secciones

`<section class="tc-sec tc-sec--X tone-Y">` pinta un degradado vertical; dentro, **siempre** un
`<div class="tc-sec__in">` (queda por encima del hilo). Cada tramo empieza en el color en que acaba el
anterior: así no hay costuras. Nada de fondos planos alternos ni de líneas divisorias.

| Clase | De → a | Tono | Cuándo |
|---|---|---|---|
| `tc-sec--night` | `#020A2A` → `#040F3F` | `tone-dark` | hero |
| `tc-sec--deep` | `#040F3F` → `#08195B` | `tone-dark` | segundo tramo oscuro (manifiesto) |
| `tc-sec--dusk` | `#08195B` → `#1450AA` | `tone-dark tone-mid` | tercer tramo oscuro (escenario) |
| `tc-sec--navy-dusk` | `#040F3F` → `#1450AA` | `tone-dark tone-mid` | un único tramo oscuro largo tras el hero |
| `tc-wave` | navy → cielo → olas → `#EAF5FF` | — | el paso a claro (una vez por página) |
| `tc-sec--mist` | `#EAF5FF` → `#F5FAFF` | `tone-light` | primera clara |
| `tc-sec--paper` | `#F5FAFF` → `#FFFFFF` | `tone-light` | |
| `tc-sec--white` | `#FFFFFF` | `tone-light` | |
| `tc-sec--day` | `#FFFFFF` → `#EAF5FF` | `tone-light` | antes de volver a `--mist` o del CTA |
| `tc-sec--mist-flat` | `#EAF5FF` | `tone-light` | |
| `tc-sec--paper-mist`, `tc-sec--mist-mist` | con blanco en medio | `tone-light` | página de una sola sección clara |

Cadena habitual: `night` → `tc-wave` → `mist` → `paper` → `white` → `day` → (`mist` → `paper` → …) →
**la última acaba en mist** (`--day`, `--mist-flat`, `--paper-mist`…) → `tc-pool`.
Tras un tramo `--dusk` / `--navy-dusk` la ola es `tc-wave tc-wave--from-dusk` (`tc-wave--tall` en portada).
Otro degradado: `style="--bg-a:#…;--bg-b:#…"` (y `--bg-m` para un color intermedio).

Aire vertical: `tc-pad` en `.tc-sec__in` (`tc-pad--sm`, `tc-pad--lg`, `tc-pad--top-0`, `tc-pad--bottom-0`).

### Tono

`.tone-dark` / `.tone-light` definen `--fg`, `--fg-2`, `--fg-3`, `--accent`, `--accent-text`, `--line`,
`--surface`… y todos los componentes las leen. **Manda el ancestro más cercano.** Reglas:

- Toda sección declara su tono. Una pieza de tono contrario dentro (una «isla») declara el suyo:
  `<div class="tc-leaf tc-leaf--night tone-dark">` en una sección clara.
- Sobre `--dusk` / `--navy-dusk` añade `tone-mid` (sube el contraste de las etiquetas mono).
- No pongas colores a mano en el texto: usa `tc-muted`, `tc-mono`, `tc-mono--hi`, `tc-strong`, `tc-hl`.
- Verde (`--ok`) solo confirma (chips, checks). Oro solo para premios. Nunca fondo de sección.

## 5. Contenedores y composición

| Clase | Qué hace |
|---|---|
| `tc-wrap` | ancho máximo 1240 + márgenes laterales |
| `tc-wrap--spine` | sangría editorial de 72 px a la izquierda en escritorio (texto que arranca junto al hilo) |
| `tc-wrap--narrow` / `--mid` | 820 / 1040 px |
| `tc-head` (+ `--center`) | cabecera de sección: etiqueta + titular + entradilla; da aire a lo que sigue |
| `tc-split` (+ `--5-7`, `--7-5`, `--4-8`, `--8-4`, `--top`, `--end`, `--flip`, `--keep`) | dos columnas desiguales; una sola por debajo de 920 px |
| `tc-flowgrid` (`style="--min:300px"`, `--fill`, `--stretch`) | rejilla fluida: las piezas se reparten solas |
| `tc-stair` / `tc-zig` (junto a `tc-flowgrid`) | escalonan las piezas en escritorio: rompen la rejilla |
| `tc-stack` (`style="--gap:18px"`) | pila vertical |
| `tc-cluster` | fila que salta de línea (botones, chips) |
| `tc-rel` | `position: relative` |
| `tc-mt-1…6`, `tc-center`, `tc-measure`, `tc-nowrap`, `tc-hide-s/m/l` | utilidades (pocas, a propósito) |

Composición: asimétrica y con aire. Evita tres tarjetas iguales en fila sin más: usa `tc-stair`, cambia la
esquina hoja de cada una (`--br`, `--tr`, `--tl`), mezcla una isla oscura, o un `tc-split` 7/5.

## 6. Tipografía e iconos

| Clase | Uso |
|---|---|
| `tc-display` + `tc-h1` / `tc-h2` / `tc-h3` | titulares (Bricolage Grotesque). `tc-phero__title` y `tc-pool__title` traen su tamaño |
| `tc-h4` | titular de tarjeta |
| `tc-lead` | entradilla |
| `tc-mono` (+ `--hi`, `--plain`) | etiquetas, metadatos, estados (Martian Mono, mayúsculas) |
| `tc-eyebrow` | etiqueta con regla delante (junto a `tc-mono`) |
| `tc-num` | cifras, precios (mono, tabular) |
| `tc-hl` | palabra con énfasis en degradado. Nunca cursiva, nunca subrayado |
| `tc-muted`, `tc-small`, `tc-strong` | texto secundario / pequeño / destacado |
| `tc-link` (+ `--back`) | enlace de texto con flecha |

Un solo `<h1>` por página. Los titulares no llevan punto y coma ni dos frases largas: cortos.

**Iconos** (trazo 1.6, en línea): `<svg class="tc-ico" aria-hidden="true"><use href="#i-NOMBRE"/></svg>`.
Modificadores: `tc-ico--sm`, `--lg`, `--go` (se desliza en hover dentro de un botón), `--down`, `--dl`, `--flip`.
Disponibles: arrow · down · chev · external · check · close · plus · minus · dl · play · search · filter ·
refresh · swap · copy · link · spinner · alert · info · shield · lock · key · eye · star · award · trophy ·
target · bolt · invoice · clock · spark · graph · filecheck · home · phone · mail · send · cal · user ·
users · headset · bot · pin · globe · store · tool · briefcase · scale · euro · card · chart · box · tag ·
qr · doc · book · list · quote · video · image · megaphone · share · layers · cloud · cpu · code · desktop ·
mobile · apple · windows. Si falta uno, pídelo (se añade en `scripts/icons.mjs`); no uses emojis ni el
sprite antiguo `/assets/icons/sprite.svg`.
Caja de icono: `<span class="tc-glyph"><svg class="tc-ico">…</svg></span>` (`--soft`, `--sm`, `--lg`; admite `<img>`).

## 7. Componentes

Todos están en `/_plantilla` con este mismo marcado.

### Botones
```html
<button class="tc-btn tc-btn--primary" type="button" data-calendar-open data-magnet data-track="x_demo">
  <span class="tc-btn__label">Agendar demo <svg class="tc-ico tc-ico--go" aria-hidden="true"><use href="#i-arrow"/></svg></span></button>
<a class="tc-btn tc-btn--secondary" href="/precios"><span class="tc-btn__label">Ver precios</span></a>
<a class="tc-btn tc-btn--ghost" href="#mas"><span class="tc-btn__label">Saber más</span></a>
```
Tamaños `tc-btn--sm`, `tc-btn--xl` (solo el del CTA final), `tc-btn--block`. El texto va siempre dentro de
`tc-btn__label`. Un solo primario por bloque. CTA de venta: «Agendar demo» + `data-calendar-open`.

### Descarga (detecta el sistema)
```html
<div class="tc-dl">
  <a class="tc-btn tc-btn--primary" href="mailto:info@trustcore.es?subject=Instalador%20de%20Nido" data-download="nido" data-track="nido_dl">
    <span class="tc-btn__label"><svg class="tc-ico tc-ico--dl" aria-hidden="true"><use href="#i-dl"/></svg> <span data-download-label>Descargar Nido</span></span></a>
  <p class="tc-dl__note" data-download-note="nido">macOS y Windows</p>
</div>
```
`data-download="nido|orquesta|corrector"` elige la variante del visitante, reescribe la etiqueta
(«Descargar para macOS (Apple Silicon)») y rellena la nota con las demás. Con clave exacta
(`data-download="orquesta-win"`) el botón es fijo. Ver §12.

### Chips
```html
<span class="tc-chip">Neutro</span> <span class="tc-chip tc-chip--hi">Acento</span>
<span class="tc-chip tc-chip--ok"><span class="tc-chip__dot"></span> Aprobada</span>
<span class="tc-chip tc-chip--gold">Premio</span> <span class="tc-chip tc-chip--solid">Sólido</span>
<div class="tc-chips">…varios…</div>
```

### Listas
```html
<ul class="tc-ticks">   <!-- + tc-ticks--2col, tc-ticks--ok -->
  <li><svg class="tc-ico" aria-hidden="true"><use href="#i-check"/></svg> Incluido</li>
  <li class="is-off"><svg class="tc-ico" aria-hidden="true"><use href="#i-minus"/></svg> No incluido</li>
</ul>
<ul class="tc-facts"><li><svg class="tc-ico" aria-hidden="true"><use href="#i-lock"/></svg> Dato con icono</li></ul>
<ul class="tc-rows"><li><b>Término</b><span class="tc-muted">Definición.</span></li></ul>
```

### Tarjeta «hoja»
```html
<article class="tc-leaf tc-leaf--lift tc-spot" data-reveal="rise">
  <svg class="tc-ico tc-leaf__ico" aria-hidden="true"><use href="#i-layers"/></svg>
  <h3 class="tc-h4">Título</h3>
  <p class="tc-muted">Texto.</p>
</article>
```
- Esquina: por defecto abajo-izquierda · `tc-leaf--br` · `tc-leaf--tl` · `tc-leaf--tr`.
- Tamaño: `tc-leaf--sm` · (normal) · `tc-leaf--lg`.
- Superficie: clara (por defecto) · `tc-leaf--tint` · `tc-leaf--line` · `tc-leaf--glass` (sobre sección
  oscura) · `tc-leaf--night` + `tone-dark` (isla oscura en sección clara) · `tc-leaf--raised`.
- Interacción: `tc-leaf--lift` (sube en hover), `tc-spot` (foco de luz), `data-tilt="1.6"` (inclinación 3D).
- Toda la tarjeta como enlace: pon `tc-leaf__link` en el `<a>` interior.
- Partes: `tc-leaf__ico`, `tc-leaf__n` (numeral mono), `tc-leaf__foot`.

### Producto
Bloque grande (texto + maqueta): `tc-prod` (ver `_plantilla` y §13). Tarjeta compacta para índices:
```html
<li class="tc-leaf tc-leaf--lift tc-spot"><div class="tc-pcard">
  <div class="tc-pcard__top"><img src="/assets/trustinfacts-logo.png" alt="" width="247" height="257"><h3 class="tc-pcard__name">TrustInFacts</h3></div>
  <p class="tc-pcard__claim">Factura, cobra y aplica el impuesto correcto.</p>
  <div class="tc-chips"><span class="tc-chip">VeriFactu</span></div>
  <a class="tc-pcard__go tc-leaf__link" href="/productos/trustinfacts">Conocer TrustInFacts <svg class="tc-ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
</div></li>
```

### Ventana de maqueta
```html
<figure class="tc-win">                                   <!-- + tc-win--dark tone-dark · tc-win--flat -->
  <div class="tc-win__bar"><span class="tc-win__dots"><i></i><i></i><i></i></span><span class="tc-win__title">TrustInFacts · Informes</span></div>
  <img src="…-960.webp" srcset="…" sizes="…" width="1280" height="685" alt="Descripción real de la captura" loading="lazy">
</figure>
```
Navegador: cambia el título por `<span class="tc-win__url">app.trustcore.es/…</span>`. Maqueta HTML:
`<div class="tc-win__body tc-win__body--pad">…</div>` con `tc-mini` (filas de interfaz) o tu CSS de página.
Móvil: `<div class="tc-phone"><img …></div>`. Insignias sobre la maqueta (el padre con `position: relative`,
p. ej. `tc-prod__shot` o `tc-phero__shot`): `tc-float tc-float--a|--b` con `tc-float__check`,
`tc-float__pulse` o `<span class="tc-num">IPSI</span>`. Las maquetas HTML ilustran con términos reales
del producto y van con `aria-hidden="true"` si son decorativas; no son capturas, no lo aparentes.

### Pasos y líneas de tiempo
```html
<div class="tc-brick">                                    <!-- dos columnas en ladrillo en escritorio -->
  <header class="tc-brick__head">…etiqueta, h2, entradilla…</header>
  <ol class="tc-steps tc-steps--brick" role="list" data-flow-steps>
    <li class="tc-step tc-leaf" data-reveal="slide" style="--from:60px"><p class="tc-step__n" aria-hidden="true"></p>
      <h3 class="tc-step__t">Primer paso</h3><p class="tc-muted">Texto.</p></li>
    <li class="tc-step tc-leaf" data-reveal="slide" style="--from:-60px">…</li>
  </ol>
</div>
```
`tc-step__n` vacío se numera solo (01, 02…). Una columna: `<ol class="tc-steps" data-flow-steps>` sin
`tc-brick`. `data-flow-steps` pone un nodo del hilo en cada paso (hasta 8 pasos en ladrillo). Sobre sección
oscura, los pasos son `tc-step tc-leaf tc-leaf--glass`.
Con fechas: `<ol class="tc-timeline"><li><p class="tc-timeline__when">1 ene 2027</p><div class="tc-timeline__what"><b>Hito</b><p class="tc-muted">…</p></div></li></ol>`.

### Cifras
```html
<dl class="tc-stats" data-stagger>
  <div class="tc-stat" data-reveal="rise"><dt class="tc-mono">Qué mide</dt>
    <dd class="tc-stat__n"><span data-count="19.99" data-decimals="2">19,99</span><small>€</small></dd>
    <dd class="tc-stat__d">Explicación corta.</dd></div>
</dl>
```
El texto del `<span>` es el valor final (lo que se ve sin JS). `data-thousands` añade el punto de miles.
Solo cifras verificables.

### Pestañas
```html
<div class="tc-tabs" data-tabs>
  <div class="tc-tabs__list" role="tablist" aria-label="…">
    <button class="tc-tabs__tab" role="tab" type="button" id="tab-a" aria-controls="panel-a" aria-selected="true">Una</button>
    <button class="tc-tabs__tab" role="tab" type="button" id="tab-b" aria-controls="panel-b" aria-selected="false" tabindex="-1">Otra</button>
  </div>
  <div class="tc-tabs__panels">
    <div class="tc-tabs__panel" role="tabpanel" id="panel-a" aria-labelledby="tab-a">…</div>
    <div class="tc-tabs__panel" role="tabpanel" id="panel-b" aria-labelledby="tab-b" hidden>…</div>
  </div>
</div>
```
Los paneles comparten celda (no hay salto de altura). Los hijos directos del panel entran escalonados con
`style="--i:0"`, `--i:1`… Sin JS se ven todos. Evento `tabs:change` en el contenedor; `el.tcSelect(i)`.

### Acordeón (FAQ)
```html
<div class="tc-acc">
  <details class="tc-acc__item" name="faq">              <!-- mismo name = solo una abierta; open = abierta al cargar -->
    <summary class="tc-acc__q"><h3>¿Pregunta?</h3><span class="tc-acc__plus" aria-hidden="true"></span></summary>
    <div class="tc-acc__a"><p>Respuesta tal cual estaba publicada.</p></div>
  </details>
</div>
```
Es `<details>`: el texto está siempre en el DOM (AEO) y funciona sin JS. El texto debe coincidir con el
JSON-LD `FAQPage` de la página.

- Con movimiento, el motor quita el atributo `name` al arrancar y lleva el grupo él mismo
  (`data-acc-group`): así el hermano que se cierra también se anima. No dependas de `details[name]` en
  tu CSS o JS; usa `.tc-acc__item` y la clase `is-open`.
- Si la página publicada ya tenía preguntas visibles, se conservan todas con su texto. Si el JSON-LD y
  el FAQ visible no coincidían ya en producción (pasa en `/precios`), `check-page` lo marca como aviso:
  no reescribas ni uno ni otro; anótalo en tu informe.
- La respuesta admite `p`, `ul` y enlaces; el ancho de lectura está limitado a 74 caracteres.

### Tablas
```html
<div class="tc-table-wrap">
  <table class="tc-table tc-table--compare">             <!-- o sin modificador · o tc-table--stack -->
    <caption>Título</caption>
    <thead><tr><th scope="col">Función</th><th scope="col" class="is-us">TrustCore</th><th scope="col">Otro</th></tr></thead>
    <tbody><tr><th scope="row">Fila</th>
      <td class="is-us"><span class="tc-yes"><svg class="tc-ico" aria-hidden="true"><use href="#i-check"/></svg></span><span class="sr-only">Sí</span></td>
      <td><span class="tc-no"><svg class="tc-ico" aria-hidden="true"><use href="#i-close"/></svg></span><span class="sr-only">No</span></td></tr></tbody>
  </table>
</div>
```
Siempre dentro de `tc-table-wrap` (desplaza en horizontal si no cabe). `is-us` destaca una columna.
`tc-yes` / `tc-no` / `tc-part`. Cifras: `class="tc-num"`. `tc-table--stack` + `data-label="Cabecera"` en
cada `<td>` convierte cada fila en ficha por debajo de 640 px (para tablas de 3–4 columnas de texto).

### Precios
```html
<div class="tc-billing">
  <span id="lbl-monthly" class="tc-billing__label tc-billing__label--monthly">Mensual</span>
  <button id="billing-toggle" class="tc-switch" type="button" role="switch" aria-checked="false" aria-labelledby="billing-toggle-label"><span class="tc-switch__thumb" aria-hidden="true"></span></button>
  <span id="lbl-annual" class="tc-billing__label tc-billing__label--annual">Anual <span class="tc-chip tc-chip--ok">2 meses gratis</span></span>
  <span id="billing-toggle-label" class="sr-only">Cambiar entre facturación mensual y anual</span>
</div>
<div class="tc-plans">
  <article class="tc-plan tc-leaf">                      <!-- destacado: tc-plan--featured tc-leaf--night tone-dark -->
    <h3 class="tc-plan__name">Básico</h3><p class="tc-plan__desc">…</p>
    <p class="tc-plan__price"><span class="tc-plan__amount price-monthly">5,99 €</span><span class="tc-plan__amount price-annual" hidden>4,99 €</span><span class="tc-plan__period">/usuario/mes</span></p>
    <p class="tc-plan__note"><span class="savings-note" hidden>Facturado 59,90 €/año · 2 meses gratis</span></p>
    <ul class="tc-ticks">…</ul>
    <div class="tc-plan__cta">
      <a class="tc-btn tc-btn--secondary tc-btn--block cta-monthly" href="…" data-track="…"><span class="tc-btn__label">…</span></a>
      <a class="tc-btn tc-btn--secondary tc-btn--block cta-annual" href="…" data-track="…" hidden><span class="tc-btn__label">…</span></a>
    </div>
  </article>
</div>
```
El conmutador usa los mismos ganchos que la web antigua (`#billing-toggle`, `.price-monthly`,
`.price-annual`, `.savings-note`, `.cta-monthly`, `.cta-annual`): los anuales nacen con el atributo
`hidden` (no con la clase `hidden`). Etiqueta opcional: `<span class="tc-chip tc-chip--solid tc-plan__flag">Recomendado</span>`.
Los `href` de Stripe/contacto y los `data-track` existentes se conservan tal cual.

### Formulario
```html
<form class="tc-form" data-contact-form data-form-name="contacto">
  <input type="text" name="website" tabindex="-1" autocomplete="off" data-contact-hp aria-hidden="true">
  <div class="tc-form__grid">
    <div class="tc-field"><label for="c-name">Nombre <b aria-hidden="true">*</b></label><input class="tc-input" id="c-name" name="firstname" type="text" autocomplete="name" required></div>
    <div class="tc-field tc-field--full"><label for="c-msg">Qué necesitas</label><textarea class="tc-textarea" id="c-msg" name="message"></textarea></div>
    <label class="tc-check"><input type="checkbox" name="consent" required><span>Acepto… <a href="/privacidad">Privacidad</a>.</span></label>
    <div class="tc-form__actions"><button class="tc-btn tc-btn--primary" type="submit"><span class="tc-btn__label"><svg class="tc-ico" aria-hidden="true"><use href="#i-send"/></svg> Enviar consulta</span></button></div>
    <p class="tc-form__status" data-contact-status hidden></p>
  </div>
</form>
```
Nombres de campo que espera `contact-form.js`: `firstname`, `email`, `phone`, `company`, `message`,
`consent`, `website` (trampa). También `tc-select`, `tc-field__hint`, `tc-field__err`, `aria-invalid="true"`.
Va bien dentro de `tc-leaf tc-leaf--lg tc-leaf--tl tc-leaf--raised`.

### Prosa (blog, guías, legales)
```html
<div class="tc-article tc-article--toc">
  <nav class="tc-toc" aria-label="En este artículo" data-toc="#articulo"><p class="tc-mono">En este artículo</p></nav>
  <article class="tc-prose" id="articulo">
    <div class="tc-answer"><p class="tc-mono">Respuesta rápida</p><p>La contestación corta.</p></div>
    <h2 id="apartado">Apartado</h2><p>…</p><ul><li>…</li></ul><blockquote><p>…</p><cite>Fuente</cite></blockquote>
    <div class="tc-table-wrap"><table class="tc-table">…</table></div>
    <div class="tc-note tc-note--warn"><svg class="tc-ico" aria-hidden="true"><use href="#i-alert"/></svg><div><p><b>Aviso.</b> …</p></div></div>
    <ol class="tc-sources"><li><a href="https://www.boe.es/…" target="_blank" rel="noopener">BOE · …</a></li></ol>
  </article>
</div>
```
Dentro de `tc-prose`, `h2`, `h3`, `p`, `ul`, `ol`, `blockquote`, `figure`, `code`, `hr`, `a` se estilan
solos: **pega el HTML del artículo sin clases**. El índice se genera con los `<h2>` (les pone `id` si no
lo tienen; conserva los `id` existentes: hay anclas enlazadas) y marca la sección en lectura. Sin índice:
quita `tc-article--toc` y el `<nav>`. Legales: `tc-prose tc-prose--legal` en `tc-wrap--narrow`.
Notas: `tc-note` · `--warn` · `--ok`. Metadatos: `<p class="tc-mono tc-meta"><span>…</span><span>…</span></p>`.
Hero de artículo: `tc-phero tc-phero--short` con `tc-phero__top tc-phero__top--single` (una columna).

### Migas de pan
`<nav class="tc-mono tc-crumbs" aria-label="Migas de pan"><ol><li><a href="/">Inicio</a></li><li><span aria-current="page">Blog</span></li></ol></nav>`
(deben coincidir con el JSON-LD `BreadcrumbList`).

### Tarjetas de artículo y filtros
```html
<div class="tc-chips" data-filter-group="#posts" role="group" aria-label="Filtrar artículos">
  <button class="tc-chip" type="button" data-filter="all" aria-pressed="true">Todo</button>
  <button class="tc-chip" type="button" data-filter="ipsi" aria-pressed="false">IPSI</button>
</div>
<div class="tc-posts" id="posts">
  <article class="tc-post tc-leaf tc-leaf--lift" data-category="ipsi" data-reveal="rise">
    <span class="tc-chip">IPSI</span>
    <h3 class="tc-post__title"><a href="/…">Título</a></h3>
    <p class="tc-post__excerpt">Extracto.</p>
    <p class="tc-mono tc-post__meta"><span>2 nov 2026</span><span>4 min</span></p>
  </article>
</div>
```
Destacado a todo el ancho: `tc-post tc-post--feature tc-leaf tc-leaf--lg tc-leaf--tr tc-leaf--tint`
(dos hijos: bloque de texto y bloque de meta). `data-category` admite varias separadas por espacio.

### Vídeos (Aprende)
```html
<div class="tc-videos">
  <button type="button" class="tc-video" id="crear-cliente" data-video-title="Crear cliente"
          data-video-src="/videos/aprende/trustinfacts/crear-cliente.mp4" data-video-poster="/assets/posters/crear-cliente-960.jpg">
    <span class="tc-video__poster"><img src="/assets/posters/crear-cliente-960.jpg" alt="" width="960" height="516" loading="lazy">
      <span class="tc-video__play"><svg class="tc-ico" aria-hidden="true"><use href="#i-play"/></svg></span></span>
    <span class="tc-video__body"><span class="tc-video__title">Crear cliente</span><span class="tc-video__desc">Alta de datos…</span>
      <em class="tc-video__state" data-video-state>Comprobando vídeo</em></span>
  </button>
</div>
```
El motor comprueba si el MP4 existe (HEAD) y deja el botón «Disponible» o «Próximamente». En filas:
`tc-lessons` / `tc-lesson` (ver plantilla). Conserva los `id` (son las anclas del `embedUrl` del JSON-LD).
Ojo: `scripts/aprende-videos.mjs` regenera el JSON-LD leyendo el marcado antiguo; si cambias el marcado,
no lo ejecutes sin adaptarlo (el bloque JSON-LD ya generado se conserva).

### Cinta, logos, cita y premio
```html
<div class="tc-belt tc-belt--words" data-belt data-live><ul class="tc-belt__track"><li>Uno</li><li>Dos</li></ul></div>
<div class="tc-logos"><img src="/assets/logo-impulsa-startup.png" alt="Impulsa Startup" width="297" height="128" loading="lazy"></div>
<figure class="tc-quote"><p class="tc-mono tc-quote__award"><svg class="tc-ico" aria-hidden="true"><use href="#i-award"/></svg> Premio</p>
  <blockquote class="tc-quote__text">«Cita ya publicada.»</blockquote><figcaption><b>Nombre</b><span>Cargo · Empresa</span></figcaption></figure>
<p class="tc-award"><span class="tc-award__ico"><svg class="tc-ico" aria-hidden="true"><use href="#i-trophy"/></svg></span><span>Ganador del II Ceuta Tech Summit<small>2026</small></span></p>
```
La cinta escribe la lista una vez (el motor la duplica); con logos, `<li><img …></li>` sin `--words`.
`style="--belt-speed:60s"`. Los logos de terceros no se recolorean ni se recortan. Nunca clientes, citas
ni premios que la web no publicara ya.

`tc-logos`: cada logo es una baldosa blanca de **alto fijo** (96 px; `style="--logo-h:104px"` en el
contenedor lo cambia) y ancho proporcional. El alto es fijo a propósito: los logos cargan con
`loading="lazy"` y con `max-height` la página daba un salto al llegar a ellos. Por eso los `<img>` llevan
siempre `width` y `height` reales. Una tira muy apaisada (la de cofinanciación, 1299 × 79) lleva
`class="tc-logos__band"`: ocupa el ancho disponible (hasta `--band-w`, 560 px) y su alto sale de la
proporción. Regla general para cualquier imagen con `lazy`: dale un ancho o un alto definidos en CSS, no
solo `max-*`.

### Simuladores «Pruébalo»
`tc-sim` con `data-sim="factura"` o `data-sim="fichaje"` y los mismos `data-sim-*` de la web antigua
(marcado completo en `_plantilla`). La lógica no cambia.

### Diálogo y toast
```html
<button class="tc-btn tc-btn--secondary" type="button" data-dialog-open="mi-dialogo"><span class="tc-btn__label">Abrir</span></button>
<dialog class="tc-dialog" id="mi-dialogo" aria-labelledby="mi-dialogo-t">      <!-- tras </main>; + tc-dialog--wide -->
  <div class="tc-dialog__panel tone-light">
    <button class="tc-dialog__close" type="button" data-dialog-close aria-label="Cerrar"><svg class="tc-ico" aria-hidden="true"><use href="#i-close"/></svg></button>
    <h2 class="tc-dialog__title" id="mi-dialogo-t">Título</h2><p>Texto.</p>
    <div class="tc-dialog__actions"><button class="tc-btn tc-btn--primary" type="button" data-dialog-close><span class="tc-btn__label">Entendido</span></button></div>
  </div>
</dialog>
```
Toast: `TC.toast('Enlace copiado')`, `TC.toast('No se pudo guardar', { tone: 'err' })`.

### 404
`tc-404` (`tc-404__code`, `tc-404__title`, `tc-404__links`) dentro de una sección `tc-sec--night tone-dark`
a pantalla completa, seguida del pie (sin ola ni cúpula).

## 8. Movimiento

Regla general: se anima `transform`, `opacity` y `filter`. Todo estado oculto cuelga de `html.motion`,
que solo existe con JS y sin `prefers-reduced-motion`: **sin JS o con movimiento reducido todo se ve**.
Nunca escribas `opacity: 0` sin `.motion` delante.

### Revelados: qué usar para qué

| `data-reveal` | Para | Notas |
|---|---|---|
| `words` | titulares (`h1`, `h2`, frases en display) | sube palabra a palabra tras una máscara; respeta `<span class="tc-hl">` y `<br>` |
| `focus` | párrafos, entradillas, paneles | llega desde el desenfoque |
| `rise` | bloques cortos: etiquetas, tarjetas, filas, listas | sube 28 px |
| `pop` | chips, botones, insignias | escala con muelle |
| `tilt` | maquetas, tarjetas grandes, islas | se levanta en perspectiva |
| `curtain` | capturas | `<figure data-reveal="curtain"><div><div>…contenido…</div></div></figure>` (dos envoltorios) |
| `slide` | pasos y filas que entran de lado | `style="--from:60px"` (negativo = desde la izquierda) |
| `line` | reglas (`<hr class="tc-rule" data-reveal="line">`) | se dibuja |

- Retardo: `style="--delay:160ms"`.
- Escalonado: `data-stagger` en el **padre** reparte el retardo entre los hijos con `data-reveal`
  (`style="--step:90ms;--base:0ms"`).
- Entrada orquestada del hero: `data-intro` en el `.tc-sec__in` del hero → sus revelados no esperan al
  scroll; ordénalos con `--delay` (migas 80 → titular 140 → entradilla ~520 → botones ~720 → maqueta ~1300).
- No pongas `data-reveal` en un contenedor enorme (una sección entera): revela las piezas.
- Cada elemento se revela una vez. Un titular por sección con `words`; el resto `rise`/`focus`.

### Otros atributos

| Atributo | Efecto |
|---|---|
| `data-plx` (`style="--plx:60px;--plx-r:2deg"`) | parallax vertical ligado al scroll (decoración, olas, palabra del pie) |
| `data-magnet` | botón magnético (solo los CTA principales) |
| `class="tc-spot"` | foco de luz que sigue al puntero (`--spot-c` cambia el color) |
| `data-tilt="1.6"` | inclinación 3D con el puntero (grados; tarjetas grandes) |
| `data-count="6"` (+ `data-decimals`, `data-thousands`) | contador al entrar en pantalla |
| `data-live` | añade `.is-live` mientras el elemento se ve: cuelga de ahí los bucles (`.motion .x.is-live { animation: … }`) |
| `data-scrub-words` | texto en display que se enciende palabra a palabra con el scroll (uno por página) |
| `data-pointer-parallax` | hijos que se desplazan con el puntero (tareas del hero de portada) |
| `data-rise` en `tc-phero__shot` | la maqueta del hero se endereza al entrar |

Bucles propios (CSS de página): solo `transform`/`opacity`, colgados de `.motion … .is-live`, nada de
`setInterval`. Para lógica propia por cuadro usa `TC.task(fn)` (un único `requestAnimationFrame` compartido
que se para con la pestaña oculta).

### Transición entre páginas

Automática entre páginas del sitio (View Transitions entre documentos; en navegadores sin soporte, un
telón curvo). Elemento compartido entre dos páginas: mismo `data-vt="nombre"` en ambas
(p. ej. la tarjeta de GenAI en `/productos` y el hero de `/productos/genai`: `data-vt="prod-genai"`);
para textos, añade `data-vt-text`. Un nombre no se repite dentro de una página. `data-no-transition` en un
enlace lo excluye. Prueba la reserva con `?vt=off` (y `?vt=on` para volver).

**Convención para productos (obligatoria).** La maqueta o captura y el nombre de cada producto viajan de
la portada (y de cualquier índice) al hero de su página. El nombre de la transición es fijo:

| Elemento | `data-vt` | Dónde va |
|---|---|---|
| Maqueta, captura o ventana del producto | `vt-<slug>-shot` | en el `<figure class="tc-win">` (o el contenedor de la maqueta HTML), no en un envoltorio con `data-reveal` |
| Nombre del producto | `vt-<slug>-title` + `data-vt-text` | en un `<span>` que envuelve **solo el texto** del nombre, dentro del `<h1>`/`<h3>` (sin el icono ni chips) |

`<slug>` es el de la URL: `trustinfacts`, `trustintime`, `genai`, `orquesta`, `corrector-fiscal`, `nido`.

```html
<!-- portada (site/index.html) -->
<h3 class="tc-display tc-h3 tc-prod__name"><img …> <span data-vt="vt-genai-title" data-vt-text>GenAI</span></h3>
<a class="tc-win" href="/productos/genai" data-vt="vt-genai-shot">…maqueta…</a>

<!-- hero de /productos/genai -->
<h1 class="tc-display tc-phero__title"><span data-vt="vt-genai-title" data-vt-text>GenAI</span></h1>
<div class="tc-phero__shot" data-rise><figure class="tc-win" data-vt="vt-genai-shot">…</figure></div>
```

El motor convierte `data-vt` en `view-transition-name` en el momento del clic (solo si el elemento se ve) y
al llegar a la página nueva, así que **no se escribe `view-transition-name` en el CSS**. Cada nombre aparece
una sola vez por página; si una página lista el mismo producto dos veces, solo la primera lleva `data-vt`.
La portada ya declara los doce (`vt-<slug>-shot` y `vt-<slug>-title` de los seis productos): la página de
producto solo tiene que usar los mismos nombres en su hero.

## 9. El hilo de luz

Lo dibuja el motor en un lienzo fijo; **está en todas las páginas sin que hagas nada**:

- nace en un nodo al pie del hero (`tc-phero__in` / `tc-hero__in`),
- pasa por el centro de la ola,
- baja por el margen izquierdo de cada sección, con un nodo a la altura de su etiqueta,
- zigzaguea por los pasos con `data-flow-steps` y vuelve al margen,
- y desemboca en el centro de la cúpula del CTA (`tc-pool__in`).

El color sigue al fondo (cian sobre oscuro, blanco a media luz, royal sobre claro): lo deduce del degradado
de la sección. Si usas un fondo propio y el color no acierta, declara `data-lum="a b"` en la sección
(0 = oscuro, 1 = claro; admite `a m b`).

Para llevarlo por otro sitio, coloca puntos a mano dentro del `.tc-sec__in` (o de cualquier ancestro
posicionado). Una sección con puntos propios no recibe los automáticos:

```html
<i class="tc-flow-pt tc-flow-pt--spine" style="top:120px" data-flow></i>                      <!-- punto de paso -->
<i class="tc-flow-pt tc-flow-node tc-flow-pt--center" style="top:50%" data-flow data-flow-node></i>   <!-- con nodo -->
```
Posición horizontal: `tc-flow-pt--spine` (margen izquierdo), `--right`, `--center`, o `style="left:…"`.
Vertical: `style="top:…"`, `tc-flow-pt--head` (altura de la etiqueta), `tc-flow-pt--foot` (fondo de la
sección). Dentro de una tarjeta: `tc-flow-pt--card`. Como los coloca el CSS, puedes moverlos por punto de
corte desde tu CSS de página. El hilo pasa **por detrás** de tarjetas y texto: llévalo por huecos.

- `data-flow-skip` en una sección: no recibe puntos automáticos (el hilo la cruza en diagonal suave).
- `<main data-thread="manual">`: ningún punto automático salvo los nodos de pasos. `data-thread="off"`: sin hilo.
- El texto que arranca pegado al margen izquierdo en escritorio debe ir en `tc-wrap--spine` o empezar con
  una tarjeta: el hilo corre a 32 px a la izquierda del contenido.

## 10. CSS propio de página

`src/css/pages/<slug>.css` (uno por página o familia: `precios.css`, `producto-genai.css`, `guias.css`).
El build los incluye todos, en orden alfabético, en `@layer pages`, que va **después** de la capa del
sistema: una regla tuya gana siempre a una del sistema sin `!important` ni selectores largos.

- Prefijo obligatorio: `p-<slug>-…` (`.p-precios-nota`, `.p-genai-maqueta`). Para ajustar un componente
  en tu página: añádele una clase propia (`<div class="tc-leaf p-precios-plan">`) o limita con el body
  (`<body class="tc-body p-precios">` → `.p-precios .tc-plan { … }`). Nunca `.tc-plan { … }` a secas.
- Solo tokens (`var(--navy)`, `var(--r-lg)`, `var(--leaf)`, `var(--sh-2)`, `var(--e-out)`, `var(--d-3)`,
  `var(--fg-2)`…). Ni colores, ni radios, ni sombras, ni duraciones nuevas. Lista en `src/css/01-tokens.css`.
- Estados ocultos, siempre con `.motion` delante. Bucles, con `.is-live`.
- Nada de `@import`, ni reglas sobre `html`, `body`, `main`, `.tc-nav`, `.tc-foot`, `.tc-bot`.
- Nada cuadrado: radios `--r-sm`…`--r-xl`, `--r-pill`; tarjetas con esquina hoja.
- Puntos de corte del sistema: 520, 760, 920, 1000 px.
- JS propio: evita necesitarlo. Si hace falta, un `<script>` en línea al final que use `window.TC`
  (`TC.motion`, `TC.task`, `TC.onScroll`, `TC.onLayout`, `TC.reveal(el)`, `TC.scan(nodo)`, `TC.live(el)`,
  `TC.toast`, `TC.openDialog`, `TC.openCalendar`, `TC.track`, `TC.refresh()` tras cambiar alturas).

## 11. Atributos `data-*` de comportamiento

| Atributo | Qué hace |
|---|---|
| `data-calendar-open` | abre el diálogo de agenda (calendario real de Google, incrustado al abrir). Envía `tc_demo_click` |
| `data-track="etiqueta"` | envía `cta_click` al `dataLayer` (conserva las etiquetas existentes; para las nuevas, `<slug>_<zona>_<acción>`) |
| `data-cookie-settings` | abre la configuración de cookies |
| `data-dialog-open="id"` / `data-dialog-close` | abre / cierra un `<dialog class="tc-dialog">` |
| `data-download="app"` (+ `data-download-label`, `data-download-note`) | descarga con detección de sistema |
| `data-tabs` | pestañas ARIA |
| `data-filter-group="#lista"` + `data-filter` / `data-category` | filtros |
| `data-toc="#articulo"` | índice lateral |
| `data-belt` | cinta |
| `data-video-src` (+ `-title`, `-poster`, `data-video-state`) | vídeo que se activa si el MP4 existe |
| `data-sim="factura|fichaje"` + `data-sim-*` | simuladores |
| `data-contact-form` | formulario de contacto (con `contact-form.js`) |
| `data-vt="nombre"` (+ `data-vt-text`) | elemento compartido en la transición entre páginas |
| `data-no-assistant` en `<body>` | página sin TrusTy |
| `data-reveal`, `data-stagger`, `data-intro`, `data-plx`, `data-magnet`, `data-tilt`, `data-count`, `data-live`, `data-scrub-words`, `data-rise` | movimiento (§8) |
| `data-flow`, `data-flow-node`, `data-flow-origin`, `data-flow-steps`, `data-flow-skip`, `data-lum`, `data-thread` | hilo (§9) |
| `data-hero`, `data-fibers`, `data-stage`, `data-stage-panel`, `data-stage-node`, `data-stage-count`, `data-flow-stage`, `data-flow-rail`, `data-pointer-parallax` | portada (§13) |

Eventos que ya envía el motor: `tc_page_ready`, `cta_click`, `tc_demo_click`, `demo_modal_open`,
`platform_tab`, `faq_open`, `billing_toggle`, `download_click`, `sim_factura_emitida`, `sim_fichaje`,
`sim_fichaje_export`, `learn_video_open`, `filter`, `trusty_open`, `trusty_question`.

## 12. Descargas

Mapa `DOWNLOADS` en `src/js/ui.js`:

```js
'nido-mac-arm64':     { app: 'Nido', os: 'mac', label: 'macOS (Apple Silicon)', url: '' },
'nido-mac-x64':       { app: 'Nido', os: 'mac', label: 'macOS (Intel)', url: '' },
'nido-win':           { app: 'Nido', os: 'win', label: 'Windows', url: '' },
'orquesta-mac-arm64' · 'orquesta-mac-x64' · 'orquesta-win' · 'corrector-mac'
```

**Para activar una descarga basta rellenar su `url`** y compilar. Con `url` vacía el botón abre el diálogo
«Instalador disponible bajo petición», con un `mailto:` a info@trustcore.es cuyo asunto lleva la app y la
variante. Los instaladores pueden subirse a mano a `s3://trustcore.es/descargas/` (el despliegue excluye
esa carpeta del `--delete`) y enlazarse como `/descargas/Nido-1.0.0-arm64.dmg`.
El `href` del botón es la reserva sin JS: un `mailto:` o `/contacto`.

## 13. Portada

Marcado completo y comentado en `site/_plantilla-portada.html`. Piezas propias:

- **Hero** `tc-hero`: `<div class="tc-sec__in tc-hero__in" data-hero data-intro>` con
  `<canvas class="tc-hero__canvas" data-fibers aria-hidden="true">` (la corriente de fibras), `tc-hero__grid`
  → `tc-hero__copy` (`tc-hero__title`, `tc-hero__lead`, `tc-hero__cta`, `tc-hero__award`) y
  `tc-hero__chips` con cuatro `tc-task` (decorativas, `data-pointer-parallax`), `tc-hero__foot` →
  `tc-hero__index`, el nodo de origen `<i class="tc-flow-pt tc-flow-node tc-flow-pt--origin" data-flow data-flow-node data-flow-origin>`
  (las fibras convergen en él), `<i class="tc-flow-pt tc-flow-pt--drop" data-flow>` y `tc-hero__cue`.
- **Manifiesto**: `<p class="tc-display tc-manifesto" data-scrub-words>` + `tc-stats`.
- **Escenario fijado**: `<section class="tc-sec tc-sec--dusk tc-stage tone-dark tone-mid" data-stage data-flow-stage>`
  → `tc-stage__pin` → `tc-stage__aura` (un `<i>` por producto), `tc-stage__head` con
  `<b data-stage-count>`, `tc-stage__rail` con un `<i class="tc-flow-node tc-stage__node" data-stage-node>`
  por producto, y los `<article class="tc-prod" id="…" data-stage-panel style="--i:N">`. Dentro de cada
  producto, los hijos de `tc-prod__copy` llevan `style="--j:0…5"` y las insignias `style="--f:1.4"`
  (velocidades distintas). Se fija solo en ≥ 1180 × 680 px con movimiento; en el resto, los productos van
  apilados y se revelan al entrar. Los enlaces `#id-del-producto` llevan al punto exacto. El número de
  productos es libre (2–5).
- Tras el escenario: `tc-wave tc-wave--tall tc-wave--from-dusk`.

**La portada real** es `site/index.html` (`<body class="tc-body p-home">`) con `src/css/pages/home.css`.
Recorrido: hero → manifiesto → escenario (TrustInFacts, TrustInTime, GenAI) → ola → apps del estudio
(`#orquesta`, `#corrector-fiscal`, `#nido`) → cómo trabajamos → vídeo y precios (`#precios`) →
reconocimiento y clientes (`#confianza`) → respuestas (`#respuestas`) → CTA (`#contacto-home`).

- Los `id` de producto (`#trustinfacts` … `#nido`) son anclas públicas: el índice del hero y cualquier
  enlace `/#genai` llevan al punto exacto (dentro del escenario lo resuelve el motor).
- `home.css` contiene las tres maquetas HTML (`p-home-ga` panel de GenAI, `p-home-orq` grafo de Orquesta,
  `p-home-cf` revisión de Corrector Fiscal). Son ilustraciones con términos reales, no capturas, y van con
  `aria-hidden`. Si una página de producto las necesita, se copian a su CSS con su prefijo; si acaban en
  tres sitios, se suben al sistema.
- El diagrama del bucle (`p-home-loop`) sigue a las pestañas con el evento `tabs:change` (script en línea
  al final de la página). Es decorativo: sin JS las cuatro pestañas se ven apiladas.
- Las preguntas de `#respuestas` conservan `class="tc-tldr"` y `<h3>` en cada pregunta: los usa el
  `speakable` del JSON-LD `FAQPage`. El texto de cada respuesta debe seguir siendo idéntico al del JSON-LD.
- Precios: solo los «desde» de `site/precios.html` (19,99 €/mes y 5,99 €/usuario/mes). Compruébalo con el
  `grep` de `.claude/skills/trustcore-home/references/copy-rules.md` §5 cada vez que se toquen.
- El `<title>`, la descripción, Open Graph y Twitter de la portada son **los publicados**, palabra por
  palabra (`node scripts/dev/check-page.mjs site/index.html` lo comprueba). Reposicionarlos hacia
  «software con IA» es una decisión de SEO que toma el fundador, no el rediseño.
- Corrector Fiscal: no se dice que los datos «no salen del equipo». Se guardan en local, pero cada
  revisión envía a la IA del usuario lo que este adjunta (`docs/04-datos-y-privacidad.md` de la app).
- Un CSS de página que cambie el `display` de una pieza del sistema que este oculta por punto de corte
  (p. ej. `tc-hero__index`, oculto por debajo de 1200 px) debe ir dentro del mismo `@media`: la capa
  `pages` gana siempre a la del sistema, también a sus `display: none`.

## 14. Lista de comprobación antes de dar una página por hecha

- [ ] `node scripts/dev/check-page.mjs site/<pagina>.html` sin errores: `<head>` SEO intacto, un solo `<h1>`, jerarquía de encabezados sin saltos, FAQ con el mismo texto que el JSON-LD, ninguna clase `tc-…` ni icono inexistente.
- [ ] `body.tc-body`, `main#main-content`, marcadores de navegación y pie, scripts con `defer`.
- [ ] Cadena de fondos sin costuras; cada sección con su tono; la última clara acaba en mist.
- [ ] `check-overflow.mjs` limpio a 1440, 1024, 768, 375 y 320: nada cortado por los lados. Botones a todo el ancho en móvil donde toca.
- [ ] La altura de la página no cambia al recorrerla (imágenes `lazy` con caja definida): el final de la última captura es el final de la página.
- [ ] Sin JS (`nojs.mjs`) y con movimiento reducido (`shoot2 … reduce`): todo el contenido visible.
- [ ] Teclado: todo lo interactivo recibe foco visible; pestañas con flechas; diálogos cierran con Esc.
- [ ] Imágenes con `width`/`height`, `alt` real (o `alt=""` si son decorativas) y `loading="lazy"` bajo el pliegue. La imagen del hero, sin `lazy`.
- [ ] CTA principal «Agendar demo» con `data-calendar-open`; `data-track` en los CTA.
- [ ] Sin cifras, clientes, logos ni testimonios nuevos; sin promesas absolutas; sin emojis.
- [ ] Consola sin errores (los 404 de vídeos que aún no existen son esperables en local).

## 15. Páginas aún sin migrar

Mientras una página conserve el marcado antiguo se ve sin estilo (texto sobre claro), pero la navegación,
el pie, la agenda, las cookies y TrusTy ya funcionan en ella. En `src/css/02-base.css` hay una reserva
mínima para esas páginas (`.tc-icon`, `.hidden`, margen bajo la navegación) que se borra al terminar la
migración. Una página pasa al sistema nuevo en cuanto su `<body>` lleva `tc-body`.
