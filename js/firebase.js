"// ===== OK MART - COMPLETE WORKING FIREBASE CONFIGURATION =====

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
// SAFE FIREBASE INITIALIZATION
// ============================================

// Check if Firebase SDK is loaded
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase SDK not loaded');
} else if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
}

// Get Firestore instance
const db = firebase.firestore();

// ============================================
// SAFE FIRESTORE PERSISTENCE
// ============================================

if (typeof db.enablePersistence === 'function') {
  db.enablePersistence({ synchronizeTabs: true })
    .then(() => console.log('✅ Firestore persistence enabled'))
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Browser doesn\\'t support persistence');
      } else {
        console.warn('⚠️ Persistence unavailable:', err.code);
      }
    });
}

// ============================================
// SAFE FIREBASE MESSAGING (FCM) SETUP 🔥
// ============================================

const VAPID_KEY = 'BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE';

let messaging = null;

try {
  const messagingSupported =
    'Notification' in window &&
    'serviceWorker' in navigator &&
    firebase.messaging &&
    typeof firebase.messaging === 'function';

  if (messagingSupported) {
    messaging = firebase.messaging();
    console.log('✅ Firebase Messaging initialized');
  } else {
    console.log('ℹ️ Messaging not supported on this device');
  }
} catch (err) {
  console.warn('⚠️ Messaging initialization failed:', err);
}

// ============================================
// COLLECTION REFERENCES (CONSISTENT NAMING)
// ============================================

const collections = {
  products: db.collection('products'),
  orders: db.collection('orders'),
  offers: db.collection('offers'),
  banners: db.collection('banners'),
  admins: db.collection('admins'),
  pincodes: db.collection('pincodes'),
  users: db.collection('users'),
  settings: db.collection('settings'),
  fcmTokens: db.collection('fcmTokens')  // 🔥 FCM Tokens collection (consistent naming)
};

// ============================================
// PRODUCT FUNCTIONS
// ============================================

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
    
    // Send WhatsApp notification to admin
    sendWhatsAppNotification(orderData, docRef.id);
    
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error('Error placing order:', error);
    return { success: false, error: error.message };
  }
}

