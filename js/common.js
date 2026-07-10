// ===== OK MART - COMPLETE COMMON.JS =====
// Version: 2.0 - Optimized & Fully Working

// ============================================
// STORAGE KEYS
// ============================================
const CART_KEY = 'okmart_cart';
const WISHLIST_KEY = 'okmart_wishlist';
const USER_KEY = 'okmart_user';
const RECENTLY_VIEWED_KEY = 'okmart_recently_viewed';

// ============================================
// MAIN OKMart OBJECT
// ============================================
window.OKMart = {
  // ========== CART FUNCTIONS ==========
  getCart: () => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch (e) {
      return [];
    }
  },
  
  saveCart: (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.OKMart.updateCartUI();
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  },
  
  addToCart: (product, qty = 1) => {
    const cart = window.OKMart.getCart();
    const existing = cart.find(i => i.id === product.id);
    
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        unit: product.unit || '',
        quantity: qty
      });
    }
    
    window.OKMart.saveCart(cart);
    window.OKMart.showToast(`${product.name} added to cart!`, 'success');
    
    // Animate add to cart
    window.OKMart.animateAddToCart();
  },
  
  removeFromCart: (productId) => {
    const cart = window.OKMart.getCart().filter(i => i.id !== productId);
    window.OKMart.saveCart(cart);
    window.OKMart.showToast('Item removed from cart', 'info');
  },
  
  updateQty: (productId, qty) => {
    const cart = window.OKMart.getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
      item.quantity = Math.max(1, qty);
      window.OKMart.saveCart(cart);
    }
  },
  
  updateCartUI: () => {
    const cart = window.OKMart.getCart();
    const total = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    const subtotal = cart.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
    
    // Update all cart badges
    document.querySelectorAll('.cart-badge, .cart-count').forEach(el => {
      if (el) el.textContent = total;
    });
    
    // Update floating cart bar
    const countEl = document.getElementById('bottomCartCount');
    const totalEl = document.getElementById('bottomCartTotal');
    const barEl = document.getElementById('bottomCartBar');
    const floatingBar = document.getElementById('floatingCartBar');
    
    if (countEl) countEl.textContent = `${total} item${total !== 1 ? 's' : ''}`;
    if (totalEl) totalEl.textContent = `₹${subtotal}`;
    if (barEl) barEl.style.display = total > 0 ? 'flex' : 'none';
    if (floatingBar) {
      if (total > 0) {
        floatingBar.classList.add('visible');
        floatingBar.style.display = 'flex';
      } else {
        floatingBar.classList.remove('visible');
        setTimeout(() => {
          if (!floatingBar.classList.contains('visible')) {
            floatingBar.style.display = 'none';
          }
        }, 300);
      }
    }
    
    // Update free delivery progress
    window.OKMart.updateFreeDeliveryProgress?.();
  },
  
  // ========== WISHLIST FUNCTIONS ==========
  getWishlist: () => {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    } catch (e) {
      return [];
    }
  },
  
  toggleWishlist: (product, heartEl) => {
    const w = window.OKMart.getWishlist();
    const idx = w.findIndex(i => i.id === product.id);
    let isAdded = false;
    
    if (idx > -1) {
      w.splice(idx, 1);
      if (heartEl) heartEl.textContent = '🤍';
      window.OKMart.showToast('Removed from wishlist', 'info');
    } else {
      w.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit
      });
      if (heartEl) heartEl.textContent = '❤️';
      window.OKMart.showToast('Added to wishlist', 'success');
      isAdded = true;
    }
    
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(w));
    window.OKMart.updateWishlistUI();
    return isAdded;
  },
  
  isInWishlist: (id) => {
    return window.OKMart.getWishlist().some(i => i.id === id);
  },
  
  updateWishlistUI: () => {
    const wishlist = window.OKMart.getWishlist();
    const wishlistCount = document.getElementById('wishlistCount');
    if (wishlistCount) wishlistCount.textContent = wishlist.length;
    
    // Update all wishlist buttons
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      const productCard = btn.closest('.product-card');
      if (productCard) {
        const productId = productCard.dataset.id;
        if (productId && window.OKMart.isInWishlist(productId)) {
          btn.textContent = '❤️';
        } else {
          btn.textContent = '🤍';
        }
      }
    });
  },
  
  // ========== RECENTLY VIEWED ==========
  getRecentlyViewed: () => {
    try {
      return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    } catch (e) {
      return [];
    }
  },
  
  addToRecentlyViewed: (productId) => {
    let recent = window.OKMart.getRecentlyViewed();
    recent = recent.filter(id => id !== productId);
    recent.unshift(productId);
    recent = recent.slice(0, 10);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recent));
  },
  
  // ========== SHARE FUNCTION ==========
  shareProduct: (product) => {
    const url = `${window.location.origin}/product.html?id=${product.id}`;
    const text = `Check out ${product.name} on OK Mart for only ₹${product.price}!`;
    
    if (navigator.share) {
      navigator.share({ title: product.name, text: text, url: url })
        .catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank');
    }
  },
  
  // ========== TOAST NOTIFICATION ==========
  showToast: (msg, type = 'info') => {
    let toast = document.getElementById('toastMessage');
    
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastMessage';
      toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        padding: 12px 24px;
        border-radius: 40px;
        font-weight: 500;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease;
        white-space: nowrap;
        pointer-events: none;
        font-size: 0.85rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(toast);
    }
    
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#1a1e2b';
    toast.style.color = 'white';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
  },
  
  // ========== PRODUCT CARD RENDERER ==========
  renderProductCard: (product) => {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    const isOutOfStock = (product.stock || 0) === 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.setAttribute('data-product-id', product.id);
    
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=OK'">
      ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
      ${discount > 0 ? `<span class="offer-badge">${discount}% OFF</span>` : ''}
      <button class="wishlist-btn" aria-label="Wishlist">${window.OKMart.isInWishlist(product.id) ? '❤️' : '🤍'}</button>
      <button class="share-btn" aria-label="Share">📤</button>
      <h3 class="product-name">${window.OKMart.escapeHtml(product.name)}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
      </div>
      <button class="add-btn" ${isOutOfStock ? 'disabled' : ''}>${isOutOfStock ? 'Out of Stock' : 'ADD'}</button>
    `;
    
    // Product click - navigate to detail page
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        window.OKMart.addToRecentlyViewed(product.id);
        window.location.href = `/product.html?id=${product.id}`;
      }
    });
    
    // Add to cart button
    const addBtn = card.querySelector('.add-btn');
    if (addBtn && !isOutOfStock) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.OKMart.addToCart(product);
      });
    }
    
    // Wishlist button
    const wishlistBtn = card.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.OKMart.toggleWishlist(product, wishlistBtn);
    });
    
    // Share button
    const shareBtn = card.querySelector('.share-btn');
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.OKMart.shareProduct(product);
    });
    
    return card;
  },
  
  // ========== ANIMATIONS ==========
  animateAddToCart: () => {
    const popup = document.getElementById('miniOrderPopup');
    if (popup) {
      popup.classList.add('show');
      setTimeout(() => popup.classList.remove('show'), 2000);
    }
  },
  
  // ========== HELPER FUNCTIONS ==========
  escapeHtml: (str) => {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  },
  
  calculateDiscount: (price, mrp) => {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  },
  
  formatCurrency: (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  },
  
  formatDate: (timestamp) => {
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
};

// ============================================
// SKELETON LOADING HELPERS
// ============================================

window.showProductSkeleton = function(containerId, count = 6) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const skeletons = [];
  for (let i = 0; i < count; i++) {
    skeletons.push(`
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text-sm"></div>
        <div class="skeleton-button"></div>
      </div>
    `);
  }
  container.innerHTML = skeletons.join('');
};

window.hideSkeleton = function(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
};

// ============================================
// ANIMATE NUMBER COUNTER
// ============================================

window.animateNumber = function(element, start, end, duration = 1000) {
  if (!element) return;
  
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= end) {
      element.textContent = end;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
};

// ============================================
// CONFETTI EFFECT
// ============================================

window.showConfetti = function() {
  // Simple confetti effect
  const colors = ['#2ecc71', '#27ae60', '#f39c12', '#e74c3c', '#3498db'];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      top: -10px;
      left: ${Math.random() * 100}%;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: 2px;
      opacity: 0.8;
      pointer-events: none;
      z-index: 9999;
      animation: confettiFall ${Math.random() * 2 + 1}s linear forwards;
    `;
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
  
  // Add animation if not exists
  if (!document.querySelector('#confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      @keyframes confettiFall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
};

// ============================================
// COPY TO CLIPBOARD
// ============================================

window.copyToClipboard = async function(text, successMessage = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text);
    window.OKMart.showToast(successMessage, 'success');
    return true;
  } catch (err) {
    window.OKMart.showToast('Failed to copy', 'error');
    return false;
  }
};

