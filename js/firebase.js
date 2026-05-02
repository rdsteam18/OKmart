// ===== OK Mart - Firebase Configuration (FIXED) =====

// Firebase config
var firebaseConfig = {
  apiKey: "AIzaSyDHvki4jXafwzLAXJSrLQt4QodiNi5JXCw",
  authDomain: "okmart-e6219.firebaseapp.com",
  projectId: "okmart-e6219",
  storageBucket: "okmart-e6219.firebasestorage.app",
  messagingSenderId: "1066655324741",
  appId: "1:1066655324741:web:194d93a22faf870c16a12c",
  measurementId: "G-2497DJLP1Q"
};

// Initialize Firebase (only if not already initialized)
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firestore
var db = firebase.firestore();

// Enable offline persistence
try {
  db.enablePersistence({ synchronizeTabs: true })
    .then(function() {
      console.log('🔥 Firestore persistence ON');
    })
    .catch(function(err) {
      console.warn('⚠️ Persistence:', err.code);
    });
} catch(e) {
  console.warn('⚠️ Persistence error');
}

// ============================================
// CLOUD MESSAGING (FCM)
// ============================================

// VAPID Key - Firebase Console se copy karo
var VAPID_KEY = 'BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE';

var messaging = null;

// Check if messaging is supported
if (firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported()) {
  messaging = firebase.messaging();
  console.log('📨 Messaging ready');
} else {
  console.warn('⚠️ Messaging not supported');
}

/**
 * NOTIFICATION PERMISSION MAANGO
 * Ye function call karo jab user "Enable" button click kare
 */
function requestNotificationPermission(callback) {
  if (!messaging) {
    console.warn('⚠️ Messaging not available');
    if (callback) callback(null, 'Not supported');
    return;
  }

  // Step 1: Browser permission maango
  Notification.requestPermission()
    .then(function(permission) {
      console.log('🔔 Permission:', permission);
      
      if (permission === 'granted') {
        // Step 2: FCM token lo
        messaging.getToken({ vapidKey: VAPID_KEY })
          .then(function(token) {
            console.log('📨 Token mil gaya:', token);
            
            // Token save karo localStorage mein
            localStorage.setItem('okmart_fcm_token', token);
            
            // Callback - success
            if (callback) callback(token, null);
          })
          .catch(function(err) {
            console.error('❌ Token error:', err);
            if (callback) callback(null, err.message);
          });
      } else {
        console.log('❌ User ne deny kiya');
        if (callback) callback(null, 'denied');
      }
    });
}

/**
 * Stored token nikalo
 */
function getStoredFCMToken() {
  return localStorage.getItem('okmart_fcm_token') || null;
}

// Foreground message handle karo
if (messaging) {
  messaging.onMessage(function(payload) {
    console.log('📨 Message aaya:', payload);
    
    var title = payload.notification ? payload.notification.title : 'OK Mart';
    var body = payload.notification ? payload.notification.body : '';
    
    // Toast notification dikhao
    if (window.showToast) {
      window.showToast('🔔 ' + title, 'info');
    }
    
    // Agar koi custom notification function hai to call karo
    if (typeof showBrowserNotification === 'function') {
      showBrowserNotification(title, body);
    }
  });
}

// ============================================
// SERVICE WORKER REGISTER KARO
// ============================================

// ============================================
// SERVICE WORKER REGISTRATION (FIXED)
// ============================================

if ('serviceWorker' in navigator) {
  // Unregister old service workers first (cleanup)
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    registrations.forEach(function(registration) {
      // Only unregister if it's not our current one
      if (registration.active && registration.active.scriptURL.includes('firebase-messaging-sw.js')) {
        console.log('✅ Found existing FCM service worker');
      }
    });
  });

  // Register the Firebase messaging service worker
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(function(registration) {
      console.log('✅ Service Worker registered:', registration.scope);
      
      // Wait for service worker to be ready
      return navigator.serviceWorker.ready;
    })
    .then(function(registration) {
      console.log('✅ Service Worker is ready');
      
      // Give messaging the service worker registration
      if (messaging) {
        // For compat SDK, use the service worker registration directly
        messaging.useServiceWorker(registration);
        console.log('✅ Messaging linked with Service Worker');
      }
    })
    .catch(function(err) {
      console.error('❌ Service Worker registration failed:', err.message);
      
      // Try alternative registration path
      navigator.serviceWorker.register('./firebase-messaging-sw.js')
        .then(function(reg) {
          console.log('✅ SW registered with alt path:', reg.scope);
        })
        .catch(function(err2) {
          console.error('❌ Alt registration also failed:', err2.message);
        });
    });
} else {
  console.warn('⚠️ Service Workers not supported in this browser');
}

// ============================================
// COLLECTIONS REFERENCE
// ============================================

var collections = {
  products: db.collection('products'),
  orders: db.collection('orders'),
  offers: db.collection('offers'),
  banners: db.collection('banners'),
  admins: db.collection('admins'),
  settings: db.collection('settings')
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getAllDocs(colName) {
  return db.collection(colName).get().then(function(snap) {
    var docs = [];
    snap.forEach(function(d) { docs.push({ id: d.id, data: d.data() }); });
    return docs;
  });
}

function getDoc(colName, id) {
  return db.collection(colName).doc(id).get().then(function(d) {
    return d.exists ? { id: d.id, data: d.data() } : null;
  });
}

function addDoc(colName, data) {
  return db.collection(colName).add(data);
}

function updateDoc(colName, id, data) {
  return db.collection(colName).doc(id).update(data);
}

function deleteDoc(colName, id) {
  return db.collection(colName).doc(id).delete();
}

// ============================================
// GLOBAL EXPORT
// ============================================

window.db = db;
window.messaging = messaging;
window.collections = collections;

window.FirebaseHelper = {
  requestPermission: requestNotificationPermission,
  getToken: getStoredFCMToken,
  getAllDocs: getAllDocs,
  getDoc: getDoc,
  addDoc: addDoc,
  updateDoc: updateDoc,
  deleteDoc: deleteDoc,
  collections: collections
};

console.log('✅ Firebase ready | Messaging:', messaging ? 'OK' : 'N/A');
