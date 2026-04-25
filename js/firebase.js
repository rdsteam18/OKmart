// ===== OK MART - FIREBASE CONFIGURATION =====
const firebaseConfig = {
    apiKey: "AIzaSyDHvki4jXafwzLAXJSrLQt4QodiNi5JXCw",
    authDomain: "okmart-e6219.firebaseapp.com",
    projectId: "okmart-e6219",
    storageBucket: "okmart-e6219.firebasestorage.app",
    messagingSenderId: "1066655324741",
    appId: "1:1066655324741:web:194d93a22faf870c16a12c",
    measurementId: "G-2497DJLP1Q"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

db.enablePersistence({ synchronizeTabs: true })
  .then(() => console.log('🔥 Firestore persistence enabled'))
  .catch(err => console.warn('Persistence:', err.code));

console.log('✅ Firebase initialized');
