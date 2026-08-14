// Download the latin + latin-ext Inter faces referenced by the site's Google Fonts
// link, self-host them under .design-sync/fonts/, and emit a local @font-face CSS
// that cfg.extraFonts can consume (extractFonts copies the woff2 into fonts/).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '.design-sync/fonts';
mkdirSync(OUT, { recursive: true });

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';

const css = await (await fetch(URL, { headers: { 'User-Agent': UA } })).text();

// Each @font-face is preceded by a /* subset */ comment.
const blocks = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g)];
const keep = new Set(['latin', 'latin-ext']);
const rules = [];

for (const [, subset, block] of blocks) {
  if (!keep.has(subset)) continue;
  const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  if (!weight || !url) continue;

  const name = `inter-${weight}-${subset}.woff2`;
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
  writeFileSync(join(OUT, name), buf);
  rules.push(block.replace(url, `./${name}`));
  console.log(`  ${name} (${(buf.length / 1024).toFixed(1)} KB)`);
}

writeFileSync(
  join(OUT, 'inter.css'),
  `/* Inter — self-hosted from Google Fonts (latin + latin-ext), matching the\n   weights the trustcore.es site loads: 400/500/600/700/800. */\n${rules.join('\n')}\n`,
);
console.log(`\n${rules.length} @font-face rules → ${OUT}/inter.css`);
