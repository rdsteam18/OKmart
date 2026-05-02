// ===== OK Mart - FCM Service Worker =====

// Give this service worker access to Firebase Messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyDHvki4jXafwzLAXJSrLQt4QodiNi5JXCw",
  authDomain: "okmart-e6219.firebaseapp.com",
  projectId: "okmart-e6219",
  storageBucket: "okmart-e6219.firebasestorage.app",
  messagingSenderId: "1066655324741",
  appId: "1:1066655324741:web:194d93a22faf870c16a12c"
};

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
var messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Background message received:', payload);

  var notificationTitle = payload.notification ? payload.notification.title : 'OK Mart Update';
  var notificationOptions = {
    body: payload.notification ? payload.notification.body : 'New update available!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  var url = '/';
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a tab open
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Optional: Handle push events directly
self.addEventListener('push', function(event) {
  console.log('[SW] Push event received');

  if (event.data) {
    try {
      var data = event.data.json();
      var title = data.notification ? data.notification.title : 'OK Mart';
      var options = {
        body: data.notification ? data.notification.body : 'New update!',
        icon: '/assets/icons/icon-192x192.png',
        vibrate: [200, 100, 200],
        data: data.data || {}
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      console.error('[SW] Push parse error:', e);
    }
  }
});

// Service worker install event
self.addEventListener('install', function(event) {
  console.log('[SW] Service Worker installed');
  self.skipWaiting();
});

// Service worker activate event
self.addEventListener('activate', function(event) {
  console.log('[SW] Service Worker activated');
  event.waitUntil(clients.claim());
});

console.log('[SW] Firebase Messaging Service Worker ready');
