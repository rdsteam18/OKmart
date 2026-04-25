// ===== OK MART - FIREBASE CONFIGURATION =====
// Shared Firebase config for all admin pages

const firebaseConfig = {
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

// Initialize Firestore
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true })
  .then(() => console.log('🔥 Firestore offline persistence enabled'))
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence');
    }
  });

console.log('✅ Firebase Admin initialized');
