// ===== OK Mart - Firebase Configuration =====
// Firebase v9 Compat (Modular SDK via CDN)
// Includes Firestore + Cloud Messaging (FCM)

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyDHvki4jXafwzLAXJSrLQt4QodiNi5JXCw",
  authDomain: "okmart-e6219.firebaseapp.com",
  projectId: "okmart-e6219",
  storageBucket: "okmart-e6219.firebasestorage.app",
  messagingSenderId: "1066655324741",
  appId: "1:1066655324741:web:194d93a22faf870c16a12c",
  measurementId: "G-2497DJLP1Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore
var db = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true })
  .then(function() {
    console.log('🔥 Firestore offline persistence enabled');
  })
  .catch(function(err) {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Multiple tabs detected - Offline persistence disabled');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Browser does not support offline persistence');
    } else {
      console.warn('⚠️ Persistence error:', err.code);
    }
  });

// ============================================
// FIREBASE CLOUD MESSAGING (FCM)
// ============================================

// Initialize Messaging
var messaging = null;

// Check if messaging is supported (requires HTTPS)
if (firebase.messaging && firebase.messaging.isSupported()) {
  messaging = firebase.messaging();
  
  console.log('📨 Firebase Messaging initialized');
} else {
  console.warn('⚠️ Firebase Messaging not supported in this browser/environment');
}

// VAPID Key (Public Key for Web Push)
// Get this from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
var VAPID_KEY = 'BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE';

/**
 * Request notification permission and get FCM token
 * @param {function} callback - Called with the FCM token or error
 */
function requestNotificationPermission(callback) {
  if (!messaging) {
    console.warn('⚠️ Messaging not available');
    if (callback) callback(null, 'Messaging not supported');
    return;
  }

  Notification.requestPermission()
    .then(function(permission) {
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return getToken(messaging, { vapidKey: VAPID_KEY });
      } else {
        console.log('❌ Notification permission denied');
        throw new Error('Permission denied');
      }
    })
    .then(function(currentToken) {
      if (currentToken) {
        console.log('📨 FCM Token:', currentToken);
        
        // Save token to localStorage for later use
        localStorage.setItem('okmart_fcm_token', currentToken);
        
        // You can also save this token to Firestore for the user
        // saveTokenToFirestore(currentToken);
        
        if (callback) callback(currentToken, null);
      } else {
        console.warn('⚠️ No FCM token available');
        if (callback) callback(null, 'No token available');
      }
    })
    .catch(function(err) {
      console.error('❌ FCM Error:', err);
      if (callback) callback(null, err.message);
    });
}

/**
 * Get stored FCM token
 * @returns {string|null} - The stored FCM token
 */
function getStoredFCMToken() {
  return localStorage.getItem('okmart_fcm_token') || null;
}

/**
 * Save FCM token to Firestore (optional)
 * @param {string} token - The FCM token
 */
function saveTokenToFirestore(token) {
  var userId = localStorage.getItem('okmart_user_phone') || 'guest';
  
  db.collection('fcm_tokens').doc(userId).set({
    token: token,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    userAgent: navigator.userAgent,
    platform: navigator.platform
  }, { merge: true })
  .then(function() {
    console.log('✅ Token saved to Firestore');
  })
  .catch(function(err) {
    console.error('❌ Error saving token:', err);
  });
}

/**
 * Delete FCM token (on logout)
 */
function deleteFCMToken() {
  var token = getStoredFCMToken();
  if (token && messaging) {
    deleteToken(messaging, token)
      .then(function() {
        console.log('✅ Token deleted');
        localStorage.removeItem('okmart_fcm_token');
      })
      .catch(function(err) {
        console.error('❌ Error deleting token:', err);
      });
  }
}

// ============================================
// FOREGROUND MESSAGE HANDLER
// ============================================

if (messaging) {
  // Handle messages when app is in foreground
  messaging.onMessage(function(payload) {
    console.log('📨 Foreground message received:', payload);
    
    // Show custom notification
    showInAppNotification(payload);
  });
}

/**
 * Show in-app notification (when website is open)
 * @param {Object} payload - The message payload
 */
function showInAppNotification(payload) {
  var notification = payload.notification || {};
  var data = payload.data || {};
  
  // Create notification element
  var notifEl = document.createElement('div');
  notifEl.className = 'in-app-notification';
  notifEl.style.cssText = 
    'position: fixed; top: 20px; right: 20px; background: white; ' +
    'border-radius: 16px; padding: 16px 20px; box-shadow: 0 8px 30px rgba(0,0,0,.15); ' +
    'z-index: 9999; max-width: 350px; animation: slideInRight .3s ease; ' +
    'display: flex; align-items: center; gap: 12px; cursor: pointer;';
  
  notifEl.innerHTML = 
    '<div style="font-size:2rem;">🔔</div>' +
    '<div>' +
      '<div style="font-weight:700;">' + (notification.title || 'New Notification') + '</div>' +
      '<div style="font-size:.85rem;color:#6b7280;">' + (notification.body || '') + '</div>' +
    '</div>' +
    '<button style="position:absolute;top:8px;right:12px;background:none;border:none;font-size:1.2rem;cursor:pointer;color:#6b7280;">✕</button>';
  
  document.body.appendChild(notifEl);
  
  // Add close button functionality
  notifEl.querySelector('button').addEventListener('click', function(e) {
    e.stopPropagation();
    notifEl.remove();
  });
  
  // Click notification to navigate
  notifEl.addEventListener('click', function() {
    if (data.url) {
      window.location.href = data.url;
    }
    notifEl.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(function() {
    if (notifEl.parentNode) {
      notifEl.remove();
    }
  }, 5000);
}

// Add animation style for notifications
(function() {
  var style = document.createElement('style');
  style.textContent = 
    '@keyframes slideInRight { ' +
      'from { transform: translateX(100%); opacity: 0; } ' +
      'to { transform: translateX(0); opacity: 1; } ' +
    '}';
  document.head.appendChild(style);
})();

// ============================================
// SERVICE WORKER REGISTRATION FOR FCM
// ============================================

/**
 * Register service worker for background notifications
 * Call this function after page load
 */
function registerFCMServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(function(registration) {
        console.log('✅ Service Worker registered for FCM');
        
        // Pass service worker to messaging
        if (messaging) {
          messaging.useServiceWorker(registration);
        }
      })
      .catch(function(err) {
        console.error('❌ Service Worker registration failed:', err);
      });
  }
}

