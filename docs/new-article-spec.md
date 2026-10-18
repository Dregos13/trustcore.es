# Spec de artículo para `scripts/new-article.mjs`

Un artículo nuevo se da de alta con un solo comando a partir de un fichero
JSON. El comando valida el spec, genera la página, la tarjeta del hub, las
entradas de `llms.txt` y `llms-full.txt` y regenera el sitemap. Ejecutarlo dos
veces con el mismo spec no cambia nada.

```bash
npm run new-article -- --from scripts/examples/articulo-ejemplo.json
```

Opciones:

| Opción | Efecto |
|---|---|
| `--from <spec.json>` | Spec del artículo (obligatorio). |
| `--dry-run` | Valida y renderiza sin escribir nada ni regenerar el sitemap. |
| `--force` | Sustituye una página existente que no generó este script. |
| `--blog-dir` | Genera `site/blog/<slug>.html` con URL `/blog/<slug>`. Solo cuando exista la ruta `/blog/` en el CDN; hoy los artículos viven en la raíz. |
| `--json` | Imprime el resultado como JSON (para SAI y otros scripts). |
| `--root <dir>` | Raíz del repo; por defecto, la del script. Lo usan las pruebas. |

Códigos de salida: `0` todo bien, `1` spec inválido o error, `2` uso incorrecto.

## Qué genera

| Destino | Cómo se localiza para actualizar |
|---|---|
| `site/<slug>.html` | Marca `<!--new-article:v1 …-->` en el `<head>`. Sin ella, el script no sobrescribe (salvo `--force`). |
| `site/blog.html` | Tarjeta entre `<!--article:<slug>-->` y `<!--/article:<slug>-->`, la primera del grid `#articles-grid`. Si hay una tarjeta manual con el mismo `href`, se sustituye. |
| `site/llms.txt` | Línea `- [título](url): descripción` en la sección `## Artículos del blog` (se crea antes de «Fuentes oficiales» si no existe). La más reciente, primero. |
| `site/llms-full.txt` | Línea `- url` al final de su `### Serie …` dentro de `## Contenido estratégico`; la serie se crea si no existe. |
| `site/sitemap.xml` | Lo regenera `scripts/seo-i18n.mjs` a partir del disco. |

Nada más se toca. Los demás artículos no cambian.

## Formato del spec

```json
{
  "slug": "ipsi-en-presupuestos-convertir-a-factura",
  "title": "IPSI en presupuestos: evita diferencias al facturar",
  "description": "Cómo preparar presupuestos con IPSI en Ceuta y Melilla para que la factura salga con la misma base, tipo y cuota, sin correcciones con la asesoría.",
  "cluster": "ipsi",
  "h1": "IPSI en presupuestos: cómo evitar diferencias al convertir a factura",
  "eyebrow": "IPSI",
  "lead": "El presupuesto es la primera vez que el cliente ve un importe con IPSI. Si la factura sale distinta, el problema no es el impuesto: es el flujo.",
  "datePublished": "2026-10-18",
  "dateModified": "2026-10-18",
  "author": { "name": "TrustCore", "type": "Organization" },
  "ogImage": "/assets/og-image-1200x630.jpg",
  "icon": "fa-file-invoice",
  "body": { "format": "markdown", "file": "articulo-ejemplo.md" },
  "faq": [
    {
      "question": "¿Qué hago si el tipo de IPSI cambia entre el presupuesto y la factura?",
      "answer": "Documenta el cambio en la factura, conserva el presupuesto aceptado y confirma con tu asesoría qué tipo corresponde.",
      "sources": ["https://www.boe.es/buscar/act.php?id=BOE-A-1991-7645"]
    }
  ],
  "related": [
    "ipsi-ceuta-melilla-guia-practica",
    { "slug": "ipsi-en-factura-ejemplo-completo", "label": "Ejemplo", "summary": "Resumen propio para la tarjeta." }
  ],
  "sources": [
    {
      "label": "AEAT: Ceuta y Melilla",
      "url": "https://sede.agenciatributaria.gob.es/Sede/aduanas/islas-canarias-ciudades-ceuta-melilla/ceuta-melilla.html",
      "accessed": "2026-10-18"
    }
  ],
  "cta": {
    "title": "Cómo lo enfoca TrustCore",
    "text": "TrustinFacts conserva el tipo de IPSI por línea desde el presupuesto hasta la factura.",
    "primary": { "label": "Agendar demo", "href": "/contacto" },
    "secondary": { "label": "Ver vídeos cortos", "href": "/aprende" }
  },
  "card": { "summary": "Base, tipo y cuota iguales en presupuesto y factura." }
}
```

