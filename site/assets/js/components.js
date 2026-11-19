/* ==========================================================================
   TrustCore · motor "Flujo" · entrada del bundle
   Este archivo solo ordena el arranque. El código vive en src/js/ y
   scripts/build-assets.mjs lo empaqueta en components.<hash>.min.js (el
   fuente sin hash no se despliega).

     core.js     entorno, bucle rAF compartido, scroll/tamaño, analítica
     motion.js   revelados, palabras, parallax, magnetismo, foco, tilt, contadores
     thread.js   el hilo de luz (lienzo fijo) y sus puntos automáticos
     stream.js   la corriente de fibras del hero de portada
     stage.js    escenario fijado de productos (portada)
     chrome.js   navegación, transición entre páginas, diálogos, toasts, agenda, TrusTy
     ui.js       pestañas, acordeón, precios, descargas, cinta, simuladores, vídeos…

   Se carga con <script defer> al final del <body>. Vanilla, sin dependencias.
   ========================================================================== */
import * as core from '../../../src/js/core.js';
import { initMotion, reveal, scan, live } from '../../../src/js/motion.js';
import { initThread } from '../../../src/js/thread.js';
import { initStream } from '../../../src/js/stream.js';
import { initStage } from '../../../src/js/stage.js';
import { initChrome, openCalendar, openDialog, closeDialog, makeDialog, toast } from '../../../src/js/chrome.js';
import { initUI, DOWNLOADS } from '../../../src/js/ui.js';

function safe(name, fn) {
  try { fn(); } catch (err) {
    /* un módulo roto no debe dejar la página a medio revelar */
    if (window.console) console.error('[tc] ' + name, err);
    if (name === 'motion') document.documentElement.classList.remove('motion');
    if (name === 'ui') document.documentElement.classList.remove('js');      /* pestañas sin motor: todos los paneles a la vista */
  }
}

/* API pública mínima para CSS/JS propio de página */
window.TC = {
  motion: core.motion, fine: core.fine,
  $: core.$, $$: core.$$, clamp: core.clamp, lerp: core.lerp,
  task: core.task, onScroll: core.onScroll, onResize: core.onResize, onLayout: core.onLayout, refresh: core.emitLayout,
  track: core.track, reveal, scan, live,
  toast, openDialog, closeDialog, makeDialog, openCalendar,
  DOWNLOADS
};

safe('chrome', initChrome);      /* navegación y agenda primero: es lo que debe funcionar siempre */
safe('ui', initUI);
safe('stage', initStage);        /* antes del hilo: fijar el escenario cambia la altura del documento */
safe('thread', initThread);
safe('stream', initStream);
safe('motion', initMotion);
