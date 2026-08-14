# Traducciones EN / FR — archivadas (no se despliegan)

28 páginas traducidas (14 EN + 14 FR) que **estuvieron** en `site/en/` y `site/fr/`.
Se movieron aquí el 2026-08-15: TrustCore se centra solo en España por ahora.

## Por qué están fuera de `site/`

No es una decisión estética: mientras vivían en `site/` se subían a S3 en cada
despliegue **pero eran inalcanzables**. La CloudFront Function
`trustcore-es-canonical-redirect` (viewer-request, distribución `E3DUTT7AH6H3WN`)
devuelve un 301 permanente de toda `/en/*` y `/fr/*` a su equivalente en español,
antes de que la petición llegue a S3. Ver `legacyRedirectTarget()` en esa función
y `docs/domain-consolidation-seo-plan.md`.

Sacarlas de `site/` no cambia nada de cara al usuario (el 301 ocurre en el CDN,
no en S3) y evita dos riesgos:

1. **Contenido rancio latente.** Si alguien quitara el redirect del CDN sin
   revisar esto, 28 páginas desactualizadas se publicarían de golpe.
2. **Deriva silenciosa.** Seguían recibiendo cambios globales de CSS/JS sin que
   nadie las revisara, porque nadie puede verlas.

## Cómo reactivar el multiidioma

En este orden — al revés reintroduce el problema que esto arregla:

1. `git mv i18n-archive/en site/en && git mv i18n-archive/fr site/fr`
2. Quitar `/en/` y `/fr/` de `legacyRedirectTarget()` en la CloudFront Function y
   **desplegar la función** (`aws cloudfront publish-function`). Comprobar que
   `curl -I https://www.trustcore.es/en/pricing` devuelve 200, no 301.
3. Restaurar en `scripts/seo-i18n.mjs` los clústeres hreflang es/en/fr/x-default
   y las URLs traducidas en el sitemap (el script explica el porqué en su cabecera).
4. Revisar el contenido: estas páginas llevan sin mantenerse desde la
   consolidación y su copy puede no coincidir con el de las páginas ES actuales.

El widget TrusTy (`site/assets/js/components.js`) ya trae las cadenas EN y FR y
detecta el idioma por la ruta, así que funcionará solo en cuanto el paso 2 esté hecho.