El ejemplo completo y funcional está en `scripts/examples/articulo-ejemplo.json`
con su cuerpo en `scripts/examples/articulo-ejemplo.md`.

### Campos

| Campo | Obligatorio | Límite | Notas |
|---|---|---|---|
| `slug` | sí | 80 | Minúsculas, dígitos y guiones. Será la URL: `/<slug>`. No puede ser una página existente hecha a mano (salvo `--force`). |
| `title` | sí | 60 | Va en `<title>` (se añade ` | TrustCore`), `og:title`, migas, JSON-LD y tarjeta. Sin el sufijo. |
| `description` | sí | 155 | Meta description, `og:description` y entrada de `llms.txt`. Por debajo de 70 avisa. |
| `cluster` | sí | — | `verifactu`, `ipsi`, `control-horario` o `plan-lite`. Fija la píldora de la tarjeta, el filtro del hub, `articleSection` y la serie de `llms-full.txt`. Para abrir una serie nueva, añadirla a `CLUSTERS` en el script y la píldora en `blog.html`. |
| `h1` | no | 90 | Titular visible. Por defecto, `title`. Admite Markdown en línea. |
| `eyebrow` | no | 40 | Etiqueta sobre el titular y en la tarjeta. Por defecto, la del clúster. |
| `lead` | no | 260 | Entradilla bajo el titular. Por defecto, `description`. |
| `datePublished` | sí | — | `AAAA-MM-DD`. |
| `dateModified` | no | — | `AAAA-MM-DD`, no anterior a `datePublished`. Si es posterior, la página dice «Actualizado el …». Por defecto, igual a `datePublished`. |
| `author` | no | — | `{ "name", "type": "Organization" \| "Person", "url"? }`. Por defecto, TrustCore (se muestra «Equipo TrustCore»). |
| `ogImage` | no | — | Ruta `/assets/…` existente o URL https. Por defecto, la imagen OG del sitio (1200×630). |
| `icon` | no | — | Id del sprite (`site/assets/icons/sprite.svg`) para la tarjeta. Por defecto, el del clúster. |
| `body` | sí | — | `{ "format": "markdown" \| "html", "content": "…" }` o `{ …, "file": "ruta" }` (relativa a la carpeta del spec). Una cadena suelta se trata como Markdown. Sin `<h1>`. Por debajo de 300 palabras avisa. |
| `faq` | no | 12 | Lista de `{ question ≤ 150, answer, sources? }`. `answer` admite Markdown. Genera el bloque «Preguntas frecuentes» (`<details>`) y el `FAQPage`. |
| `related` | no | 6 | Slugs de artículos existentes, o `{ slug, label?, title?, summary? }`. Título y resumen se leen de la propia página; la etiqueta, de su tarjeta en el hub. Genera «Sigue leyendo». |
| `sources` | sí | 25 | Lista de `{ label ≤ 120, url https, accessed? }`. Puede ir vacía (con aviso) solo si el artículo no afirma nada legal, fiscal ni numérico. Genera «Fuentes» y `citation` en el JSON-LD. |
| `cta` | no | — | `{ title?, text?, primary?, secondary? }`; cada botón `{ label, href, icon? }`. `null` quita un botón. Por defecto: «Agendar demo» → `/contacto` y «Ver vídeos cortos» → `/aprende`. |
| `card` | no | — | `{ summary ≤ 160 }` para la tarjeta del hub. Por defecto, `description`. |

Cualquier campo que no esté en esta tabla hace fallar la validación (evita
erratas silenciosas).

