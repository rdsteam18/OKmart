// ===== OK MART - ADVANCED CART PAGE (FIXED) =====

(function() {
  'use strict';

  // ========== DOM Elements ==========
  const loadingState = document.getElementById('loadingState');
  const cartContent = document.getElementById('cartContent');
  const emptyCart = document.getElementById('emptyCart');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartItemCount = document.getElementById('cartItemCount');
  const savedItemsList = document.getElementById('savedItemsList');
  const savedSection = document.getElementById('savedSection');
  const subtotalEl = document.getElementById('subtotal');
  const discountAmountEl = document.getElementById('discountAmount');
  const discountRow = document.getElementById('discountRow');
  const deliveryChargeEl = document.getElementById('deliveryCharge');
  const totalAmountEl = document.getElementById('totalAmount');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const couponInput = document.getElementById('couponCode');
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const couponMessage = document.getElementById('couponMessage');
  const couponChips = document.getElementById('couponChips');
  const availableCoupons = document.getElementById('availableCoupons');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const viewSavedBtn = document.getElementById('viewSavedBtn');
  const relatedProductsGrid = document.getElementById('relatedProductsGrid');
  const trendingGridEmpty = document.getElementById('trendingGridEmpty');

  // ========== State ==========
  let cart = [];
  let savedItems = [];
  let allProducts = [];
  let coupons = [];
  let appliedCoupon = null;
  // ✅ common.js से centralized values लें (fallback भी है)
  const FREE_DELIVERY_THRESHOLD = window.FREE_DELIVERY_THRESHOLD || 199;
  const BASE_DELIVERY_CHARGE = window.BASE_DELIVERY_CHARGE || 39;

  // ========== Load Data ==========
  async function loadData() {
    try {
      loadingState.style.display = 'block';
      
      // Load products
      allProducts = await fetchProducts();
      
      // Load coupons from Firebase
      await loadCoupons();
      
      // Load cart from localStorage
      loadCart();
      
      // Load saved items
      loadSavedItems();
      
      loadingState.style.display = 'none';
      
      if (cart.length === 0 && savedItems.length === 0) {
        showEmptyCart();
      } else {
        cartContent.style.display = 'block';
        renderCart();
        renderRelatedProducts();
        updateOrderSummary();
      }
      
      // Load trending for empty cart
      if (trendingGridEmpty) {
        renderTrendingProducts();
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      loadingState.innerHTML = '<div class="spinner"></div><p>Error loading cart. Please refresh.</p>';
    }
  }

  // ========== Load Coupons from Firebase ==========
  async function loadCoupons() {
    try {
      const snapshot = await db.collection('offers')
        .where('active', '==', true)
        .get();
      
      coupons = [];
      snapshot.forEach(doc => {
        coupons.push({ id: doc.id, ...doc.data() });
      });
      
      // Show available coupons
      if (coupons.length > 0 && availableCoupons) {
        availableCoupons.style.display = 'block';
        couponChips.innerHTML = coupons.slice(0, 4).map(c => `
          <div class="coupon-chip" onclick="applyCouponCode('${c.code}')">
            🏷️ ${c.code} ${c.type === 'flat' ? `₹${c.discount} OFF` : `${c.discount}% OFF`}
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
    }
  }

  // ========== Load Cart from localStorage ==========
  function loadCart() {
    const savedCart = localStorage.getItem('okmart_cart');
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch(e) { cart = []; }
    } else {
      cart = [];
    }
  }

  // ========== Save Cart to localStorage ==========
  function saveCart() {
    localStorage.setItem('okmart_cart', JSON.stringify(cart));
    updateCartBadge();
  }

  // ========== Load Saved Items ==========
  function loadSavedItems() {
    const saved = localStorage.getItem('okmart_saved_for_later');
    if (saved) {
      try {
        savedItems = JSON.parse(saved);
      } catch(e) { savedItems = []; }
    } else {
      savedItems = [];
    }
  }

  // ========== Save Saved Items ==========
  function saveSavedItems() {
    localStorage.setItem('okmart_saved_for_later', JSON.stringify(savedItems));
  }

  // ========== Update Cart Badge ==========
  function updateCartBadge() {
    const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    localStorage.setItem('okmart_cart_count', total);
    const event = new CustomEvent('cartUpdated');
    window.dispatchEvent(event);
  }

  // ========== Render Cart Items ==========
  function renderCart() {
    if (!cartItemsList) return;
    
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartItemCount.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    
    if (cart.length === 0) {
      cartItemsList.innerHTML = '<div style="text-align:center;padding:40px;color:#6b7280;">No items in cart</div>';
      document.querySelector('.cart-items-section').style.display = 'none';
    } else {
      document.querySelector('.cart-items-section').style.display = 'block';
      cartItemsList.innerHTML = cart.map((item, index) => {
        const product = allProducts.find(p => p.id === item.id) || item;
        const quantity = item.quantity || 1;
        
        return `
          <div class="cart-item" data-id="${item.id}">
            <img src="${product.image}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80'">
            <div class="cart-item-details">
              <div class="cart-item-name">${escapeHtml(product.name)}</div>
              <div class="cart-item-unit">${product.unit || ''}</div>
              <div class="cart-item-price">₹${product.price}</div>
            </div>
            <div class="cart-item-actions">
              <div class="quantity-control">
                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                <span class="qty-value">${quantity}</span>
                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
              </div>
              <button class="save-for-later-btn" onclick="saveForLater('${item.id}')">📦 Save for Later</button>
              <button class="remove-item-btn" onclick="removeFromCart('${item.id}')">🗑️ Remove</button>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // Render saved items
    renderSavedItems();
  }

  // ========== Render Saved Items ==========
  function renderSavedItems() {
    if (!savedItemsList) return;
    
    if (savedItems.length === 0) {
      savedSection.style.display = 'none';
      return;
    }
    
    savedSection.style.display = 'block';
    
    savedItemsList.innerHTML = savedItems.slice(0, 3).map(item => {
      const product = allProducts.find(p => p.id === item.id) || item;
      return `
        <div class="saved-item">
          <img src="${product.image}" class="saved-item-image" onerror="this.src='https://via.placeholder.com/55'">
          <div class="saved-item-details">
            <div class="saved-item-name">${escapeHtml(product.name)}</div>
            <div class="saved-item-price">₹${product.price}</div>
          </div>
          <button class="move-to-cart-btn" onclick="moveToCart('${item.id}')">Move to Cart →</button>
        </div>
      `;
    }).join('');
  }

  // ========== Update Quantity ==========
  window.updateQuantity = function(productId, delta) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;
    
    const newQuantity = (cart[itemIndex].quantity || 1) + delta;
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    cart[itemIndex].quantity = newQuantity;
    saveCart();
    renderCart();
    updateOrderSummary();
    showMiniPopup();
  };

  // ========== Remove from Cart ==========
  window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    updateOrderSummary();
    showMiniPopup();
    
    if (cart.length === 0 && savedItems.length === 0) {
      showEmptyCart();
    }
  };

  // ========== Save for Later ==========
  window.saveForLater = function(productId) {
    const itemIndex = cart.findIndex(i => i.id === productId);
    if (itemIndex === -1) return;
    
    const item = cart[itemIndex];
    
    // Remove from cart
    cart.splice(itemIndex, 1);
    saveCart();
    
    // Add to saved items (avoid duplicates)
    if (!savedItems.find(i => i.id === productId)) {
      savedItems.push(item);
      saveSavedItems();
    }
    
    renderCart();
    renderSavedItems();
    updateOrderSummary();
    showMiniPopup();
    
    if (cart.length === 0 && savedItems.length === 0) {
      showEmptyCart();
    }
  };

  // ========== Move to Cart ==========
  window.moveToCart = function(productId) {
    const itemIndex = savedItems.findIndex(i => i.id === productId);
    if (itemIndex === -1) return;
    
    const item = savedItems[itemIndex];
    
    // Remove from saved
    savedItems.splice(itemIndex, 1);
    saveSavedItems();
    
    // Add to cart
    const existingIndex = cart.findIndex(i => i.id === productId);
    if (existingIndex !== -1) {
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + (item.quantity || 1);
    } else {
      cart.push(item);
    }
    saveCart();
    
    renderCart();
    renderSavedItems();
    updateOrderSummary();
    showMiniPopup();
  };

  // ========== Apply Coupon ==========
  window.applyCouponCode = function(code) {
    couponInput.value = code;
    applyCoupon();
  };

  function applyCoupon() {
    const code = couponInput.value.trim().toUpperCase();
    
    if (!code) {
      showCouponMessage('Please enter a coupon code', 'error');
      return;
    }
    
    const coupon = coupons.find(c => c.code === code);
    
    if (!coupon) {
      showCouponMessage('Invalid coupon code', 'error');
      return;
    }
    
    if (coupon.active === false) {
      showCouponMessage('This coupon is no longer active', 'error');
      return;
    }
    
    // Check expiry
    if (coupon.validTo && new Date(coupon.validTo) < new Date()) {
      showCouponMessage('This coupon has expired', 'error');
      return;
    }
    
    // Check min order
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    if (subtotal < (coupon.minOrder || 0)) {
      showCouponMessage(`Minimum order of ₹${coupon.minOrder} required`, 'error');
      return;
    }
    
    appliedCoupon = coupon;
    localStorage.setItem('okmart_applied_coupon', JSON.stringify(appliedCoupon));
    showCouponMessage(`Coupon applied! ${coupon.type === 'flat' ? `₹${coupon.discount} OFF` : `${coupon.discount}% OFF`}`, 'success');
    updateOrderSummary();
  }

  function showCouponMessage(message, type) {
    couponMessage.textContent = message;
    couponMessage.className = `coupon-message ${type}`;
    setTimeout(() => {
      couponMessage.textContent = '';
      couponMessage.className = 'coupon-message';
    }, 3000);
  }

  // ========== Calculate Discount ==========
  function calculateDiscount(subtotal) {
    if (!appliedCoupon) return 0;
    
    let discount = 0;
    if (appliedCoupon.type === 'flat') {
      discount = appliedCoupon.discount;
    } else {
      discount = (subtotal * appliedCoupon.discount) / 100;
      if (appliedCoupon.maxDiscount) {
        discount = Math.min(discount, appliedCoupon.maxDiscount);
      }
    }
    
    return Math.min(discount, subtotal);
  }

  // ========== Update Order Summary ==========
  function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const discount = calculateDiscount(subtotal);
    const afterDiscount = subtotal - discount;
    
    // Delivery charge logic
    let delivery = BASE_DELIVERY_CHARGE;
    if (afterDiscount >= FREE_DELIVERY_THRESHOLD) {
      delivery = 0;
    }
    
    const total = afterDiscount + delivery;
    
    // Update UI
    subtotalEl.textContent = `₹${subtotal}`;
    
    if (discount > 0) {
      discountRow.style.display = 'flex';
      discountAmountEl.textContent = `-₹${discount}`;
    } else {
      discountRow.style.display = 'none';
    }
    
    deliveryChargeEl.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
    totalAmountEl.textContent = `₹${total}`;
    
    // Update free delivery progress
    const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - afterDiscount);
    const percent = Math.min(100, (afterDiscount / FREE_DELIVERY_THRESHOLD) * 100);
    
    progressFill.style.width = `${percent}%`;
    if (remaining <= 0) {
      progressLabel.innerHTML = '🎉 Free delivery unlocked! 🎉';
    } else {
      progressLabel.innerHTML = `Add ₹${remaining} more for FREE delivery 🎁`;
    }
  }

  // ========== Clear Cart ==========
  function clearCart() {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      cart = [];
      saveCart();
      appliedCoupon = null;
      localStorage.removeItem('okmart_applied_coupon');
      renderCart();
      updateOrderSummary();
      showMiniPopup();
      
      if (cart.length === 0 && savedItems.length === 0) {
        showEmptyCart();
      }
    }
  }

  // ========== Proceed to Checkout ==========
  function proceedToCheckout() {
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    
    // Save applied coupon for checkout
    if (appliedCoupon) {
      localStorage.setItem('okmart_applied_coupon', JSON.stringify(appliedCoupon));
    }
    
    window.location.href = '/checkout.html';
  }

  // ========== Show Empty Cart ==========
  function showEmptyCart() {
    cartContent.style.display = 'none';
    emptyCart.style.display = 'block';
  }

  // ========== Render Related Products ==========
  async function renderRelatedProducts() {
    if (!relatedProductsGrid) return;
    
    // Get product IDs from cart
    const cartProductIds = cart.map(item => item.id);
    
    // Get trending products not in cart
    const trending = allProducts
      .filter(p => p.active !== false && !cartProductIds.includes(p.id) && (p.popular === true || (p.salesCount || 0) > 5))
      .slice(0, 6);
    
    if (trending.length === 0) {
      document.getElementById('relatedSection').style.display = 'none';
      return;
    }
    
    document.getElementById('relatedSection').style.display = 'block';
    relatedProductsGrid.innerHTML = trending.map(product => `
      <div class="related-product-card" onclick="window.location.href='/product.html?id=${product.id}'">
        <img src="${product.image}" class="related-product-image" onerror="this.src='https://via.placeholder.com/110'">
        <div class="related-product-name">${escapeHtml(product.name)}</div>
        <div class="related-product-price">₹${product.price}</div>
      </div>
    `).join('');
  }

  // ========== Render Trending Products (Empty Cart) ==========
  async function renderTrendingProducts() {
    if (!trendingGridEmpty) return;
    
    const trending = allProducts
      .filter(p => p.active !== false && (p.popular === true || (p.salesCount || 0) > 5))
      .slice(0, 6);
    
    if (trending.length === 0) {
      trendingGridEmpty.innerHTML = '<div style="text-align:center;color:#6b7280;">No products available</div>';
      return;
    }
    
    trendingGridEmpty.innerHTML = trending.map(product => `
      <div class="related-product-card" onclick="window.location.href='/product.html?id=${product.id}'">
        <img src="${product.image}" class="related-product-image" onerror="this.src='https://via.placeholder.com/110'">
        <div class="related-product-name">${escapeHtml(product.name)}</div>
        <div class="related-product-price">₹${product.price}</div>
      </div>
    `).join('');
  }

  // ========== Helper Functions ==========
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  function showMiniPopup() {
    const popup = document.getElementById('miniOrderPopup');
    if (!popup) return;
    
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 2000);
  }

  function showToast(message, type) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ========== Event Listeners ==========
  function initEventListeners() {
    if (applyCouponBtn) applyCouponBtn.addEventListener('click', applyCoupon);
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', proceedToCheckout);
    if (viewSavedBtn) viewSavedBtn.addEventListener('click', () => {
      window.location.href = '/saved-items.html';
    });
    
    if (couponInput) {
      couponInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyCoupon();
      });
    }
    
    // Listen for cart updates from other tabs/pages
    window.addEventListener('storage', (e) => {
      if (e.key === 'okmart_cart') {
        loadCart();
        renderCart();
        updateOrderSummary();
      }
      if (e.key === 'okmart_saved_for_later') {
        loadSavedItems();
        renderSavedItems();
      }
    });
  }

  // ========== Expose Global Functions ==========
  window.updateQuantity = updateQuantity;
  window.removeFromCart = removeFromCart;
  window.saveForLater = saveForLater;
  window.moveToCart = moveToCart;
  window.applyCouponCode = applyCouponCode;

  // ========== Initialize ==========
  function init() {
    initEventListeners();
    loadData();
    console.log('✅ Cart page initialized');
  }
  
  init();
})();

