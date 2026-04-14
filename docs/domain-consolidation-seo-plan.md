# Plan de consolidacion de dominios y SEO

Fecha de referencia: 2026-04-13
Objetivo: convertir `trustcore.es` en la web principal comercial sin perder el potencial SEO de otros dominios si se mantienen como satelites editoriales.

## Decision recomendada
- `trustcore.es`: web principal de marca, producto, precios, comparativa, contacto y conversion.
- `trustintime.es`: mantener solo contenido editorial sobre control horario si aporta trafico organico real.
- `trustinfacts.com` o dominio equivalente: mantener solo contenido editorial sobre VeriFactu, facturacion o normativa fiscal si aporta trafico organico real.

La regla es simple: una sola web comercial y, como mucho, dominios satelite de contenidos. No mezclar las dos cosas.

## Lo que debe vivir solo en TrustCore
- Home principal.
- Paginas de producto.
- Precios.
- Comparativa comercial.
- Contacto.
- Formularios.
- Demo.
- Cualquier CTA de captacion o cierre.

Estas URLs no deben existir indexables en otros dominios. Si existen hoy, hay que hacer `301` hacia TrustCore o, de forma temporal, `noindex, follow` hasta poder redirigir.

## Lo que puede quedarse en dominios satelite
- Articulos originales y no duplicados.
- Guías long-tail muy especificas por tematica.
- Contenido informacional que capture demanda alta en TOFU/MOFU.
- Piezas que enlacen de forma contextual hacia TrustCore.

Si un articulo del satelite es practicamente el mismo que uno de TrustCore, no debe competir. En ese caso:
- o se mueve a TrustCore y se hace `301`,
- o se reescribe para que sea claramente distinto,
- o se deja fuera del indice con `noindex`.

## Regla de canonical
- Toda pagina indexable debe tener canonical a si misma dentro de su propio dominio.
- No usar canonical cruzado entre dominios salvo caso muy temporal y muy controlado.
- Si una URL comercial deja de existir en el dominio satelite, mejor `301` que canonical cruzado.

Regla practica:
- contenido original que quieres posicionar: `canonical self`
- contenido duplicado o comercial migrado: `301` a TrustCore

## Regla de robots.txt
Cada dominio debe tener su propio `robots.txt`.

En `trustcore.es`:
- `Allow: /`
- declarar solo su `Sitemap: https://www.trustcore.es/sitemap.xml`

En dominios satelite:
- `Allow: /` si quieres que el blog se indexe
- declarar solo el sitemap de ese host
- no bloquear el blog si el plan es mantener SEO
- si dejas rutas comerciales temporales con `noindex`, no las bloquees en `robots.txt`, porque Google necesita rastrearlas para ver el `noindex`

## Regla de sitemap
No hay que usar `sitemap.txt`. La pieza correcta es `sitemap.xml`.

Cada host debe exponer un sitemap solo con URLs:
- canonicas
- indexables
- con respuesta `200`
- sin redireccion
- sin `noindex`

Por tanto:
- `trustcore.es/sitemap.xml` solo debe listar paginas de TrustCore
- `trustintime.es/sitemap.xml` solo debe listar articulos que realmente se quieran indexar en ese dominio
- `trustinfacts.com/sitemap.xml` idem

Nunca metas en sitemap:
- URLs redirigidas
- URLs bloqueadas por robots
- URLs con `noindex`
- URLs duplicadas cuya version principal ya esta en TrustCore

## Regla de redirecciones
Usar `301` permanentes para todas las rutas comerciales antiguas.

Mapeo recomendado:
- home antigua de producto -> landing o bloque equivalente de TrustCore
- precios antigua -> `https://www.trustcore.es/#precios`
- contacto antiguo -> `https://www.trustcore.es/contacto`
- demo antigua -> `https://www.trustcore.es/contacto`
- features antiguas -> producto equivalente dentro de TrustCore

Evitar:
- `302` salvo pruebas temporales
- cadenas de redireccion
- redirigir todo a home si existe una URL mas precisa

## Arquitectura recomendada de enlazado
Desde dominios satelite hacia TrustCore:
- enlaces contextuales dentro del contenido
- CTA editorial al final del articulo
- anchors naturales y variados

Evitar:
- menus enteros duplicados de producto entre dominios
- mismas paginas de precios/contacto repetidas
- interlinking masivo y artificial sitewide con anchors exactos repetidos

## Search Console
Necesitais una propiedad por host relevante:
- `https://www.trustcore.es/`
- `https://trustintime.es/` o dominio final
- `https://trustinfacts.com/` o dominio final

En cada propiedad:
- enviar sitemap propio
- revisar exclusiones
- validar cobertura despues de redirecciones
- vigilar canibalizacion por consultas de marca y producto

## Despliegue recomendado por fases
### Fase 1
- consolidar TrustCore como web comercial unica
- mantener robots y sitemap actuales de TrustCore
- dejar listas las URLs destino de producto, precios y contacto

### Fase 2
- decidir que contenidos de satelite sobreviven por valor SEO real
- clasificar cada URL satelite en una de estas acciones:
  - mantener indexable
  - mover a TrustCore con `301`
  - dejar `noindex`
  - eliminar con `410` si no aporta nada

### Fase 3
- desplegar redirecciones `301` en rutas comerciales antiguas
- rehacer `robots.txt` y `sitemap.xml` por dominio
- revisar canonicals de todas las paginas que se conservan

### Fase 4
- reenviar sitemaps en Search Console
- inspeccionar URLs clave
- monitorizar 2-6 semanas impresiones, clics, cobertura y canibalizacion

## Riesgos a evitar
- dejar paginas comerciales duplicadas indexables en varios dominios
- meter en sitemap URLs redirigidas o con `noindex`
- usar canonical cruzado como sustituto de una migracion real
- bloquear por robots una pagina a la que quieres aplicar `noindex`
- enlazar desde satelites a TrustCore con estructuras de menu casi clonadas

## Estado actual de TrustCore
- `robots.txt` ya permite rastreo y declara `sitemap.xml`
- `sitemap.xml` ya existe y usa `hreflang`
- las paginas principales revisadas tienen `canonical` y `robots` correctos

## Siguiente ejecucion recomendada
1. Inventario de URLs de `trustintime.es` y `trustinfacts`.
2. Clasificacion por URL: `keep`, `301`, `noindex`, `410`.
3. Tabla final de redirecciones por dominio.
4. Ajuste de `robots.txt` y `sitemap.xml` de cada host en el mismo despliegue.