# Fase 0 · Línea base (2026-08-15, antes del rediseño)

Medido sobre `site/index.html` servido en local, con todos los `data-reveal`
forzados a visibles.

## Métricas

| Métrica | Antes | Objetivo |
|---|---|---|
| Alto a 1440px | **8.581 px** | reducir de forma medible |
| Alto a 768px | **10.784 px** | — |
| Alto a 375px | **15.313 px** | — |
| Secciones `<section>` | 9 | ~11 bloques conceptuales |
| Tarjetas / bloques | 59 | — |
| **Etiquetas de CTA únicas** | **17** | **≤3** |
| "cumplimiento" | 5 | ≤3 |
| "VeriFactu" + "VERI*FACTU" | 18 | ≤4 |
| "Inspección" | 4 | ≤2 |
| "legal" | 7 | ≤3 |
| "sanciones" | 3 | 0 en portada |

Capturas "antes": `home-1440.png`, `home-768.png`, `home-375.png` (esta carpeta).

### Las 17 etiquetas de CTA

Blindar mi empresa (demo 15 min) · Agendar demo · Agendar demo 15 min ·
Agendar demo en 1 click · Demo 15 min · Enviar consulta · Ver TrustinFacts ·
Ver TrustinTime · Ver VERI*FACTU + IPSI · Ver comparativa · Ver guía completa ·
Ver precios · Ver todos los planes detallados · Ver vídeos cortos · Conoce
nuestra visión completa · #1 CeutaTech Summit… · rami@trustcore.es

Esto es exactamente lo que describe el brief: *"la repetición de CTAs con
nombres diferentes"*. Cada nombre distinto obliga a decidir otra vez.

## Auditoría de activos

### ✅ Disponibles — no bloquean ninguna fase

| Activo | Detalle | Usar en |
|---|---|---|
| `trustinfacts-dashboard.png` | 1919×1027, 112 KB | Hero, pestaña Facturación |
| `trustintime-dashboard.png` | 1906×915, 348 KB | Pestaña Equipo |
| `trustintime-ausencias.png` | 1905×914, 352 KB | Pestaña Información |
| `trustintime-app-screenshot.jpeg` | 921×2048 | App móvil |
| Vídeos de producto | `/videos/aprende/trustinfacts/*.mp4` en S3, verificados 206 | Fase 7 · demo |
| Premios | Ceuta Tech Summit 2026 + Alhambra Venture | Fase 4 · línea |
| Testimonios atribuibles | Antonio González (IDEAL), José Diestro (Procesa) — ambos jurado | Prueba social |

**Hallazgo importante:** los vídeos de `/aprende` son grabaciones reales de
pantalla del producto (crear factura, cobrar venta, crear cliente) y **ya están
en producción**. Sirven como el vídeo de 20–30s que pide el brief sin grabar
nada nuevo.

### ❌ Bloqueados — requieren a Rami

| Falta | Fase | Por qué no se puede resolver aquí |
|---|---|---|
| Logos de cliente (Barnosi, Fariña, Sofertón, Mármoles Román, El Técnico, Gestoría Mughili) | 4 | No están en `site/assets/` y el brief exige permiso explícito de uso |
| Caso real con cifras ("antes X horas, ahora Y") | 7 | Requiere dato verificable del cliente. **No inventar.** |
| URL de "Entrar" (login) | 2 | No hay ninguna app enlazada desde el sitio actual |

### ⚠️ Restricción legal ya conocida

Los logos de aceleradora e institucionales (`acelerado-telefonica.png`,
`logo-impulsa-startup.png`, `COF_logo.png`,
`logos-camara-fondos-europeos.png`) **no se recortan, recolorean ni
redimensionan**. Se usan tal cual o no se usan.

## Plan de ejecución sin Rami

| Fase | Estado |
|---|---|
| 1 · Base visual | ✅ completa |
| 2 · Navegación | ⚠️ sin "Entrar" (no hay URL de login) |
| 3 · Hero con producto | ✅ completa (hay captura real) |
| 4 · Confianza | ⚠️ solo premios; la franja de logos queda pendiente |
| 5 · Problema → transformación | ✅ completa |
| 6 · Plataforma por pestañas | ✅ completa (3 capturas + panel de Trusty) |
| 7 · Beneficios + vídeo + precios | ⚠️ sin caso real de cliente |
| 8 · FAQ + cierre | ✅ completa |
