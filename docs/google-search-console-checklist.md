# Checklist operativo de indexacion Google (TrustCore)

Fecha de referencia: 2026-04-02
Objetivo: validar que ES/EN/FR indexan correctamente y que no hay conflictos de canonical o hreflang.

## 1) Enviar sitemap
1. Entra en Google Search Console (propiedad `https://www.trustcore.es/` o de dominio).
2. Abre `Sitemaps`.
3. Envia: `https://www.trustcore.es/sitemap.xml`.
4. Esperado: estado `Success`.

## 2) Inspeccion URL (muestra minima)
Inspecciona y solicita indexacion de estas 9 URLs:
- `https://www.trustcore.es/`
- `https://www.trustcore.es/en/`
- `https://www.trustcore.es/fr/`
- `https://www.trustcore.es/article`
- `https://www.trustcore.es/en/article`
- `https://www.trustcore.es/fr/article`
- `https://www.trustcore.es/control-horario-fichaje-remoto-sin-riesgos`
- `https://www.trustcore.es/en/control-horario-fichaje-remoto-sin-riesgos`
- `https://www.trustcore.es/fr/control-horario-fichaje-remoto-sin-riesgos`

Esperado por URL:
- `URL is on Google` (tras rastreo).
- `User-declared canonical` = `Google-selected canonical`.
- Detecta `Page is indexable`.

## 3) Informe de paginas (Indexing > Pages)
Revisa y filtra por causas:
- `Alternate page with proper canonical`: debe existir, pero no dispararse de forma anomala.
- `Duplicate without user-selected canonical`: deberia tender a 0.
- `Crawled - currently not indexed`: vigilar tendencia tras 7-14 dias.
- `Discovered - currently not indexed`: vigilar si crece en EN/FR.

Accion si sube una causa:
- abrir ejemplos,
- comprobar canonical/hreflang en HTML,
- validar que la URL esta en sitemap,
- relanzar validacion (`Validate fix`).

## 4) Verificacion de internacionalizacion
Con inspeccion URL, valida que Google detecta alternates ES/EN/FR.

Comprobaciones clave por pagina:
- `rel=canonical` apunta a si misma por idioma.
- `hreflang` incluye `es`, `en`, `fr`, `x-default`.
- Cada version referencia reciprocamente a las otras 2.

## 5) Cobertura de descubrimiento interno
Comprueba navegacion real:
- Selector de idioma cambia entre equivalentes de la misma pagina.
- `article` en EN/FR enlaza a sus 10 articulos localizados.

## 6) KPI de control (primeras 2 semanas)
- Dia 1: sitemap enviado + 9 URLs inspeccionadas.
- Dia 3-5: primeras URLs EN/FR en estado `Indexed`.
- Dia 7: revisar crecimiento de impresiones EN/FR en `Performance`.
- Dia 14: revisar causas de exclusion y revalidar fixes.

## 7) Riesgos comunes a vigilar
- Canonical cruzado accidental (ej. EN canonica a ES).
- Hreflang no reciproco por despliegue parcial.
- URLs sin enlazado interno suficiente (especialmente FR).
- Diferencias de contenido muy bajas entre idiomas (puede ralentizar indexacion).

## Estado tecnico actual (repo)
- `robots.txt` permite rastreo y declara sitemap.
- `sitemap.xml` incluye 39 URLs (13 slugs x 3 idiomas) con alternates `xhtml:link`.
- HTML en ES/EN/FR con canonical y hreflang reciproco.
