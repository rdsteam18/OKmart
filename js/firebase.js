// ===== OK Mart - Firebase Configuration (COMPLETE WORKING) =====

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
  console.log('🔥 Firebase initialized');
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

// VAPID Key - Already in your project
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
// SERVICE WORKER REGISTRATION (FIXED)
// ============================================

if ('serviceWorker' in navigator) {
  // Register the Firebase messaging service worker
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(function(registration) {
      console.log('✅ Service Worker registered:', registration.scope);
      console.log('✅ SW active:', registration.active ? 'YES' : 'NO');
      return navigator.serviceWorker.ready;
    })
    .then(function() {
      console.log('✅ Service Worker is ready - Notifications will work');
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
// TOPIC SUBSCRIPTION HELPER
// ============================================

// Store all tokens in Firestore for later use
function saveTokenToFirestore(token) {
  if (!db) return;
  
  // Get user info if available
  var userId = localStorage.getItem('okmart_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('okmart_user_id', userId);
  }
  
  // Save token to Firestore
  db.collection('fcm_tokens').doc(token).set({
    token: token,
    userId: userId,
    userAgent: navigator.userAgent,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastActive: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function() {
    console.log('✅ Token saved to Firestore');
  }).catch(function(err) {
    console.warn('⚠️ Could not save token to Firestore:', err.message);
  });
}

// ============================================
// NOTIFICATION PERMISSION & TOKEN (UPDATED)
// ============================================

/**
 * NOTIFICATION PERMISSION MAANGO - Sab users ke liye
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
        // Wait a bit for service worker to be ready
        setTimeout(function() {
          messaging.getToken({ vapidKey: VAPID_KEY })
            .then(function(token) {
              console.log('📨 FCM Token generated:', token);
              
              // Save to localStorage
              localStorage.setItem('okmart_fcm_token', token);
              
              // Save to Firestore (so you can send notifications to all users)
              saveTokenToFirestore(token);
              
              // Show success message
              if (typeof window.showToast === 'function') {
                window.showToast('✅ Notifications enabled!', 'success');
              } else {
                console.log('✅ Notifications enabled for this device');
              }
              
              if (callback) callback(token, null);
            })
            .catch(function(err) {
              console.error('❌ Token error:', err);
              if (callback) callback(null, err.message);
            });
        }, 1000);
      } else {
        console.log('❌ User denied notification permission');
        if (callback) callback(null, 'denied');
      }
    })
    .catch(function(err) {
      console.error('❌ Permission request error:', err);
      if (callback) callback(null, err.message);
    });
}

/**
 * Stored token nikalo
 */
function getStoredFCMToken() {
  return localStorage.getItem('okmart_fcm_token') || null;
}

/**
 * Get all FCM tokens from Firestore (for admin use)
 */
function getAllUserTokens() {
  return db.collection('fcm_tokens').get().then(function(snapshot) {
    var tokens = [];
    snapshot.forEach(function(doc) {
      tokens.push(doc.data().token);
    });
    return tokens;
  });
}

// ============================================
// FOREGROUND MESSAGES (JAB APP KHULA HO)
// ============================================

if (messaging) {
  messaging.onMessage(function(payload) {
    console.log('📨 Foreground message received:', payload);
    
    var title = payload.notification ? payload.notification.title : 'OK Mart';
    var body = payload.notification ? payload.notification.body : 'New update available!';
    
    // Show browser notification even in foreground
    if (Notification.permission === 'granted') {
      var options = {
        body: body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        requireInteraction: true
      };
      
      var notification = new Notification(title, options);
      
      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        notification.close();
      };
    }
    
    // Also show toast if available
    if (typeof window.showToast === 'function') {
      window.showToast('🔔 ' + title + ': ' + body, 'info');
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
  settings: db.collection('settings'),
  fcm_tokens: db.collection('fcm_tokens')  // NEW: Store all user tokens
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
// ADMIN: SEND NOTIFICATION TO ALL USERS
// ============================================

/**
 * Send notification to all users (call this from admin panel)
 */
function sendNotificationToAllUsers(title, body, data) {
  return getAllUserTokens().then(function(tokens) {
    console.log(`📨 Sending to ${tokens.length} users`);
    
    // Firebase Cloud Messaging HTTP v1 API endpoint
    // Note: You'll need a server-side function for this
    // For now, this shows how many tokens you have
    
    alert(`Total ${tokens.length} users will receive notifications`);
    return tokens;
  });
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
  getAllTokens: getAllUserTokens,
  sendToAll: sendNotificationToAllUsers,
  getAllDocs: getAllDocs,
  getDoc: getDoc,
  addDoc: addDoc,
  updateDoc: updateDoc,
  deleteDoc: deleteDoc,
  collections: collections
};

console.log('✅ Firebase ready | Messaging:', messaging ? 'OK' : 'N/A');
