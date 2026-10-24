const CACHE_NAME = 'sheba-pos-cache-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// Install: Cache initial static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests - mutating requests (POST, PUT, DELETE) must never be intercepted
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 1. Exclude API calls, file uploads, APK downloads, or requests to external domains
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/uploads') ||
    url.pathname.endsWith('.apk') ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  // 2. Navigation (HTML page navigations like /projects, /pos, /inventory, /login):
  // Network first, falling back to cached /index.html (SPA shell) or offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = (await caches.match('/index.html')) || (await caches.match('/'));
          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline - Sheba POS</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:sans-serif;text-align:center;padding:50px 20px;"><h2>ইন্টারনেট সংযোগ নেই (Offline)</h2><p>অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করে পুনরায় চেষ্টা করুন।</p><button onclick="window.location.reload()" style="padding:10px 20px;font-size:16px;cursor:pointer;border-radius:6px;border:none;background:#2563eb;color:#fff;">রিলোড করুন</button></body></html>',
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        })
    );
    return;
  }

  // 3. Static assets (JS, CSS, images, fonts): Network First with Cache Fallback
  // Ensures fresh updates are applied immediately while preserving offline support
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('', { status: 504, statusText: 'Gateway Timeout' });
      })
  );
});
