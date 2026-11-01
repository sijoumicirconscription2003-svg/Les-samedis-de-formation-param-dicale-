const CACHE_NAME = 'ali-trad-fmc-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle Firestore and external API calls directly
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebaseio.com')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
