// ===== OK MART - COMMON.JS =====
const CART_KEY = 'okmart_cart';
const WISHLIST_KEY = 'okmart_wishlist';
const USER_KEY = 'okmart_user';

window.OKMart = {
  getCart: () => JSON.parse(localStorage.getItem(CART_KEY) || '[]'),
  
  saveCart: (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.OKMart.updateCartUI();
  },
  
  addToCart: (product, qty = 1) => {
    const cart = window.OKMart.getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.quantity += qty;
    else cart.push({ id: product.id, name: product.name, price: product.price, mrp: product.mrp, image: product.image, unit: product.unit, quantity: qty });
    window.OKMart.saveCart(cart);
    window.OKMart.showToast(`${product.name} added!`, 'success');
  },
  
  removeFromCart: (productId) => {
    const cart = window.OKMart.getCart().filter(i => i.id !== productId);
    window.OKMart.saveCart(cart);
  },
  
  updateQty: (productId, qty) => {
    const cart = window.OKMart.getCart();
    const item = cart.find(i => i.id === productId);
    if (item) { item.quantity = Math.max(1, qty); window.OKMart.saveCart(cart); }
  },
  
  updateCartUI: () => {
    const cart = window.OKMart.getCart();
    const total = cart.reduce((s, i) => s + i.quantity, 0);
    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    document.querySelectorAll('.cart-badge').forEach(b => b.textContent = total);
    const countEl = document.getElementById('bottomCartCount');
    const totalEl = document.getElementById('bottomCartTotal');
    const barEl = document.getElementById('bottomCartBar');
    if (countEl) countEl.textContent = `${total} item${total !== 1 ? 's' : ''}`;
    if (totalEl) totalEl.textContent = `₹${subtotal}`;
    if (barEl) barEl.style.display = total > 0 ? 'flex' : 'none';
  },
  
  getWishlist: () => JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'),
  
  toggleWishlist: (product, heartEl) => {
    const w = window.OKMart.getWishlist();
    const idx = w.findIndex(i => i.id === product.id);
    if (idx > -1) { w.splice(idx, 1); if (heartEl) heartEl.textContent = '🤍'; }
    else { w.push({ id: product.id, name: product.name, price: product.price, image: product.image, unit: product.unit }); if (heartEl) heartEl.textContent = '❤️'; }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(w));
    return idx === -1;
  },
  
  isInWishlist: (id) => window.OKMart.getWishlist().some(i => i.id === id),
  
  shareProduct: (product) => {
    const url = `${location.origin}/product.html?id=${product.id}`;
    if (navigator.share) navigator.share({ title: product.name, url }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(`🛒 ${product.name}\n💰 ₹${product.price}\n${url}`)}`, '_blank');
  },
  
  showToast: (msg, type = 'info') => {
    let toast = document.getElementById('toastMessage');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastMessage';
      toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:40px;font-weight:500;z-index:9999;opacity:0;transition:0.3s;white-space:nowrap;pointer-events:none;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#1a1e2b';
    toast.style.color = 'white';
    toast.style.opacity = '1';
    toast.style.bottom = '100px';
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => { toast.style.opacity = '0'; toast.style.bottom = '80px'; }, 2500);
  },
  
  renderProductCard: (product) => {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=OK'">
      ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
      <button class="wishlist-btn">${window.OKMart.isInWishlist(product.id) ? '❤️' : '🤍'}</button>
      <button class="share-btn">📤</button>
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row"><span class="current-price">₹${product.price}</span>${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}</div>
      <button class="add-btn">ADD</button>
    `;
    card.addEventListener('click', e => { if (!e.target.closest('button')) location.href = `/product.html?id=${product.id}`; });
    card.querySelector('.add-btn').addEventListener('click', e => { e.stopPropagation(); window.OKMart.addToCart(product); });
    card.querySelector('.wishlist-btn').addEventListener('click', e => { e.stopPropagation(); window.OKMart.toggleWishlist(product, e.target); });
    card.querySelector('.share-btn').addEventListener('click', e => { e.stopPropagation(); window.OKMart.shareProduct(product); });
    return card;
  }
};

document.addEventListener('DOMContentLoaded', () => window.OKMart.updateCartUI());


async function initNotifications() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notification permission granted");

      const token = await getToken(messaging, {
        vapidKey: "BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE"
      });

      console.log("FCM Token:", token);

    } else {
      console.log("Permission denied");
    }

  } catch (err) {
    console.error("Notification error:", err);
  }
}

