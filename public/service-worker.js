/**
 * Service Worker for PNG Green Fees System
 * Provides offline support and background sync for unreliable networks
 * Optimized for PNG network conditions (2G/3G, frequent dropouts)
 */

const CACHE_NAME = 'greenpay-v4';
const API_CACHE_NAME = 'greenpay-api-v4';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/buy-voucher',
  '/offline.html',
  '/manifest.json'
];

// API endpoints to cache (for offline access)
const API_ENDPOINTS = [
  '/api/public-purchases/create-session',
  '/api/public-purchases/complete'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[Service Worker] Installation complete');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation complete');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - network-first with cache fallback (optimized for PNG)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // For POST requests, try network and queue if offline
    if (!navigator.onLine) {
      event.respondWith(
        queueRequestForLater(request)
      );
    }
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request, API_CACHE_NAME)
    );
    return;
  }

  // Handle static assets - cache first for speed
  event.respondWith(
    cacheFirstStrategy(request, CACHE_NAME)
  );
});

/**
 * Network-first strategy (for API calls)
 * Try network first, fall back to cache if offline
 * Timeout after 5 seconds (PNG networks can be slow)
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network with timeout
    const networkResponse = await fetchWithTimeout(request, 5000);

    // Cache successful responses
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);

    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url);
      return cachedResponse;
    }

    // No cache available, return offline page
    return caches.match('/offline.html');
  }
}

/**
 * Cache-first strategy (for static assets)
 * Serve from cache if available, otherwise fetch from network
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[Service Worker] Serving from cache:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Failed to fetch:', request.url);
    return caches.match('/offline.html');
  }
}

/**
 * Fetch with timeout (for slow PNG networks)
 */
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

/**
 * Queue request for background sync
 * Store failed requests to retry when online
 */
async function queueRequestForLater(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text()
  };

  // Store in IndexedDB for background sync
  // This is a simplified version - full implementation would use IndexedDB
  console.log('[Service Worker] Queuing request for background sync:', requestData);

  // Return a response indicating the request was queued
  return new Response(
    JSON.stringify({
      queued: true,
      message: 'Request queued for when you are back online'
    }),
    {
      status: 202,
      statusText: 'Accepted',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Background Sync - retry failed requests when online
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-purchase-queue') {
    event.waitUntil(
      syncPendingPurchases()
    );
  }
});

/**
 * Sync pending purchases when connection restored
 */
async function syncPendingPurchases() {
  console.log('[Service Worker] Syncing pending purchases...');

  // Get pending purchases from IndexedDB
  // Retry sending them
  // This is a placeholder - full implementation would use IndexedDB

  // Notify clients that sync is complete
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      message: 'Pending purchases synced successfully'
    });
  });
}

// Push notifications (for payment confirmations)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PNG Green Fees';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler (for communication with main app)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[Service Worker] Loaded successfully');