### Enlaces internos

Todos los `href` y `src` del cuerpo, las FAQ, el CTA y el autor se comprueban
contra `site/`:

- Deben ser rutas absolutas (`/precios`, `/productos/trustinfacts`, `/assets/x.png`) o la URL completa `https://www.trustcore.es/…`. `precios` o `../precios` fallan.
- Sin `.html`: el sitio sirve URLs limpias.
- `/article` y `/comparativa` responden 301 y no se admiten; `/en/…` y `/fr/…` tampoco.
- Los enlaces externos deben ser `https://`. No se comprueba que respondan: eso es parte de la revisión «Hechos» de quien publica.

### Markdown admitido

Subconjunto suficiente para un artículo. Lo que no cubra se escribe en HTML
dentro del Markdown (bloques que empiezan por `<div>`, `<section>`, `<figure>`,
`<details>`, etc. pasan tal cual) o se manda el cuerpo entero como `html`.

- Cabeceras `##`, `###`, `####` (un `#` se convierte en `##`: el h1 es el titular). Cada una lleva `id` para enlazar.
- Párrafos, `**negrita**`, `*cursiva*`, `~~tachado~~`, `` `código` ``, dos espacios al final de línea = `<br>`.
- Listas `-` y `1.`, anidadas por sangría, con párrafos dentro de un ítem si van sangrados.
- Citas `>`, líneas `---`, bloques de código con cerca.
- Tablas con cabecera y fila `|---|:-:|---:|` (alineación).
- Enlaces `[texto](url)` e imágenes `![alt](ruta)`. Los externos abren en pestaña nueva con `rel="noopener"`.
- Autoenlaces `<https://…>`.

El cuerpo se renderiza dentro de `.tc-article`, cuyos estilos van en la propia
plantilla (`site/_templates/article.html`) con los tokens del sitio. Así no
depende de que cada utilidad de Tailwind esté en el bundle purgado. En HTML
puedes usar además `.tc-callout` para un recuadro destacado.

## La plantilla

`site/_templates/article.html` es una página completa del sitio con huecos:

`{{title}}` `{{description}}` `{{slug}}` `{{url}}` `{{datePublished}}`
`{{dateModified}}` `{{author}}` `{{section}}` `{{ogImage}}` `{{jsonld}}`
`{{breadcrumbs}}` `{{eyebrow}}` `{{h1}}` `{{lead}}` `{{dateline}}` `{{body}}`
`{{faq}}` `{{cta}}` `{{sources}}` `{{related}}`

Lleva los bloques `<!--NAV-->`, `<!--MNAV-->` y `<!--FOOTER-->`, así que
`scripts/nav.mjs`, `scripts/footer.mjs` y `scripts/build-assets.mjs` la
mantienen al día como a cualquier otra página. No se publica: está excluida
del despliegue y del sitemap.

El JSON-LD se genera desde el spec: `Article` (con `author`, `datePublished`,
`dateModified`, `articleSection`, `citation`), `BreadcrumbList`
(Inicio › Blog › artículo) y `FAQPage` si hay preguntas.

## Antes de publicar

El script comprueba forma, no fondo. Antes de abrir el PR:

1. Reglas editoriales de `docs/content-playbook.md` y voz de `docs/brand-voice.md`.
2. Nada de «homologado por la AEAT»: «compatible», «preparado», «adaptado».
3. Toda fecha, importe o cifra legal con su fuente en `sources` y revisada en AEAT/BOE.
4. Mirar la página con `npm run serve` (`http://127.0.0.1:8471/<slug>.html`) y el hub (`/blog.html`).

## Pruebas

```bash
npm test
```

`scripts/new-article.test.mjs` trabaja sobre una copia temporal de `site/`:
alta, `--blog-dir`, idempotencia, actualización sin duplicar, rechazo de título
largo, meta larga, enlaces internos a páginas inexistentes, `related`
inexistente, slug inválido, fuentes sin https, protección de páginas manuales,
`--dry-run`, códigos de salida y el conversor de Markdown.
