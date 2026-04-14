# Mapa de clasificacion de URLs para consolidacion de dominios

Fecha de referencia: 2026-04-13
Objetivo: decidir que URLs se mantienen en dominios satelite y cuales se consolidan en `trustcore.es`.

## Resumen ejecutivo
- `trustintime.es`: hoy es una web puramente comercial. Recomendacion: no mantenerla como dominio indexable comercial. Consolidar casi todo en TrustCore.
- `trustinfacts.com`: mezcla web comercial y blog. Recomendacion: mantener solo el blog y retirar o redirigir las URLs comerciales.
- Riesgo actual: en `trustinfacts.com` el blog real tiene muchas mas URLs que las incluidas en su `sitemap.xml`, asi que ahora mismo el sitemap esta incompleto.

## Nota critica antes de aplicar 301
Para ejecutar redirecciones de producto correctamente, TrustCore deberia tener URLs propias estables de producto, no solo anchors internos.

Destino recomendado futuro:
- `https://www.trustcore.es/productos/trustintime`
- `https://www.trustcore.es/productos/trustinfacts`
- `https://www.trustcore.es/precios`
- `https://www.trustcore.es/contacto`

Si esas URLs aun no existen, se puede hacer una fase intermedia con destino a `contacto` o a la home, pero no es la opcion ideal para SEO.

## Clasificacion: trustintime.es
### Inventario detectado
- `/`
- `/precios.html`
- `/robots.txt`
- `/sitemap.xml`

### Accion recomendada
- `/` -> `301`
  Destino ideal: `https://www.trustcore.es/productos/trustintime`
  Destino temporal aceptable: `https://www.trustcore.es/contacto`
  Motivo: home comercial duplicada.
- `/precios.html` -> `301`
  Destino ideal: `https://www.trustcore.es/precios`
  Destino temporal aceptable: `https://www.trustcore.es/#precios`
  Motivo: precios no deben vivir fuera de TrustCore.
- `/robots.txt` -> mantener
  Motivo: archivo tecnico del host.
- `/sitemap.xml` -> rehacer o vaciar segun fase
  Fase final recomendada: no listar URLs comerciales que redirigen.

### Regla general para trustintime.es
- Mantener el dominio solo como redireccion comercial completa o como dominio sin contenido indexable.
- No recomiendo dejarlo como blog salvo que vayais a crear contenido editorial original y sostenido sobre control horario.

## Clasificacion: trustinfacts.com
### URLs comerciales detectadas en sitemap y archivos
- `/`
- `/precios.html`
- `/quienes-somos.html`
- `/contacto.html`
- `/faq.html`
- `/ayuda.html`
- `/legal.html`

### Accion recomendada para URLs comerciales
- `/` -> `301`
  Destino ideal: `https://www.trustcore.es/productos/trustinfacts`
  Destino temporal aceptable: `https://www.trustcore.es/contacto`
- `/precios.html` -> `301`
  Destino ideal: `https://www.trustcore.es/precios`
  Destino temporal aceptable: `https://www.trustcore.es/#precios`
- `/contacto.html` -> `301`
  Destino: `https://www.trustcore.es/contacto`
- `/quienes-somos.html` -> `301`
  Destino recomendado: `https://www.trustcore.es/#nosotros`
  Mejor aun: pagina corporativa equivalente futura dentro de TrustCore.
- `/faq.html` -> `301` o `noindex`
  Si el contenido se integra en TrustCore: `301`
  Si se mantiene temporalmente: `noindex, follow`
- `/ayuda.html` -> `301` o `noindex`
  Igual criterio que FAQ.
- `/legal.html` -> mantener o `noindex`
  Si es la pagina legal del dominio y el dominio sigue vivo para el blog, debe mantenerse accesible.
  Si el dominio deja de servir contenido propio, puede redirigirse o quedarse solo como pagina tecnica.

### URLs editoriales detectadas en sitemap
- `/blog/guia-basica-ip-si-ceuta-melilla.html`
- `/blog/errores-frecuentes-iva-ipsi.html`
- `/blog/checklist-fiscal-trimestral-autonomos.html`

