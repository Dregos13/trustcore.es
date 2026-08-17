# Flujo de trabajo del repositorio

Todo lo que hay que saber para construir, verificar y desplegar sin romper
nada. Aprendido a base de romperlo.

---

## Construir

```bash
npm run build      # CSS + JS con hash, sitemap y hreflang
```

Equivale a:

```bash
# 1. Bundle de CSS y JS: Tailwind (purgado contra site/**/*.html) + fuentes +
#    tokens + componentes, minificado y con el hash del contenido en el nombre.
#    Reescribe el <link> y los <script> de las 40 páginas.
node scripts/build-assets.mjs

# 2. Sitemap (incluidas las 23 lecciones en vídeo) + hreflang
node scripts/seo-i18n.mjs
```

Y, solo cuando cambia el material de origen:

```bash
# Variantes optimizadas de las imágenes propias (marca, favicons, capturas)
node scripts/build-images.mjs

# Pósters y duraciones de los vídeos, desde los .mp4 de VideosTF/
node scripts/build-video-posters.mjs        # requiere pip install imageio-ffmpeg

# Schema VideoObject de /aprende (lee scripts/video-meta.json)
node scripts/aprende-videos.mjs
```

**Clases nuevas de Tailwind → hay que reconstruir.** Si se añade `grid-cols-5`
en un HTML y no se ejecuta el paso 1, la clase no existe y el layout se rompe en
silencio.

**Los ficheros con hash son artefactos.** `site/assets/css/site.*.min.css` y
`site/assets/js/*.*.min.js` los genera el build; las fuentes que se editan a
mano son `site/assets/css/components.css`, `site/assets/css/tokens.css`,
`site/assets/js/components.js` y `site/assets/js/consent.js`. El build borra el
artefacto anterior al escribir el nuevo, así que no se acumulan.

## Servir en local

```bash
npm run serve      # http://127.0.0.1:8471
```

Los vídeos de `/aprende` dan 404 en local — están solo en S3. Es esperado.

## Verificar (obligatorio antes de desplegar)

Playwright ya está instalado en `.ds-sync/` (versión **1.60.0**, es la que
corresponde al chromium cacheado; otra versión falla con
`Executable doesn't exist`). El enlace `.design-sync/verify/node_modules` apunta
ahí.

```bash
# Capturas de página completa
node .design-sync/verify/audit-shots.mjs .design-sync/verify/out index.html precios.html
```

**Mirar las capturas.** El bug de cascada (titulares azul marino sobre azul
marino) pasó todas las aserciones automáticas y solo se vio en la imagen.

Comprobaciones mínimas por fase:

```js
// sin scroll horizontal ni titulares desbordados, a 1440 / 768 / 375
document.documentElement.scrollWidth > document.documentElement.clientWidth
```

## Desplegar

**No hay push por SSH desde este entorno**, así que el workflow de GitHub
Actions no se puede disparar. Se despliega con la CLI de AWS replicando
exactamente lo que hace `.github/workflows/deploy.yml`.

**Siempre `--dryrun` primero** y revisar los borrados: el flag `--delete` puede
llevarse ficheros por delante.

```bash
# 1. Assets (inmutables). Los fuentes de CSS/JS no se suben: solo se sirve el
#    bundle con hash, así que components.css, tokens.css, components.js y
#    consent.js se quedan fuera.
aws s3 sync site/ s3://trustcore.es/ --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "videos/*" --exclude "*.html" --exclude "*.xml" --exclude "*.txt" \
  --exclude "assets/css/components.css" --exclude "assets/css/tokens.css" \
  --exclude "assets/js/components.js" --exclude "assets/js/consent.js" \
  --exclude "assets/js/contact-form.js"

# 2. HTML/XML/TXT (sin caché)
aws s3 sync site/ s3://trustcore.es/ --delete \
  --cache-control "no-cache, no-store, must-revalidate" \
  --exclude "*" --include "*.html" --include "*.xml" --include "*.txt" \
  --exclude "videos/*"

# 3. Invalidar y ESPERAR a que termine
aws cloudfront create-invalidation --distribution-id E3DUTT7AH6H3WN --paths "/*"
```

