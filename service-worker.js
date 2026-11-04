const CACHE = "builder-world-v1";
const FILES = ["./", "./index.html", "./style.css", "./game.js", "./manifest.json", "./icon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Three.js is loaded from a CDN, so the first launch needs an internet connection.
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match("./index.html"))));
});