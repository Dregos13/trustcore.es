# Plan Proqio — llevar trustcore.es al nivel de proqio.com

> Documento de trabajo. La versión presentada está publicada como artifact.
> Decisiones cerradas por Rami el 15/08/2026:
> **(1)** Adoptamos la *estructura* de Proqio con el color de TrustCore (navy + cian), no su paleta oscura.
> **(2)** Alcance completo: rediseño visual + páginas por sector + casos de uso + `/funcionalidades` y `/como-funciona`.
> **(3)** Hero con captura de producto grande mejorada (no foto).

---

## 1. Línea base medida (15/08/2026)

| Métrica | trustcore.es | proqio.com |
|---|---|---|
| Alto de la home @1440 | 6.877 px | 7.822 px |
| Nº de `<section>` en la home | 11 | 11 |
| Peso del HTML de la home | 61 KB | 712 KB |
| Scroll horizontal @1440 | no | **sí (bug suyo)** |
| Páginas HTML totales | 35 | ~60 + 73 de help center |
| Páginas por sector | 0 | 13 (`/application/*`) |
| Casos de cliente | 0 | 4 (`/use-cases/*`) |
| Página de precios | sí | **no** |
| `FAQPage` JSON-LD | 6 páginas | 0 |
| `meta keywords` (obsoleto) | no | sí, 11 términos |

**Conclusión:** el problema no es cantidad de contenido, es densidad y oficio. Misma longitud, mismo número de secciones, resultado muy distinto.

---

## 2. Los 12 mecanismos de Proqio que hay que adoptar

1. **Lenguaje de paneles a dos niveles.** Fondo base + panel con borde de 1 px y radio 16 px. Nunca contenido flotando sobre el fondo desnudo.
2. **Paneles *spotlight* a sangre** (radio 40 px, color de acento como fondo) para romper el ritmo una o dos veces por página.
3. **Eyebrow como chip**, no como línea con guion. `BENEFICIOS` en píldora, 12 px, uppercase, tracking .12em.
4. **Palabra clave en color dentro del H1.** «Your **all-in-one** platform». Coste cero, impacto alto.
5. **Escala tipográfica valiente.** H1 90 px, H2 48 px. Hoy vamos a 76/44.
6. **Raíles horizontales** con scroll-snap y puntos para inventarios largos (sectores, casos, testimonios). Enseñan 6–9 elementos sin alargar la página.
7. **Sustantivo subrayado** en cada titular de funcionalidad (`Dynamic Map`, `Heatmaps`, `Dashboards`).
8. **Filas alternas captura+texto a tamaño real.** La captura ocupa la mitad del ancho, con marco y sombra. Nunca recortada a media tabla.
9. **Franja de logos** sobre banda de color ligeramente distinto, inmediatamente después de las tarjetas de sector.
10. **Tarjetas-foto a sangre** con el título superpuesto, para proyectos/casos.
11. **Métricas al final**, sobre banda propia, justo antes del pie — no en el hero.
12. **Pie de 4 columnas denso**, con columna legal completa. Señal barata de empresa real.

---

## 3. Lo que Proqio hace MAL — no copiar

- `<meta name="keywords">` con 11 términos apilados. Obsoleto desde 2009.
- Cuatro bloques JSON-LD con la misma entidad declarada como `LocalBusiness`, `Organization` **y** `Corporation`.
- Un `BreadcrumbList` falso que declara los 12 enlaces del menú como posiciones 1–12. Esto no es una miga de pan; es *structured data* engañoso.
- Erratas dentro del JSON-LD: `"Applicatrion"`, `"How its Works"`.
- URLs del JSON-LD que no existen: `/privacy-policies`, `/legal-advice`, `/how-its-works`.
- 712 KB de HTML en la portada.
- Scroll horizontal a 1440 px.
- **Cero `FAQPage`.** Nosotros tenemos 6. No lo cambiamos por nada.
- **Cero precios.** Nuestro comprador necesita el precio.
- Copy genérico de marketing: «Embark on a transformative journey», «Unleash the power». Prohibido por `copy-rules.md`.
- Métricas sin referente: «+2K Actionable Insights». También prohibido.