// ============================================
// SHARE FUNCTION (Web Share API)
// ============================================

window.shareContent = async function(title, text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      return false;
    }
  } else {
    await window.copyToClipboard(url, 'Link copied!');
    return false;
  }
};

// ============================================
// DELIVERY SYSTEM INTEGRATION
// ============================================

window.DeliverySystem = {
  checkServiceability: async function(pincode) {
    try {
      if (!window.db) {
        console.warn('Firestore not available');
        return { serviceable: false };
      }
      const doc = await window.db.collection('pincodes').doc(pincode).get();
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
  },
  
  calculateDeliveryCharge: async function(pincode, cartTotal) {
    const result = await this.checkServiceability(pincode);
    if (!result.serviceable) return null;
    const { deliveryCharge, freeAbove } = result;
    if (cartTotal >= freeAbove) return 0;
    return deliveryCharge;
  },
  
  getEstimatedTime: function(deliveryType) {
    if (deliveryType === 'quick') {
      const now = new Date();
      const eta = new Date(now.getTime() + 15 * 60000);
      return eta.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return 'Today, 6-8 PM';
  },
  
  saveUserLocation: function(location) {
    localStorage.setItem('okmart_user_location', JSON.stringify(location));
    document.dispatchEvent(new CustomEvent('locationUpdated', { detail: location }));
  },
  
  getUserLocation: function() {
    const saved = localStorage.getItem('okmart_user_location');
    return saved ? JSON.parse(saved) : null;
  }
};

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

window.initNotifications = async function() {
  if (!window.messaging) {
    console.log('Firebase Messaging not available');
    return;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      const token = await window.messaging.getToken({
        vapidKey: 'BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE'
      });
      console.log('FCM Token:', token);
      
      // Save token to Firestore
      if (window.saveTokenToFirestore) {
        await window.saveTokenToFirestore(token);
      }
    } else {
      console.log('Notification permission denied');
    }
  } catch (err) {
    console.error('Notification error:', err);
  }
};

// ============================================
// UPDATE DELIVERY UI
// ============================================

function updateDeliveryUI() {
  const savedPincode = localStorage.getItem('okmart_pincode');
  const deliveryBanner = document.getElementById('deliveryInfoBanner');
  
  if (savedPincode && deliveryBanner && window.DeliverySystem) {
    window.DeliverySystem.checkServiceability(savedPincode).then(result => {
      if (result.serviceable) {
        deliveryBanner.innerHTML = `
          <div class="delivery-info-content">
            <span class="delivery-icon">🚚</span>
            <span class="delivery-text">Delivery to ${savedPincode}</span>
            <span class="delivery-separator">|</span>
            <span class="delivery-time">⚡ ${result.estimatedTime}</span>
          </div>
        `;
      }
    });
  }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Update cart UI
  window.OKMart.updateCartUI();
  
  // Update wishlist UI
  window.OKMart.updateWishlistUI();
  
  // Update delivery UI
  updateDeliveryUI();
  
  // Initialize notifications after delay
  setTimeout(() => {
    window.initNotifications();
  }, 2000);
  
  console.log('✅ Common.js loaded successfully');
});

