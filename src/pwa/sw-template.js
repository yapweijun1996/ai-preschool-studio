/* AI Preschool Studio service worker template.
 * The Vite plugin in vite.config.ts prepends `const VERSION`, `const BUILD` and
 * `const PRECACHE` (paths relative to this file), so sw.js bytes change every release.
 * This file is not bundled or type-checked; keep it plain ES2020. */
/* global VERSION, BUILD, PRECACHE */

const CACHE = 'aps-' + VERSION + '-' + BUILD;
const SCOPE = self.registration.scope; // e.g. https://host/ai-preschool-studio/
const SCOPE_PATH = new URL(SCOPE).pathname;
const SHELL_URL = new URL('index.html', SCOPE).href;
const NEVER_CACHE = [new URL('version.json', SCOPE).pathname, new URL('sw.js', SCOPE).pathname];

// No skipWaiting here: a new release waits until the page asks for it.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((p) => new Request(new URL(p, SCOPE).href, { cache: 'reload' }))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('aps-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function cacheFirst(request) {
  return caches.open(CACHE).then((cache) =>
    cache.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
          return res;
        })
    )
  );
}

// Network-first for navigations; offline falls back to this release's cached shell.
// `no-cache` revalidates with the server, so the HTTP cache (GitHub Pages sends max-age=600)
// cannot hand back the previous release's index.html after a deploy.
function networkFirstShell(request) {
  return fetch(request, { cache: 'no-cache' }).catch(() =>
    caches
      .open(CACHE)
      .then((cache) => cache.match(SHELL_URL))
      .then((hit) => hit || Response.error())
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Nothing else outside the app's own origin + path is touched.
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PATH)) return;

  if (NEVER_CACHE.includes(url.pathname)) {
    event.respondWith(fetch(request.url, { cache: 'no-store' }));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShell(request));
    return;
  }
  if (url.pathname.startsWith(SCOPE_PATH + 'assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  // Manifest, icons and other precached files: this release's copy first, network otherwise.
  event.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(request, { ignoreSearch: true }))
      .then((hit) => hit || fetch(request))
  );
});
