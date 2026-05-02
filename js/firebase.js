// ===== OK Mart - Firebase Configuration (FIXED) =====
// Firebase v9 Compat SDK

// Your Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyDHvki4jXafwzLAXJSrLQt4QodiNi5JXCw",
  authDomain: "okmart-e6219.firebaseapp.com",
  projectId: "okmart-e6219",
  storageBucket: "okmart-e6219.firebasestorage.app",
  messagingSenderId: "1066655324741",
  appId: "1:1066655324741:web:194d93a22faf870c16a12c",
  measurementId: "G-2497DJLP1Q"
};

// Check if Firebase is already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('🔥 Firebase initialized');
} else {
  console.log('🔥 Firebase already initialized');
}

// Initialize Firestore
var db = firebase.firestore();

// Enable offline persistence (only once)
try {
  db.enablePersistence({ synchronizeTabs: true })
    .then(function() {
      console.log('🔥 Firestore persistence enabled');
    })
    .catch(function(err) {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs - persistence disabled');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Browser not supported');
      }
    });
} catch(e) {
  console.warn('⚠️ Persistence already set');
}

// ============================================
// FIREBASE CLOUD MESSAGING (FCM)
// ============================================

var messaging = null;

// Check if messaging is supported
if (firebase.messaging && typeof firebase.messaging.isSupported === 'function') {
  if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
    console.log('📨 Firebase Messaging initialized');
  } else {
    console.warn('⚠️ Messaging not supported in this browser');
  }
} else {
  console.warn('⚠️ Messaging SDK not loaded');
}

// VAPID Key - Get from Firebase Console
var VAPID_KEY = 'BPLxX9qGdT8xZ2WqGvY5kLmNpR3sT7vX1yA6bD9eF0hJ4cK8oQ2rS5uW8zA1bC3dE6fG9hI0jL2mN4pR6tV8xY';

/**
 * Request notification permission and get FCM token
 */
function requestNotificationPermission(callback) {
  if (!messaging) {
    console.warn('⚠️ Messaging not available');
    if (callback) callback(null, 'Messaging not supported');
    return;
  }

  // Request browser permission first
  Notification.requestPermission()
    .then(function(permission) {
      console.log('🔔 Permission:', permission);
      
      if (permission === 'granted') {
        // Get FCM token using compat API
        messaging.getToken({ vapidKey: VAPID_KEY })
          .then(function(currentToken) {
            if (currentToken) {
              console.log('📨 FCM Token:', currentToken);
              localStorage.setItem('okmart_fcm_token', currentToken);
              
              if (callback) callback(currentToken, null);
            } else {
              console.warn('⚠️ No registration token available');
              if (callback) callback(null, 'No token');
            }
          })
          .catch(function(err) {
            console.error('❌ Error getting token:', err);
            if (callback) callback(null, err.message);
          });
      } else {
        console.log('❌ Permission denied');
        if (callback) callback(null, 'Permission denied');
      }
    });
}

/**
 * Get stored FCM token
 */
function getStoredFCMToken() {
  return localStorage.getItem('okmart_fcm_token') || null;
}

/**
 * Delete FCM token
 */
function deleteFCMToken(callback) {
  var token = getStoredFCMToken();
  if (token && messaging) {
    messaging.deleteToken(token)
      .then(function() {
        console.log('✅ Token deleted');
        localStorage.removeItem('okmart_fcm_token');
        if (callback) callback(true);
      })
      .catch(function(err) {
        console.error('❌ Error deleting token:', err);
        if (callback) callback(false);
      });
  }
}

// Foreground message handler
if (messaging) {
  messaging.onMessage(function(payload) {
    console.log('📨 Foreground message:', payload);
    
    var notification = payload.notification || {};
    
    // Show in-app notification if function exists
    if (window.showToast) {
      window.showToast('🔔 ' + (notification.title || 'New Update') + ': ' + (notification.body || ''), 'info');
    }
  });
}

// ============================================
// FIREBASE COLLECTIONS REFERENCE
// ============================================

var collections = {
  products: db.collection('products'),
  orders: db.collection('orders'),
  offers: db.collection('offers'),
  banners: db.collection('banners'),
  admins: db.collection('admins'),
  settings: db.collection('settings'),
  blockedUsers: db.collection('blockedUsers'),
  fcmTokens: db.collection('fcm_tokens')
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getAllDocuments(collectionName) {
  return db.collection(collectionName).get()
    .then(function(snapshot) {
      var docs = [];
      snapshot.forEach(function(doc) {
        docs.push({ id: doc.id, data: doc.data() });
      });
      return docs;
    });
}

function getDocumentById(collectionName, docId) {
  return db.collection(collectionName).doc(docId).get()
    .then(function(doc) {
      return doc.exists ? { id: doc.id, data: doc.data() } : null;
    });
}

function addDocument(collectionName, data) {
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  return db.collection(collectionName).add(data);
}

function updateDocument(collectionName, docId, data) {
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  return db.collection(collectionName).doc(docId).update(data);
}

function deleteDocument(collectionName, docId) {
  return db.collection(collectionName).doc(docId).delete();
}

function queryDocuments(collectionName, field, operator, value) {
  return db.collection(collectionName).where(field, operator, value).get()
    .then(function(snapshot) {
      var docs = [];
      snapshot.forEach(function(doc) {
        docs.push({ id: doc.id, data: doc.data() });
      });
      return docs;
    });
}

function listenToCollection(collectionName, callback, filters) {
  var query = db.collection(collectionName);
  if (filters && Array.isArray(filters)) {
    filters.forEach(function(f) {
      query = query.where(f.field, f.operator, f.value);
    });
  }
  return query.onSnapshot(function(snapshot) {
    var docs = [];
    snapshot.forEach(function(doc) {
      docs.push({ id: doc.id, data: doc.data() });
    });
    callback(docs);
  });
}

// ============================================
// EXPORT TO GLOBAL SCOPE
// ============================================

window.db = db;
window.firestoreCollections = collections;
window.messaging = messaging;

window.FirebaseHelper = {
  getAllDocuments: getAllDocuments,
  getDocumentById: getDocumentById,
  addDocument: addDocument,
  updateDocument: updateDocument,
  deleteDocument: deleteDocument,
  queryDocuments: queryDocuments,
  listenToCollection: listenToCollection,
  collections: collections,
  requestNotificationPermission: requestNotificationPermission,
  getStoredFCMToken: getStoredFCMToken,
  deleteFCMToken: deleteFCMToken,
  VAPID_KEY: VAPID_KEY
};

console.log('🔥 Firebase ready');
console.log('📦 Collections:', Object.keys(collections).join(', '));
console.log('📨 Messaging:', messaging ? 'Available' : 'Not Available');
