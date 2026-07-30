# TrustCore content playbook

## Objetivo

El contenido público debe reforzar confianza antes de Alhambra Venture: explicar VeriFactu 2027, IPSI Ceuta/Melilla, control horario y la relación península - ciudades con régimen especial sin prometer resultados legales que dependan del uso que haga cada cliente.

## Clusters editoriales

1. VeriFactu 2027
   - Calendario y preparación por tipo de obligado.
   - Checklist para autónomos.
   - Flujo presupuesto -> factura -> rectificativa -> cobro -> asesoría.

2. IPSI y actividad Ceuta/Melilla - península
   - Diferencias operativas entre IVA e IPSI.
   - Casos de facturación entre territorios.
   - Errores habituales del software genérico.

3. Control horario
   - Registro diario, conservación y evidencias.
   - Fichaje remoto, ausencias, turnos y auditoría.
   - Implantación por fases para pymes.

4. Aprende TrustCore
   - Vídeos de 10-15 segundos.
   - Cada vídeo debe enseñar una tarea completa y no una pantalla suelta.
   - Cada vídeo debe enlazar mentalmente con una guía del blog.

## Rutas de vídeo en CloudFront/S3

El hub `/aprende` comprueba automáticamente si existe cada MP4 con una petición `HEAD`. Cuando el archivo existe y CloudFront responde `200`, el botón se activa sin tocar el HTML.

Subir los vídeos con esta convención:

```text
videos/aprende/trustinfacts/crear-factura-verifactu.mp4
videos/aprende/trustinfacts/convertir-presupuesto-factura.mp4
videos/aprende/trustinfacts/aplicar-ipsi.mp4
videos/aprende/trustinfacts/registrar-gasto.mp4
videos/aprende/trustinfacts/crear-producto-stock.mp4
videos/aprende/trustinfacts/revisar-margen.mp4
videos/aprende/trustintime/fichar-jornada.mp4
videos/aprende/trustintime/gestionar-ausencia.mp4
videos/aprende/trustintime/exportar-informe.mp4
```

URL pública esperada:

```text
https://www.trustcore.es/videos/aprende/trustinfacts/crear-factura-verifactu.mp4
```

## Reglas editoriales

- No usar "homologado AEAT" salvo que exista una certificación oficial concreta y documentada.
- Preferir "compatible", "preparado" o "adaptado a requisitos técnicos".
- No responsabilizar a TrustCore por errores de configuración, datos introducidos por el cliente o decisiones fiscales ajenas a la herramienta.
- Para fechas legales, revisar AEAT/BOE antes de publicar.
- Cada artículo debe terminar con una acción: leer una guía relacionada, abrir Aprende o contactar.

## Próximas piezas recomendadas

- "Cómo preparar tu asesoría para VeriFactu 2027 con clientes en Ceuta y Melilla".
- "IPSI en presupuestos: cómo evitar diferencias al convertir a factura".
- "Control horario en comercios con turnos partidos".
- "Primeros 7 días con TrustCore: checklist de implantación".
