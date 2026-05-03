// ===== OK MART - FIREBASE CONFIGURATION (UPDATED) =====

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
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('🔥 Firebase initialized');
}

// Firestore
var db = firebase.firestore();

// Enable persistence
try {
  db.enablePersistence({ synchronizeTabs: true })
    .then(() => console.log('🔥 Persistence enabled'))
    .catch(err => console.warn('Persistence error:', err.code));
} catch(e) { console.warn('Persistence error'); }

// ============================================
// COLLECTIONS
// ============================================

var collections = {
  products: db.collection('products'),
  orders: db.collection('orders'),
  offers: db.collection('offers'),
  banners: db.collection('banners'),
  admins: db.collection('admins'),
  settings: db.collection('settings'),
  pincodes: db.collection('pincodes'),
  users: db.collection('users')
};

// ============================================
// FETCH FUNCTIONS WITH CACHING
// ============================================

let cachedProducts = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchProducts(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedProducts && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedProducts;
  }
  
  try {
    const snapshot = await collections.products.get();
    cachedProducts = [];
    snapshot.forEach(doc => {
      cachedProducts.push({ id: doc.id, ...doc.data() });
    });
    lastFetchTime = now;
    return cachedProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    return cachedProducts || [];
  }
}

async function fetchBanners() {
  try {
    const snapshot = await collections.banners.where('active', '==', true).get();
    const banners = [];
    snapshot.forEach(doc => {
      banners.push({ id: doc.id, ...doc.data() });
    });
    return banners.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

async function checkPincodeServiceability(pincode) {
  try {
    const doc = await collections.pincodes.doc(pincode).get();
    if (doc.exists && doc.data().active !== false) {
      return { serviceable: true, deliveryType: doc.data().deliveryType, deliveryCharge: doc.data().deliveryCharge };
    }
    return { serviceable: false };
  } catch (error) {
    return { serviceable: false };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateDiscount(price, mrp) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

// ============================================
// EXPORTS
// ============================================

window.db = db;
window.collections = collections;
window.fetchProducts = fetchProducts;
window.fetchBanners = fetchBanners;
window.checkPincodeServiceability = checkPincodeServiceability;
window.calculateDiscount = calculateDiscount;

console.log('✅ Firebase ready');
