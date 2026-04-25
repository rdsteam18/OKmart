// ===== OK MART - FIREBASE CONFIGURATION =====
// Replace with your Firebase project credentials

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

// Enable offline persistence (optional)
db.enablePersistence()
  .then(() => console.log('🔥 Firebase connected with offline support'))
  .catch((err) => console.log('Firebase persistence error:', err));

console.log('✅ Firebase initialized successfully');
