# Sistema visual — traducción del brief a este repositorio

El brief describe la dirección. Este documento la baja a los tokens y clases
que **ya existen** en `site/assets/css/`, para no inventar un sistema paralelo.

---

## Superficies: una base común, no un color por sección

El brief es explícito: *"No llenaría cada sección con un color diferente"* y
*"cada cambio de color anuncia otra sección más"*.

**Regla:** toda la home vive sobre **una única base clara**. Solo hay dos
excepciones oscuras en toda la página.

| Uso | Valor | Cuándo |
|---|---|---|
| Base | `--tc-surface-alt` (`#F8FAFC`) | Fondo por defecto de la página |
| Tarjeta | `--tc-surface` (`#FFFFFF`) | Tarjetas y paneles sobre la base |
| Oscuro | `--tc-navy` → `--tc-blue-corp` | **Solo** hero y CTA final |

Nota: `bg-slate-50` de Tailwind y `--tc-surface-alt` son **el mismo color**
(`#F8FAFC`). Alternarlos con `bg-white` crea costuras sin aportar jerarquía —
fue una de las causas del efecto "bloque detrás de bloque". Usar un solo token.

### Prohibido

- Un fondo verde de sección completa.
- Fondos cian/celeste saturados (los orbes ya están al 16%; no subirlos).
- Más de dos secciones oscuras en la home.

### Transiciones

Las secciones oscuras usan `.tc-blend` (ya en `components.css`), que funde su
degradado hacia el color de la sección vecina con capas de `background-image`.

```html
<section class="tc-blend" style="--blend-base: linear-gradient(...); --blend-to: #F8FAFC">
```

No usar pseudo-elementos para esto: crearían contextos de apilamiento y taparían
contenido.

---

## Color con significado

| Color | Token | Significado exclusivo |
|---|---|---|
| Azul TrustCore | `--tc-blue-royal` | **Acción.** Botones primarios, enlaces |
| Azul marino | `--tc-navy` | Texto de titulares, superficies oscuras |
| Verde | `--tc-success` | **Solo estados positivos dentro del producto** |
| Oro | `--tc-gold` | Solo premios/reconocimiento, uso mínimo |

**El verde es la regla más importante de este bloque.** Del brief: *"El verde
no debería actuar como fondo de una sección completa. Tiene más fuerza si
representa una confirmación dentro del producto"*.

Usos válidos del verde, todos dentro de una captura o tarjeta de producto:
"Factura validada", "Jornada registrada", "Documento firmado", "Pagado".

Uso inválido: fondos de sección, badges decorativos, checks de listas de
features genéricas.

---

## Tipografía

Ya ajustada (ver commit `fd19ee9`). No volver a subirla.

| Clase | Tamaño máx. | Uso |
|---|---|---|
| `.tc-display-xl` | 56px | Solo el H1 del hero |
| `.tc-display-lg` | 40px | H2 de sección |
| `.tc-display-md` | 30px | H3 destacado |

`.tc-display` lleva `max-width: 20ch` y `text-wrap: balance`. Si un titular
necesita más ancho, **acortar el titular**, no ampliar el límite.

Cuerpo: 16px mínimo, `line-height` 1.5–1.65, medida de línea máx. ~65 caracteres
(`.tc-section-head__lead` ya usa `48ch`).

---

## Composición: conectar, no apilar

El brief pide *"mucho espacio, pero con una composición que conecte los
elementos"*. Traducción práctica:

- **Cabecera de sección asimétrica** — usar `.tc-section-head` (titular
  izquierda / lead derecha). Ya existe. El centrado (`--center`) queda
  reservado para el CTA final.
- **Capturas grandes y parcialmente superpuestas** — la captura debe romper el
  borde de su contenedor o solaparse con la tarjeta vecina. Nada de una imagen
  centrada dentro de una caja con margen uniforme.
- **Elementos flotantes con datos reales** — tarjetitas ancladas sobre la
  captura ("12 empleados fichando"). Datos reales del producto, nunca lorem.
- **Alternar el peso**, no el color: una sección puede ser dos columnas
  60/40, la siguiente una franja horizontal, la siguiente una rejilla. La
  variación viene de la composición.

## Bordes, sombras y radios

Usar exclusivamente la escala existente: `--tc-radius-lg/xl/2xl`,
`--tc-shadow-xs/sm/md/lg`. Sombras contenidas: nada por encima de
`--tc-shadow-lg` salvo el panel principal de una captura destacada.

---

## Iconografía

Sprite SVG en `site/assets/icons/sprite.svg`, vía `<svg class="tc-icon"><use href="/assets/icons/sprite.svg#fa-nombre"/></svg>`.

**No usar la webfont de Font Awesome.** No está cargada en el sitio; cuatro
reglas `::before` que la pedían salían como cuadraditos (□) y se arreglaron en
`fd19ee9`. Si hace falta un icono en un pseudo-elemento, ir a `background-image`
con el path del sprite como data URI — con **comillas simples** dentro del SVG y
el color en `rgb()` (un `#` se re-codifica a `%2523` y el icono sale negro).

**Nada de emojis como iconos.**

---

## Movimiento

- `data-reveal` / `.tc-auto-reveal` ya aplican aparición al hacer scroll con
  stagger. Respetan `prefers-reduced-motion`.
- Micro-interacciones 150–300ms. Nada por encima de 400ms.
- Animar solo `transform` y `opacity`.
- El vídeo de producto (fase 5) va silenciado, en bucle, `playsinline`, con
  `poster` y `loading="lazy"`. No debe bloquear el LCP.

---

## Accesibilidad — no negociable

- Contraste 4.5:1 en texto normal, 3:1 en texto grande. Verificar sobre las
  superficies claras nuevas, donde es fácil quedarse corto con grises.
- Las **pestañas** de la sección de plataforma necesitan `role="tablist"`,
  `role="tab"`, `aria-selected`, `aria-controls` y navegación con flechas.
- Los **acordeones** de la FAQ: usar `<details>/<summary>` nativo o botones con
  `aria-expanded`. El contenido debe seguir en el DOM aunque esté colapsado
  (requisito de AEO).
- Área táctil mínima 44×44px.
- Foco visible en todo lo interactivo.
