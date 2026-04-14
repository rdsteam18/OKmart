// ===== OK MART - CHECKOUT.JS =====
// Checkout with validation, pincode check, and WhatsApp order

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const WHATSAPP_NUMBER = '9982239821'; // Your WhatsApp number
  const FREE_DELIVERY_THRESHOLD = 300;
  const DELIVERY_CHARGE = 20;
  
  // Allowed pincodes for delivery
  const ALLOWED_PINCODES = ['380026', '382418', '380058', '110001', '400001', '560001'];
  
  // ---------- STATE ----------
  let cartItems = [];
  let cartTotals = null;
  let isPincodeValid = false;
  
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
  
  // ---------- CART FUNCTIONS ----------
  
  // Load cart from localStorage
  function loadCart() {
    const stored = localStorage.getItem('okmart_cart');
    cartItems = stored ? JSON.parse(stored) : [];
    
    // If cart is empty, redirect to home
    if (cartItems.length === 0) {
      window.location.href = 'index.html';
      return;
    }
    
    calculateTotals();
    return cartItems;
  }
  
  // Calculate totals
  function calculateTotals() {
    let mrpTotal = 0;
    let sellingTotal = 0;
    
    cartItems.forEach(item => {
      mrpTotal += (item.mrp || item.price) * item.quantity;
      sellingTotal += item.price * item.quantity;
    });
    
    const discount = mrpTotal - sellingTotal;
    const subtotal = sellingTotal;
    const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
    const total = subtotal + deliveryCharge;
    
    cartTotals = {
      mrpTotal,
      sellingTotal,
      discount,
      subtotal,
      deliveryCharge,
      total
    };
    
    return cartTotals;
  }
  
  // Render order summary
  function renderOrderSummary() {
    // Render items list
    if (orderItemsList) {
      orderItemsList.innerHTML = '';
      
      cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        const itemEl = document.createElement('div');
        itemEl.className = 'order-item-compact';
        itemEl.innerHTML = `
          <img src="${item.image}" alt="${item.name}" class="order-item-image">
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
    
    // Update totals
    if (checkoutSubtotal) {
      checkoutSubtotal.textContent = `₹${cartTotals.subtotal}`;
    }
    
    if (checkoutDelivery) {
      if (cartTotals.deliveryCharge === 0) {
        checkoutDelivery.textContent = 'FREE';
        checkoutDelivery.style.color = '#10b981';
      } else {
        checkoutDelivery.textContent = `₹${cartTotals.deliveryCharge}`;
      }
    }
    
    if (checkoutTotal) {
      checkoutTotal.textContent = `₹${cartTotals.total}`;
    }
    
    if (stickyCheckoutTotal) {
      stickyCheckoutTotal.textContent = `₹${cartTotals.total}`;
    }
  }
  
  // Toggle items visibility
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
          // Validate pincode after loading
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
  
  // Enhanced pincode validation with real-time feedback

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
      
      // Add success animation
      pincodeStatus.style.animation = 'none';
      setTimeout(() => {
        pincodeStatus.style.animation = 'pulse 0.3s ease-out';
      }, 10);
    } else if (isValidFormat && !isAllowed) {
      pincodeStatus.textContent = '❌ Sorry, delivery not available in your area';
      pincodeStatus.className = 'pincode-status unavailable';
      pincodeStatus.style.display = 'block';
      
      // Suggest alternative message
      const suggestion = document.createElement('div');
      suggestion.style.fontSize = '0.75rem';
      suggestion.style.marginTop = '4px';
      suggestion.style.color = 'var(--text-muted)';
      
      // Clear existing suggestion
      const existingSuggestion = pincodeStatus.querySelector('.suggestion');
      if (existingSuggestion) existingSuggestion.remove();
      
      const suggestionEl = document.createElement('div');
      suggestionEl.className = 'suggestion';
      suggestionEl.textContent = 'Try: 380026, 382418, or 380058';
      pincodeStatus.appendChild(suggestionEl);
    }
    
    // Update input border color
    if (customerPincode) {
      if (isValidFormat && isAllowed) {
        customerPincode.style.borderColor = 'var(--primary)';
      } else if (pincodeStr.length > 0) {
        customerPincode.style.borderColor = '#ef4444';
      } else {
        customerPincode.style.borderColor = 'var(--border-light)';
      }
    }
  }
  
  return isPincodeValid;
}

// Add pulse animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);
  
  function validateName(name) {
    const isValid = name && name.trim().length >= 2;
    if (nameError) {
      nameError.textContent = isValid ? '' : 'Please enter your full name';
    }
    return isValid;
  }
  
  function validatePhone(phone) {
    const isValid = /^[0-9]{10}$/.test(phone);
    if (phoneError) {
      phoneError.textContent = isValid ? '' : 'Please enter a valid 10-digit number';
    }
    return isValid;
  }
  
  function validateAddress(address) {
    const isValid = address && address.trim().length >= 5;
    if (addressError) {
      addressError.textContent = isValid ? '' : 'Please enter your complete address';
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
  
  function generateOrderMessage() {
    const name = customerName.value.trim();
    const phone = customerPhone.value.trim();
    const address = customerAddress.value.trim();
    const pincode = customerPincode.value.trim();
    const slot = deliverySlot.value;
    const instructions = specialInstructions.value.trim();
    
    // Format slot for display
    const slotLabels = {
      'morning': '🌅 Morning (8 AM - 12 PM)',
      'evening': '🌆 Evening (4 PM - 8 PM)',
      'urgent': '⚡ Urgent (within 30 mins)'
    };
    
    let message = `🛒 *OK Mart Order*\n\n`;
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
    
    message += `\n💰 *Total:* ₹${cartTotals.total}`;
    
    if (cartTotals.deliveryCharge === 0) {
      message += ` (Free Delivery 🎉)`;
    }
    
    message += `\n\n✅ Please confirm this order.`;
    
    return message;
  }
  
  function sendWhatsAppOrder() {
    const message = generateOrderMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // Save order to localStorage before redirecting
    const orderData = {
      items: cartItems,
      totals: cartTotals,
      customer: {
        name: customerName.value,
        phone: customerPhone.value,
        address: customerAddress.value,
        pincode: customerPincode.value,
        slot: deliverySlot.value,
        instructions: specialInstructions.value
      },
      orderTime: new Date().toISOString(),
      orderId: 'OKM-' + Date.now().toString(36).toUpperCase()
    };
    
    localStorage.setItem('okmart_last_order', JSON.stringify(orderData));
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Clear cart
    localStorage.removeItem('okmart_cart');
    
    // Redirect to success page after short delay
    setTimeout(() => {
      window.location.href = 'success.html';
    }, 500);
  }
  
  // ---------- FORM SUBMISSION ----------
  
  function handleSubmit(e) {
    e.preventDefault();
    
    if (validateForm()) {
      // Save user data for future use
      saveUserData();
      
      // Send WhatsApp order
      sendWhatsAppOrder();
    } else {
      // Scroll to first error
      const firstError = document.querySelector('.error-message:not(:empty)');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
  
  // ---------- REAL-TIME VALIDATION ----------
  
  function setupRealTimeValidation() {
    if (customerName) {
      customerName.addEventListener('input', () => validateName(customerName.value));
      customerName.addEventListener('blur', () => validateName(customerName.value));
    }
    
    if (customerPhone) {
      customerPhone.addEventListener('input', () => validatePhone(customerPhone.value));
      customerPhone.addEventListener('blur', () => validatePhone(customerPhone.value));
    }
    
    if (customerAddress) {
      customerAddress.addEventListener('input', () => validateAddress(customerAddress.value));
      customerAddress.addEventListener('blur', () => validateAddress(customerAddress.value));
    }
    
    if (customerPincode) {
      customerPincode.addEventListener('input', () => {
        const pincode = customerPincode.value;
        if (pincode.length === 6) {
          validatePincode(pincode);
        }
      });
      customerPincode.addEventListener('blur', () => validatePincode(customerPincode.value));
    }
  }
  
  // ---------- INITIALIZATION ----------
  
  function init() {
    // Load cart
    loadCart();
    
    // Render order summary
    renderOrderSummary();
    
    // Setup items toggle
    setupItemsToggle();
    
    // Load saved user data
    loadSavedUserData();
    
    // Setup real-time validation
    setupRealTimeValidation();
    
    // Setup form submission
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', handleSubmit);
    }
    
    // Expose for debugging
    window.OKMartCheckout = {
      validateForm,
      getCartTotals: () => cartTotals,
      getAllowedPincodes: () => ALLOWED_PINCODES
    };
  }
  
  init();
  
})();
