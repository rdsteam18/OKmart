// ===== OK Mart - Firebase Messaging Service Worker =====

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase config
var firebaseConfig = {
  apiKey: "AIzaSyDHvki4jXafwzLAXJSrLQt4QodiNi5JXCw",
  authDomain: "okmart-e6219.firebaseapp.com",
  projectId: "okmart-e6219",
  storageBucket: "okmart-e6219.firebasestorage.app",
  messagingSenderId: "1066655324741",
  appId: "1:1066655324741:web:194d93a22faf870c16a12c"
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

var messaging = null;

// Initialize messaging if supported
if (firebase.messaging && typeof firebase.messaging.isSupported === 'function') {
  if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
  }
}

// Handle background messages
if (messaging) {
  messaging.onBackgroundMessage(function(payload) {
    console.log('📨 Background message:', payload);
    
    var notificationTitle = payload.notification ? payload.notification.title : 'OK Mart';
    var notificationOptions = {
      body: payload.notification ? payload.notification.body : 'New update available!',
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      data: payload.data || {},
      vibrate: [200, 100, 200],
      requireInteraction: true
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

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
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('📨 FCM Service Worker ready');
