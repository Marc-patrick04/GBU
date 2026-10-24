const CACHE = "gbur-shell-v1";
const ASSETS = ["/", "/manifest.json", "/logo.png", "/bibles/NIV.xml", "/bibles/KJV.xml", "/bibles/ESV.xml", "/bibles/BY.xml", "/bibles/BIR.xml"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("/"))));
});
