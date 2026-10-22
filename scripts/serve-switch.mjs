// Tiny static server for the PWA update e2e test (e2e/pwa-update.spec.ts).
// Serves one of several build directories and can switch between them at runtime:
//   PW_SWITCH_PORT=4180 node scripts/serve-switch.mjs a=dir/a b=dir/b
//   POST /__switch?to=b   → serve dir/b from now on
//   POST /__switch?to=off → drop every connection (a real network failure, for offline tests)
//   POST /__switch?to=b&cache=pages → also send GitHub Pages' `max-age=600` on non-hashed files
//                                     (until the next switch), to test the browser HTTP cache
// Files are mounted under PW_SWITCH_BASE (default /ai-preschool-studio/) to mirror GitHub Pages.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const port = Number(process.env.PW_SWITCH_PORT || 4180);
const base = process.env.PW_SWITCH_BASE || '/ai-preschool-studio/';
const roots = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [name, dir] = arg.split('=');
    return [name, resolve(dir)];
  })
);
let current = Object.keys(roots)[0];
let pagesCache = false;
if (!current) {
  console.error('usage: node scripts/serve-switch.mjs name=dir [name=dir ...]');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/__switch') {
    const to = url.searchParams.get('to') || '';
    if (to !== 'off' && !(to in roots)) {
      res.writeHead(400).end('unknown root ' + to);
      return;
    }
    current = to;
    pagesCache = url.searchParams.get('cache') === 'pages';
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('serving ' + to);
    return;
  }
  if (current === 'off') {
    req.socket.destroy();
    return;
  }
  const root = roots[current];
  if (!url.pathname.startsWith(base)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('outside ' + base);
    return;
  }
  let path = decodeURIComponent(url.pathname.slice(base.length - 1));
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(root, path));
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    const body = await readFile(file);
    const ext = extname(file);
    // Hashed assets are immutable; everything else (html, sw.js, version.json, manifest, icons)
    // must revalidate — unless mimicking GitHub Pages, which lets browsers reuse them for 10 min.
    const hashed = path.startsWith('/assets/');
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : pagesCache ? 'public, max-age=600' : 'no-cache'
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`serve-switch: http://127.0.0.1:${port}${base} serving ${current} (${roots[current]})`);
});
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.closeAllConnections();
    server.close(() => process.exit(0));
  });
}