**Regla:** copiamos su forma, mantenemos nuestro fondo.

---

## 4. Bugs propios detectados en la auditoría

| Fichero | Problema |
|---|---|
| `site/app-verifactu-ceuta-melilla-trustinfacts.html` | sin `<h1>` |
| `site/facturacion-ceuta-melilla-peninsula-ipsi.html` | sin `<h1>` |
| `site/ventajas-verifactu-pymes-autonomos.html` | sin `<h1>` |
| `site/verifactu-autonomos-2027-checklist.html` | sin `<h1>` |
| `site/verifactu-ventajas-gestorias-comercios.html` | sin `<h1>` |
| `site/comparativa.html` | 4 KB huérfanos: sin description, sin `<h1>`, sin JSON-LD, fuera del sitemap |
| `site/aviso-legal.html`, `cookies.html`, `privacidad.html`, `terminos.html` | descriptions de 23–35 caracteres |
| Banner de cookies | modal centrado de ~920 px que tapa el viewport en todas las capturas |
| Burbuja de Trusty | píldora de ~250 px que se solapa con el banner de cookies |
| Home, tras «Una factura de principio a fin» | vacío vertical de ~350 px |
| Home, tras el teaser de precios | vacío vertical de ~370 px |
| Capturas de producto | ~600 px de ancho, recortadas a media tabla |
| Teaser de precios | tres cajas idénticas, sin plan recomendado |
| Pie | logos de aceleradoras **después** de la línea de copyright |

> Los logos de Telefónica / Ciudad Autónoma / El Ángulo **no se redimensionan ni se recortan**. Solo se mueven de sitio.

---

## 4 bis. Estado (15/08/2026)

| Fase | Estado | Nota |
|---|---|---|
| F0 · Sangrado | **hecha** | Los 5 artículos tenían el HTML roto, no solo el `h1` que faltaba |
| F1 · Sistema visual | **hecha** | Escala a 72/48/34 (no 90: había una decisión documentada en contra) |
| F2 · Home recompuesta | **hecha** | Suite completa marcada como «La más completa» |
| F3 · /funcionalidades y /como-funciona | **hecha** | Poster propio por vídeo; 3 vídeos de TrustinTime dan 404 |
| F4 · Páginas por sector | **hecha (2 de 2)** | No hay segmentación: dos perfiles, no seis sectores |
| F5 · Casos de uso | **parcial** | `/clientes` publicada; sin logos ni cifras (ver abajo) |
| F6 · Navegación y pie | **hecha** | Un solo pie en 38 páginas vía `scripts/footer.mjs` |
| F7 · SEO y AEO | **hecha** | 57 bloques JSON-LD válidos, 32 URLs, sin metadatos incompletos |

### Decisiones tomadas sobre la marcha

- **No se subió a 90px.** `components.css` documentaba por qué se capó a 56px.
  La causa real del problema de entonces no era el tamaño sino el `max-width:
  20ch` que lo acompañaba. Se subieron los dos juntos: 72px y 22ch.
- **Se creó `--tc-blue-eyebrow: #1A5CB0`.** Al teñir el chip con `currentColor`,
  `#2071D5` bajaba de 4,58:1 a 3,87 y dejaba de cumplir AA.
- **Los avales van dentro del hero, no en una franja clara.** `COF_Logo.png` es
  arte blanco sobre transparente: en claro sería invisible y oscurecerlo sería
  alterar logos ajenos.
- **`comparativa.html` no se tocó.** Es un redirect `noindex` deliberado.
  Pendiente de decisión: apunta a `/precios`, no a la comparativa real.
