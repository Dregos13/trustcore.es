// Genera las variantes optimizadas de los activos propios de TrustCore.
//
// Regla no negociable: aquí NO entra ningún logotipo de terceros
// (COF_Logo.png, acelerado-telefonica.png, logos-camara-*, logo-impulsa-*).
// Son marcas ajenas y sus guías prohíben redimensionarlas o recomprimirlas.
//
// Uso: node scripts/build-images.mjs
// Requiere Python 3 con Pillow (ya presente en el entorno).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('python3', [resolve(root, 'scripts/build-images.py')], {
  cwd: root,
  stdio: 'inherit',
});
