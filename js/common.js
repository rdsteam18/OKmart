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
