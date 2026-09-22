/* sw.js — Workbox-powered Service Worker
 * - Immediate activation: self.skipWaiting() + clientsClaim()
 * - Page handles reload on `controllerchange` (do NOT force reload from SW)
 * - Keeps your routes, share-target, background sync, and push handlers
 */

import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

// --- Take over as soon as installed ---
self.skipWaiting();
clientsClaim();

// --- Precache app shell and static assets ---
precacheAndRoute(self.__WB_MANIFEST);

// =========================
// Caching routes / strategies
// =========================

// 1) API (exclude Mapbox): NetworkFirst (offline fallback to cache/JSON)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.hostname.includes('mapbox'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }), // 1 day
    ],
  })
);

// 2) JS/CSS: NetworkFirst (you can switch to StaleWhileRevalidate if preferred)
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new NetworkFirst({
    cacheName: 'static-resources',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

// 3) Images: CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }), // 30 days
    ],
  })
);

// 4) Mapbox tiles: CacheFirst (bounded)
registerRoute(
  ({ url }) => url.hostname === 'api.mapbox.com',
  new CacheFirst({
    cacheName: 'mapbox-tiles',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 }), // 7 days
    ],
  })
);

// 5) Fonts: CacheFirst
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }), // 1 year
    ],
  })
);

// =========================
// Lifecycle & messaging
// =========================

// Activate: light cache cleanup (do NOT touch Workbox precache caches)
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.map((n) => {
        if (n.startsWith('old-') || n.startsWith('temp-')) return caches.delete(n);
        return undefined;
      })
    );

    // Optional: enable navigation preload if supported
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
  })());
});

// Single message handler:
// - Resolve share-target handshake
// - Handle SKIP_WAITING requests from the page
const nextMessageResolveMap = new Map();
self.addEventListener('message', (event) => {
  // Resolve waiters from nextMessage()
  const resolvers = nextMessageResolveMap.get(event.data);
  if (resolvers) {
    nextMessageResolveMap.delete(event.data);
    for (const resolve of resolvers) resolve();
  }

  // Handle explicit activation request
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// =========================
// Share Target (POST) handling
// =========================

self.addEventListener('fetch', (event) => {
  // Share Target: handle POST to /share-target
  if (event.request.url.endsWith('/share-target') && event.request.method === 'POST') {
    const formDataPromise = event.request.formData();

    // Immediately respond with a redirect so the app opens
    event.respondWith(Response.redirect('./index.html?share-target', 303));

    event.waitUntil((async () => {
      // Wait until the page says it's ready to receive the data
      await nextMessage('share-ready');

      // Determine target client window
      let client = null;
      if (event.resultingClientId) {
        client = await self.clients.get(event.resultingClientId);
      }
      if (!client) {
        const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        client = all[0]; // best effort
      }
      if (!client) return;

      const data = await formDataPromise;

      // If any images were shared, send them all; otherwise send the file (ZIP)
      const imageFiles = [];
      for (const [, value] of data.entries()) {
        if (value instanceof File && value.type.startsWith('image/')) imageFiles.push(value);
      }

      if (imageFiles.length > 0) {
        client.postMessage({ action: 'load-images', files: imageFiles });
      } else {
        const file = data.get('file');
        if (file) client.postMessage({ action: 'load-map', file });
      }
    })());

    return; // important: stop here for the share-target request
  }

  // HTML navigation fallback: try network, then precached index.html
  if (event.request.mode === 'navigate') {
    // Respond within the handler to avoid cancelling the preload promise
    event.respondWith((async () => {
      try {
        // If navigation preload is available, prefer it
        const preload = await event.preloadResponse;
        if (preload) return preload;
        return await fetch(event.request);
      } catch {
        // Offline -> app shell
        const cached = await caches.match('/index.html');
        if (cached) return cached;
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })());
    return;
  }

  // API requests (non-Mapbox) offline fallback (if not covered by Workbox route)
  if (event.request.url.includes('/api/') && !event.request.url.includes('mapbox')) {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(
          JSON.stringify({ error: 'Offline', message: 'This feature requires an internet connection.' }),
          { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } }
        );
      }
    })());
    return;
  }
});

// Helper to await a specific next message from the page
function nextMessage(dataVal) {
  return new Promise((resolve) => {
    if (!nextMessageResolveMap.has(dataVal)) nextMessageResolveMap.set(dataVal, []);
    nextMessageResolveMap.get(dataVal).push(resolve);
  });
}

// =========================
// Background Sync (optional)
// =========================

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    const queuedItems = await getQueuedItems(); // implement with IndexedDB if needed
    for (const item of queuedItems) {
      try {
        await processQueuedItem(item);
        await removeQueuedItem(item.id);
      } catch (err) {
        console.error('SW: Failed to process queued item', err);
      }
    }
  } catch (err) {
    console.error('SW: Background sync failed', err);
  }
}

async function getQueuedItems() { return []; }
async function processQueuedItem(item) { /* no-op */ }
async function removeQueuedItem(id) { /* no-op */ }

// =========================
/* Push notifications (optional) */
// =========================

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Open App', icon: '/icon-192x192.png' },
      { action: 'close', title: 'Close', icon: '/icon-192x192.png' },
    ],
  };
  event.waitUntil(self.registration.showNotification('WAMaps', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open') {
    event.waitUntil(clients.openWindow('/'));
  }
});
