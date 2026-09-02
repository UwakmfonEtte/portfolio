/**
 * Produces a single self-contained dist/index.html with every image inlined.
 *
 * The site/ version links images as files, which is right for hosting — the browser caches them
 * and the initial HTML stays small. A published artifact runs under a CSP that blocks external
 * requests entirely, so there the images have to travel inside the document or they silently
 * never appear.
 *
 *   node build-standalone.js
 */
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'site');
const OUT = path.join(__dirname, 'dist');

function main() {
  let html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');

  const refs = [...new Set([...html.matchAll(/src="(img\/[^"]+)"/g)].map((m) => m[1]))];
  let inlined = 0;
  let bytes = 0;

  for (const ref of refs) {
    const file = path.join(SITE, ref);
    if (!fs.existsSync(file)) {
      console.log('  missing ' + ref + ' — left as a link');
      continue;
    }
    const b64 = fs.readFileSync(file).toString('base64');
    const uri = 'data:image/webp;base64,' + b64;
    html = html.split('"' + ref + '"').join('"' + uri + '"');
    inlined++;
    bytes += b64.length;
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), html);

  const kb = (fs.statSync(path.join(OUT, 'index.html')).size / 1024).toFixed(0);
  console.log('  inlined ' + inlined + '/' + refs.length + ' images (' + (bytes / 1024).toFixed(0) + 'KB base64)');
  console.log('  wrote dist/index.html (' + kb + 'KB)');

  const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !u.startsWith('https://fonts.googleapis.com') && !u.startsWith('https://fonts.gstatic.com'));
  const offsite = [...new Set(external)].filter((u) => !/kakenft|kinsman|hoodbunnies|github\.com/.test(u));
  console.log(offsite.length ? '  NOTE unexpected external refs: ' + offsite.join(', ') : '  external refs are fonts and outbound project links only');
}

try { main(); } catch (e) { console.error(e.message); process.exitCode = 1; }