- **F4 baja de seis páginas a dos.** Rami: *«no segmentamos aún los sectores,
  tenemos de todo»*. Inventar una taxonomía de seis sectores habría sido
  fabricar un posicionamiento que la empresa no tiene. Las dos que sí existen
  —`/facturacion-para-tiendas` y `/facturacion-para-instaladores`— salen de los
  dos perfiles que él nombró.
- **Se reconstruyó `tailwind.min.css`.** Dos clases de padding escritas en el
  HTML no existían compiladas y el hero se quedó sin margen inferior. Diff del
  rebuild: 3 selectores fuera (los que dejé de usar), 8 dentro (los nuevos).
  Está en `workflow.md` §21 — cuesta poco olvidarlo y solo se ve en la captura.
- **Los vídeos son la prueba visual, no las capturas.** Hay 26 grabaciones de
  producto publicadas en S3. `/facturacion-para-tiendas` usa
  `ver-venta-y-crear-factura` y `mover-a-tienda`;
  `/facturacion-para-instaladores`, `editar-presupuesto` y
  `registrar-gasto-con-albaran`. Ninguna afirmación de esas páginas va más allá
  de lo que enseña un vídeo o de lo que ya dice `/precios`.

### Sobre F5 — qué se publicó y qué no

Rami autorizó usar los seis clientes que `llms.txt` ya listaba. Se publicó
`/clientes` con lo que se puede sostener y **solo** con eso:

| Sí | No |
|---|---|
| Nombre y ciudad (los de `llms.txt`) | Logotipos: son marca de terceros y no tenemos los ficheros |
| Enlace a su web o ficha pública | Cifras de resultado: nadie nos ha dado ninguna |
| FAQ que explica qué es y qué no es la página | Testimonios: no hay ninguno atribuible |

La página se llama «clientes», no «casos de éxito», porque sin cifras
verificables no es un caso. Cuando haya permiso de logo y datos, se convierte.

De paso arregla una cita rota: `llms.txt` citaba
`https://www.trustcore.es/clientes` **dos veces** como fuente y esa página no
existía. Cualquier modelo que siguiera la cita se comía un 404.

### Sobre los `poster` de los vídeos

Los seis vídeos de `/funcionalidades` compartían el mismo `poster`, así que
hasta pulsar play parecía la misma captura repetida seis veces — justo en la
página que existe para enseñar que son cosas distintas.

Se extrajo un fotograma propio de cada uno con Chromium (la build de ffmpeg que
trae Playwright no lleva el demuxer de MP4). El fotograma no se coge a ciegas:
el de los 2 s cae siempre en una pantalla de carga o en un modal abierto. Se
sacaron cuatro candidatos por vídeo (20/40/60/80 % de la duración) y se eligió a
mano el que ilustra lo que dice el bloque:

| Vídeo | Momento | Qué se ve |
|---|---|---|
| `crear-factura-desde-venta` | 60 % | Venta V1-0002 con sus facturas asociadas y régimen IPSI |
| `editar-presupuesto` | 80 % | Líneas del presupuesto con IPSI al 4 % y el botón «Crear venta» |
| `mover-a-tienda` | 80 % | Modal «Trasladar stock» con origen y destino |
| `registrar-gasto-con-albaran` | 80 % | Alta de factura de proveedor con albaranes vinculados |
| `informes-1` | 80 % | Panel de métricas con facturación, márgenes y KPIs |
| `ver-venta-y-crear-factura` | 80 % | Venta con plan de cuotas y factura asociada |

Rami confirmó que los datos que aparecen son ficticios. Los seis JPEG suman
432 KB en `site/assets/posters/`.

**Regla para el futuro:** un `poster` se carga siempre, lo indexa Google
Imágenes y sale en la vista previa al compartir. Antes de publicar uno nuevo,
mirarlo — no basta con que el vídeo ya sea público.

### Los tres vídeos de TrustinTime no existen

