#!/usr/bin/env node
// Envoltorio de build-video-posters.py — ver ese fichero para el detalle.
// Requiere: python3 con Pillow e imageio-ffmpeg (pip install imageio-ffmpeg).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('python3', [resolve(root, 'scripts/build-video-posters.py')], { cwd: root, stdio: 'inherit' });
