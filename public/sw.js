// Service Worker untuk PWA
// Cache version - update ini untuk force refresh cache
const CACHE_NAME = 'bali-pet-v1';
const RUNTIME_CACHE = 'bali-pet-runtime-v1';

// Assets yang akan di-cache saat install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/data/destinasi_wisata_bali.geojson',
  '/favicon.ico',
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

// Fetch event - network first, fallback to cache
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

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response untuk cache
            const responseToCache = response.clone();

            // Cache response
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback untuk HTML pages
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
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
    body: 'Data prakiraan kenyamanan termal terbaru sudah tersedia',
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
