// Tujyane Service Worker - Enables offline access & PWA install
const CACHE_NAME = 'tujyane-v2';
const STATIC_ASSETS = [
  './tugendane-car.png',
  './favicon.png',
  './manifest.json',
];

// Install: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(windows.map((client) => client.navigate(client.url).catch(() => undefined)));
  })());
});

// Network-first keeps the installed app current and leaves the cache as an offline fallback.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and Firebase / external requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cloned = response.clone();
        await caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
      }
      return response;
    } catch {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') return caches.match('./');
      return Response.error();
    }
  })());
});
