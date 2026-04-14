// ===== OK MART - COMMON.JS =====
// Reusable utilities, product data management, and cart functions

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const CART_KEY = 'okmart_cart';
  const CACHE_KEY = 'okmart_products_cache';
  const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
  
  // ---------- GLOBAL STATE ----------
  window.OKMart = window.OKMart || {};
  
  let cachedProducts = null;
  
  // ---------- PRODUCT FETCHING (WITH CACHING) ----------
  async function fetchProducts() {
    // Check memory cache first
    if (cachedProducts) {
      return cachedProducts;
    }
    
    // Check sessionStorage cache
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          console.log('✅ Using cached products');
          cachedProducts = data;
          return cachedProducts;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    
    // Fetch from network
    try {
      console.log('🌐 Fetching products from network');
      const response = await fetch('/data/products.json');
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      cachedProducts = data.products;
      
      // Save to sessionStorage
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data: cachedProducts,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Cache save error:', e);
      }
      
      return cachedProducts;
    } catch (error) {
      console.error('Error loading products:', error);
      
      // Try to return stale cache if network fails
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          console.log('⚠️ Using stale cache');
          return JSON.parse(cached).data;
        }
      } catch (e) {}
      
      return [];
    }
  }
  
  window.OKMart.getProducts = fetchProducts;
  
  // ---------- CATEGORY FILTERING ----------
  window.OKMart.getProductsByCategory = async (categorySlug) => {
    const products = await fetchProducts();
    return products.filter(p => p.category === categorySlug);
  };
  
  window.OKMart.getPopularProducts = async () => {
    const products = await fetchProducts();
    return products.filter(p => p.popular === true);
  };
  
  // ---------- DISCOUNT CALCULATION ----------
  window.OKMart.calculateDiscount = (price, mrp) => {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };
  
  // ---------- PRODUCT CARD RENDERING ----------
  window.OKMart.renderProductCard = (product) => {
    const discount = window.OKMart.calculateDiscount(product.price, product.mrp);
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    
    // Image
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.className = 'product-image';
    img.loading = 'lazy';
    
    // Name
    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name;
    
    // Unit
    const unitSpan = document.createElement('span');
    unitSpan.className = 'product-unit';
    unitSpan.textContent = product.unit || '';
    
    // Price container
    const priceDiv = document.createElement('div');
    priceDiv.className = 'price-container';
    
    const currPrice = document.createElement('span');
    currPrice.className = 'current-price';
    currPrice.textContent = `₹${product.price}`;
    
    const mrpSpan = document.createElement('span');
    mrpSpan.className = 'mrp-price';
    mrpSpan.textContent = product.mrp ? `₹${product.mrp}` : '';
    
    priceDiv.appendChild(currPrice);
    if (product.mrp && product.mrp > product.price) {
      priceDiv.appendChild(mrpSpan);
    }
    
    if (discount > 0) {
      const discountBadge = document.createElement('span');
      discountBadge.className = 'discount-badge';
      discountBadge.textContent = `${discount}% OFF`;
      priceDiv.appendChild(discountBadge);
    }
    
    // Button
    const btn = document.createElement('button');
    btn.className = 'add-to-cart-btn';
    btn.textContent = 'Add to cart';
    btn.setAttribute('aria-label', `Add ${product.name} to cart`);
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('okmart:add-to-cart', { detail: product }));
    });
    
    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(unitSpan);
    card.appendChild(priceDiv);
    card.appendChild(btn);
    
    return card;
  };
  
  // ---------- CART FUNCTIONS ----------
  function getCart() {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    updateStickyCartBar();
    window.dispatchEvent(new CustomEvent('okmart:cart-updated'));
  }
  
  function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('#cartCountPlaceholder, .cart-badge');
    badges.forEach(badge => {
      if (badge) badge.textContent = totalItems;
    });
  }
  
  window.OKMart.addToCart = (product, quantity = 1) => {
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
        quantity
      });
    }
    
    saveCart(cart);
    showAddToCartFeedback(product.name);
  };
  
  window.OKMart.getCartItems = getCart;
  
  window.OKMart.getCartCount = () => {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };
  
  window.OKMart.getCartSubtotal = () => {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  window.OKMart.clearCart = () => {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
    updateStickyCartBar();
    window.dispatchEvent(new CustomEvent('okmart:cart-updated'));
  };
  
  // ---------- ADD TO CART FEEDBACK ----------
  function showAddToCartFeedback(productName) {
    const feedback = document.createElement('div');
    feedback.className = 'cart-feedback-toast';
    feedback.innerHTML = `
      <span>🛒</span>
      <span>${productName} added to cart!</span>
    `;
    feedback.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e2a2e;
      color: white;
      padding: 12px 24px;
      border-radius: 40px;
      font-weight: 500;
      font-size: 0.9rem;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
      animation: slideUpFade 0.3s ease-out;
      white-space: nowrap;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.style.animation = 'slideDownFade 0.3s ease-in';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }
  
  // ---------- STICKY CART BAR ----------
  let stickyCartBar = null;
  
  function createStickyCartBar() {
    if (document.getElementById('stickyCartBar')) return;
    
    const bar = document.createElement('div');
    bar.className = 'sticky-cart-bar';
    bar.id = 'stickyCartBar';
    bar.innerHTML = `
      <div class="cart-bar-inner">
        <div class="sticky-cart-info">
          <span class="cart-item-count-small" id="stickyCartCount">0</span>
          <span class="cart-total-small" id="stickyCartTotal">₹0</span>
        </div>
        <a href="cart.html" class="view-cart-btn">View Cart →</a>
      </div>
    `;
    
    document.body.appendChild(bar);
    return bar;
  }
  
  function updateStickyCartBar() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (totalItems > 0) {
      if (!stickyCartBar) {
        stickyCartBar = createStickyCartBar();
      }
      
      const countEl = document.getElementById('stickyCartCount');
      const totalEl = document.getElementById('stickyCartTotal');
      
      if (countEl) countEl.textContent = totalItems;
      if (totalEl) totalEl.textContent = `₹${subtotal}`;
      
      setTimeout(() => stickyCartBar.classList.add('visible'), 10);
    } else {
      if (stickyCartBar) {
        stickyCartBar.classList.remove('visible');
      }
    }
  }
  
  window.OKMart.updateStickyCartBar = updateStickyCartBar;
  
  // ---------- EVENT LISTENERS ----------
  window.addEventListener('okmart:add-to-cart', (e) => {
    window.OKMart.addToCart(e.detail);
  });
  
  // ---------- ADD ANIMATION STYLES ----------
  function addGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUpFade {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes slideDownFade {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
      }
      
      .sticky-cart-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        padding: 12px 16px;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
        z-index: 200;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-top: 2px solid #2ecc71;
      }
      
      .sticky-cart-bar.visible {
        transform: translateY(0);
      }
      
      .sticky-cart-bar .cart-bar-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .sticky-cart-info {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
      
      .cart-item-count-small {
        background: #2ecc71;
        color: white;
        padding: 2px 8px;
        border-radius: 40px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      
      .cart-total-small {
        font-weight: 700;
        font-size: 1.1rem;
      }
      
      .view-cart-btn {
        background: #2ecc71;
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 40px;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
      }
      
      .view-cart-btn:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);
  }
  
  // ---------- INITIALIZATION ----------
  document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    updateStickyCartBar();
    addGlobalStyles();
  });
  
})();
