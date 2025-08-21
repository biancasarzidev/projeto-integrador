// 📦 Versão do cache (mude a cada deploy para forçar atualização)
const APP_VERSION = "v5-2025-08-21";

// Prefixos e nomes dos caches
const CACHE_PREFIX = "uninga-cache";
const CACHE_STATIC = `${CACHE_PREFIX}-static-${APP_VERSION}`;
const CACHE_CDN = `${CACHE_PREFIX}-cdn-${APP_VERSION}`;

const OFFLINE_URL = "offline.html";

// Arquivos essenciais para funcionar offline (seu app)
const ASSETS = [
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",
  OFFLINE_URL,
  // imagens do app
  "imagens/fachada.png",
  "imagens/favicon.jfif",
  "imagens/icon-120.png",
  "imagens/icon-152.png",
  "imagens/icon-180.png",
  "imagens/icon-192.png",
  "imagens/icon-512.png",
  // se tiver esse arquivo, mantenha; se não tiver, pode remover da lista
  "imagens/maskable-512.png"
];

// 🔧 Instalação: pré-carrega os assets essenciais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 🛰️ Ativação: limpa caches antigos e ativa Navigation Preload
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Navigation Preload (quando disponível)
    if ("navigationPreload" in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(CACHE_PREFIX) && ![CACHE_STATIC, CACHE_CDN].includes(k))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// 🔄 Util: checa mesma origem
const sameOrigin = (requestUrl) => {
  const url = new URL(requestUrl, self.location.href);
  return url.origin === self.location.origin;
};

// 🛰️ Estratégias:
// - Navegação (HTML): network-first (usa navigation preload quando tem) -> cache -> offline.html
// - Estáticos do mesmo domínio (css/js/imagens/json): cache-first
// - CDNs/terceiros: stale-while-revalidate (usa cache e atualiza em segundo plano)
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só tratamos GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 1) Requests de navegação (HTML / SPA)
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        // Tenta usar a resposta de preload (mais rápida)
        const preload = await event.preloadResponse;
        if (preload) {
          // Atualiza cache do index em background para fallback futuro
          caches.open(CACHE_STATIC).then((c) => c.put("index.html", preload.clone()));
          return preload;
        }

        // Vai à rede
        const network = await fetch(request);
        // Cacheia versão boa do index para fallback posterior
        caches.open(CACHE_STATIC).then((c) => c.put("index.html", network.clone()));
        return network;
      } catch (err) {
        // offline: tenta o index em cache
        const cachedIndex = await caches.match("index.html", { ignoreSearch: true });
        if (cachedIndex) return cachedIndex;
        // fallback para offline.html
        const offline = await caches.match(OFFLINE_URL, { ignoreSearch: true });
        return offline || new Response(
          "<h1>Offline</h1><p>Sem conexão e sem cache disponível.</p>",
          { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 }
        );
      }
    })());
    return;
  }

  // 2) Mesma origem (arquivos estáticos)
  if (sameOrigin(request.url)) {
    const isStatic = /\.(?:js|mjs|css|png|jpg|jpeg|svg|gif|webp|ico|json|woff2?|ttf|eot)$/i.test(url.pathname);
    if (isStatic) {
      // cache-first
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((resp) => {
              // só cacheia respostas válidas
              if (resp.ok && (resp.type === "basic" || resp.type === "cors")) {
                const copy = resp.clone();
                caches.open(CACHE_STATIC).then((c) => c.put(request, copy));
              }
              return resp;
            })
            .catch(() => cached || new Response("", { status: 504 }));
        })
      );
      return;
    }

    // Default para mesma origem (network-first leve)
    event.respondWith(
      fetch(request)
        .then((resp) => resp)
        .catch(() => caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  // 3) Terceiros / CDNs (ex.: Tailwind): stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((resp) => {
          if (resp && (resp.ok || resp.type === "opaque")) {
            const copy = resp.clone();
            caches.open(CACHE_CDN).then((c) => c.put(request, copy));
          }
          return resp;
        })
        .catch(() => null);

      // retorna cache imediatamente (se houver), e atualiza em segundo plano
      return cached || fetchPromise || new Response("", { status: 504 });
    })
  );
});

// Mensagem opcional para permitir "atualizar agora" (skipWaiting)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