initNotifications();


// Add these functions to your existing common.js

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
// CONFETTI EFFECT (for order success)
// ============================================

window.showConfetti = function() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  } else {
    // Simple confetti fallback
    console.log('🎉 Congratulations!');
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
    // Fallback - copy to clipboard
    await window.copyToClipboard(url, 'Link copied!');
    return false;
  }
};



// ===== OK MART - DELIVERY SYSTEM INTEGRATION =====

// Add these functions to your existing common.js

// ========== DELIVERY CHECK ==========
window.DeliverySystem = {
  // Check if pincode is serviceable
  checkServiceability: async function(pincode) {
    try {
      const doc = await db.collection('pincodes').doc(pincode).get();
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
  
  // Calculate delivery charge based on cart total and pincode
  calculateDeliveryCharge: async function(pincode, cartTotal) {
    const result = await this.checkServiceability(pincode);
    if (!result.serviceable) return null;
    
    const { deliveryCharge, freeAbove } = result;
    if (cartTotal >= freeAbove) return 0;
    return deliveryCharge;
  },
  
  // Get estimated delivery time
  getEstimatedTime: function(deliveryType) {
    if (deliveryType === 'quick') {
      const now = new Date();
      const eta = new Date(now.getTime() + 15 * 60000);
      return eta.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return 'Today, 6-8 PM';
  },
  
  // Save user location
  saveUserLocation: function(location) {
    localStorage.setItem('okmart_user_location', JSON.stringify(location));
    document.dispatchEvent(new CustomEvent('locationUpdated', { detail: location }));
  },
  
  // Get saved location
  getUserLocation: function() {
    const saved = localStorage.getItem('okmart_user_location');
    return saved ? JSON.parse(saved) : null;
  }
};

// ========== UPDATE DELIVERY UI ==========
function updateDeliveryUI() {
  const savedPincode = localStorage.getItem('okmart_pincode');
  const deliveryBanner = document.getElementById('deliveryInfoBanner');
  
  if (savedPincode && deliveryBanner) {
    DeliverySystem.checkServiceability(savedPincode).then(result => {
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

// Call when page loads
document.addEventListener('DOMContentLoaded', updateDeliveryUI);
document.addEventListener('locationUpdated', updateDeliveryUI);




// ===== OK MART - COMMON.JS (ADD THESE FUNCTIONS) =====

// Cart Functions
function getCart() {
  return JSON.parse(localStorage.getItem('okmart_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('okmart_cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      unit: product.unit,
      quantity: quantity
    });
  }
  
  saveCart(cart);
  showToast(`${product.name} added to cart!`, 'success');
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  document.querySelectorAll('.cart-count, .cart-badge').forEach(el => {
    if (el) el.textContent = total;
  });
}

// Wishlist Functions
function getWishlist() {
  return JSON.parse(localStorage.getItem('okmart_wishlist') || '[]');
}

function toggleWishlist(productId) {
  let wishlist = getWishlist();
  const index = wishlist.indexOf(productId);
  
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast('Removed from wishlist', 'info');
  } else {
    wishlist.push(productId);
    showToast('Added to wishlist', 'success');
  }
  
  localStorage.setItem('okmart_wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
}

// Toast Function
function showToast(message, type) {
  let toast = document.getElementById('toastMessage');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastMessage';
    toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:40px;font-weight:500;z-index:9999;opacity:0;transition:0.3s;background:#1a1e2b;color:white;';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#1a1e2b';
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}

// Product Card Renderer
function renderProductCard(product) {
  const discount = calculateDiscount(product.price, product.mrp);
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-product-id', product.id);
  card.onclick = () => window.location.href = `/product.html?id=${product.id}`;
  
  card.innerHTML = `
    <img src="${product.image}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=OK'">
    ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
    ${discount > 0 ? `<span class="offer-badge">${discount}% OFF</span>` : ''}
    <h3 class="product-name">${escapeHtml(product.name)}</h3>
    <span class="product-unit">${product.unit || ''}</span>
    <div class="price-row">
      <span class="current-price">₹${product.price}</span>
      ${product.mrp ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
    </div>
    <button class="add-btn" onclick="event.stopPropagation(); addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">ADD</button>
  `;
  
  return card;
}

// Make functions globally available
window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.updateCartBadge = updateCartBadge;
window.getWishlist = getWishlist;
window.toggleWishlist = toggleWishlist;
window.showToast = showToast;
window.renderProductCard = renderProductCard;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  console.log('✅ Common.js loaded');
});
