// ===== OK MART - SERVICE WORKER =====
// Caching strategy: Cache first, then network fallback

const CACHE_NAME = 'okmart-v1.0.0';
const DYNAMIC_CACHE = 'okmart-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/cart.html',
  '/checkout.html',
  '/success.html',
  '/search.html',
  '/track.html',
  '/categories/dairy.html',
  '/categories/snacks.html',
  '/categories/grocery.html',
  '/manifest.json',
  
  // CSS
  '/css/common.css',
  '/css/home.css',
  '/css/cart.css',
  '/css/checkout.css',
  '/css/category.css',
  '/css/search.css',
  '/css/success.css',
  '/css/track.css',
  
  // JavaScript
  '/js/common.js',
  '/js/home.js',
  '/js/cart.js',
  '/js/checkout.js',
  '/js/category.js',
  '/js/search.js',
  '/js/success.js',
  '/js/track.js',
  
  // Data
  '/data/products.json',
  
  // External resources (fonts)
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external analytics/tracking
  if (url.hostname.includes('google-analytics') || 
      url.hostname.includes('googletagmanager')) {
    return;
  }
  
  // Handle API calls (if any) - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Handle image requests - cache first with dynamic caching
  if (request.destination === 'image') {
    event.respondWith(cacheFirstWithDynamic(request));
    return;
  }
  
  // Handle HTML pages - network first, fallback to cache
  if (request.destination === 'document') {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }
  
  // Default: stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ---------- Caching Strategies ----------

// Cache first, then network (with dynamic caching)
async function cacheFirstWithDynamic(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the new response
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Return fallback image if available
    return caches.match('/assets/images/placeholder.png');
  }
}

// Network first, fallback to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Network first with offline fallback for HTML pages
async function networkFirstWithOffline(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html');
  }
}

// Stale while revalidate
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      caches.open(CACHE_NAME)
        .then((cache) => {
          cache.put(request, networkResponse.clone());
        });
      return networkResponse;
    })
    .catch(() => {
      return cachedResponse;
    });
  
  return cachedResponse || fetchPromise;
}

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Your order is out for delivery! 🚚',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/track.html',
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'track',
        title: 'Track Order',
        icon: '/assets/icons/track-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icons/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('OK Mart', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'track') {
    event.waitUntil(
      clients.openWindow('/track.html')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCartData());
  }
});

async function syncCartData() {
  console.log('[SW] Syncing cart data...');
  // Implement cart sync logic here
}
