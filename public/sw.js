// Service worker voor de werkplaats: de app blijft bruikbaar bij slecht bereik.
// Bewust simpel gehouden — de échte offline-garantie zit in de IndexedDB-
// schrijfwachtrij (zie src/lib/offline-queue.ts), niet in agressieve caching.
const CACHE = "materiaalonderhoud-v1";
const SCHIL = ["/manifest.json", "/brand/logo-ov.svg", "/brand/logo-ov-mark.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SCHIL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Nooit API-antwoorden of server-rendered pagina's serveren uit de cache:
  // verouderde materiaalgegevens zijn hier gevaarlijker dan een foutmelding.
  if (url.pathname.startsWith("/api/")) return;

  const isStatisch =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json";

  if (!isStatisch) return;

  event.respondWith(
    caches.match(request).then(
      (gecached) =>
        gecached ??
        fetch(request).then((antwoord) => {
          const kopie = antwoord.clone();
          caches.open(CACHE).then((cache) => cache.put(request, kopie));
          return antwoord;
        })
    )
  );
});
