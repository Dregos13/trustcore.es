# Reglas de copy — promesas, CTAs y vocabulario

## 1. Promesas: el riesgo es legal, no estético

El brief avisa: *"pueden percibirse como garantías jurídicas"*. TrustCore vende
software de cumplimiento a pymes; una frase absoluta en portada es una promesa
que la empresa tendría que sostener si alguien la reclama.

**Tabla de sustitución — obligatoria en portada y en cualquier página nueva:**

| ❌ No usar | ✅ Usar |
|---|---|
| "100% cumplimiento cubierto" | "Preparado para los requisitos de VeriFactu" |
| "0 sanciones en 18 meses" (como métrica principal) | Retirar de portada; si se usa, atribuido y fechado |
| "firma legal" | "evidencias trazables y exportables" |
| "Tú firmas. Nosotros ponemos las pruebas." | "Registros diseñados para facilitar una revisión" |
| "cumple el RDL 8/2019" | "te ayuda a cumplir el RDL 8/2019" |
| "Blindar mi empresa" | "Ver TrustCore en acción" |

**Matiz que ya usan las páginas de producto y debe subir a portada:** el
cumplimiento depende de la configuración y el uso correcto por parte de la
empresa. Mantener esa precisión.

**Citas y testimonios:** solo si se pueden atribuir y demostrar. Nombre, cargo,
empresa y contexto. Una cita contundente sin atribución verificable se retira.

**Cifras:** toda cifra en portada necesita una referencia clara de qué mide y
de cuándo es. Si no la tiene, fuera. Esto elimina de portada las que el brief
señala como "estadísticas que no aportan una referencia clara".

---

## 2. CTAs: exactamente dos, en toda la página

Del brief: *"Tendría solamente dos acciones coherentes en toda la página"*.

| Nivel | Etiqueta | Destino |
|---|---|---|
| Primaria | **Agendar demo** | Modal de calendario (`data-calendar-open`) |
| Secundaria | **Explorar la plataforma** | Ancla a la sección de módulos |
| Vídeo | **Ver vídeos cortos** | `/aprende` — solo si de verdad reproduce vídeo |

> **Por qué ya no es "Ver demo".** Un lector externo señaló la trampa el
> 16/08/2026: el botón decía *ver* y abría un calendario para reservar media
> hora con el fundador. Quien esperaba un vídeo se sentía engañado, y quien
> estaba listo para agendar no pulsaba porque creía que solo iba a mirar.
> El audit encontró **14 etiquetas distintas para esa misma acción** y 43 CTAs
> que había que renombrar. El verbo tiene que decir lo que pasa: *agendar*
> reserva, *ver* reproduce. Nunca usar "Ver demo" para abrir el calendario.
>
> Misma regla para el pago: "Contratar" solo si lleva a Stripe. En TrustinTime
> decía "Contratar Avanzado" y abría un calendario.

El CTA final (fase 8) es la única excepción permitida: puede usar "Agendar una
demo de 15 minutos" y "Hablar por WhatsApp", porque cierra el recorrido.

**Prohibido** volver a introducir variantes: "blindar", "empezar hoy", "enviar
consulta", "ver producto", "quiero saber más". Cada nombre distinto para la
misma acción obliga al visitante a decidir de nuevo.

Antes de cerrar la fase 8, contar los CTAs distintos de la home. Si salen más de
tres etiquetas únicas, hay trabajo pendiente.

---

## 3. Vocabulario: dejar de repetir

El brief pide reducir *"la repetición de 'cumplimiento', 'legal', 'VeriFactu' e
'Inspección' en casi todas las secciones"*.

**Presupuesto orientativo para la home completa:**

| Término | Máximo |
|---|---|
| "cumplimiento" | 3 |
| "VeriFactu" | 4 (hero, módulos, precios, FAQ) |
| "Inspección" | 2 |
| "legal" | 3 |

Medir con `grep -o` sobre `site/index.html` al cerrar cada fase. Si se supera,
reescribir en términos de beneficio ("controla", "organiza", "sin perseguir
papeles") en vez de en términos de norma.

---

## 4. Tono

De `docs/brand-voice.md` y del brief: plain, factual, cercano. Español de
España. Sin jerga de startup, sin superlativos vacíos, sin "revolucionario" ni
"líder".

El brief lo resume: *"Una marca española cercana"* y *"un producto preparado
para empresas reales, no una startup abstracta"*.

**Nunca** exponer jerga interna al usuario (ya pasó: "S3 pendiente",
"Cuando subas un MP4 a CloudFront"). El visitante no sabe qué es CloudFront.

---

## 5. Coherencia de precios

Los precios los manda **`site/precios.html`**. Es la fuente de verdad.

Estado correcto a fecha 2026-08-15:

| Producto | Planes |
|---|---|
| TrustinTime | Básico 5,99 · Estándar 6,99 · Avanzado 7,99 (€/usuario/mes) |
| TrustinFacts | Starter 19,99 · Pro 39,99 · Business 49,99 (€/mes) |

Ya hubo un desajuste grave: la portada y las páginas de producto anunciaban
2 €/usuario/mes y 9,99 €/mes, tarifas que no existían. Al tocar precios en
portada, verificar con:

```bash
grep -rohE '[0-9]+(,[0-9]{2})? ?&?(euro;|€) ?/?(usuario|empleado)?/?mes' site --include='*.html' \
  | sed 's/&euro;/€/g' | sort | uniq -c
```

Solo deben aparecer esos seis importes. Y actualizar también `lowPrice`/
`highPrice` del JSON-LD de cada página de producto.