// Auto-register service worker on load
if (document.readyState === 'complete') {
  registerFCMServiceWorker();
} else {
  window.addEventListener('load', registerFCMServiceWorker);
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

/**
 * Get all documents from a collection
 */
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

/**
 * Get a single document by ID
 */
function getDocumentById(collectionName, docId) {
  return db.collection(collectionName).doc(docId).get()
    .then(function(doc) {
      if (doc.exists) {
        return { id: doc.id, data: doc.data() };
      }
      return null;
    });
}

/**
 * Add a new document
 */
function addDocument(collectionName, data) {
  data.createdAt = data.createdAt || firebase.firestore.FieldValue.serverTimestamp();
  return db.collection(collectionName).add(data);
}

/**
 * Update an existing document
 */
function updateDocument(collectionName, docId, data) {
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  return db.collection(collectionName).doc(docId).update(data);
}

/**
 * Delete a document
 */
function deleteDocument(collectionName, docId) {
  return db.collection(collectionName).doc(docId).delete();
}

/**
 * Query documents with filters
 */
function queryDocuments(collectionName, field, operator, value) {
  return db.collection(collectionName)
    .where(field, operator, value)
    .get()
    .then(function(snapshot) {
      var docs = [];
      snapshot.forEach(function(doc) {
        docs.push({ id: doc.id, data: doc.data() });
      });
      return docs;
    });
}

/**
 * Real-time collection listener
 */
function listenToCollection(collectionName, callback, filters) {
  var query = db.collection(collectionName);
  
  if (filters && Array.isArray(filters)) {
    filters.forEach(function(filter) {
      query = query.where(filter.field, filter.operator, filter.value);
    });
  }
  
  return query.onSnapshot(function(snapshot) {
    var docs = [];
    snapshot.forEach(function(doc) {
      docs.push({ id: doc.id, data: doc.data() });
    });
    callback(docs);
  }, function(error) {
    console.error('Listener error:', error);
    callback([]);
  });
}

/**
 * Real-time single document listener
 */
function listenToDocument(collectionName, docId, callback) {
  return db.collection(collectionName).doc(docId)
    .onSnapshot(function(doc) {
      if (doc.exists) {
        callback({ id: doc.id, data: doc.data() });
      } else {
        callback(null);
      }
    });
}

/**
 * Batch add documents
 */
function batchAddDocuments(collectionName, documents) {
  var batch = db.batch();
  var collectionRef = db.collection(collectionName);
  
  documents.forEach(function(data) {
    var docRef = collectionRef.doc();
    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    batch.set(docRef, data);
  });
  
  return batch.commit();
}

/**
 * Batch delete documents
 */
function batchDeleteDocuments(collectionName, docIds) {
  var batch = db.batch();
  var collectionRef = db.collection(collectionName);
  
  docIds.forEach(function(docId) {
    batch.delete(collectionRef.doc(docId));
  });
  
  return batch.commit();
}

// ============================================
// EXPORT TO GLOBAL SCOPE
// ============================================

window.db = db;
window.firestoreCollections = collections;
window.messaging = messaging;

window.FirebaseHelper = {
  // Firestore
  getAllDocuments: getAllDocuments,
  getDocumentById: getDocumentById,
  addDocument: addDocument,
  updateDocument: updateDocument,
  deleteDocument: deleteDocument,
  queryDocuments: queryDocuments,
  listenToCollection: listenToCollection,
  listenToDocument: listenToDocument,
  batchAddDocuments: batchAddDocuments,
  batchDeleteDocuments: batchDeleteDocuments,
  collections: collections,
  
  // Messaging
  requestNotificationPermission: requestNotificationPermission,
  getStoredFCMToken: getStoredFCMToken,
  saveTokenToFirestore: saveTokenToFirestore,
  deleteFCMToken: deleteFCMToken,
  showInAppNotification: showInAppNotification,
  
  // Config
  VAPID_KEY: VAPID_KEY
};

// ============================================
// INIT LOG
// ============================================

console.log('🔥 Firebase initialized');
console.log('📦 Collections:', Object.keys(collections).join(', '));
console.log('📨 Messaging:', messaging ? 'Available' : 'Not Available');
console.log('✅ Firebase module loaded');
