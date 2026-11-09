/* PADEL 5IVE · PWA Lab 5.6.0
 * Installable shell plus offline fallback for pages/modes visited online.
 * Session data stays in existing browser storage, NOT Cache Storage.
 * Never intercept or cache APIs, published results, mutations, or cross-origin requests.
 */
'use strict';
const VERSION = 'p5-pwa-lab-v566-1';
const PREFIX = 'padel5ive-pwa-';
const CACHE_SHELL = PREFIX + 'shell-' + VERSION;
const CACHE_PAGES = PREFIX + 'pages-' + VERSION;
const CACHE_ASSETS = PREFIX + 'assets-' + VERSION;
const PRECACHE = [
  '/', '/offline.html', '/manifest.webmanifest', '/pwa-register.js',
  '/pwa-standalone-layout-v5601.css',
  '/pwa/navigation-v5603.js', '/pwa/header-compact-v5605.js',
  '/pwa/icons/apple-touch-icon.png', '/pwa/icons/icon-192.png',
  '/pwa/icons/icon-512.png', '/pwa/icons/icon-maskable-512.png'
];
const APP_PAGES = new Set([
  '/', '/index.html', '/modes/unified/', '/modes/unified/index.html',
  '/modes/club-match/', '/modes/club-match/index.html'
]);
const DENY_PREFIXES = ['/api/', '/.netlify/', '/results/', '/r/', '/u/'];
function isSafeResponse(response) {
  if (!response || !response.ok || response.type === 'opaque') return false;
  if (response.type !== 'basic') return false;
  const cc = response.headers.get('cache-control') || '';
  if (/\b(no-store|private)\b/i.test(cc)) return false;
  return true;
}
function normalizedPath(pathname) {
  if (pathname === '/index.html') return '/';
  if (pathname === '/modes/unified/index.html') return '/modes/unified/';
  if (pathname === '/modes/club-match/index.html') return '/modes/club-match/';
  return pathname;
}
async function cacheSuccessful(cacheName, requestKey, response) {
  if (!isSafeResponse(response)) return;
  try {
    const cache = await caches.open(cacheName);
    await cache.put(requestKey, response.clone());
  } catch (_err) { /* Quota errors must never block scoring or navigation. */ }
}
async function networkFirst(request, key, cacheName, fallback) {
  try {
    const response = await fetch(request);
    await cacheSuccessful(cacheName, key, response);
    return response;
  } catch (err) {
    const cache = await caches.open(cacheName);
    const stored = await cache.match(key);
    if (stored) return stored;
    if (fallback) {
      const offline = await caches.match('/offline.html');
      if (offline) return offline;
    }
    throw err;
  }
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shell = await caches.open(CACHE_SHELL);
    await shell.addAll(PRECACHE);
    // Do not skipWaiting: avoid swapping worker while a tournament is open.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const all = await caches.keys();
    await Promise.all(all.filter(k => k.startsWith(PREFIX) && ![CACHE_SHELL,CACHE_PAGES,CACHE_ASSETS].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (DENY_PREFIXES.some(prefix => url.pathname.startsWith(prefix))) return;
  if (req.mode === 'navigate') {
    if (!APP_PAGES.has(url.pathname)) return;
    const path = normalizedPath(url.pathname);
    event.respondWith(networkFirst(req, path, CACHE_PAGES, true));
    return;
  }
  const asset = url.pathname;
  if (asset.startsWith('/assets/') || asset.startsWith('/pwa/') ||
      asset === '/manifest.webmanifest' || asset === '/pwa-register.js' ||
      asset === '/offline.html' || asset === '/pwa-standalone-layout-v5601.css') {
    if (!/\.(?:js|css|png|jpe?g|webp|svg|woff2?|webmanifest|html)$/.test(asset)) return;
    event.respondWith(networkFirst(req, asset, CACHE_ASSETS, false));
  }
});
// Opt-in update only; never automatically reload an active match.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'P5_APPLY_UPDATE') self.skipWaiting();
});