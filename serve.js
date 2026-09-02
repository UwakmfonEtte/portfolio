/**
 * Zero-dependency static server for the design preview.
 *
 * Deliberately no framework: the preview is a single self-contained HTML file, and adding a
 * dependency to serve one file would be more moving parts than the thing being served.
 *
 *   node scripts/serve.js            -> http://localhost:4173
 *   node scripts/serve.js 8080       -> http://localhost:8080
 *
 * Binds on all interfaces so the page can also be opened from a phone or another machine on the
 * same network — the LAN address is printed at startup.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Serves the built output, not the source, so what you review locally is byte-identical to what
// Vercel serves and what the shared artifact renders.
const ROOT = path.join(__dirname, 'site');
const PORT = Number(process.argv[2]) || 4180;
const INDEX = 'index.html';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Strip the query string, then resolve inside ROOT and confirm it stayed there — a request for
  // ../../.env must not be able to walk out of the served directory.
  const requested = decodeURIComponent(req.url.split('?')[0]);
  const rel = requested === '/' ? INDEX : requested.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT, rel);

  if (!filePath.startsWith(path.resolve(ROOT))) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found: ' + rel);
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

function lanAddress() {
  for (const iface of Object.values(os.networkInterfaces()).flat()) {
    if (iface && iface.family === 'IPv4' && !iface.internal) return iface.address;
  }
  return null;
}

server.listen(PORT, '0.0.0.0', () => {
  const lan = lanAddress();
  console.log('');
  console.log('  Portfolio — UwakmfonAbasi Ette');
  console.log('  ─────────────────────────────────────────');
  console.log('  Local:    http://localhost:' + PORT);
  if (lan) console.log('  Network:  http://' + lan + ':' + PORT + '   (same wifi)');
  console.log('');
  console.log('  Serving:  ' + ROOT);
  console.log('  Stop:     Ctrl+C');
  console.log('');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' is already in use. Try: node scripts/serve.js ' + (PORT + 1));
    process.exit(1);
  }
  throw e;
});