async function getOrdersByPhone(phone) {
  try {
    let orders = [];
    
    let snapshot = await collections.orders
      .where('phone', '==', phone)
      .orderBy('orderDate', 'desc')
      .get();
    
    if (snapshot.empty) {
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

function listenToOrder(orderId, callback) {
  return collections.orders.doc(orderId).onSnapshot((doc) => {
    if (doc.exists) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
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
// FCM TOKEN FUNCTIONS 🔥🔥🔥
// ============================================

// Get and store FCM Token (MANUAL - called on button click)
async function getAndStoreFCMToken() {
  if (!messaging) {
    console.log('ℹ️ Firebase Messaging not supported on this device');
    return null;
  }
  
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      // Get token
      const token = await messaging.getToken({ vapidKey: VAPID_KEY });
      
      if (token) {
        console.log('📨 FCM Token generated:', token.substring(0, 20) + '...');
        
        // Save to localStorage
        localStorage.setItem('fcm_token', token);
        
        // Save to Firestore 🔥
        await saveTokenToFirestore(token);
        
        return token;
      }
    } else if (permission === 'denied') {
      console.log('❌ Notification permission denied');
      localStorage.setItem('notifications_blocked', 'true');
    } else {
      console.log('⚠️ Notification permission not granted');
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
  return null;
}

// Save token to Firestore
async function saveTokenToFirestore(token) {
  try {
    let userId = localStorage.getItem('user_phone');
    if (!userId) {
      userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      localStorage.setItem('user_phone', userId);
    }
    
    await collections.fcmTokens.doc(userId).set({
      token: token,
      userId: userId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      userAgent: navigator.userAgent,
      platform: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: getBrowserName()
    }, { merge: true });
    
    console.log('✅ FCM Token saved to Firestore for user:', userId);
    localStorage.setItem('fcm_token_saved', 'true');
    localStorage.setItem('fcm_token_time', Date.now().toString());
    return true;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return false;
  }
}

// Get browser name
function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  return 'Unknown';
}

// Get all FCM tokens (for admin)
async function getAllFCMTokens() {
  try {
    const snapshot = await collections.fcmTokens.get();
    const tokens = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.token) {
        tokens.push({
          token: data.token,
          userId: data.userId,
          platform: data.platform
        });
      }
    });
    console.log(`📨 Found ${tokens.length} FCM tokens`);
    return tokens;
  } catch (error) {
    console.error('Error fetching FCM tokens:', error);
    return [];
  }
}

// Remove FCM token
async function removeFCMToken() {
  try {
    const userId = localStorage.getItem('user_phone');
    if (userId) {
      await collections.fcmTokens.doc(userId).delete();
      localStorage.removeItem('fcm_token');
      localStorage.removeItem('fcm_token_saved');
      localStorage.removeItem('fcm_token_time');
      console.log('✅ FCM token removed');
    }
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
}

// SAFE Token refresh listener (no crash)
if (
  messaging &&
  typeof messaging.onTokenRefresh === 'function'
) {
  messaging.onTokenRefresh(async () => {
    console.log('🔄 Token refreshed');
    try {
      const newToken = await messaging.getToken({ vapidKey: VAPID_KEY });
      if (newToken) {
        localStorage.setItem('fcm_token', newToken);
        await saveTokenToFirestore(newToken);
        console.log('✅ Refreshed token saved');
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
    }
  });
}

// ============================================
// WHATSAPP NOTIFICATION
// ============================================

async function sendWhatsAppNotification(orderData, orderId) {
  const adminWhatsapp = localStorage.getItem('adminWhatsapp') || '919982239821';
  
  const itemsList = (orderData.items || []).map(item => {
    return `${item.name} x ${item.quantity} = ₹${(item.price * item.quantity)}`;
  }).join('%0A');
  
  const message = `🛍️ *NEW ORDER!* 🛍️%0A%0A` +
    `📋 *Order ID:* #${orderId.slice(0, 8).toUpperCase()}%0A` +
    `👤 *Customer:* ${orderData.name}%0A` +
    `📞 *Phone:* ${orderData.phone}%0A` +
    `📍 *Address:* ${orderData.address}%0A` +
    `📦 *Items:*%0A${itemsList}%0A` +
    `💰 *Total:* ₹${orderData.total}%0A%0A` +
    `🔗 *View Order:* ${window.location.origin}/admin/orders.html`;
  
  const whatsappUrl = `https://wa.me/${adminWhatsapp}?text=${message}`;
  console.log('📱 WhatsApp notification URL generated');
  return whatsappUrl;
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
// NO AUTO NOTIFICATION - WAIT FOR USER ACTION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🔔 FCM waiting for user interaction - enable notifications from button click');
});

// ============================================
// EXPORTS (GLOBAL WINDOW OBJECT)
// ============================================

window.db = db;
window.collections = collections;
window.messaging = messaging;

// Product functions
window.fetchProducts = fetchProducts;
window.getProductById = getProductById;

// Order functions
window.placeOrder = placeOrder;
window.getOrdersByPhone = getOrdersByPhone;
window.updateOrderStatus = updateOrderStatus;
window.listenToOrder = listenToOrder;

// Banner functions
window.fetchBanners = fetchBanners;

// Coupon functions
window.fetchCoupons = fetchCoupons;
window.validateCoupon = validateCoupon;

// Delivery functions
window.checkPincodeServiceability = checkPincodeServiceability;

// FCM Token functions 🔥
window.getAndStoreFCMToken = getAndStoreFCMToken;
window.saveTokenToFirestore = saveTokenToFirestore;
window.getAllFCMTokens = getAllFCMTokens;
window.removeFCMToken = removeFCMToken;

// Settings functions
window.getSettings = getSettings;

// WhatsApp function
window.sendWhatsAppNotification = sendWhatsAppNotification;

// Helper functions
window.calculateDiscount = calculateDiscount;
window.formatCurrency = formatCurrency;
window.escapeHtml = escapeHtml;

console.log('✅ Firebase fully loaded!');
console.log('📦 Firestore:', db ? 'Available' : 'Not available');
console.log('📨 Messaging:', messaging ? 'Available' : 'Not available');
console.log('🔥 FCM Tokens collection:', collections.fcmTokens ? 'Ready' : 'Not ready');
console.log('🔔 Notification permission will be requested on button click only');
"
