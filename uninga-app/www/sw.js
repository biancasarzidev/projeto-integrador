// 📦 Versão do cache (mude a cada deploy para forçar atualização)
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



// Default para mesma origem (network-first leve)
event.respondWith(
fetch(request)
.then((resp) => resp)
.catch(() => caches.match(request, { ignoreSearch: true }))
);
return;



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


// Mensagem opcional para permitir "atualizar agora" (skipWaiting)
self.addEventListener("message", (event) => {
if (event.data === "SKIP_WAITING") self.skipWaiting();
});