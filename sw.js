/**
 * Service Worker — Toko Delina ATK & Fotokopi (Kiko Smart Shop)
 * PWA Cache & Offline Engine v2.1
 */

const CACHE_NAME = 'delina-kiko-v2.1';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/logo.jpg',
  './assets/kiko_mascot.jpg',
  './assets/product_hvs.jpg',
  './assets/print_review.jpg',
  './assets/loyalty_gift.jpg',
  './assets/audio/adhan_makkah.mp3',
  './assets/audio/adhan_subuh.mp3',
  './assets/audio/iqamah.mp3'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell & audio assets...');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache asset partial warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Non-GET requests should bypass cache
  if (request.method !== 'GET') {
    return;
  }

  // Network first for dynamic APIs, Cache first for local assets
  const isApi = request.url.includes('api.aladhan.com') ||
                request.url.includes('open-meteo.com') ||
                request.url.includes('almatsurat.com');

  if (isApi) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const respClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first strategy for app shell and media
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && request.url.startsWith('http')) {
          const respClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
        }
        return networkResponse;
      });
    }).catch(() => {
      // Offline fallback for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
