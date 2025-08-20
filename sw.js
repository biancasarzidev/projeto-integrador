// 📦 Versão do cache (mude a cada deploy para forçar atualização)
const APP_VERSION = "v3";

// Prefixos e nomes dos caches
const CACHE_PREFIX = "uninga-cache";
const CACHE_STATIC = `${CACHE_PREFIX}-static-${APP_VERSION}`;
const CACHE_CDN = `${CACHE_PREFIX}-cdn-${APP_VERSION}`;

// Arquivos essenciais para funcionar offline (seu app)
const ASSETS = [
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",
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

// 🧹 Ativação: remove caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && ![CACHE_STATIC, CACHE_CDN].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 🔄 Util: checa mesma origem
const sameOrigin = (requestUrl) => {
  const url = new URL(requestUrl, self.location.href);
  return url.origin === self.location.origin;
};

// 🛰️ Estratégias:
// - Navegação (HTML): network-first (cai para cache se offline)
// - Estáticos do mesmo domínio (css/js/imagens/json): cache-first
// - CDNs/terceiros: stale-while-revalidate (usa cache e atualiza em segundo plano)
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só tratamos GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 1) Requests de navegação (HTML / SPA)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          // cacheia versão boa do index para fallback posterior
          const copy = resp.clone();
          caches.open(CACHE_STATIC).then((c) => c.put("index.html", copy));
          return resp;
        })
        .catch(async () => {
          // offline: tenta o index em cache
          const cachedIndex = await caches.match("index.html");
          if (cachedIndex) return cachedIndex;

          // fallback mínimo inline (se ainda não tiver nada no cache)
          return new Response(
            "<h1>Offline</h1><p>Você está sem conexão e ainda não há cache disponível.</p>",
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 }
          );
        })
    );
    return;
  }

  // 2) Mesma origem (arquivos estáticos)
  if (sameOrigin(request.url)) {
    const isStatic = /\.(?:js|css|png|jpg|jpeg|svg|gif|webp|ico|json)$/i.test(url.pathname);
    if (isStatic) {
      // cache-first
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((resp) => {
              // só cacheia respostas válidas
              if (resp.ok && resp.type === "basic") {
                const copy = resp.clone();
                caches.open(CACHE_STATIC).then((c) => c.put(request, copy));
              }
              return resp;
            })
            .catch(() => cached); // se der erro de rede, tenta cache (se existir)
        })
      );
      return;
    }

    // Default para mesma origem (network-first leve)
    event.respondWith(
      fetch(request)
        .then((resp) => resp)
        .catch(() => caches.match(request))
    );
    return;
  }

  // 3) Terceiros / CDNs (ex.: Tailwind): stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((resp) => {
          if (resp.ok) {
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
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
