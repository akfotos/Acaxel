/* ================================================================
   ACAXEL — SERVICE WORKER
   Provides offline access to the dashboard "app shell" so teachers,
   parents, students and admins can open the app, mark attendance,
   enter grades, and view cached data with no internet connection.
   Actual data writes still go through localStorage (see
   js/offline-clockin.js) and sync automatically once back online.
   ================================================================ */

const CACHE_VERSION = 'acaxel-v1';
const APP_SHELL = [
  '/',
  '/login.html',
  '/admin-dashboard.html',
  '/teacher-dashboard.html',
  '/parent-dashboard.html',
  '/student-dashboard.html',
  '/manifest.json',
  '/css/style.css',
  '/css/dashboard.css',
  '/css/theme.css',
  '/css/home.css',
  '/js/dashboard.js',
  '/js/auth.js',
  '/js/theme-panel.js',
  '/js/support.js',
  '/js/offline-clockin.js',
  '/js/clockin.js',
  '/js/momo-payment.js',
  '/js/school-data.js',
  '/js/highcrest-data.js',
  '/js/admin-dashboard.js',
  '/js/teacher-dashboard.js',
  '/js/i18n.js',
  '/images/Logo/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Network-first for navigations (HTML), so content stays fresh when
   online, but falls back to the cached shell when offline.
   Cache-first for everything else (css/js/images) for speed. */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let CDN scripts pass through normally

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match('/login.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});