Rami confirmó que esas grabaciones **no están hechas**, no es que falten en S3.
Devuelven 404:

- `/videos/aprende/trustintime/fichar-jornada.mp4`
- `/videos/aprende/trustintime/gestionar-ausencia.mp4`
- `/videos/aprende/trustintime/exportar-informe.mp4`

Qué se hizo:

- **`/aprende` ya lo resolvía solo.** `components.js` comprueba en runtime si el
  fichero responde; si no, deshabilita el botón y escribe «Próximamente». No
  había nada que arreglar en la interfaz.
- **Se retiraron los tres `VideoObject` del JSON-LD.** Declaraban un
  `contentUrl` que responde 404: eso es *structured data* inválido y Search
  Console lo marca. Quedan 29 `VideoObject`, todos con fichero vivo.
- **`/funcionalidades`** usa la captura `trustintime-dashboard.png` en la fila de
  control horario, con una nota que dice que el módulo **sí está disponible**
  desde 5,99 €/usuario/mes y que lo que está en preparación es la grabación.

> **Cuidado con la palabra «próximamente».** Aplica a los vídeos, no al módulo.
> Poner «Próximamente» en el bloque de control horario diría que el producto no
> existe todavía — y se vende desde 5,99 €/usuario/mes, tiene página propia y
> está en `/precios`.

**Aviso de método:** el primer intento de quitar esos `VideoObject` usó un regex
con `.*?` y `DOTALL` sobre JSON anidado. Se comió 130 líneas, incluido un `HowTo`
entero de TrustinFacts. Sobre JSON anidado hay que parsear, no hacer regex.

### Sobre F6 — cómo quedó

El sitio tenía **tres pies distintos** repartidos en 38 páginas: uno completo de
4 columnas (home, precios, productos), uno intermedio y uno ligero de 4 enlaces
en los artículos. Desde un artículo del blog no había forma de llegar a
productos ni a precios.

Decisión de Rami: **el completo, en todas**. Se escribió
`scripts/footer.mjs`, hermano de `nav.mjs`: idempotente, con marcadores
`<!--FOOTER-->` y una sola fuente de verdad. Ahora son cinco columnas —marca +
Producto + Soluciones + Empresa + Legal— con los avales encima del copyright.

Las cuatro páginas legales no tenían pie **ninguno**; se les puso el marcador y
ya lo heredan. Excluidas a propósito: `og-image.html` (plantilla de la imagen
OG), `article.html` y `comparativa.html` (ambas redirigen en la CloudFront
Function).

Al añadir una página nueva basta con meterla en `COLS` y ejecutar el script.

---

## 5. Fases

### F0 · Sangrado (1 sesión)
Arreglar los bugs de la tabla anterior. Banner de cookies a tarjeta discreta abajo-izquierda (máx. 380 px); Trusty a círculo de 56 px. Capturas «antes» a 1440 / 768 / 375.
**Gate:** ninguna página sin `h1`; nada tapa el viewport; `comparativa.html` redirige o se elimina.

### F1 · Sistema visual (tokens + components.css)
Añadir a `tokens.css`: `--tc-panel`, `--tc-panel-border`, `--tc-spotlight`, `--tc-radius-panel: 40px`.
Subir `--tc-text-5xl` a `clamp(2.75rem, 2rem + 4.5vw, 5.625rem)` (90 px).
Bajar `--tc-section-pad-y` a `clamp(3.5rem, 5vw, 5.5rem)` y sustituir márgenes internos por `gap`.
Nuevas clases en `components.css`: `.tc-chip`, `.tc-panel`, `.tc-spotlight`, `.tc-shot`, `.tc-rail`, `.tc-underline`, `.tc-logostrip`.
**Gate:** capturas a los tres anchos; ningún hueco vertical > 120 px; sin regresión de contraste.

