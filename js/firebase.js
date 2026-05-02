// ===== OK Mart - Firebase Configuration (FULLY FIXED) =====

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

var VAPID_KEY = 'BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE';

var messaging = null;

// Check if messaging is supported
if (firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported()) {
  messaging = firebase.messaging();
  console.log('📨 Messaging ready');
} else {
  console.warn('⚠️ Messaging not supported');
}

// ============================================
// SERVICE WORKER REGISTRATION (FIXED - NO useServiceWorker)
// ============================================

if ('serviceWorker' in navigator) {
  // Register the Firebase messaging service worker
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(function(registration) {
      console.log('✅ Service Worker registered:', registration.scope);
      console.log('✅ SW active:', registration.active ? 'YES' : 'NO');
      
      // ⚠️ IMPORTANT: Modular SDK mein useServiceWorker() ki ZAROORAT NAHI HAI
      // Firebase automatically detects and uses the service worker
      // Yahan sirf registration confirm karna hai
      
      return navigator.serviceWorker.ready;
    })
    .then(function() {
      console.log('✅ Service Worker is ready (notifications will work)');
    })
    .catch(function(err) {
      console.error('❌ Service Worker registration failed:', err.message);
      
      // Try alternative path
      navigator.serviceWorker.register('./firebase-messaging-sw.js')
        .then(function(reg) {
          console.log('✅ SW registered with alt path:', reg.scope);
        })
        .catch(function(err2) {
          console.error('❌ Alt registration also failed:', err2.message);
        });
    });
} else {
  console.warn('⚠️ Service Workers not supported');
}

// ============================================
// NOTIFICATION PERMISSION & TOKEN
// ============================================

/**
 * NOTIFICATION PERMISSION MAANGO
 */
function requestNotificationPermission(callback) {
  if (!messaging) {
    console.warn('⚠️ Messaging not available');
    if (callback) callback(null, 'Not supported');
    return;
  }

  Notification.requestPermission()
    .then(function(permission) {
      console.log('🔔 Permission:', permission);
      
      if (permission === 'granted') {
        // Wait a bit for service worker to be fully ready
        setTimeout(function() {
          messaging.getToken({ vapidKey: VAPID_KEY })
            .then(function(token) {
              console.log('📨 Token:', token);
              localStorage.setItem('okmart_fcm_token', token);
              if (callback) callback(token, null);
            })
            .catch(function(err) {
              console.error('❌ Token error:', err);
              if (callback) callback(null, err.message);
            });
        }, 1000);
      } else {
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

// ============================================
// FOREGROUND MESSAGES
// ============================================

if (messaging) {
  messaging.onMessage(function(payload) {
    console.log('📨 Foreground message:', payload);
    
    var title = payload.notification ? payload.notification.title : 'OK Mart';
    var body = payload.notification ? payload.notification.body : '';
    
    // Agar custom notification function hai
    if (typeof window.showToast === 'function') {
      window.showToast('🔔 ' + title, 'info');
    }
    
    // Browser notification bhi dikhao (optional)
    if (Notification.permission === 'granted') {
      new Notification(title, { body: body, icon: '/assets/icons/icon-192x192.png' });
    }
  });
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
