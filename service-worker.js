const CACHE='issue-v1';

self.addEventListener('install',e=>{
e.waitUntil(
caches.open(CACHE).then(c=>c.addAll([
'/issue-ticket-app/',
'/issue-ticket-app/index.html'
]))
);
});

self.addEventListener('fetch',e=>{
e.respondWith(
fetch(e.request).catch(()=>caches.match(e.request))
);
});
