#!/usr/bin/env node
/**
 * dev-server.mjs — servidor estático local con URLs limpias, como CloudFront.
 * /precios → site/precios.html · /productos/nido → site/productos/nido.html
 * Uso: node scripts/dev-server.mjs [puerto] [interfaz]   (por defecto 8471 y 127.0.0.1)
 *      node scripts/dev-server.mjs 8473 0.0.0.0   → accesible desde la red local
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const PORT = Number(process.argv[2] || 8471);
// Tercer argumento: interfaz. Por defecto solo este equipo; `0.0.0.0` lo abre a la red local.
const HOST = process.argv[3] || '127.0.0.1';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.pdf': 'application/pdf' };

const isFile = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  path = normalize(path).replace(/^(\.\.[/\\])+/, '');
  let file = join(SITE, path);
  if (!file.startsWith(SITE)) { res.writeHead(403).end(); return; }
  // Igual que la función de CloudFront (infra/main.tf): «/x» → «/x.html», «/x/» → «/x/index.html».
  // «/productos» es site/productos.html, no site/productos/index.html: aquí también da 404 si falta.
  const candidates = path.endsWith('/') ? [join(file, 'index.html')] : [file, file + '.html'];
  let hit = null;
  for (const c of candidates) if (await isFile(c)) { hit = c; break; }
  let status = 200;
  if (!hit) { hit = join(SITE, '404.html'); status = 404; }
  try {
    let body = await readFile(hit);
    const headers = { 'content-type': TYPES[extname(hit)] || 'application/octet-stream', 'cache-control': 'no-store' };
    // Como CloudFront: el texto viaja comprimido (el CSS pasa de ~560 KiB a ~100).
    if (/\.(html|css|js|mjs|json|svg|txt|xml)$/.test(hit) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      body = gzipSync(body); headers['content-encoding'] = 'gzip';
    }
    res.writeHead(status, headers);
    res.end(body);
  } catch { res.writeHead(500).end('error'); }
}).listen(PORT, HOST, () => console.log(`http://${HOST}:${PORT}`));
