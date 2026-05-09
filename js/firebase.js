// ===== OK MART - COMPLETE FIREBASE CONFIGURATION =====
// Includes: Firestore, Authentication, Storage, Messaging, FCM Tokens

// ============================================
// FIREBASE CONFIGURATION
// ============================================

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
// INITIALIZE FIREBASE
// ============================================

// Initialize Firebase if not already initialized
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized');
}

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();

// ============================================
// FIRESTORE PERSISTENCE
// ============================================

// Enable offline persistence
try {
  db.enablePersistence({ synchronizeTabs: true })
    .then(() => console.log('✅ Firestore persistence enabled'))
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only');
      }
    });
} catch (e) {
  console.warn('⚠️ Persistence not supported');
}

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
  settings: db.collection('settings'),
  fcmTokens: db.collection('fcmTokens')  // 🔥 FCM Tokens collection
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
    console.log(`✅ Loaded ${products.length} products from Firebase`);
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

// Add new product
async function addProduct(productData) {
  try {
    const docRef = await collections.products.add({
      ...productData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      salesCount: 0
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding product:', error);
    return { success: false, error: error.message };
  }
}

// Update product
async function updateProduct(productId, productData) {
  try {
    await collections.products.doc(productId).update({
      ...productData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message };
  }
}

// Delete product
async function deleteProduct(productId) {
  try {
    await collections.products.doc(productId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
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
    console.log(`✅ Loaded ${banners.length} banners from Firebase`);
    return banners;
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

// Add banner
async function addBanner(bannerData) {
  try {
    const docRef = await collections.banners.add({
      ...bannerData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding banner:', error);
    return { success: false, error: error.message };
  }
}

// Update banner
async function updateBanner(bannerId, bannerData) {
  try {
    await collections.banners.doc(bannerId).update(bannerData);
    return { success: true };
  } catch (error) {
    console.error('Error updating banner:', error);
    return { success: false, error: error.message };
  }
}

// Delete banner
async function deleteBanner(bannerId) {
  try {
    await collections.banners.doc(bannerId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting banner:', error);
    return { success: false, error: error.message };
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

// Listen to order in real-time
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
        freeAbove: doc.data().freeAbove || 499,
        estimatedTime: doc.data().deliveryType === 'quick' ? '10-15 mins' : '2-4 hours'
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

// VAPID Key
const VAPID_KEY = 'BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE';

// Initialize messaging
let messaging = null;
if (firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported()) {
  messaging = firebase.messaging();
  console.log('✅ Firebase Messaging initialized');
}

// Get and store FCM Token 🔥
async function getAndStoreFCMToken() {
  if (!messaging) {
    console.log('⚠️ Firebase Messaging not supported in this browser');
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
        console.log('📨 FCM Token generated:', token);
        
        // Save to localStorage
        localStorage.setItem('fcm_token', token);
        
        // Save to Firestore 🔥
        await saveTokenToFirestore(token);
        
        return token;
      } else {
        console.log('⚠️ No registration token available');
        return null;
      }
    } else {
      console.log('❌ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Save token to Firestore 🔥
async function saveTokenToFirestore(token) {
  try {
    // Get user identifier (phone from localStorage or generate guest ID)
    let userId = localStorage.getItem('user_phone');
    if (!userId) {
      userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      localStorage.setItem('user_phone', userId);
    }
    
    // Save to fcmTokens collection
    await collections.fcmTokens.doc(userId).set({
      token: token,
      userId: userId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      userAgent: navigator.userAgent,
      platform: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent.split(' ').pop()
    }, { merge: true });
    
    console.log('✅ FCM Token saved to Firestore for user:', userId);
    return true;
  } catch (error) {
    console.error('Error saving FCM token to Firestore:', error);
    return false;
  }
}

// Get all FCM tokens (for admin to send notifications)
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
          platform: data.platform,
          lastUpdated: data.updatedAt
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

// Remove token (when user logs out or disables notifications)
async function removeFCMToken() {
  try {
    const userId = localStorage.getItem('user_phone');
    if (userId) {
      await collections.fcmTokens.doc(userId).delete();
      localStorage.removeItem('fcm_token');
      console.log('✅ FCM token removed');
    }
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
}

// Listen for token refresh
if (messaging) {
  messaging.onTokenRefresh(async () => {
    console.log('🔄 Token refreshed');
    const newToken = await messaging.getToken({ vapidKey: VAPID_KEY });
    if (newToken) {
      localStorage.setItem('fcm_token', newToken);
      await saveTokenToFirestore(newToken);
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
  
  // Open in new tab (will be blocked by popup blocker if not user-triggered)
  console.log('WhatsApp URL:', whatsappUrl);
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
      primaryColor: '#2ecc71',
      secondaryColor: '#27ae60',
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

async function updateSettings(settingsData) {
  try {
    await collections.settings.doc('app').update(settingsData);
    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false };
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
// AUTO-INITIALIZE ON PAGE LOAD
// ============================================

// Auto fetch FCM token when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure everything is loaded
  setTimeout(() => {
    getAndStoreFCMToken();
  }, 2000);
});

// ============================================
// EXPORTS (GLOBAL WINDOW OBJECT)
// ============================================

// Database
window.db = db;
window.auth = auth;
window.collections = collections;
window.messaging = messaging;

// Product functions
window.fetchProducts = fetchProducts;
window.getProductById = getProductById;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;

// Banner functions
window.fetchBanners = fetchBanners;
window.addBanner = addBanner;
window.updateBanner = updateBanner;
window.deleteBanner = deleteBanner;

// Order functions
window.placeOrder = placeOrder;
window.getOrdersByPhone = getOrdersByPhone;
window.updateOrderStatus = updateOrderStatus;
window.listenToOrder = listenToOrder;

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
window.updateSettings = updateSettings;

// WhatsApp function
window.sendWhatsAppNotification = sendWhatsAppNotification;

// Helpers
window.calculateDiscount = calculateDiscount;
window.formatCurrency = formatCurrency;
window.escapeHtml = escapeHtml;

console.log('✅ Firebase fully loaded!');
console.log('📦 Firestore:', db ? 'Available' : 'Not available');
console.log('📨 Messaging:', messaging ? 'Available' : 'Not available');
console.log('🗂️ Collections:', Object.keys(collections));
