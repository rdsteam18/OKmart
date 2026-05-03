// ===== OK MART - ADVANCED CART PAGE =====

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
  const savedCount = document.getElementById('savedCount');
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
  let deliveryCharge = 0;
  let pincode = null;
  const FREE_DELIVERY_THRESHOLD = 199;
  const BASE_DELIVERY_CHARGE = 39;

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
      
      // Load pincode
      loadPincode();
      
      loadingState.style.display = 'none';
      
      if (cart.length === 0) {
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
      if (coupons.length > 0) {
        availableCoupons.style.display = 'block';
        couponChips.innerHTML = coupons.slice(0, 3).map(c => `
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
      cart = JSON.parse(savedCart);
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
      savedItems = JSON.parse(saved);
    } else {
      savedItems = [];
    }
  }

  // ========== Save Saved Items ==========
  function saveSavedItems() {
    localStorage.setItem('okmart_saved_for_later', JSON.stringify(savedItems));
  }

  // ========== Load Pincode ==========
  function loadPincode() {
    pincode = localStorage.getItem('okmart_pincode');
    if (!pincode) {
      // Default delivery charge
      deliveryCharge = BASE_DELIVERY_CHARGE;
    }
  }

  // ========== Update Cart Badge ==========
  function updateCartBadge() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count, .cart-badge').forEach(el => {
      if (el) el.textContent = total;
    });
  }

  // ========== Render Cart Items ==========
  function renderCart() {
    if (!cartItemsList) return;
    
    if (cart.length === 0) {
      showEmptyCart();
      return;
    }
    
    cartContent.style.display = 'block';
    emptyCart.style.display = 'none';
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartItemCount.textContent = totalItems;
    
    cartItemsList.innerHTML = cart.map((item, index) => {
      const product = allProducts.find(p => p.id === item.id) || item;
      const itemTotal = product.price * item.quantity;
      
      return `
        <div class="cart-item" data-index="${index}">
          <img src="${product.image}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80'">
          <div class="cart-item-details">
            <div class="cart-item-name">${escapeHtml(product.name)}</div>
            <div class="cart-item-unit">${product.unit || ''}</div>
            <div class="cart-item-price">₹${product.price}</div>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-control">
              <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
            <button class="save-for-later-btn" onclick="saveForLater('${item.id}')">📦 Save for Later</button>
            <button class="remove-item-btn" onclick="removeFromCart('${item.id}')">🗑️ Remove</button>
          </div>
        </div>
      `;
    }).join('');
    
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
    savedCount.textContent = savedItems.length;
    
    savedItemsList.innerHTML = savedItems.map(item => {
      const product = allProducts.find(p => p.id === item.id) || item;
      return `
        <div class="saved-item">
          <img src="${product.image}" class="saved-item-image" onerror="this.src='https://via.placeholder.com/60'">
          <div class="saved-item-details">
            <div class="saved-item-name">${escapeHtml(product.name)}</div>
            <div class="saved-item-price">₹${product.price}</div>
          </div>
          <button class="move-to-cart-btn" onclick="moveToCart('${item.id}')">Move to Cart</button>
        </div>
      `;
    }).join('');
  }

  // ========== Update Quantity ==========
  window.updateQuantity = function(productId, delta) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;
    
    const newQuantity = cart[itemIndex].quantity + delta;
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    cart[itemIndex].quantity = newQuantity;
    saveCart();
    renderCart();
    updateOrderSummary();
    showMiniPopup('Cart updated!');
  };

  // ========== Remove from Cart ==========
  window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    updateOrderSummary();
    showMiniPopup('Item removed');
    
    if (cart.length === 0) {
      showEmptyCart();
    }
  };

  // ========== Save for Later ==========
  window.saveForLater = function(productId) {
    const item = cart.find(i => i.id === productId);
    if (item) {
      // Remove from cart
      cart = cart.filter(i => i.id !== productId);
      saveCart();
      
      // Add to saved
      if (!savedItems.find(i => i.id === productId)) {
        savedItems.push(item);
        saveSavedItems();
      }
      
      renderCart();
      renderSavedItems();
      updateOrderSummary();
      showMiniPopup('Saved for later');
      
      if (cart.length === 0) {
        showEmptyCart();
      }
    }
  };

  // ========== Move to Cart ==========
  window.moveToCart = function(productId) {
    const item = savedItems.find(i => i.id === productId);
    if (item) {
      // Remove from saved
      savedItems = savedItems.filter(i => i.id !== productId);
      saveSavedItems();
      
      // Add to cart
      const existing = cart.find(i => i.id === productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        cart.push(item);
      }
      saveCart();
      
      renderCart();
      renderSavedItems();
      updateOrderSummary();
      showMiniPopup('Moved to cart');
    }
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
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (subtotal < (coupon.minOrder || 0)) {
      showCouponMessage(`Minimum order of ₹${coupon.minOrder} required`, 'error');
      return;
    }
    
    appliedCoupon = coupon;
    showCouponMessage(`Coupon applied! ${coupon.type === 'flat' ? `₹${coupon.discount} OFF` : `${coupon.discount}% OFF`}`, 'success');
    updateOrderSummary();
  }

  function removeCoupon() {
    appliedCoupon = null;
    couponInput.value = '';
    showCouponMessage('Coupon removed', 'success');
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
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = calculateDiscount(subtotal);
    const finalSubtotal = subtotal - discount;
    
    // Delivery charge logic
    let delivery = BASE_DELIVERY_CHARGE;
    if (finalSubtotal >= FREE_DELIVERY_THRESHOLD) {
      delivery = 0;
    }
    deliveryCharge = delivery;
    
    const total = finalSubtotal + deliveryCharge;
    
    // Update UI
    subtotalEl.textContent = `₹${subtotal}`;
    
    if (discount > 0) {
      discountRow.style.display = 'flex';
      discountAmountEl.textContent = `-₹${discount}`;
    } else {
      discountRow.style.display = 'none';
    }
    
    deliveryChargeEl.textContent = deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`;
    totalAmountEl.textContent = `₹${total}`;
    
    // Update free delivery progress
    const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - finalSubtotal);
    const percent = Math.min(100, (finalSubtotal / FREE_DELIVERY_THRESHOLD) * 100);
    
    progressFill.style.width = `${percent}%`;
    if (remaining <= 0) {
      progressLabel.innerHTML = '🎉 Free delivery unlocked! 🎉';
    } else {
      progressLabel.innerHTML = `Add ₹${remaining} more to get FREE delivery 🎁`;
    }
  }

  // ========== Clear Cart ==========
  function clearCart() {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      cart = [];
      saveCart();
      renderCart();
      updateOrderSummary();
      showMiniPopup('Cart cleared');
      showEmptyCart();
    }
  }

  // ========== Proceed to Checkout ==========
  function proceedToCheckout() {
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    
    // Save applied coupon to localStorage for checkout
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
      .filter(p => p.active !== false && !cartProductIds.includes(p.id))
      .slice(0, 6);
    
    if (trending.length === 0) {
      document.getElementById('relatedSection').style.display = 'none';
      return;
    }
    
    document.getElementById('relatedSection').style.display = 'block';
    relatedProductsGrid.innerHTML = trending.map(product => `
      <div class="related-product-card" onclick="window.location.href='/product.html?id=${product.id}'">
        <img src="${product.image}" class="related-product-image" onerror="this.src='https://via.placeholder.com/120'">
        <div class="related-product-name">${product.name}</div>
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
    
    trendingGridEmpty.innerHTML = trending.map(product => `
      <div class="related-product-card" onclick="window.location.href='/product.html?id=${product.id}'">
        <img src="${product.image}" class="related-product-image" onerror="this.src='https://via.placeholder.com/120'">
        <div class="related-product-name">${product.name}</div>
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

  function showMiniPopup(message) {
    const popup = document.getElementById('miniOrderPopup');
    if (!popup) return;
    
    const textEl = popup.querySelector('.popup-text');
    if (textEl) textEl.textContent = message;
    
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
    applyCouponBtn?.addEventListener('click', applyCoupon);
    clearCartBtn?.addEventListener('click', clearCart);
    checkoutBtn?.addEventListener('click', proceedToCheckout);
    viewSavedBtn?.addEventListener('click', () => {
      window.location.href = '/saved-items.html';
    });
    
    couponInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyCoupon();
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
