# trustcore.es

Web estática de TrustCore: HTML por página en `site/`, Tailwind compilado en
local, sin framework. Se despliega sola: un push a `main` que toque `site/**`
sube la carpeta a S3 e invalida CloudFront (`.github/workflows/deploy.yml`).

## Comandos

```bash
npm install
npm run serve        # http://127.0.0.1:8471 (sirve site/ tal cual; usa /pagina.html)
npm run build        # CSS y JS con hash + sitemap y hreflang
npm run build:seo    # solo sitemap, hreflang y schema de /aprende
npm run new-article -- --from <spec.json>   # da de alta un artículo
npm test             # pruebas (node --test)
```

Node 22 o superior.

## Dar de alta un artículo

Un artículo se describe en un JSON y se crea con un solo comando, sin tocar a
mano el hub ni el sitemap:

```bash
npm run new-article -- --from scripts/examples/articulo-ejemplo.json
```

El comando valida el spec (título ≤ 60, meta ≤ 155, slug, cuerpo en Markdown o
HTML, FAQ opcional, enlaces internos a páginas que existen, fuentes) y después:

1. Genera `site/<slug>.html` desde `site/_templates/article.html`, con JSON-LD
   `Article` + `BreadcrumbList` + `FAQPage`.
2. Añade o actualiza la tarjeta en `site/blog.html`.
3. Añade la entrada en `site/llms.txt` y `site/llms-full.txt`.
4. Regenera `site/sitemap.xml` (`scripts/seo-i18n.mjs`).

Es idempotente: ejecutarlo dos veces con el mismo spec deja todo igual; cambiar
el spec y repetirlo actualiza en sitio sin duplicar. `--dry-run` valida sin
escribir, `--json` devuelve el resumen para otros programas y `--blog-dir` deja
preparada la ruta `/blog/<slug>` para cuando exista en el CDN.

Formato del spec, campos, límites y Markdown admitido: [docs/new-article-spec.md](docs/new-article-spec.md).

## Estructura

```
site/                 páginas (una por URL), assets, sitemap, llms.txt
site/_templates/      plantilla de artículo (no se publica)
scripts/              build, componentes compartidos (nav, footer), SEO, alta de artículos
scripts/examples/     spec de ejemplo
docs/                 voz de marca, playbook de contenido, sistema de diseño, planes SEO
infra/                Terraform de S3 + CloudFront
```

## Cosas que conviene saber

- **Tailwind se purga contra `site/**/*.html`.** Una clase nueva en una página
  no existe hasta `npm run build`, que además cambia el nombre con hash del
  bundle en todas las páginas. El cuerpo de los artículos generados usa estilos
  propios de la plantilla para no depender de eso.
- **Navegación y pie son datos**: `scripts/nav.mjs` y `scripts/footer.mjs` los
  reescriben en todas las páginas (incluida la plantilla).
- **`/en/` y `/fr/` están retiradas** (301 en CloudFront). No añadir hreflang ni
  URLs traducidas: ver la cabecera de `scripts/seo-i18n.mjs`.
- Reglas editoriales: `docs/content-playbook.md`. Voz: `docs/brand-voice.md`.
  Flujo de build, verificación y despliegue con sus trampas conocidas:
  `.claude/skills/trustcore-home/references/workflow.md`.
