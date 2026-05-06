// Service Worker untuk PWA
// Cache version - update ini untuk force refresh cache
const CACHE_NAME = 'bali-pet-v2';
const RUNTIME_CACHE = 'bali-pet-runtime-v2';

// Assets yang akan di-cache saat install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/data/destinasi_wisata_bali.geojson',
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache assets penting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
      })
  );
});

// Activate event - cleanup cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

function isHtmlRequest(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.svg'))
  );
}

function isGeoJson(url) {
  return url.origin === self.location.origin && url.pathname.endsWith('.geojson');
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Cache only successful same-origin basic responses
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // SPA fallback
    if (isHtmlRequest(request)) return caches.match('/index.html');
    throw e;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // If we have cache, serve it immediately and refresh in background.
  if (cached) {
    eventWaitUntilSafe(networkPromise);
    return cached;
  }
  const network = await networkPromise;
  return network || (await caches.match(request));
}

function eventWaitUntilSafe(promise) {
  // no-op helper: fetch handler may call respondWith before waitUntil.
  // We only use this for background refresh; if it rejects, ignore.
  promise?.catch?.(() => {});
}

// Fetch event - best practice:
// - HTML navigations: network-first (fast updates), fallback cache/offline
// - Build assets: cache-first (hashed), with runtime cache
// - GeoJSON: stale-while-revalidate
// - Supabase API: always network (skip)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Supabase API calls (always network)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Skip external resources (tiles, dll)
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/data/')) {
    return;
  }

  // HTML navigation: network-first
  if (isHtmlRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // GeoJSON: stale-while-revalidate
  if (isGeoJson(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        const res = await network;
        return res || (await caches.match(request));
      })()
    );
    return;
  }

  // Static assets: cache-first (hashed assets are safe to cache)
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.status === 200 && response.type === 'basic') {
          cache.put(request, response.clone());
        }
        return response;
      })()
    );
    return;
  }

  // Default: try cache then network
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.status === 200 && response.type === 'basic') {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })()
  );
});

// Message handler untuk update cache dari client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);

  let notificationData = {
    title: 'Prakiraan Baru Tersedia',
    body: 'Data prakiraan kenyamanan termal Destinasi Wisata Bali terbaru sudah tersedia. Buka aplikasi untuk melihat peta interaktif.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'new-forecast-batch',
    requireInteraction: false,
    data: {
      url: '/',
      timestamp: Date.now(),
    },
  };

  // Parse push data jika ada
  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) notificationData.title = data.title;
      if (data.body) notificationData.body = data.body;
      if (data.url) notificationData.data.url = data.url;
      if (data.batchId) notificationData.data.batchId = data.batchId;
    } catch (e) {
      console.log('[SW] Push data is text:', event.data.text());
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Buka Aplikasi',
        },
        {
          action: 'close',
          title: 'Tutup',
        },
      ],
    })
  );
});

// Notification click event - handle user clicking notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Default action atau 'open' action
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Cek apakah ada window yang sudah terbuka
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Buka window baru jika belum ada
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
