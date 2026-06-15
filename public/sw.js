// OneSky service worker: a conservative offline shell. Navigations are
// network-first with an offline fallback; static assets are served
// stale-while-revalidate (instant from cache, refreshed in the background); API
// and auth are never cached. Bump CACHE to invalidate.
const CACHE = "onesky-v2";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error())),
    );
    return;
  }

  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icon") ||
    /\.(svg|png|jpe?g|webp|woff2?)$/.test(url.pathname);
  if (isStatic) {
    // Stale-while-revalidate: serve the cached copy at once, fetch a fresh one in
    // the background to update the cache for next time. Hashed assets have unique
    // URLs, so this only ever refreshes the stable ones (icons, fonts).
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((res) => {
              if (res && res.ok) cache.put(request, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || network;
        }),
      ),
    );
  }
});