// Cart update event listener
window.addEventListener('cartUpdated', () => {
  window.OKMart.updateCartUI();
});

// Storage event listener for cross-tab sync
window.addEventListener('storage', (e) => {
  if (e.key === CART_KEY) {
    window.OKMart.updateCartUI();
  }
  if (e.key === WISHLIST_KEY) {
    window.OKMart.updateWishlistUI();
  }
});

// ============================================
// CENTRALIZED CONSTANTS
// ============================================

// एक ही जगह free delivery threshold — सभी pages यहाँ से लें
window.FREE_DELIVERY_THRESHOLD = 199;
window.BASE_DELIVERY_CHARGE = 39;

// ============================================
// FETCH PRODUCTS FROM FIREBASE (Global)
// ============================================

/**
 * Firebase से active products fetch करता है।
 * cart.js, checkout.js, search.js etc. यही function use करें।
 */
window.fetchProducts = async function(filters = {}) {
  try {
    if (typeof db === 'undefined') {
      console.warn('fetchProducts: Firestore (db) not available yet.');
      return [];
    }
    let query = db.collection('products').where('active', '==', true);
    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    const snapshot = await query.get();
    const products = [];
    snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
    return products;
  } catch (error) {
    console.error('fetchProducts error:', error);
    return [];
  }
};

// ============================================
// EXPORTS (for compatibility)
// ============================================

// Alias for existing functions
window.getCart = window.OKMart.getCart;
window.saveCart = window.OKMart.saveCart;
window.addToCart = window.OKMart.addToCart;
window.removeFromCart = window.OKMart.removeFromCart;
window.updateCartBadge = window.OKMart.updateCartUI;
window.getWishlist = window.OKMart.getWishlist;
window.toggleWishlist = window.OKMart.toggleWishlist;
window.showToast = window.OKMart.showToast;
window.renderProductCard = window.OKMart.renderProductCard;
window.escapeHtml = window.OKMart.escapeHtml;
window.calculateDiscount = window.OKMart.calculateDiscount;
window.formatCurrency = window.OKMart.formatCurrency;




// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 New Service Worker installing...');
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (window.OKMart && window.OKMart.showToast) {
                window.OKMart.showToast('New version available! Refresh to update.', 'info');
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Check for app install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) {
    installBtn.style.display = 'flex';
    installBtn.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        installBtn.style.display = 'none';
      });
    });
  }
});
