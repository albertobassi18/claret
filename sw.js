// Service worker Claret — network-first (aggiornamenti freschi) con fallback offline.
const CACHE = 'claret-v3';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));   // butta la cache vecchia
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request;
  // gestiamo solo GET dello stesso dominio: le chiamate a Supabase/CDN passano intatte
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req))
  );
});