### URLs editoriales detectadas en el directorio blog
- `/blog/`
- `/blog/checklist-facturacion-autonomos.html`
- `/blog/checklist-fiscal-trimestral-autonomos.html`
- `/blog/como-facturar-ipsi-clientes-peninsula-ue.html`
- `/blog/errores-declarar-ipsi-autonomos.html`
- `/blog/errores-frecuentes-iva-ipsi.html`
- `/blog/excel-vs-programa-facturacion.html`
- `/blog/gastos-deducibles-autonomos-facturacion.html`
- `/blog/guia-basica-ip-si-ceuta-melilla.html`
- `/blog/informes-facturacion-autonomos.html`
- `/blog/ipsi-ecommerce-ceuta-melilla.html`
- `/blog/ipsi-vs-iva-diferencias-ceuta-melilla.html`
- `/blog/modelo-130-ipsi.html`
- `/blog/organizar-facturas-cierre-trimestral.html`
- `/blog/perder-miedo-hacienda-entendiendo-numeros.html`
- `/blog/plantilla-factura-ipsi.html`
- `/blog/plantilla.html`
- `/blog/preparar-informacion-gestor-facturas.html`
- `/blog/programa-facturacion-ipsi-iva.html`
- `/blog/revisar-facturas-antes-gestor.html`
- `/blog/riesgos-facturacion-errores-impuestos.html`
- `/blog/trustinfacts-ipsi-iva-mixtos.html`

### Accion recomendada para URLs editoriales
- `/blog/` -> `keep`
  Motivo: hub editorial del dominio satelite.
- Articulos del blog -> `keep`, salvo revision de duplicidad con TrustCore.
  Regla: mantener solo piezas originales y utiles.
- `/blog/plantilla.html` -> revisar manualmente
  Motivo: nombre demasiado generico; puede ser plantilla tecnica o pagina no preparada para indexar.
  Accion provisional: `noindex` hasta revisar.
- Cualquier post que duplique casi literalmente uno de TrustCore -> mover a TrustCore y aplicar `301`.

## Riesgos detectados
### 1. Sitemap incompleto en trustinfacts.com
El `sitemap.xml` solo lista 3 posts del blog, pero el directorio contiene bastantes mas. Eso genera una señal incompleta a Google.

Accion recomendada:
- rehacer `trustinfacts.com/sitemap.xml` para incluir solo:
  - URLs blog indexables
  - URLs `200`
  - URLs con `canonical self`
  - URLs sin `noindex`
- sacar del sitemap todas las URLs comerciales si se redirigen o pasan a `noindex`

### 2. Canonicals comerciales aun activos fuera de TrustCore
Las homes y precios de ambos dominios tienen `canonical self` y `index,follow`, lo que hoy indica a Google que deben seguir compitiendo.

Accion recomendada:
- si una URL se migra, usar `301`
- si una URL debe desaparecer temporalmente sin redireccion, usar `noindex, follow`

### 3. Mezcla de estrategia en trustinfacts.com
El dominio quiere ser a la vez producto y blog. Eso diluye foco de marca y señal SEO.

Accion recomendada:
- dejar en `trustinfacts.com` solo el bloque editorial
- mover conversion, precios y contacto a TrustCore

## Politica final por dominio
### trustcore.es
- web principal de marca
- producto
- precios
- comparativa
- contacto
- demo
- conversion

### trustintime.es
- opcion A recomendada: solo redirecciones `301`
- opcion B: mantener un blog real sobre control horario, pero solo si vais a producir contenido de forma sostenida

### trustinfacts.com
- mantener como blog satelite sobre facturacion, IPSI, IVA y fiscalidad practica
- eliminar o redirigir todo lo comercial

## Orden de ejecucion recomendado
1. Crear en TrustCore URLs finales de producto y precios sin depender de anchors.
2. Clasificar definitivamente cada post del blog TrustInFacts como `keep` o `move`.
3. Rehacer `sitemap.xml` de TrustInFacts con solo URLs editoriales validas.
4. Aplicar `301` en TrustInTime y en las URLs comerciales de TrustInFacts.
5. Revisar `robots.txt` por dominio.
6. Reenviar sitemaps en Search Console.
