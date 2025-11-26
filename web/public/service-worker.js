/**
 * Service Worker for MetaPharm Connect
 *
 * T2-045: Caching strategy implementation
 *
 * Caching strategies:
 * 1. Cache-First: Static assets (JS, CSS, fonts, images)
 * 2. Network-First: API calls (with fallback to cache)
 * 3. Stale-While-Revalidate: Non-critical resources
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `metapharm-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `metapharm-dynamic-${CACHE_VERSION}`;
const API_CACHE = `metapharm-api-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Cache size limits
const MAX_CACHE_SIZE = {
  [DYNAMIC_CACHE]: 50, // 50 items
  [API_CACHE]: 100, // 100 API responses
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[ServiceWorker] Installation failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versions of our caches
              return cacheName.startsWith('metapharm-') &&
                     cacheName !== STATIC_CACHE &&
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== API_CACHE;
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activated successfully');
        return self.clients.claim(); // Take control of all pages immediately
      })
  );
});

/**
 * Fetch event - handle requests with appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip POST, PUT, DELETE requests (only cache GET)
  if (request.method !== 'GET') {
    return;
  }

  // Determine caching strategy based on request type
  if (isStaticAsset(url)) {
    // Strategy 1: Cache-First for static assets
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isApiRequest(url)) {
    // Strategy 2: Network-First for API calls
    event.respondWith(networkFirst(request, API_CACHE));
  } else {
    // Strategy 3: Stale-While-Revalidate for other resources
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

/**
 * Check if request is for static asset
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * Check if request is an API call
 */
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

/**
 * Strategy 1: Cache-First
 * Tries cache first, falls back to network
 * Best for: Static assets that rarely change
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      console.log('[ServiceWorker] Cache hit:', request.url);
      return cached;
    }

    console.log('[ServiceWorker] Cache miss, fetching:', request.url);
    const response = await fetch(request);

    // Cache the response for next time
    if (response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[ServiceWorker] Cache-first failed:', error);
    throw error;
  }
}

/**
 * Strategy 2: Network-First
 * Tries network first, falls back to cache
 * Best for: API calls that need fresh data
 */
async function networkFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);

    try {
      // Try network first
      const response = await fetch(request);

      // Cache successful responses
      if (response.status === 200) {
        cache.put(request, response.clone());
        await limitCacheSize(cacheName, MAX_CACHE_SIZE[cacheName]);
      }

      return response;
    } catch (networkError) {
      console.log('[ServiceWorker] Network failed, trying cache:', request.url);

      // Network failed, try cache
      const cached = await cache.match(request);

      if (cached) {
        console.log('[ServiceWorker] Serving from cache (offline):', request.url);
        return cached;
      }

      // Both failed
      throw networkError;
    }
  } catch (error) {
    console.error('[ServiceWorker] Network-first failed:', error);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }

    throw error;
  }
}

/**
 * Strategy 3: Stale-While-Revalidate
 * Returns cached version immediately, updates cache in background
 * Best for: Resources where freshness is nice but not critical
 */
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Fetch fresh version in background
    const fetchPromise = fetch(request)
      .then((response) => {
        if (response.status === 200) {
          cache.put(request, response.clone());
          limitCacheSize(cacheName, MAX_CACHE_SIZE[cacheName]);
        }
        return response;
      })
      .catch((error) => {
        console.log('[ServiceWorker] Background fetch failed:', error);
      });

    // Return cached version immediately if available
    if (cached) {
      console.log('[ServiceWorker] Serving stale, revalidating:', request.url);
      return cached;
    }

    // Wait for fetch if no cached version
    console.log('[ServiceWorker] No cache, waiting for network:', request.url);
    return await fetchPromise;
  } catch (error) {
    console.error('[ServiceWorker] Stale-while-revalidate failed:', error);
    throw error;
  }
}

/**
 * Limit cache size to prevent storage bloat
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Delete oldest entries (first in cache)
    const toDelete = keys.length - maxSize;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`[ServiceWorker] Trimmed cache ${cacheName} to ${maxSize} items`);
  }
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});
