// ===== OK MART - COMPLETE FIREBASE CONFIGURATION =====
// Includes: Firestore, Authentication, Storage, Messaging, Real-time updates

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
  console.log('🔥 Firebase initialized');
}

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// ============================================
// FIRESTORE PERSISTENCE
// ============================================

// Enable offline persistence for better performance
try {
  db.enablePersistence({ synchronizeTabs: true })
    .then(() => console.log('🔥 Firestore persistence enabled'))
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Browser doesn\'t support persistence');
      }
    });
} catch (e) {
  console.warn('⚠️ Persistence error:', e);
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
  notifications: db.collection('notifications')
};

// ============================================
// PRODUCT FUNCTIONS
// ============================================

// Fetch all products with caching
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
// ORDER FUNCTIONS
// ============================================

// Place new order
async function placeOrder(orderData) {
  try {
    const docRef = await collections.orders.add({
      ...orderData,
      orderDate: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'received',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error('Error placing order:', error);
    return { success: false, error: error.message };
  }
}

// Get orders by phone number
async function getOrdersByPhone(phone) {
  try {
    const snapshot = await collections.orders
      .where('phone', '==', phone)
      .orderBy('orderDate', 'desc')
      .get();
    
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Update order status
async function updateOrderStatus(orderId, status) {
  try {
    await collections.orders.doc(orderId).update({
      status: status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}

// Get order by ID with real-time listener
function listenToOrder(orderId, callback) {
  return collections.orders.doc(orderId).onSnapshot((doc) => {
    if (doc.exists) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to order:', error);
    callback(null, error);
  });
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
    return banners;
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
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
      .where('active', '==', true)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return { valid: false, message: 'Invalid coupon code' };
    }
    
    const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    
    // Check expiry
    if (coupon.validTo && new Date(coupon.validTo) < new Date()) {
      return { valid: false, message: 'Coupon has expired' };
    }
    
    // Check min order
    if (coupon.minOrder && cartTotal < coupon.minOrder) {
      return { valid: false, message: `Minimum order of ₹${coupon.minOrder} required` };
    }
    
    // Calculate discount
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
      discount: Math.min(discount, cartTotal),
      message: `Coupon applied! ${coupon.type === 'flat' ? `₹${coupon.discount} OFF` : `${coupon.discount}% OFF`}`
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
      allowCod: true
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
    return { success: false, error: error.message };
  }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Admin login (simple - for demo)
async function adminLogin(email, password) {
  try {
    const snapshot = await collections.admins
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return { success: false, message: 'Admin not found' };
    }
    
    const admin = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    
    // Simple password check (in production, use Firebase Auth)
    if (atob(admin.password) === password) {
      return { success: true, admin: admin };
    }
    
    return { success: false, message: 'Invalid password' };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, message: 'Login error' };
  }
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

// FCM VAPID Key
const VAPID_KEY = 'BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE';

let messaging = null;

// Initialize messaging
if (firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported()) {
  messaging = firebase.messaging();
  console.log('📨 Firebase Messaging initialized');
}

// Request notification permission
async function requestNotificationPermission() {
  if (!messaging) {
    console.warn('⚠️ Messaging not supported');
    return { success: false, message: 'Not supported' };
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await messaging.getToken({ vapidKey: VAPID_KEY });
      localStorage.setItem('fcm_token', token);
      console.log('📨 FCM Token:', token);
      return { success: true, token: token };
    }
    return { success: false, message: 'Permission denied' };
  } catch (error) {
    console.error('Error getting token:', error);
    return { success: false, message: error.message };
  }
}

// Send notification to admin (WhatsApp fallback)
function sendAdminNotification(orderData) {
  const adminNumber = localStorage.getItem('adminWhatsapp') || '919982239821';
  const message = `🛍️ *NEW ORDER!* 🛍️\n\nOrder ID: #${orderData.id?.slice(0,8)}\nCustomer: ${orderData.name}\nPhone: ${orderData.phone}\nTotal: ₹${orderData.total}\n\nView: ${window.location.origin}/admin/orders.html`;
  const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
  
  // Open in new tab (will be blocked by popup blocker if not user-triggered)
  // So we'll just log it
  console.log('WhatsApp notification would be sent:', whatsappUrl);
  return whatsappUrl;
}

// ============================================
// REAL-TIME LISTENERS
// ============================================

// Listen to products changes
function listenToProducts(callback) {
  return collections.products.onSnapshot((snapshot) => {
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    callback(products);
  }, (error) => {
    console.error('Error listening to products:', error);
  });
}

// Listen to orders changes
function listenToOrders(callback) {
  return collections.orders.orderBy('orderDate', 'desc').onSnapshot((snapshot) => {
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    callback(orders);
  }, (error) => {
    console.error('Error listening to orders:', error);
  });
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

async function getDashboardStats() {
  try {
    const ordersSnapshot = await collections.orders.get();
    const productsSnapshot = await collections.products.get();
    
    let totalRevenue = 0;
    let totalOrders = 0;
    let todayRevenue = 0;
    const today = new Date().toDateString();
    
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      totalRevenue += order.total || 0;
      totalOrders++;
      
      const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
      if (orderDate.toDateString() === today) {
        todayRevenue += order.total || 0;
      }
    });
    
    return {
      totalRevenue: totalRevenue,
      totalOrders: totalOrders,
      totalProducts: productsSnapshot.size,
      todayRevenue: todayRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      todayRevenue: 0,
      averageOrderValue: 0
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate discount percentage
function calculateDiscount(price, mrp) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Escape HTML
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
// EXPORTS (Global)
// ============================================

// Make everything available globally
window.db = db;
window.auth = auth;
window.storage = storage;
window.collections = collections;
window.messaging = messaging;

// Product functions
window.fetchProducts = fetchProducts;
window.getProductById = getProductById;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;

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

// Settings functions
window.getSettings = getSettings;
window.updateSettings = updateSettings;

// Auth functions
window.adminLogin = adminLogin;

// Notification functions
window.requestNotificationPermission = requestNotificationPermission;
window.sendAdminNotification = sendAdminNotification;

// Real-time listeners
window.listenToProducts = listenToProducts;
window.listenToOrders = listenToOrders;

// Analytics
window.getDashboardStats = getDashboardStats;

// Helpers
window.calculateDiscount = calculateDiscount;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.escapeHtml = escapeHtml;

console.log('✅ Firebase fully initialized and ready!');
console.log('📦 Collections:', Object.keys(collections));
console.log('🔔 Messaging:', messaging ? 'Available' : 'Not available');
