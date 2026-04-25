const CACHE_NAME = "issue-ticket-pro-v9";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/style.css",
  "./assets/js/config.js",
  "./assets/js/db.js",
  "./assets/js/auth.js",
  "./assets/js/camera.js",
  "./assets/js/submit.js",
  "./assets/js/sync.js",
  "./assets/js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const file of ASSETS) {
        try {
          await cache.add(file);
        } catch (err) {
          console.warn("Skipped:", file);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.method !== "GET") return;

  const isHtml = req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHtml) {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
