const CACHE_NAME = "issue-v8";

const FILES = [
  "/issue-ticket-app/",
  "/issue-ticket-app/index.html",
  "/issue-ticket-app/manifest.json"
];

self.addEventListener("install", e => {
  self.skipWaiting();

  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", e => {

  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then(res => res)
      .catch(() => caches.match(e.request))
  );
});
