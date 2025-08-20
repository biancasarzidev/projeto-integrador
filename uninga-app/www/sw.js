const CACHE = 'uninga-v1';
const ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'imagens/fachada.png',
  'imagens/favicon.jfif'
];

// instalar e guardar no cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ativar e limpar caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// responder às requisições
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached =>
      cached ||
      fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, copy));
        return resp;
      }).catch(() => cached)
    )
  );
});
