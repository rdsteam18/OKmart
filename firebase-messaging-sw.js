// ===== OK Mart - FCM Service Worker =====

// Firebase SDKs import karo service worker mein
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

var firebaseConfig = {
  apiKey: "AIzaSyDHvki4jXafwzLAXJSrLQt4QodiNi5JXCw",
  authDomain: "okmart-e6219.firebaseapp.com",
  projectId: "okmart-e6219",
  storageBucket: "okmart-e6219.firebasestorage.app",
  messagingSenderId: "1066655324741",
  appId: "1:1066655324741:web:194d93a22faf870c16a12c"
};

// Initialize (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

var messaging = firebase.messaging();

// Background message handle karo
messaging.onBackgroundMessage(function(payload) {
  console.log('📨 Background message:', payload);
  
  var title = payload.notification ? payload.notification.title : 'OK Mart';
  var options = {
    body: payload.notification ? payload.notification.body : '',
    icon: '/assets/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: payload.data || {}
  };
  
  return self.registration.showNotification(title, options);
});

// Notification click handle karo
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  var url = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes(self.location.origin) && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
