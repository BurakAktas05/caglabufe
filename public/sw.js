/* eslint-disable no-restricted-globals */
// Çağla Büfe & Market - Modern PWA Service Worker & Push Notification Handler
const CACHE_NAME = 'caglabufe-cache-v1.4';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/favicon.ico',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event & Cache Cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignore non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // 1. Navigation requests (HTML pages) -> Network first, fallback to cache, then offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return offline || new Response('Çevrimdışısınız', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        })
    );
    return;
  }

  // 2. Images, fonts, and static assets -> Stale-While-Revalidate
  const isStatic =
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.url.includes('/_next/static/');

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default fetch
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ============================================================
// PUSH NOTIFICATIONS & INTERACTION HANDLERS
// ============================================================

// Push notification arrival handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'Çağla Büfe & Market',
    body: 'Yeni bir sipariş veya durum güncellemesi!',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    url: '/',
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/favicon.png',
    vibrate: [300, 100, 300, 100, 400],
    data: {
      url: data.url || '/',
      orderId: data.orderId,
    },
    actions: [
      {
        action: 'view',
        title: 'Siparişi Gör',
      },
      {
        action: 'close',
        title: 'Kapat',
      },
    ],
    tag: data.tag || 'caglabufe-alert',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // If no window is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for message events (e.g. skipWaiting or show notification directly)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Trigger local notification via service worker
  if (event.data && event.data.type === 'SHOW_LOCAL_NOTIFICATION') {
    const { title, body, url, tag } = event.data.payload || {};
    self.registration.showNotification(title || 'Çağla Büfe', {
      body: body || 'Siparişinizde yeni hareket var.',
      icon: '/icon-192.png',
      badge: '/favicon.png',
      vibrate: [250, 100, 250, 100, 350],
      data: { url: url || '/' },
      tag: tag || 'local-notification',
      renotify: true,
      actions: [
        { action: 'view', title: 'Siparişi Gör' },
        { action: 'close', title: 'Kapat' },
      ],
    });
  }
});
