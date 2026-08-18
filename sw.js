/**
 * Service Worker minimal — cache offline des assets statiques.
 * Stratégie : cache-first pour les assets versionnés (CSS/JS/fonts/images),
 * network-first avec fallback cache pour le HTML (toujours la dernière version si en ligne).
 */
const CACHE_NAME = "pe-monreal-v1.5.0";
const PRECACHE_URLS = [
  '/',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/images/photo-profil.webp',
  '/fonts/manrope-v20-latin-300.woff2',
  '/fonts/manrope-v20-latin-regular.woff2',
  '/fonts/manrope-v20-latin-600.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Ne jamais mettre en cache les appels Formspree (données dynamiques/sensibles)
  if (request.url.includes('formspree.io')) return;

  const isHTML = request.mode === 'navigate' || request.destination === 'document';

  if (isHTML) {
    // Network-first : toujours la dernière version du site si en ligne
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Cache-first pour le reste (CSS, JS, fonts, images)
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
