// ===== OK MART - SERVICE WORKER FOR PWA =====

// ===== FCM (push notifications) inside the ACTIVE service worker =====
// sw.js is the registered worker (see js/common.js); firebase-messaging-sw.js
// is NOT registered, so FCM must live here or console-sent pushes would never
// display. Guarded: if the CDN is unreachable at install time, the worker
// still installs and the raw push handler below is the fallback.
var fcmMessaging = null;
try {
  importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: 'AIzaSyA1JX2YZf2DgqI5JbY3k1G9fVw6mX0zQ8pR4sT2v',
    authDomain: 'okmart-e6219.firebaseapp.com',
    projectId: 'okmart-e6219',
    messagingSenderId: '1066655324741',
    appId: '1:1066655324741:web:194d93a22faf870c16a12c'
  });
  fcmMessaging = firebase.messaging();
  fcmMessaging.onBackgroundMessage(function (payload) {
    var n = payload.notification || {};
    var d = payload.data || {};
    var title = n.title || d.title || 'OK Mart';
    var options = {
      body: n.body || d.body || 'New update from OK Mart!',
      icon: LOGO_URL,
      image: n.image || d.image || undefined,
      data: { url: d.url || '/' },
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'close', title: 'Dismiss' }
      ]
    };
    return self.registration.showNotification(title, options);
  });
} catch (e) { /* FCM unavailable in SW; raw push handler below still works */ }

const CACHE_NAME = 'okmart-v1.0.13';
const LOGO_URL = 'https://blogger.googleusercontent.com/img/a/AVvXsEjqUODVL4iyLalUMIzsfwPSpjOSA_8OEz7zn7WiCOxVySl8TqcLxulYNt7tBT9C85tto_EoafNkIMbgV1AMPkOJjkeZ52VLY5PR02z06GFwwFPb9WQBAun4WHcd3JB2Heky3Q2WdDGPy8DGZn7suo0_8RdY7Wd7i7wTMA4osYIiL6NZ1CbuPJHGzmeX';

const urlsToCache = [
  '/',
  '/index.html',
  '/cart.html',
  '/checkout.html',
  '/product.html',
  '/profile.html',
  '/track-order.html',
  '/search.html',
  '/offers.html',
  '/css/common.css',
  '/css/home.css',
  '/css/cart.css',
  '/css/product.css',
  '/js/common.js',
  '/js/fcm-token.js',
  '/js/firebase.js',
  '/js/home.js',
  '/manifest.json',
  '/offline.html'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Fetch from cache first, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      
      // Clone the request
      const fetchRequest = event.request.clone();
      
      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline - Please check your connection', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// Handle push notifications (RAW fallback — only when the FCM SDK above did
// not load, otherwise the SDK's background handler shows the notification and
// this would double-display). Parses JioMart-style payloads: title + body +
// big image + deep link in data.url.
if (!fcmMessaging) {
  self.addEventListener('push', (event) => {
    var title = 'OK Mart';
    var options = {
      body: 'New update available!',
      icon: LOGO_URL,
      vibrate: [200, 100, 200],
      data: { url: '/' },
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'close', title: 'Dismiss' }
      ]
    };
    if (event.data) {
      try {
        var data = event.data.json();
        if (data.notification) {
          title = data.notification.title || title;
          options.body = data.notification.body || options.body;
          if (data.notification.image) options.image = data.notification.image;
        } else if (typeof data.body === 'string') {
          options.body = data.body;
        }
        if (data.title) title = data.title;
        if (data.data && data.data.url) options.data = { url: data.data.url };
        if (data.image) options.image = data.image;
      } catch (e) {
        try { options.body = event.data.text(); } catch (e2) {}
      }
    }
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
}

// Handle notification click — body tap AND the Open action both follow the
// notification's deep link (data.url); Dismiss just closes.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(url) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
