// ===== OK MART - CHECKOUT.JS =====
// Checkout with validation, pincode check, WhatsApp order, coupon system, and order tracking

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const WHATSAPP_NUMBER = '9982239821'; // Your WhatsApp number
  const FREE_DELIVERY_THRESHOLD = 199;  // Changed to ₹199
  const DELIVERY_CHARGE = 20;
  
  // Coupon configuration
  const COUPON_CODE = 'SAVE20';
  const COUPON_DISCOUNT = 20;
  const COUPON_MIN_ORDER = 250;
  
  // Allowed pincodes for delivery
  const ALLOWED_PINCODES = ['380026', '382418', '380058', '110001', '400001', '560001'];
  
  // ---------- STATE ----------
  let cartItems = [];
  let cartTotals = null;
  let isPincodeValid = false;
  let couponApplied = false;
  let couponDiscount = 0;
  
  // DOM Elements
  const orderItemsList = document.getElementById('orderItemsList');
  const orderItemsCollapsible = document.getElementById('orderItemsCollapsible');
  const viewItemsToggle = document.getElementById('viewItemsToggle');
  const checkoutSubtotal = document.getElementById('checkoutSubtotal');
  const checkoutDelivery = document.getElementById('checkoutDelivery');
  const checkoutTotal = document.getElementById('checkoutTotal');
  const stickyCheckoutTotal = document.getElementById('stickyCheckoutTotal');
  
  const checkoutForm = document.getElementById('checkoutForm');
  const customerName = document.getElementById('customerName');
  const customerPhone = document.getElementById('customerPhone');
  const customerAddress = document.getElementById('customerAddress');
  const customerPincode = document.getElementById('customerPincode');
  const deliverySlot = document.getElementById('deliverySlot');
  const specialInstructions = document.getElementById('specialInstructions');
  
  const nameError = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');
  const addressError = document.getElementById('addressError');
  const pincodeError = document.getElementById('pincodeError');
  const pincodeStatus = document.getElementById('pincodeStatus');
  
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  
  // Coupon elements
  const couponSection = document.getElementById('couponSection');
  const couponInput = document.getElementById('couponInput');
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const couponMessage = document.getElementById('couponMessage');
  const appliedCouponDisplay = document.getElementById('appliedCouponDisplay');
  const removeCouponBtn = document.getElementById('removeCouponBtn');
  const couponDiscountRow = document.getElementById('couponDiscountRow');
  const couponDiscountAmount = document.getElementById('couponDiscountAmount');
  
  // ---------- CART FUNCTIONS ----------
  
  function loadCart() {
    const stored = localStorage.getItem('okmart_cart');
    cartItems = stored ? JSON.parse(stored) : [];
    
    if (cartItems.length === 0) {
      window.location.href = '/index.html';
      return;
    }
    
    calculateTotals();
    return cartItems;
  }
  
  function calculateTotals() {
    let mrpTotal = 0;
    let sellingTotal = 0;
    
    cartItems.forEach(item => {
      mrpTotal += (item.mrp || item.price) * item.quantity;
      sellingTotal += item.price * item.quantity;
    });
    
    const itemDiscount = mrpTotal - sellingTotal;
    const subtotal = sellingTotal;
    
    // Apply coupon discount if valid
    let appliedCouponDiscount = 0;
    if (couponApplied && subtotal >= COUPON_MIN_ORDER) {
      appliedCouponDiscount = COUPON_DISCOUNT;
    }
    
    const subtotalAfterCoupon = subtotal - appliedCouponDiscount;
    
    // Delivery charge: FREE on orders above ₹199, else ₹20
    const deliveryCharge = subtotalAfterCoupon >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
    const finalTotal = Math.max(0, subtotalAfterCoupon + deliveryCharge);
    
    cartTotals = {
      mrpTotal,
      sellingTotal,
      itemDiscount,
      couponDiscount: appliedCouponDiscount,
      totalDiscount: itemDiscount + appliedCouponDiscount,
      subtotal,
      subtotalAfterCoupon,
      deliveryCharge,
      finalTotal,
      hasFreeDelivery: deliveryCharge === 0,
      couponApplied: appliedCouponDiscount > 0
    };
    
    return cartTotals;
  }
  
  function renderOrderSummary() {
    if (orderItemsList) {
      orderItemsList.innerHTML = '';
      
      cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        const itemEl = document.createElement('div');
        itemEl.className = 'order-item-compact';
        itemEl.innerHTML = `
          <img src="${item.image}" alt="${item.name}" class="order-item-image" loading="lazy">
          <div class="order-item-details">
            <div>
              <div class="order-item-name">${item.name}</div>
              <span class="order-item-quantity">Qty: ${item.quantity}</span>
            </div>
            <span class="order-item-price">₹${itemTotal}</span>
          </div>
        `;
        orderItemsList.appendChild(itemEl);
      });
    }
    
    updateTotalsDisplay();
  }
  
  function updateTotalsDisplay() {
    if (checkoutSubtotal) {
      checkoutSubtotal.textContent = `₹${cartTotals.subtotal}`;
    }
    
    // Show/hide coupon discount row
    if (couponDiscountRow) {
      if (cartTotals.couponDiscount > 0) {
        couponDiscountRow.style.display = 'flex';
        if (couponDiscountAmount) {
          couponDiscountAmount.textContent = `-₹${cartTotals.couponDiscount}`;
        }
      } else {
        couponDiscountRow.style.display = 'none';
      }
    }
    
    if (checkoutDelivery) {
      if (cartTotals.deliveryCharge === 0) {
        checkoutDelivery.textContent = 'FREE';
        checkoutDelivery.style.color = '#10b981';
      } else {
        checkoutDelivery.textContent = `₹${cartTotals.deliveryCharge}`;
        checkoutDelivery.style.color = '';
      }
    }
    
    if (checkoutTotal) {
      checkoutTotal.textContent = `₹${cartTotals.finalTotal}`;
    }
    
    if (stickyCheckoutTotal) {
      stickyCheckoutTotal.textContent = `₹${cartTotals.finalTotal}`;
    }
    
    // Update delivery message
    updateDeliveryMessage();
  }
  
  function updateDeliveryMessage() {
    const deliveryMessageEl = document.querySelector('.delivery-offer-message');
    if (deliveryMessageEl) {
      if (cartTotals.hasFreeDelivery) {
        deliveryMessageEl.innerHTML = '🎉 FREE Delivery Applied!';
        deliveryMessageEl.style.color = '#10b981';
      } else {
        const remaining = FREE_DELIVERY_THRESHOLD - cartTotals.subtotalAfterCoupon;
        deliveryMessageEl.innerHTML = `🚚 Add ₹${remaining} more for FREE delivery!`;
        deliveryMessageEl.style.color = '#f59e0b';
      }
    }
  }
  
  function setupItemsToggle() {
    if (viewItemsToggle && orderItemsCollapsible) {
      let isVisible = true;
      
      viewItemsToggle.addEventListener('click', () => {
        isVisible = !isVisible;
        orderItemsCollapsible.style.display = isVisible ? 'block' : 'none';
        viewItemsToggle.textContent = isVisible ? 'View Items ▼' : 'View Items ▶';
      });
    }
  }
  
  // ---------- COUPON FUNCTIONS ----------
  
  function applyCoupon() {
    const code = couponInput?.value.trim().toUpperCase();
    
    if (!code) {
      showCouponMessage('Please enter a coupon code', 'error');
      return;
    }
    
    if (code !== COUPON_CODE) {
      showCouponMessage('Invalid coupon code', 'error');
      return;
    }
    
    if (couponApplied) {
      showCouponMessage('Coupon already applied', 'error');
      return;
    }
    
    if (cartTotals.subtotal < COUPON_MIN_ORDER) {
      const remaining = COUPON_MIN_ORDER - cartTotals.subtotal;
      showCouponMessage(`Add ₹${remaining} more to apply this coupon`, 'error');
      return;
    }
    
    // Apply coupon
    couponApplied = true;
    calculateTotals();
    updateTotalsDisplay();
    
    // Show applied coupon display
    if (appliedCouponDisplay) {
      appliedCouponDisplay.style.display = 'flex';
      document.getElementById('appliedCouponCode').textContent = COUPON_CODE;
      document.getElementById('appliedCouponValue').textContent = `-₹${COUPON_DISCOUNT}`;
    }
    
    // Hide coupon input section
    if (couponSection) {
      couponSection.style.display = 'none';
    }
    
    showCouponMessage(`🎉 Coupon applied! You saved ₹${COUPON_DISCOUNT}!`, 'success');
    showToast(`₹${COUPON_DISCOUNT} off applied!`, 'success');
  }
  
  function removeCoupon() {
    couponApplied = false;
    calculateTotals();
    updateTotalsDisplay();
    
    // Hide applied coupon display
    if (appliedCouponDisplay) {
      appliedCouponDisplay.style.display = 'none';
    }
    
    // Show coupon input section
    if (couponSection) {
      couponSection.style.display = 'block';
    }
    
    if (couponInput) {
      couponInput.value = '';
    }
    
    showToast('Coupon removed', 'info');
  }
  
  function showCouponMessage(message, type) {
    if (couponMessage) {
      couponMessage.textContent = message;
      couponMessage.className = `coupon-message ${type}`;
      couponMessage.style.display = 'block';
      
      setTimeout(() => {
        couponMessage.style.display = 'none';
      }, 3000);
    }
  }
  
  function setupCouponListeners() {
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', applyCoupon);
    }
    
    if (couponInput) {
      couponInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          applyCoupon();
        }
      });
    }
    
    if (removeCouponBtn) {
      removeCouponBtn.addEventListener('click', removeCoupon);
    }
  }
  
  // ---------- USER DATA AUTO-FILL ----------
  
  function loadSavedUserData() {
    const savedUser = localStorage.getItem('okmart_user_data');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        
        if (customerName) customerName.value = userData.name || '';
        if (customerPhone) customerPhone.value = userData.phone || '';
        if (customerAddress) customerAddress.value = userData.address || '';
        if (customerPincode) {
          customerPincode.value = userData.pincode || '';
          validatePincode(userData.pincode);
        }
        if (deliverySlot) deliverySlot.value = userData.deliverySlot || 'morning';
        if (specialInstructions) specialInstructions.value = userData.instructions || '';
        
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    }
  }
  
  function saveUserData() {
    const userData = {
      name: customerName?.value || '',
      phone: customerPhone?.value || '',
      address: customerAddress?.value || '',
      pincode: customerPincode?.value || '',
      deliverySlot: deliverySlot?.value || 'morning',
      instructions: specialInstructions?.value || '',
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('okmart_user_data', JSON.stringify(userData));
  }
  
  // ---------- VALIDATION ----------
  
  function validatePincode(pincode) {
    const pincodeStr = pincode?.toString().trim() || '';
    const isValidFormat = /^[0-9]{6}$/.test(pincodeStr);
    const isAllowed = ALLOWED_PINCODES.includes(pincodeStr);
    
    isPincodeValid = isValidFormat && isAllowed;
    
    if (pincodeStatus) {
      if (pincodeStr.length === 0) {
        pincodeStatus.style.display = 'none';
        pincodeStatus.className = 'pincode-status';
      } else if (!isValidFormat) {
        pincodeStatus.textContent = '⚠️ Please enter a valid 6-digit pincode';
        pincodeStatus.className = 'pincode-status unavailable';
        pincodeStatus.style.display = 'block';
      } else if (isValidFormat && isAllowed) {
        pincodeStatus.textContent = '✅ Delivery available in your area!';
        pincodeStatus.className = 'pincode-status available';
        pincodeStatus.style.display = 'block';
        
        const existingSuggestion = pincodeStatus.querySelector('.suggestion');
        if (existingSuggestion) existingSuggestion.remove();
      } else if (isValidFormat && !isAllowed) {
        pincodeStatus.textContent = '❌ Sorry, delivery not available in your area';
        pincodeStatus.className = 'pincode-status unavailable';
        pincodeStatus.style.display = 'block';
        
        const existingSuggestion = pincodeStatus.querySelector('.suggestion');
        if (existingSuggestion) existingSuggestion.remove();
        
        const suggestionEl = document.createElement('div');
        suggestionEl.className = 'suggestion';
        suggestionEl.style.cssText = 'font-size:0.75rem;margin-top:4px;color:#64748b';
        suggestionEl.textContent = 'Try: 380026, 382418, or 380058';
        pincodeStatus.appendChild(suggestionEl);
      }
      
      if (customerPincode) {
        if (isValidFormat && isAllowed) {
          customerPincode.style.borderColor = '#2ecc71';
        } else if (pincodeStr.length > 0) {
          customerPincode.style.borderColor = '#ef4444';
        } else {
          customerPincode.style.borderColor = '#e2e8f0';
        }
      }
    }
    
    return isPincodeValid;
  }
  
  function validateName(name) {
    const isValid = name && name.trim().length >= 2;
    if (nameError) {
      nameError.textContent = isValid ? '' : 'Please enter your full name';
    }
    if (customerName) {
      customerName.style.borderColor = isValid ? '#e2e8f0' : '#ef4444';
    }
    return isValid;
  }
  
  function validatePhone(phone) {
    const isValid = /^[0-9]{10}$/.test(phone);
    if (phoneError) {
      phoneError.textContent = isValid ? '' : 'Please enter a valid 10-digit number';
    }
    if (customerPhone) {
      customerPhone.style.borderColor = isValid ? '#e2e8f0' : '#ef4444';
    }
    return isValid;
  }
  
  function validateAddress(address) {
    const isValid = address && address.trim().length >= 5;
    if (addressError) {
      addressError.textContent = isValid ? '' : 'Please enter your complete address';
    }
    if (customerAddress) {
      customerAddress.style.borderColor = isValid ? '#e2e8f0' : '#ef4444';
    }
    return isValid;
  }
  
  function validateForm() {
    const nameValid = validateName(customerName?.value);
    const phoneValid = validatePhone(customerPhone?.value);
    const addressValid = validateAddress(customerAddress?.value);
    const pincodeValid = validatePincode(customerPincode?.value);
    
    return nameValid && phoneValid && addressValid && pincodeValid;
  }
  
  // ---------- WHATSAPP ORDER ----------
  
  function generateOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `OKM-${timestamp}-${random}`;
  }
  
  function generateOrderMessage(orderId) {
    const name = customerName.value.trim();
    const phone = customerPhone.value.trim();
    const address = customerAddress.value.trim();
    const pincode = customerPincode.value.trim();
    const slot = deliverySlot.value;
    const instructions = specialInstructions.value.trim();
    
    const slotLabels = {
      'morning': '🌅 Morning (8 AM - 12 PM)',
      'evening': '🌆 Evening (4 PM - 8 PM)',
      'urgent': '⚡ Urgent (within 30 mins)'
    };
    
    let message = `🛒 *OK Mart Order*\n\n`;
    message += `📋 *Order ID:* ${orderId}\n\n`;
    message += `👤 *Name:* ${name}\n`;
    message += `📱 *Phone:* ${phone}\n`;
    message += `🏠 *Address:* ${address}\n`;
    message += `📮 *Pincode:* ${pincode}\n`;
    message += `🕐 *Delivery Time:* ${slotLabels[slot]}\n`;
    
    if (instructions) {
      message += `💬 *Instructions:* ${instructions}\n`;
    }
    
    message += `\n📋 *Order Items:*\n`;
    
    cartItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      message += `  • ${item.name} x${item.quantity} - ₹${itemTotal}\n`;
    });
    
    message += `\n💰 *Subtotal:* ₹${cartTotals.subtotal}\n`;
    
    if (cartTotals.couponDiscount > 0) {
      message += `🏷️ *Coupon (${COUPON_CODE}):* -₹${cartTotals.couponDiscount}\n`;
    }
    
    if (cartTotals.deliveryCharge > 0) {
      message += `🚚 *Delivery:* ₹${cartTotals.deliveryCharge}\n`;
    } else {
      message += `🚚 *Delivery:* FREE 🎉\n`;
    }
    
    message += `\n💵 *Total:* ₹${cartTotals.finalTotal}`;
    message += `\n💳 *Payment:* Cash on Delivery`;
    
    message += `\n\n✅ Please confirm this order.`;
    message += `\n\n📦 Track: https://okmart.netlify.app/track.html?phone=${phone}`;
    
    return message;
  }
  
  function sendWhatsAppOrder() {
    const orderId = generateOrderId();
    const message = generateOrderMessage(orderId);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    const orderData = {
      orderId: orderId,
      items: cartItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      // In checkout.js - Add after creating orderData

// Save order to orders history
if (window.OKMartOrders && window.OKMartOrders.saveOrder) {
  window.OKMartOrders.saveOrder({
    orderId: orderId,
    total: cartTotals.finalTotal,
    deliveryCharge: cartTotals.deliveryCharge,
    subtotal: cartTotals.subtotal,
    status: 'received',
    paymentMethod: 'Cash on Delivery',
    items: cartItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      mrp: item.mrp,
      image: item.image,
      unit: item.unit,
      quantity: item.quantity
    }))
  });
},
      
      totals: cartTotals,
      customer: {
        name: customerName.value.trim(),
        phone: customerPhone.value.trim().replace(/\D/g, ''),
        address: customerAddress.value.trim(),
        pincode: customerPincode.value.trim(),
        slot: deliverySlot.value,
        instructions: specialInstructions.value.trim()
      },
      orderDate: new Date().toISOString(),
      status: 'received',
      estimatedDelivery: '20-25 mins',
      paymentMethod: 'Cash on Delivery',
      couponUsed: couponApplied ? COUPON_CODE : null
    };
    
    localStorage.setItem('okmart_last_order', JSON.stringify(orderData));
    saveOrderToTrackingSystem(orderData);
    
    window.open(whatsappUrl, '_blank');
    localStorage.removeItem('okmart_cart');
    
    setTimeout(() => {
      window.location.href = '/success.html';
    }, 500);
  }
  
  function saveOrderToTrackingSystem(orderData) {
    const ORDERS_STORAGE_KEY = 'okmart_orders';
    
    try {
      const existingOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      const orders = existingOrders ? JSON.parse(existingOrders) : [];
      
      orders.push({
        orderId: orderData.orderId,
        phone: orderData.customer.phone,
        customerName: orderData.customer.name,
        customerAddress: orderData.customer.address,
        items: orderData.items,
        total: orderData.totals.finalTotal,
        paymentMethod: orderData.paymentMethod,
        status: orderData.status,
        orderDate: orderData.orderDate,
        estimatedDelivery: orderData.estimatedDelivery,
        deliverySlot: orderData.customer.slot,
        instructions: orderData.customer.instructions,
        couponUsed: orderData.couponUsed
      });
      
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      console.log('✅ Order saved:', orderData.orderId);
      
    } catch (e) {
      console.error('Failed to save order:', e);
    }
  }
  
  // ---------- FORM SUBMISSION ----------
  
  function handleSubmit(e) {
    e.preventDefault();
    
    if (validateForm()) {
      saveUserData();
      sendWhatsAppOrder();
    } else {
      const firstError = document.querySelector('.error-message:not(:empty)');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      showToast('Please fill all required fields correctly', 'error');
    }
  }
  
  // ---------- TOAST NOTIFICATION ----------
  
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#1e2a2e'};
      color: white;
      padding: 12px 24px;
      border-radius: 40px;
      font-weight: 500;
      z-index: 1000;
      animation: slideUpFade 0.3s ease-out;
      white-space: nowrap;
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideDownFade 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  function addToastStyles() {
    if (document.getElementById('toastStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
      @keyframes slideUpFade {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes slideDownFade {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // ---------- REAL-TIME VALIDATION ----------
  
  function setupRealTimeValidation() {
    if (customerName) {
      customerName.addEventListener('input', () => validateName(customerName.value));
      customerName.addEventListener('blur', () => validateName(customerName.value));
    }
    
    if (customerPhone) {
      customerPhone.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        validatePhone(e.target.value);
      });
      customerPhone.addEventListener('blur', () => validatePhone(customerPhone.value));
    }
    
    if (customerAddress) {
      customerAddress.addEventListener('input', () => validateAddress(customerAddress.value));
      customerAddress.addEventListener('blur', () => validateAddress(customerAddress.value));
    }
    
    if (customerPincode) {
      customerPincode.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        const pincode = e.target.value;
        if (pincode.length === 6) {
          validatePincode(pincode);
        }
      });
      customerPincode.addEventListener('blur', () => validatePincode(customerPincode.value));
    }
  }
  
  // ---------- INITIALIZATION ----------
  
  function init() {
    addToastStyles();
    loadCart();
    renderOrderSummary();
    setupItemsToggle();
    loadSavedUserData();
    setupRealTimeValidation();
    setupCouponListeners();
    
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', handleSubmit);
    }
    
    if (window.OKMart && window.OKMart.getCartItems) {
      const cart = window.OKMart.getCartItems();
      const badges = document.querySelectorAll('.cart-badge');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      badges.forEach(badge => {
        if (badge) badge.textContent = totalItems;
      });
    }
    
    window.OKMartCheckout = {
      validateForm,
      getCartTotals: () => cartTotals,
      getAllowedPincodes: () => ALLOWED_PINCODES,
      applyCoupon,
      removeCoupon,
      refresh: init
    };
    
    console.log('✅ Checkout initialized | Free delivery above ₹199 | Coupon: SAVE20 (₹20 off on ₹250+)');
  }
  
  init();
  
})();
