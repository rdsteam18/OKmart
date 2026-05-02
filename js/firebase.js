// ===== OK Mart - Firebase Configuration =====
// Firebase v9 Compat (Modular SDK via CDN)
// This file initializes Firebase and exports the db instance

// Your web app's Firebase configuration
// Replace these values with your actual Firebase project credentials
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

// Initialize Cloud Firestore and get a reference to the service
var db = firebase.firestore();

// Enable offline persistence (caches data for offline use)
db.enablePersistence({ synchronizeTabs: true })
  .then(function() {
    console.log('🔥 Firestore offline persistence enabled');
  })
  .catch(function(err) {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('⚠️ Multiple tabs detected - Offline persistence disabled');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support offline persistence
      console.warn('⚠️ Browser does not support offline persistence');
    } else {
      console.warn('⚠️ Persistence error:', err.code);
    }
  });

// ============================================
// FIREBASE COLLECTIONS REFERENCE
// ============================================

// Collection references for easy access
var collections = {
  products: db.collection('products'),
  orders: db.collection('orders'),
  offers: db.collection('offers'),
  banners: db.collection('banners'),
  admins: db.collection('admins'),
  settings: db.collection('settings'),
  blockedUsers: db.collection('blockedUsers')
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Array>} - Array of documents with id and data
 */
function getAllDocuments(collectionName) {
  return db.collection(collectionName).get()
    .then(function(snapshot) {
      var docs = [];
      snapshot.forEach(function(doc) {
        docs.push({
          id: doc.id,
          data: doc.data()
        });
      });
      return docs;
    });
}

/**
 * Get a single document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object>} - Document data with id
 */
function getDocumentById(collectionName, docId) {
  return db.collection(collectionName).doc(docId).get()
    .then(function(doc) {
      if (doc.exists) {
        return {
          id: doc.id,
          data: doc.data()
        };
      }
      return null;
    });
}

/**
 * Add a new document to a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @returns {Promise<Object>} - Reference to the new document
 */
function addDocument(collectionName, data) {
  data.createdAt = data.createdAt || firebase.firestore.FieldValue.serverTimestamp();
  return db.collection(collectionName).add(data);
}

/**
 * Update an existing document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
function updateDocument(collectionName, docId, data) {
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  return db.collection(collectionName).doc(docId).update(data);
}

/**
 * Delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
function deleteDocument(collectionName, docId) {
  return db.collection(collectionName).doc(docId).delete();
}

/**
 * Query documents with filters
 * @param {string} collectionName - Name of the collection
 * @param {string} field - Field to filter on
 * @param {string} operator - Comparison operator (==, !=, <, >, <=, >=)
 * @param {*} value - Value to compare
 * @returns {Promise<Array>} - Array of matching documents
 */
function queryDocuments(collectionName, field, operator, value) {
  return db.collection(collectionName)
    .where(field, operator, value)
    .get()
    .then(function(snapshot) {
      var docs = [];
      snapshot.forEach(function(doc) {
        docs.push({
          id: doc.id,
          data: doc.data()
        });
      });
      return docs;
    });
}

// ============================================
// REAL-TIME LISTENER HELPERS
// ============================================

/**
 * Listen to real-time updates on a collection
 * @param {string} collectionName - Name of the collection
 * @param {function} callback - Callback function receiving the updated array
 * @param {Array} filters - Optional array of filter objects [{field, operator, value}]
 * @returns {function} - Unsubscribe function
 */
function listenToCollection(collectionName, callback, filters) {
  var query = db.collection(collectionName);
  
  // Apply filters if provided
  if (filters && Array.isArray(filters)) {
    filters.forEach(function(filter) {
      query = query.where(filter.field, filter.operator, filter.value);
    });
  }
  
  return query.onSnapshot(function(snapshot) {
    var docs = [];
    snapshot.forEach(function(doc) {
      docs.push({
        id: doc.id,
        data: doc.data()
      });
    });
    callback(docs);
  }, function(error) {
    console.error('Listener error for', collectionName, ':', error);
    callback([]);
  });
}

/**
 * Listen to a single document in real-time
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {function} callback - Callback function receiving the document data
 * @returns {function} - Unsubscribe function
 */
function listenToDocument(collectionName, docId, callback) {
  return db.collection(collectionName).doc(docId)
    .onSnapshot(function(doc) {
      if (doc.exists) {
        callback({
          id: doc.id,
          data: doc.data()
        });
      } else {
        callback(null);
      }
    }, function(error) {
      console.error('Listener error for', collectionName, docId, ':', error);
      callback(null);
    });
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Add multiple documents in a batch
 * @param {string} collectionName - Name of the collection
 * @param {Array} documents - Array of data objects
 * @returns {Promise<void>}
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
 * Delete multiple documents in a batch
 * @param {string} collectionName - Name of the collection
 * @param {Array} docIds - Array of document IDs to delete
 * @returns {Promise<void>}
 */
function batchDeleteDocuments(collectionName, docIds) {
  var batch = db.batch();
  var collectionRef = db.collection(collectionName);
  
  docIds.forEach(function(docId) {
    var docRef = collectionRef.doc(docId);
    batch.delete(docRef);
  });
  
  return batch.commit();
}

// ============================================
// EXPIRE FIREBASE REFERENCES GLOBALLY
// ============================================

// Make collections available globally
window.db = db;
window.firestoreCollections = collections;

// Make helper functions available globally
window.FirebaseHelper = {
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
  collections: collections
};

// ============================================
// CONNECTION STATUS LOGGING
// ============================================

// Log when Firebase connects
console.log('🔥 Firebase initialized successfully');
console.log('📦 Available collections:', Object.keys(collections).join(', '));
console.log('💾 Offline persistence:', 'enabled');

// ============================================
// FIREBASE RULES REFERENCE (for console only)
// ============================================

/*
Basic Firestore Security Rules for OK Mart:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow public read for products
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow public read for banners
    match /banners/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow public read for offers
    match /offers/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders - authenticated users can create, admins can update
    match /orders/{document=**} {
      allow read: if true;
      allow create: if true;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // Admins collection - restricted
    match /admins/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Settings - restricted
    match /settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
*/

console.log('✅ Firebase module loaded');
