// ===== OK MART - CART.JS =====
// Complete cart functionality with quantity updates and pricing

(function() {
  'use strict';
  
  // ---------- CONSTANTS ----------
  const FREE_DELIVERY_THRESHOLD = 300;
  const DELIVERY_CHARGE = 20;
  
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
  const cartBadges = document.querySelectorAll('.cart-badge');
  
  // ---------- HELPER FUNCTIONS ----------
  
  // Load cart from localStorage
  function loadCart() {
    const stored = localStorage.getItem('okmart_cart');
    cartItems = stored ? JSON.parse(stored) : [];
    return cartItems;
  }
  
  // Save cart to localStorage
  function saveCart() {
    localStorage.setItem('okmart_cart', JSON.stringify(cartItems));
    updateCartBadges();
  }
  
  // Update all cart badges
  function updateCartBadges() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartBadges.forEach(badge => {
      if (badge) badge.textContent = totalItems;
    });
  }
  
  // Calculate cart totals
  function calculateTotals() {
    let mrpTotal = 0;
    let sellingTotal = 0;
    let totalItems = 0;
    
    cartItems.forEach(item => {
      mrpTotal += (item.mrp || item.price) * item.quantity;
      sellingTotal += item.price * item.quantity;
      totalItems += item.quantity;
    });
    
    const discount = mrpTotal - sellingTotal;
    const subtotal = sellingTotal;
    const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
    const finalTotal = subtotal + deliveryCharge;
    
    return {
      mrpTotal,
      sellingTotal,
      discount,
      subtotal,
      deliveryCharge,
      finalTotal,
      totalItems
    };
  }
  
  // Update all UI elements with current totals
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
      discountAmountEl.textContent = `-₹${totals.discount}`;
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
      if (totals.discount > 0) {
        savingsMessage.textContent = `🎉 You're saving ₹${totals.discount} on this order!`;
        savingsMessage.style.display = 'block';
      } else {
        savingsMessage.style.display = 'none';
      }
    }
    
    // Update free delivery banner
    updateFreeDeliveryBanner(totals);
    
    // Enable/disable place order button
    if (placeOrderBtn) {
      placeOrderBtn.disabled = cartItems.length === 0;
    }
  }
  
  // Update free delivery banner
  function updateFreeDeliveryBanner(totals) {
    if (!freeDeliveryBanner) return;
    
    const bannerText = freeDeliveryBanner.querySelector('.banner-text');
    
    if (totals.deliveryCharge === 0) {
      freeDeliveryBanner.style.background = 'linear-gradient(135deg, #d4fcdf 0%, #e8f5e9 100%)';
      bannerText.textContent = '🎉 Yay! You get FREE delivery on this order! 🎉';
    } else {
      const remaining = FREE_DELIVERY_THRESHOLD - totals.subtotal;
      freeDeliveryBanner.style.background = 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)';
      bannerText.textContent = `Add ₹${remaining} more for FREE delivery!`;
    }
  }
  
  // Show/hide empty state
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
  
  // Render a single cart item
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
    
    // Add event listeners
    const minusBtn = card.querySelector('.minus-btn');
    const plusBtn = card.querySelector('.plus-btn');
    const removeBtn = card.querySelector('.remove-btn');
    
    minusBtn.addEventListener('click', () => updateQuantity(item.id, -1));
    plusBtn.addEventListener('click', () => updateQuantity(item.id, 1));
    removeBtn.addEventListener('click', () => removeItem(item.id));
    
    return card;
  }
  
  // Render all cart items
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
  
  // Update item quantity
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
  
  // Remove item from cart
  function removeItem(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    
    // Show feedback (optional)
    console.log(`Item ${productId} removed from cart`);
  }
  
  // Clear entire cart
  function clearCart() {
    cartItems = [];
    saveCart();
    renderCart();
  }
  
  // Handle place order
  function handlePlaceOrder() {
    if (cartItems.length === 0) return;
    
    // Save cart summary to session storage for checkout
    const totals = calculateTotals();
    const orderSummary = {
      items: cartItems,
      totals: totals,
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('okmart_order_summary', JSON.stringify(orderSummary));
    
    // Navigate to checkout
    window.location.href = 'checkout.html';
  }
  
  // ---------- EVENT LISTENERS ----------
  
  // Place order button
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', handlePlaceOrder);
  }
  
  // Listen for cart updates from other pages
  window.addEventListener('okmart:cart-updated', () => {
    renderCart();
  });
  
  // Listen for storage changes (if cart updated in another tab)
  window.addEventListener('storage', (e) => {
    if (e.key === 'okmart_cart') {
      renderCart();
    }
  });
  
  // ---------- INITIALIZATION ----------
  function init() {
    renderCart();
    
    // Expose functions for debugging
    window.OKMartCart = {
      render: renderCart,
      clear: clearCart,
      getItems: () => cartItems,
      getTotals: calculateTotals
    };
  }
  
  init();
  
})();
