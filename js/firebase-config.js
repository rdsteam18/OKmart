// ===== OK MART - FIREBASE CONFIGURATION =====
// NOTE: यह file firebase.js का backup है।
// Double initialization से बचने के लिए यहाँ safe guard लगाया गया है।

const firebaseConfig = {
  apiKey: "AIzaSyDHvki4jXafwzLAXJSrLQt4QodiNi5JXCw",
  authDomain: "okmart-e6219.firebaseapp.com",
  projectId: "okmart-e6219",
  storageBucket: "okmart-e6219.firebasestorage.app",
  messagingSenderId: "1066655324741",
  appId: "1:1066655324741:web:194d93a22faf870c16a12c",
  measurementId: "G-2497DJLP1Q"
};

// ✅ Safe initialization — अगर already initialized है तो दोबारा नहीं करें
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ✅ db global variable — अगर पहले से exist करता है तो reuse करें
if (typeof db === 'undefined' && typeof firebase !== 'undefined') {
  var db = firebase.firestore();

  // Enable offline persistence (only if db freshly created here)
  if (typeof db.enablePersistence === 'function') {
    db.enablePersistence({ synchronizeTabs: true })
      .then(() => {})
      .catch((err) => {
        if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
          console.warn('Persistence error:', err.code);
        }
      });
  }
}
