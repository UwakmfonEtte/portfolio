/**
 * Turns the raw 2880x1800 screenshots into web-sized WebP.
 *
 * Two sizes per shot: a wide one for the featured carousel, a smaller one for grid cards. Both are
 * written as files rather than inlined — unlike the Hood Bunnies build, there are enough of them
 * here that inlining would make a single page several megabytes.
 *
 *   node build-art.js
 */
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const sharp = createRequire('c:/Users/Hp/Downloads/hood-bunnies/')('sharp');

const RAW = path.join(__dirname, 'raw');
const OUT = path.join(__dirname, 'site', 'img');

// [source, output slug, crop from top?]  Cropping keeps the interesting part of tall pages.
// Only the three live products still use a screenshot; the other systems are shown as
// interactive walkthroughs instead, so their captures are no longer needed on the page.
const SHOTS = [
  ['kake-markets.png', 'kake'],
  ['kinsman.png', 'kinsman'],
  ['hoodbunnies.png', 'hood']
];

const WIDE = 1600;
const CARD = 900;
const Q = 80;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;

  for (const [src, slug] of SHOTS) {
    const from = path.join(RAW, src);
    if (!fs.existsSync(from)) {
      console.log('  missing ' + src + ' — skipped');
      continue;
    }

    for (const [suffix, width] of [['', WIDE]]) {
      const to = path.join(OUT, slug + suffix + '.webp');
      await sharp(from).resize(width, null, { withoutEnlargement: true }).webp({ quality: Q }).toFile(to);
      total += fs.statSync(to).size;
    }
    const big = fs.statSync(path.join(OUT, slug + '.webp')).size;
    console.log('  ' + slug.padEnd(12) + (big / 1024).toFixed(0).padStart(5) + 'KB');
  }

  console.log('\n  ' + (total / 1024).toFixed(0) + 'KB total across ' + (SHOTS.length * 2) + ' files');
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
