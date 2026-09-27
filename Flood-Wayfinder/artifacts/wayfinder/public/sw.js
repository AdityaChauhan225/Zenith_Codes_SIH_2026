const SHELL_CACHE = "wayfinder-shell-v1";
const APP_SCOPE = self.registration.scope;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      try {
        await cache.add(new Request(APP_SCOPE, { cache: "reload" }));
      } catch {
        // A failed precache does not prevent the app from starting online.
      }
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("wayfinder-shell-") && key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  const url = new URL(request.url);
  if (!url.href.startsWith(APP_SCOPE)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(SHELL_CACHE).then((cache) => cache.put(APP_SCOPE, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(APP_SCOPE);
          if (cached) return cached;
          return new Response("Wayfinder is not available offline yet. Open it once while connected.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        void caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }),
  );
});