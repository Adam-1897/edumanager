// Builds the app in demo mode (no backend) and inlines the JS into one HTML file
// that opens straight from disk: ../EduManager-Demo.html
import { build } from 'vite';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist-demo');
const target = resolve(root, '..', 'EduManager-Demo.html');

process.env.VITE_DEMO = '1';
await build({
  root,
  base: './',
  logLevel: 'warn',
  build: { outDir, emptyOutDir: true, assetsInlineLimit: 100_000_000, modulePreload: false },
});

let html = readFileSync(resolve(outDir, 'index.html'), 'utf8');
html = html.replace(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/g, (_, file) => {
  // "</script" inside the bundle would end the inline tag early
  const js = readFileSync(resolve(outDir, file), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/g,
  (_, file) => `<style>${readFileSync(resolve(outDir, file), 'utf8')}</style>`);
if (/src="\.\/assets\//.test(html)) throw new Error('Some assets were not inlined');
html = html.replace('<title>AcademyOS — School Management System</title>', '<title>AcademyOS — Offline Demo</title>');

writeFileSync(target, html);
rmSync(outDir, { recursive: true, force: true });
console.log(`Wrote ${target} (${(html.length / 1024).toFixed(0)} KB)`);
