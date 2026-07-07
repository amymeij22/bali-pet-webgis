const CACHE_NAME = 'bali-pet-v1';
const RUNTIME_CACHE = 'bali-pet-runtime-v1';
// Cache terpisah untuk data API Supabase (agar mudah di-manage & tidak tercampur asset)
const API_CACHE = 'bali-pet-api-v1';
const IMAGE_CACHE = 'bali-pet-images-v1';

// HANYA precache resource STABIL (tidak berubah nama setiap build)
// JANGAN masukkan asset hashed (index-XYZ.js) → SW gagal install karena file lama tidak ada
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/data/destinasi_wisata_bali.geojson',
  '/image-fallback.webp',
  '/icons/logo-splash.webp',
];

// ---------------------------------------------------------------------------
// INSTALL – cache resource stabil, lalu skipWaiting
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching stable assets');
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[SW] Precache failed for:', url, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// ACTIVATE – bersihkan cache versi lama, lalu claim semua clients
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  const KNOWN_CACHES = [CACHE_NAME, RUNTIME_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !KNOWN_CACHES.includes(name))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        )
      )
      // Workaround untuk bug Chromium (Chrome 143+ / System WebView) ServiceWorkerAutoPreload yang menyebabkan whitescreen
      .then(async () => {
        if (self.registration.navigationPreload) {
          try {
            await self.registration.navigationPreload.disable();
            console.log('[SW] Navigation preload disabled successfully');
          } catch (e) {
            console.warn('[SW] Failed to disable navigation preload:', e);
          }
        }
      })
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// HELPER – apakah request ini navigasi HTML (SPA)
// ---------------------------------------------------------------------------
function isHtmlRequest(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

// ---------------------------------------------------------------------------
// HELPER – apakah asset statis berhash (JS, CSS, font, gambar dari /assets/)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// HELPER – apakah request ke Supabase REST API (bukan Realtime/auth/storage)
// Hanya intercept GET /rest/v1/ agar read-only data bisa di-cache
// ---------------------------------------------------------------------------
function isSupabaseRestGet(request, url) {
  return (
    request.method === 'GET' &&
    (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.io')) &&
    url.pathname.startsWith('/rest/v1/')
  );
}

// ---------------------------------------------------------------------------
// HELPER – validasi apakah response layak untuk di-cache (basic atau cors 200)
// Mengizinkan cors karena Vite mengunduh script type="module" dengan atribut crossorigin
// ---------------------------------------------------------------------------
function isValidResponseToCache(response) {
  if (!response || response.status !== 200) return false;
  return response.type === 'basic' || response.type === 'cors';
}

// ---------------------------------------------------------------------------
// HELPER – apakah request ini gambar (statis, Supabase Storage, map tiles, dll.)
// ---------------------------------------------------------------------------
function isImageRequest(request, url) {
  if (request.destination === 'image') return true;

  const pathname = url.pathname.toLowerCase();
  return (
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('tile.openstreetmap.org') ||
    pathname.includes('/storage/v1/object/public/')
  );
}

// ---------------------------------------------------------------------------
// STRATEGY: Cache-First untuk Gambar
//
// Perilaku:
//   CARI DI CACHE → ada, langsung return (paling instan/seamless)
//   TIDAK ADA DI CACHE → ambil dari network, simpan ke IMAGE_CACHE, return response
//
// Catatan: Mendukung CORS dan fallback Opaque jika ada yang terlewat
// ---------------------------------------------------------------------------
async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGE_CACHE);

  // Cari di cache (sensitif terhadap query parameter agar query dimensi gambar yang berbeda tidak tumpang tindih)
  let cached = await cache.match(request);
  if (cached) return cached;

  // Jika tidak cocok sensitif, coba ignoreSearch untuk fallbacks
  cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Simpan jika response sukses (200) atau opaque (untuk external CDN yang tidak support CORS)
    if (response && (response.status === 200 || response.type === 'opaque')) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.log('[SW] Image offline:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// ---------------------------------------------------------------------------
// STRATEGY: Network-First untuk HTML navigasi
// → coba network dulu, fallback ke cache '/' jika offline
// ---------------------------------------------------------------------------
async function networkFirstHtml(request) {
  try {
    const response = await fetch(request);
    if (isValidResponseToCache(response)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // Gunakan ignoreSearch: true agar jika PWA dibuka dengan query parameter (misal: ?utm_source=homescreen atau ?homescreen=1),
    // pencarian cache tetap berhasil mencocokkan '/'
    const cached = await caches.match(request, { ignoreSearch: true }) || await caches.match('/', { ignoreSearch: true });
    if (cached) return cached;
    throw e;
  }
}

// ---------------------------------------------------------------------------
// STRATEGY: Network-First + Cache Fallback untuk Supabase REST API
//
// Perilaku:
//   ONLINE  → fetch ke Supabase, simpan response ke API_CACHE, return fresh data
//   OFFLINE → fetch gagal, return data terakhir dari API_CACHE
//   KEMBALI ONLINE → fetch berhasil lagi, cache diperbarui otomatis
//
// Catatan: response.type === 'cors' karena Supabase adalah cross-origin
// ---------------------------------------------------------------------------
async function networkFirstAPI(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    // Supabase REST returns type 'cors' (cross-origin authenticated)
    if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
      cache.put(request, response.clone());
      console.log('[SW] API cached:', new URL(request.url).pathname.split('/').pop()?.split('?')[0]);
    }
    return response;
  } catch (err) {
    // Network failed → coba kembalikan data yang sudah di-cache
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] Offline – serving cached API response for:', new URL(request.url).pathname);
      return cached;
    }
    // Tidak ada cache → lempar error agar app bisa handle dengan pesan offline
    console.warn('[SW] No cached API data available for:', new URL(request.url).pathname);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// FETCH EVENT – routing utama
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET (POST/PATCH/DELETE tidak di-cache)
  if (request.method !== 'GET') {
    return;
  }

  // ── 1. Image Cache (Cache-First) ─────────────────────────────────────────
  // Intercept semua request gambar (statis, Supabase Storage, map tiles, dll.)
  if (isImageRequest(request, url)) {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  // ── 2. Supabase REST GET: Network-First + API Cache ──────────────────────
  // Ini yang memungkinkan offline dengan data terakhir yang pernah dimuat
  if (isSupabaseRestGet(request, url)) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // ── 3. Supabase lainnya (Realtime WS, auth, dll.): selalu pass ────────────
  // Catatan: request storage public GET sudah di-handle oleh rule 1 di atas
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.io')) {
    return; // WebSocket Realtime tidak bisa di-cache, biarkan browser handle
  }

  // ── 4. Semua origin eksternal (fonts, CDN): selalu pass ──────────────────
  // Catatan: request map tiles / Unsplash sudah di-handle oleh rule 1 di atas
  if (url.origin !== self.location.origin) {
    return;
  }

  // ── 5. HTML navigation: Network-First → fallback '/' untuk SPA ──────────
  if (isHtmlRequest(request)) {
    event.respondWith(networkFirstHtml(request));
    return;
  }

  // ── 6. GeoJSON peta: Stale-While-Revalidate ──────────────────────────────
  // Serve cache langsung, perbarui di background
  if (url.pathname.endsWith('.geojson')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request, { ignoreSearch: true });
        const networkFetch = fetch(request)
          .then((response) => {
            if (isValidResponseToCache(response)) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        if (cached) {
          networkFetch.catch(() => { });
          return cached;
        }
        return (await networkFetch) || (await caches.match(request, { ignoreSearch: true }));
      })()
    );
    return;
  }

  // ── 7. Static assets hashed (/assets/): Cache-First ─────────────────────
  // Aman di-cache selamanya karena hash berubah setiap build baru
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (isValidResponseToCache(response)) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (err) {
          console.warn('[SW] Static asset offline:', url.pathname);
          return new Response('Asset unavailable offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // ── 8. Default: Network-First with cache fallback ────────────────────────
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (isValidResponseToCache(response)) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (isHtmlRequest(request)) {
          return (await caches.match('/', { ignoreSearch: true })) || new Response('Offline', { status: 503 });
        }
        throw err;
      }
    })()
  );
});

