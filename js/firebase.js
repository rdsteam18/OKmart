// ===== OK MART - COMPLETE WORKING FIREBASE CONFIGURATION =====

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHvki4jXafwzLAXJSrLQt4QodiNi5JXCw",
  authDomain: "okmart-e6219.firebaseapp.com",
  projectId: "okmart-e6219",
  storageBucket: "okmart-e6219.firebasestorage.app",
  messagingSenderId: "1066655324741",
  appId: "1:1066655324741:web:194d93a22faf870c16a12c",
  measurementId: "G-2497DJLP1Q"
};

// ============================================
// INITIALIZE FIREBASE (CRITICAL FIX)
// ============================================

// Initialize Firebase only once
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
}

// Get Firestore instance
const db = firebase.firestore();

// Enable offline persistence for better performance
db.enablePersistence({ synchronizeTabs: true })
  .then(() => console.log('✅ Firestore persistence enabled'))
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Browser doesn\'t support persistence');
    }
  });

// ============================================
// COLLECTION REFERENCES
// ============================================

const collections = {
  products: db.collection('products'),
  orders: db.collection('orders'),
  offers: db.collection('offers'),
  banners: db.collection('banners'),
  admins: db.collection('admins'),
  pincodes: db.collection('pincodes'),
  users: db.collection('users'),
  settings: db.collection('settings')
};

// ============================================
// PRODUCT FUNCTIONS
// ============================================

// Fetch all products
async function fetchProducts() {
  try {
    const snapshot = await collections.products.get();
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ Loaded ${products.length} products`);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Get product by ID
async function getProductById(productId) {
  try {
    const doc = await collections.products.doc(productId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// ============================================
// BANNER FUNCTIONS
// ============================================

async function fetchBanners() {
  try {
    const snapshot = await collections.banners
      .where('active', '==', true)
      .orderBy('order', 'asc')
      .get();
    
    const banners = [];
    snapshot.forEach(doc => {
      banners.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ Loaded ${banners.length} banners`);
    return banners;
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

// ============================================
// ORDER FUNCTIONS
// ============================================

async function placeOrder(orderData) {
  try {
    const docRef = await collections.orders.add({
      ...orderData,
      orderDate: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'received',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Order placed:', docRef.id);
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error('Error placing order:', error);
    return { success: false, error: error.message };
  }
}

async function getOrdersByPhone(phone) {
  try {
    let orders = [];
    
    // Try by phone field
    let snapshot = await collections.orders
      .where('phone', '==', phone)
      .orderBy('orderDate', 'desc')
      .get();
    
    if (snapshot.empty) {
      // Try by customerPhone field
      snapshot = await collections.orders
        .where('customerPhone', '==', phone)
        .orderBy('orderDate', 'desc')
        .get();
    }
    
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await collections.orders.doc(orderId).update({
      status: status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating status:', error);
    return { success: false };
  }
}

// ============================================
// COUPON FUNCTIONS
// ============================================

async function fetchCoupons() {
  try {
    const snapshot = await collections.offers
      .where('active', '==', true)
      .get();
    
    const coupons = [];
    snapshot.forEach(doc => {
      coupons.push({ id: doc.id, ...doc.data() });
    });
    return coupons;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
}

async function validateCoupon(code, cartTotal) {
  try {
    const snapshot = await collections.offers
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return { valid: false, message: 'Invalid coupon code' };
    }
    
    const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    
    if (!coupon.active) {
      return { valid: false, message: 'Coupon is not active' };
    }
    
    if (coupon.validTo && new Date(coupon.validTo) < new Date()) {
      return { valid: false, message: 'Coupon has expired' };
    }
    
    if (coupon.minOrder && cartTotal < coupon.minOrder) {
      return { valid: false, message: `Minimum order of ₹${coupon.minOrder} required` };
    }
    
    let discount = 0;
    if (coupon.type === 'flat') {
      discount = coupon.discount;
    } else {
      discount = (cartTotal * coupon.discount) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    }
    
    return { 
      valid: true, 
      coupon: coupon, 
      discount: Math.min(discount, cartTotal)
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, message: 'Error validating coupon' };
  }
}

// ============================================
// DELIVERY FUNCTIONS
// ============================================

async function checkPincodeServiceability(pincode) {
  try {
    const doc = await collections.pincodes.doc(pincode).get();
    if (doc.exists && doc.data().active !== false) {
      return {
        serviceable: true,
        deliveryType: doc.data().deliveryType || 'quick',
        deliveryCharge: doc.data().deliveryCharge || 39,
        freeAbove: doc.data().freeAbove || 499
      };
    }
    return { serviceable: false };
  } catch (error) {
    console.error('Error checking pincode:', error);
    return { serviceable: false };
  }
}

// ============================================
// SETTINGS FUNCTIONS
// ============================================

async function getSettings() {
  try {
    const doc = await collections.settings.doc('app').get();
    if (doc.exists) {
      return doc.data();
    }
    return {
      storeName: 'OK Mart',
      storePhone: '+919982239821',
      storeEmail: 'support@okmart.com',
      deliveryEnabled: true,
      freeDeliveryThreshold: 499,
      minOrderAmount: 99,
      baseDeliveryCharge: 39
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateDiscount(price, mrp) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

function formatCurrency(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ============================================
// EXPORTS (GLOBAL WINDOW OBJECT)
// ============================================

window.db = db;
window.collections = collections;

// Product functions
window.fetchProducts = fetchProducts;
window.getProductById = getProductById;

// Order functions
window.placeOrder = placeOrder;
window.getOrdersByPhone = getOrdersByPhone;
window.updateOrderStatus = updateOrderStatus;

// Banner functions
window.fetchBanners = fetchBanners;

// Coupon functions
window.fetchCoupons = fetchCoupons;
window.validateCoupon = validateCoupon;

// Delivery functions
window.checkPincodeServiceability = checkPincodeServiceability;

// Settings functions
window.getSettings = getSettings;

// Helper functions
window.calculateDiscount = calculateDiscount;
window.formatCurrency = formatCurrency;
window.escapeHtml = escapeHtml;

console.log('✅ Firebase fully loaded and ready!');
console.log('📦 Firestore instance:', db ? 'Available' : 'Not available');
