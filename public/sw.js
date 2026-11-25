// CardioDiario Service Worker — PWA App Shell + Safe Offline Fallback + Web Push
const CACHE_NAME = "cardiodiario-v2";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/badge-72.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigazioni HTML: sempre rete, con fallback sicuro alla pagina /offline
  // (non memorizziamo pagine cliniche autenticate nella cache condivisa)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOffline = await cache.match(OFFLINE_URL);
        return (
          cachedOffline ||
          new Response(
            "<!doctype html><html lang='it'><meta charset='utf-8'><title>Offline | CardioDiario</title><body style='font-family:sans-serif;background:#faf6f0;color:#2e3230;padding:2rem;text-align:center'><h1>Connessione assente</h1><p>Ricollegati a Internet per aprire il tuo diario pressorio.</p></body></html>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
        );
      })
    );
    return;
  }

  // Asset statici versionati e icone PWA: CacheFirst
  const isImmutableAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon.svg";

  if (isImmutableAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {
    title: "CardioDiario",
    body: "Promemoria misurazione pressoria.",
    url: "/paziente/cicli",
    tag: "cardiodiario",
    badgeCount: undefined,
    silent: false,
  };

  try {
    const parsed = event.data.json();
    data = { ...data, ...parsed };
  } catch {
    const text = event.data.text();
    if (text) data.body = text;
  }

  const isSilent = Boolean(data.silent);
  const options = {
    body: data.body || "Promemoria misurazione pressoria.",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: data.tag || "cardiodiario",
    silent: isSilent,
    renotify: isSilent ? false : Boolean(data.tag),
    data: { url: data.url || "/paziente/cicli" },
  };

  const badgeTask =
    typeof data.badgeCount === "number" &&
    self.navigator &&
    typeof self.navigator.setAppBadge === "function"
      ? self.navigator.setAppBadge(data.badgeCount).catch(() => {})
      : Promise.resolve();

  event.waitUntil(
    Promise.all([self.registration.showNotification(data.title || "CardioDiario", options), badgeTask])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = (event.notification.data && event.notification.data.url) || "/paziente/cicli";
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        for (const client of clientList) {
          if (client.url && client.url.startsWith(self.location.origin) && "focus" in client) {
            await client.focus();
            if ("navigate" in client && client.url !== targetUrl) {
              return client.navigate(targetUrl);
            }
            return client;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});