`llms.txt` debería servirse como `text/markdown`; S3 le pone `text/plain` por
la extensión. No es lo que hacía fallar la auditoría de Lighthouse (era la
falta de enlaces en formato Markdown), pero sí es lo que pide la especificación:

```bash
aws s3 cp site/llms.txt s3://trustcore.es/llms.txt \
  --content-type "text/markdown; charset=utf-8" \
  --cache-control "no-cache, no-store, must-revalidate"
```

Comprobar que el CDN sirve lo mismo que hay en local (el nombre lleva hash, así
que basta con que exista):

```bash
CSS=$(basename site/assets/css/site.*.min.css)
md5sum "site/assets/css/$CSS"
curl -sS --compressed "https://www.trustcore.es/assets/css/$CSS" | md5sum
```

---

## Trampas conocidas de este repositorio

### 1. Orden de la cascada

`components.css` va **después** de Tailwind dentro del bundle (lo fija
`scripts/build-assets.mjs` al concatenar, no el orden de los `<link>` de cada
página). Una clase `tc-*` gana a una utilidad normal para cualquier propiedad
que declare.

```html
<h2 class="tc-display text-white">    <!-- ✗ invisible: gana el navy -->
<h2 class="tc-display !text-white">   <!-- ✓ -->
```

Usar el modificador `!` de Tailwind al sobrescribir algo que una clase `tc-*`
ya define. Hay ~1.400 utilidades `!` en el safelist de
`.design-sync/css/tailwind.ds.config.js` (solo para el bundle de diseño; el
build del sitio genera las que aparecen en el HTML).

### 2. `background` shorthand borra los gradientes

Si una regla `tc-*` usa `background: <color>` y el HTML aplica
`bg-gradient-to-br`, el shorthand borra el `background-image`. Usar
`background-color` en las reglas de componente. Ya corregido en
`.tc-bento__card`, `.tc-testimonial`, `.tc-pricing`, `.tc-metric`.

### 3. El atributo `hidden`

`components.css` declara `[hidden] { display: none !important; }` porque
cualquier `display: flex` de la hoja lo pisaría y el elemento "oculto"
seguiría capturando clics.

### 4. Font Awesome no está cargada

Ver `visual-system.md` § Iconografía.

### 5. `/en/` y `/fr/` están retiradas

Una CloudFront Function (`trustcore-es-canonical-redirect`) devuelve 301 de
`/en/*` y `/fr/*` al español. Las traducciones viven en `i18n-archive/`, fuera
de la ruta de despliegue. **No añadir hreflang en/fr ni URLs traducidas al
sitemap** sin quitar antes el redirect del CDN — ver la cabecera de
`scripts/seo-i18n.mjs`.

### 6. Caché del navegador — resuelto para CSS y JS

Los assets van con `max-age=31536000, immutable`. Invalidar CloudFront **no**
limpia el navegador del visitante. Al revisar cambios: Ctrl+Shift+R.

Desde agosto de 2026 el CSS y el JS llevan el hash del contenido en el nombre
(`site.bfdca54e.min.css`), así que cada despliegue cambia la URL y la caché se
invalida sola. **Las imágenes siguen sin hash**: si hay que cambiar el
contenido de una, se sube con un nombre nuevo en vez de sobrescribirla — es lo
que se hizo con `trustcore-mark-120.png` frente a `trustcore-icon.png`.

### 7. React en `node_modules`

Instalado con `--no-save` para el bundle de design-sync. Un clon nuevo debe
repetir `npm i --no-save react react-dom` si va a regenerar ese bundle.

---

## Al terminar

1. `npm run build` (bundle con hash + sitemap).
2. Verificar con capturas a 1440/768/375.
3. Desplegar + invalidar + comprobar MD5.
4. Commit descriptivo (por qué, no solo qué).
5. Recordar a Rami que haga `git push` — desde aquí no se puede.
6. Si `components.css` cambió de forma sustancial, ofrecer re-sincronizar el
   design system: `/design-sync`.
