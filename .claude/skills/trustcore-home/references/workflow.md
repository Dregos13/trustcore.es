# Flujo de trabajo del repositorio

Todo lo que hay que saber para construir, verificar y desplegar sin romper
nada. Aprendido a base de romperlo.

---

## Construir

```bash
# 1. Tailwind del sitio (purgado contra site/**/*.html)
node_modules/.bin/tailwindcss -i src/tailwind.css -o site/assets/css/tailwind.min.css --minify

# 2. Sitemap + hreflang (deriva las rutas del disco)
node scripts/seo-i18n.mjs

# 3. Schema de vídeos de /aprende (solo si cambian las lecciones)
node scripts/aprende-videos.mjs
```

**Clases nuevas de Tailwind → hay que reconstruir.** Si se añade `grid-cols-5`
en un HTML y no se ejecuta el paso 1, la clase no existe y el layout se rompe en
silencio.

## Servir en local

```bash
cd site && python3 -m http.server 8471 --bind 127.0.0.1
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
# 1. Assets (inmutables)
aws s3 sync site/ s3://trustcore.es/ --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "videos/*" --exclude "*.html" --exclude "*.xml" --exclude "*.txt"

# 2. HTML/XML/TXT (sin caché)
aws s3 sync site/ s3://trustcore.es/ --delete \
  --cache-control "no-cache, no-store, must-revalidate" \
  --exclude "*" --include "*.html" --include "*.xml" --include "*.txt" \
  --exclude "videos/*"

# 3. Invalidar y ESPERAR a que termine
aws cloudfront create-invalidation --distribution-id E3DUTT7AH6H3WN --paths "/*"
```

Comprobar que el CDN sirve lo mismo que hay en local:

```bash
md5sum site/assets/css/components.css
curl -sS --compressed https://www.trustcore.es/assets/css/components.css | md5sum
```

---

## Trampas conocidas de este repositorio

### 1. Orden de la cascada

`components.css` carga **después** de Tailwind. Una clase `tc-*` gana a una
utilidad normal para cualquier propiedad que declare.

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

### 6. Caché del navegador

Los assets van con `max-age=31536000, immutable`. Invalidar CloudFront **no**
limpia el navegador del visitante. Al revisar cambios: Ctrl+Shift+R.

> Pendiente y recomendable: cache busting con hash en el nombre del fichero.
> Sin él, un cliente que ya visitó la web puede seguir viendo el CSS antiguo
> durante un año.

### 7. React en `node_modules`

Instalado con `--no-save` para el bundle de design-sync. Un clon nuevo debe
repetir `npm i --no-save react react-dom` si va a regenerar ese bundle.

---

## Al terminar

1. Reconstruir Tailwind y el sitemap.
2. Verificar con capturas a 1440/768/375.
3. Desplegar + invalidar + comprobar MD5.
4. Commit descriptivo (por qué, no solo qué).
5. Recordar a Rami que haga `git push` — desde aquí no se puede.
6. Si `components.css` cambió de forma sustancial, ofrecer re-sincronizar el
   design system: `/design-sync`.
