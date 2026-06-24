const CACHE = 'janeselect-v69';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icon.svg',
  './js/config.js',
  './js/state.js',
  './js/utils.js',
  './js/db.js',
  './js/auth.js',
  './js/sync.js',
  './js/stay.js',
  './js/planner.js',
  './js/spots.js',
  './js/budget.js',
  './js/packing.js',
  './js/photo.js',
  './js/handbook.js',
  './js/ai.js',
  './js/ui.js',
  './js/main.js',
];

const SKIP_HOSTS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebaseio.com',
  'firebaseinstallations.googleapis.com',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (SKIP_HOSTS.some(h => url.hostname.endsWith(h))) return;

  const cacheable =
    url.origin === self.location.origin ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'www.gstatic.com';

  if (!cacheable) return;

  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(resp => {
        if (resp && resp.status === 200) {
          caches.open(CACHE).then(c => c.put(request, resp.clone()));
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