// ---------------------------------------------------------------------------
// MESSAGE – handle SKIP_WAITING dari client
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------------------------------------------------------------------------
// PUSH – handle incoming push notifications
// ---------------------------------------------------------------------------
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

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) notificationData.title = data.title;
      if (data.body) notificationData.body = data.body;
      if (data.url) notificationData.data.url = data.url;
      if (data.batchId) notificationData.data.batchId = data.batchId;
    } catch (e) {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const broadcastPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'NEW_BATCH_NOTIFICATION',
        batchId: notificationData.data.batchId,
      });
    });
  });

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        data: notificationData.data,
        requireInteraction: notificationData.requireInteraction,
        vibrate: [200, 100, 200],
        actions: [
          { action: 'open', title: 'Buka Aplikasi' },
          { action: 'close', title: 'Tutup' },
        ],
      }),
      broadcastPromise
    ])
  );
});

// ---------------------------------------------------------------------------
// NOTIFICATION CLICK – buka / fokus window app
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';
  const batchId = event.notification.data?.batchId;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const clientUrl = new URL(client.url, self.location.origin).pathname;
          const targetUrl = new URL(urlToOpen, self.location.origin).pathname;

          if (clientUrl === targetUrl && 'focus' in client) {
            if (batchId) {
              client.postMessage({
                type: 'NEW_BATCH_NOTIFICATION',
                batchId: batchId,
              });
            }
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
