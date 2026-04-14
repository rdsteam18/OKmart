// ===== OK MART - CART.JS =====
// Complete cart functionality with quantity updates, pricing, and offers

(function() {
  'use strict';
  
  // ---------- OFFER RULES ----------
  const OFFER_RULES = {
    FREE_DELIVERY_THRESHOLD: 199,  // Changed to ₹199
    DELIVERY_CHARGE: 20,
    COUPON_CODE: 'SAVE20',
    COUPON_MIN_ORDER: 250,
    COUPON_DISCOUNT: 20
  };
  
  // ---------- STATE ----------
  let cartItems = [];
  
  // DOM Elements
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const emptyCartState = document.getElementById('emptyCartState');
  const cartSummaryHeader = document.getElementById('cartSummaryHeader');
  const freeDeliveryBanner = document.getElementById('freeDeliveryBanner');
  const priceSummarySection = document.getElementById('priceSummarySection');
  const stickyCheckoutBar = document.getElementById('stickyCheckoutBar');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  
  // Summary elements
  const itemCountBadge = document.getElementById('itemCountBadge');
  const headerTotalAmount = document.getElementById('headerTotalAmount');
  const mrpTotalEl = document.getElementById('mrpTotal');
  const discountAmountEl = document.getElementById('discountAmount');
  const deliveryChargeEl = document.getElementById('deliveryCharge');
  const finalTotalEl = document.getElementById('finalTotal');
  const stickyTotalAmount = document.getElementById('stickyTotalAmount');
  const savingsMessage = document.getElementById('savingsMessage');
  
  // ---------- CART FUNCTIONS ----------
  function loadCart() {
    const stored = localStorage.getItem('okmart_cart');
    cartItems = stored ? JSON.parse(stored) : [];
    return cartItems;
  }
  
  function saveCart() {
    localStorage.setItem('okmart_cart', JSON.stringify(cartItems));
    updateCartBadges();
    
    if (window.OKMart && window.OKMart.updateStickyCartBar) {
      window.OKMart.updateStickyCartBar();
    }
  }
  
  function updateCartBadges() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge, #cartCountPlaceholder');
    badges.forEach(badge => {
      if (badge) badge.textContent = totalItems;
    });
  }
  
  // ---------- CALCULATE TOTALS WITH OFFERS ----------
  function calculateTotals() {
    let mrpTotal = 0;
    let sellingTotal = 0;
    let totalItems = 0;
    
    cartItems.forEach(item => {
      mrpTotal += (item.mrp || item.price) * item.quantity;
      sellingTotal += item.price * item.quantity;
      totalItems += item.quantity;
    });
    
    const itemDiscount = mrpTotal - sellingTotal;
    const subtotal = sellingTotal;
    
    // Delivery charge: FREE on orders above ₹199, else ₹20
    const deliveryCharge = subtotal >= OFFER_RULES.FREE_DELIVERY_THRESHOLD ? 0 : OFFER_RULES.DELIVERY_CHARGE;
    const finalTotal = subtotal + deliveryCharge;
    
    return {
      mrpTotal,
      sellingTotal,
      itemDiscount,
      totalDiscount: itemDiscount,
      subtotal,
      deliveryCharge,
      finalTotal,
      totalItems,
      hasFreeDelivery: deliveryCharge === 0
    };
  }
  
  // ---------- UI UPDATES ----------
  function updateUI() {
    const totals = calculateTotals();
    
    // Update item count
    if (itemCountBadge) {
      itemCountBadge.textContent = `${totals.totalItems} item${totals.totalItems !== 1 ? 's' : ''}`;
    }
    
    // Update header total
    if (headerTotalAmount) {
      headerTotalAmount.textContent = `₹${totals.finalTotal}`;
    }
    
    // Update price summary
    if (mrpTotalEl) {
      mrpTotalEl.textContent = `₹${totals.mrpTotal}`;
    }
    
    if (discountAmountEl) {
      discountAmountEl.textContent = `-₹${totals.totalDiscount}`;
    }
    
    if (deliveryChargeEl) {
      if (totals.deliveryCharge === 0) {
        deliveryChargeEl.textContent = 'FREE';
        deliveryChargeEl.style.color = '#10b981';
      } else {
        deliveryChargeEl.textContent = `₹${totals.deliveryCharge}`;
        deliveryChargeEl.style.color = '';
      }
    }
    
    if (finalTotalEl) {
      finalTotalEl.textContent = `₹${totals.finalTotal}`;
    }
    
    if (stickyTotalAmount) {
      stickyTotalAmount.textContent = `₹${totals.finalTotal}`;
    }
    
    // Update savings message
    if (savingsMessage) {
      if (totals.totalDiscount > 0) {
        savingsMessage.textContent = `🎉 You're saving ₹${totals.totalDiscount} on this order!`;
        savingsMessage.style.display = 'block';
      } else {
        savingsMessage.style.display = 'none';
      }
    }
    
    // Update free delivery banner
    updateFreeDeliveryBanner(totals);
    
    // Update offer tag
    updateOfferTag(totals);
    
    // Enable/disable place order button
    if (placeOrderBtn) {
      placeOrderBtn.disabled = cartItems.length === 0;
    }
  }
  
  // THIS IS WHERE THE FUNCTION GOES - Inside cart.js, before it's called
  function updateFreeDeliveryBanner(totals) {
    if (!freeDeliveryBanner) return;
    
    const bannerText = freeDeliveryBanner.querySelector('.banner-text');
    
    let message = '';
    let bgGradient = '';
    
    if (totals.hasFreeDelivery) {
      message = '🎉 FREE delivery applied! (Orders above ₹199)';
      bgGradient = 'linear-gradient(135deg, #d4fcdf 0%, #e8f5e9 100%)';
    } else {
      const remaining = OFFER_RULES.FREE_DELIVERY_THRESHOLD - totals.subtotal;
      message = `Add ₹${remaining} more for FREE delivery!`;
      bgGradient = 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)';
    }
    
    freeDeliveryBanner.style.background = bgGradient;
    bannerText.textContent = message;
  }
  
  function updateOfferTag(totals) {
    const summarySection = document.querySelector('.price-summary-section');
    if (!summarySection) return;
    
    let offerTag = document.querySelector('.offer-tag');
    if (!offerTag) {
      offerTag = document.createElement('div');
      offerTag.className = 'offer-tag';
      offerTag.style.cssText = `
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 40px;
        font-weight: 600;
        font-size: 0.85rem;
        margin-bottom: 16px;
        text-align: center;
      `;
      summarySection.insertBefore(offerTag, summarySection.firstChild);
    }
    
    if (!totals.hasFreeDelivery) {
      const remaining = OFFER_RULES.FREE_DELIVERY_THRESHOLD - totals.subtotal;
      offerTag.innerHTML = `🚚 Add ₹${remaining} for FREE delivery!`;
      offerTag.style.display = 'block';
      offerTag.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else if (totals.subtotal >= OFFER_RULES.COUPON_MIN_ORDER) {
      offerTag.innerHTML = `🏷️ Use code ${OFFER_RULES.COUPON_CODE} for ₹${OFFER_RULES.COUPON_DISCOUNT} OFF!`;
      offerTag.style.display = 'block';
      offerTag.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else if (totals.subtotal < OFFER_RULES.COUPON_MIN_ORDER && totals.subtotal >= OFFER_RULES.FREE_DELIVERY_THRESHOLD) {
      const remainingForCoupon = OFFER_RULES.COUPON_MIN_ORDER - totals.subtotal;
      offerTag.innerHTML = `🏷️ Add ₹${remainingForCoupon} more to get ₹20 OFF!`;
      offerTag.style.display = 'block';
      offerTag.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else {
      offerTag.style.display = 'none';
    }
  }
  
  function toggleEmptyState() {
    const isEmpty = cartItems.length === 0;
    
    if (cartItemsContainer) {
      cartItemsContainer.style.display = isEmpty ? 'none' : 'block';
    }
    
    if (emptyCartState) {
      emptyCartState.style.display = isEmpty ? 'block' : 'none';
    }
    
    if (cartSummaryHeader) {
      cartSummaryHeader.style.display = isEmpty ? 'none' : 'flex';
    }
    
    if (priceSummarySection) {
      priceSummarySection.style.display = isEmpty ? 'none' : 'block';
    }
    
    if (stickyCheckoutBar) {
      stickyCheckoutBar.style.display = isEmpty ? 'none' : 'block';
    }
    
    if (freeDeliveryBanner) {
      freeDeliveryBanner.style.display = isEmpty ? 'none' : 'block';
    }
  }
  
  // ---------- RENDER CART ITEMS ----------
  function renderCartItem(item) {
    const discount = item.mrp ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
    const itemTotal = item.price * item.quantity;
    
    const card = document.createElement('div');
    card.className = 'cart-item-card';
    card.dataset.productId = item.id;
    
    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-image" loading="lazy">
      
      <div class="cart-item-details">
        <div class="cart-item-header">
          <div>
            <h3 class="cart-item-name">${item.name}</h3>
            <span class="cart-item-unit">${item.unit || ''}</span>
          </div>
        </div>
        
        <div class="cart-item-pricing">
          <span class="current-price">₹${item.price}</span>
          ${item.mrp && item.mrp > item.price ? `<span class="mrp-price">₹${item.mrp}</span>` : ''}
          ${discount > 0 ? `<span class="discount-percent">${discount}% OFF</span>` : ''}
        </div>
        
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="quantity-btn minus-btn" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
            <span class="quantity-number">${item.quantity}</span>
            <button class="quantity-btn plus-btn" data-id="${item.id}">+</button>
          </div>
          <button class="remove-btn" data-id="${item.id}">Remove</button>
        </div>
      </div>
      
      <div class="item-total">₹${itemTotal}</div>
    `;
    
    const minusBtn = card.querySelector('.minus-btn');
    const plusBtn = card.querySelector('.plus-btn');
    const removeBtn = card.querySelector('.remove-btn');
    
    minusBtn.addEventListener('click', () => updateQuantity(item.id, -1));
    plusBtn.addEventListener('click', () => updateQuantity(item.id, 1));
    removeBtn.addEventListener('click', () => removeItem(item.id));
    
    return card;
  }
  
  function renderCart() {
    loadCart();
    
    if (cartItemsContainer) {
      cartItemsContainer.innerHTML = '';
      
      cartItems.forEach(item => {
        cartItemsContainer.appendChild(renderCartItem(item));
      });
    }
    
    toggleEmptyState();
    updateUI();
    updateCartBadges();
  }
  
  // ---------- CART ACTIONS ----------
  function updateQuantity(productId, change) {
    const item = cartItems.find(item => item.id === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      item.quantity = newQuantity;
      saveCart();
      renderCart();
    }
  }
  
  function removeItem(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    saveCart();
    renderCart();
  }
  
  function clearCart() {
    cartItems = [];
    saveCart();
    renderCart();
  }
  
  function handlePlaceOrder() {
    if (cartItems.length === 0) return;
    
    const totals = calculateTotals();
    const orderSummary = {
      items: cartItems,
      totals: totals,
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('okmart_order_summary', JSON.stringify(orderSummary));
    window.location.href = '/checkout.html';
  }
  
  // ---------- EVENT LISTENERS ----------
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', handlePlaceOrder);
  }
  
  window.addEventListener('okmart:cart-updated', () => {
    renderCart();
  });
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'okmart_cart') {
      renderCart();
    }
  });
  
  // ---------- INITIALIZATION ----------
  function init() {
    renderCart();
    
    window.OKMartCart = {
      render: renderCart,
      clear: clearCart,
      getItems: () => cartItems,
      getTotals: calculateTotals,
      getOfferRules: () => OFFER_RULES
    };
    
    console.log('✅ Cart initialized | Free delivery above ₹199');
  }
  
  init();
  
})();
