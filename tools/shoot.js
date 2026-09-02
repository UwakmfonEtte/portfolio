/**
 * Captures screenshots for the portfolio.
 *
 * Live sites are shot straight from their URL. The three local projects have real UIs but no
 * public deployment, so each is served statically from its own directory and shot the same way —
 * a real render of the actual interface rather than a mockup of one.
 *
 * Run from the playwright-test folder, which already has chromium installed:
 *   node ../portfolio/shoot.js
 */
// Node resolves modules from this file's location, not the working directory, so point at the
// existing playwright-test install rather than duplicating a 200MB browser download.
const { createRequire } = require('module');
const { chromium } = createRequire('c:/Users/Hp/Downloads/playwright-test/')('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'raw');
const HOME = 'c:/Users/Hp';

const LIVE = [
  { name: 'kake-markets', url: 'https://kakenft.bet/markets', wait: 3500 },
  { name: 'kake-home', url: 'https://kakenft.bet/', wait: 3000 },
  { name: 'kinsman', url: 'https://www.kinsman.live/', wait: 4000 },
  { name: 'hoodbunnies', url: 'https://hoodbunnies.vercel.app/', wait: 3000 }
];

// Local UIs: [label, directory to serve, page to open]
const LOCAL = [
  ['fonz-chat', `${HOME}/Downloads/Fonz Naturals/public`, 'index.html'],
  ['fonz-inbox', `${HOME}/Downloads/Fonz Naturals/public`, 'inbox.html'],
  ['fonz-admin', `${HOME}/Downloads/Fonz Naturals/public`, 'admin.html'],
  ['tracker', `${HOME}/Downloads/Business Tracker/public`, 'index.html'],
  ['enwongo', `${HOME}/Downloads/Automation demo`, 'enwongo_abasi_frontdesk_prototype_v2 (1).html']
];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp'
};

function serve(root, port) {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
      const file = path.resolve(root, rel);
      if (!file.startsWith(path.resolve(root))) { res.writeHead(403); return res.end(); }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    s.listen(port, () => resolve(s));
  });
}

async function shoot(page, name, label) {
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file, fullPage: false });
  const kb = (fs.statSync(file).size / 1024).toFixed(0);
  console.log(`  ${name.padEnd(16)} ${kb.padStart(5)}KB   ${label}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,             // retina, so it stays sharp when scaled down
    colorScheme: 'dark'               // these projects are all designed dark-first
  });
  const page = await ctx.newPage();

  console.log('Live sites');
  for (const s of LIVE) {
    try {
      await page.goto(s.url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(s.wait);
      await shoot(page, s.name, s.url);
    } catch (e) {
      console.log(`  ${s.name.padEnd(16)}  FAILED  ${e.message.split('\n')[0].slice(0, 60)}`);
    }
  }

  console.log('\nLocal projects');
  let port = 5301;
  for (const [name, dir, file] of LOCAL) {
    if (!fs.existsSync(path.join(dir, file))) {
      console.log(`  ${name.padEnd(16)}  skipped (not found)`);
      continue;
    }
    const server = await serve(dir, port);
    try {
      await page.goto(`http://localhost:${port}/${encodeURIComponent(file)}`, {
        waitUntil: 'domcontentloaded', timeout: 20000
      });
      await page.waitForTimeout(2500);
      await shoot(page, name, file);
    } catch (e) {
      console.log(`  ${name.padEnd(16)}  FAILED  ${e.message.split('\n')[0].slice(0, 60)}`);
    } finally {
      server.close();
      port++;
    }
  }

  await browser.close();
  console.log('\nWrote to', OUT);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
