const CACHE = 'janeselect-app';

const SKIP_HOSTS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebaseio.com',
  'firebaseinstallations.googleapis.com',
];

// 字型、CDN：快取優先（內容不會變）
const CACHE_FIRST_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com',
  'cdn.jsdelivr.net',
];

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (SKIP_HOSTS.some(h => url.hostname.endsWith(h))) return;

  // 字型、CDN：快取優先（命中直接回傳，否則網路取回後存快取）
  if (CACHE_FIRST_HOSTS.some(h => url.hostname === h)) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(resp => {
          if (resp && resp.status === 200)
            caches.open(CACHE).then(c => c.put(request, resp.clone()));
          return resp;
        });
      })
    );
    return;
  }

  // 同源 App 檔案：網路優先（永遠取最新版，離線時才用快取）
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(request)
        .then(resp => {
          if (resp && resp.status === 200)
            caches.open(CACHE).then(c => c.put(request, resp.clone()));
          return resp;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
    );
  }
});