### F2 · Home recompuesta
Orden final (12 bloques, mapeados 1:1 a los de Proqio):
1. Hero — captura grande a sangre por la derecha, palabra clave en cian dentro del H1
2. Franja de avales (Telefónica / Ciudad Autónoma / El Ángulo / COF)
3. «Todos los datos de tu empresa. Una sola plataforma» — 6 chips de tipo de dato
4. «Pensado para tu sector» — raíl de 6 tarjetas → páginas de sector
5. Casos reales — raíl de tarjetas-foto *(bloqueado, ver F5)*
6. Beneficios — 3×2 tarjetas con icono
7. Testimonios — raíl
8. Spotlight azul claro: Trusty, «Soporte con personas de verdad»
9. Funcionalidades — 5 filas alternas captura+texto con sustantivo subrayado
10. Precios resumidos — 3 rutas, una destacada
11. FAQ plegable (mantener `FAQPage`)
12. Métricas honestas en franja + CTA final navy
**Gate:** capturas revisadas a mano; importes coherentes con `/precios`; sin scroll horizontal a 375.

### F3 · `/funcionalidades` y `/como-funciona`
Dos plantillas nuevas. La primera son filas alternas (patrón de `/features`). La segunda, 4 pasos numerados (patrón de `/how-it-works`) — la numeración se justifica porque **es** una secuencia real de alta.
**Gate:** ambas enlazadas desde el menú Producto y desde el pie.

### F4 · Páginas por sector
`/soluciones/comercio`, `/hosteleria`, `/taller`, `/clinica`, `/autonomo` (+ `/gestoria`, que ya existe y se reconvierte a la plantilla).
Plantilla de 8 bloques calcada de `/application/tunnel`: contexto del sector → problema concreto → cómo lo resuelve TrustCore → capacidades por módulo → beneficios en lista → precio de entrada → FAQ del sector → CTA.
Cada una con `FAQPage` + `BreadcrumbList` **reales** + entrada en `sitemap.xml` y en `llms.txt`.
**Gate:** 6 páginas, ninguna canibaliza a otra (revisar solapamiento de keywords), todas enlazadas desde el raíl de la home.

### F5 · Casos de uso — BLOQUEADO
`/casos` + fichas individuales. **No se puede empezar sin:** un cliente real, permiso escrito de uso de nombre y logo, y cifras verificables. Nunca inventar. Mientras no exista, el bloque 5 de la home no se publica.

### F6 · Navegación y pie
Menú: **Producto · Soluciones · Precios · Recursos · Entrar** + «Ver demo».
Producto → Facturación, Control horario, Trusty, Funcionalidades, Cómo funciona.
Soluciones → los 6 sectores + Casos.
Recursos → Blog, Aprende, Comparativa, Guías.
Pie a 4 columnas con los avales **encima** del copyright.
**Gate:** ninguna página huérfana; sin enlaces rotos.

### F7 · SEO / AEO
Ampliar `sitemap.xml` y `llms.txt` con lo nuevo. `SoftwareApplication` con `AggregateOffer` en las páginas de sector. Mantener los 6 `FAQPage`. Descriptions de 140–160 en las legales. Revisar canónicas de las páginas nuevas.
**Gate:** 0 páginas sin `h1`, sin description, o fuera del sitemap. JSON-LD validado.

---

## 6. Gate final

- [ ] Ningún hueco vertical > 120 px en ninguna página comercial
- [ ] Toda captura de producto ≥ 640 px de ancho y sin recortes a media tabla
- [ ] Ningún elemento flotante tapa contenido a 375 px
- [ ] ≤ 3 etiquetas de CTA distintas por página
- [ ] Ninguna promesa de la tabla prohibida de `copy-rules.md`
- [ ] Ninguna métrica sin referente verificable
- [ ] Logos de aceleradoras sin redimensionar
- [ ] JSON-LD válido y sin entidades duplicadas
- [ ] Capturas revisadas a mano a 1440 / 768 / 375
