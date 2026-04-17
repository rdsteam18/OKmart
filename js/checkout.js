(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const USER_KEY = 'okmart_user';
  const WHATSAPP_NUMBER = '919982239821';
  const FREE_DELIVERY_THRESHOLD = 199;
  const DELIVERY_CHARGE = 20;
  const COUPON_CODE = 'SAVE20';
  const COUPON_DISCOUNT = 20;
  const COUPON_MIN = 250;
  
  let cart = [];
  let couponApplied = false;
  
  // DOM Elements
  const displayName = document.getElementById('displayName');
  const displayPhone = document.getElementById('displayPhone');
  const displayAddress = document.getElementById('displayAddress');
  const displayPincode = document.getElementById('displayPincode');
  const orderItemsList = document.getElementById('orderItemsList');
  const checkoutSubtotal = document.getElementById('checkoutSubtotal');
  const checkoutDelivery = document.getElementById('checkoutDelivery');
  const checkoutTotal = document.getElementById('checkoutTotal');
  const stickyTotal = document.getElementById('stickyTotal');
  const couponRow = document.getElementById('couponRow');
  const couponDiscount = document.getElementById('couponDiscount');
  const couponInput = document.getElementById('couponInput');
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const couponMessage = document.getElementById('couponMessage');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const viewItemsToggle = document.getElementById('viewItemsToggle');
  const toastMessage = document.getElementById('toastMessage');
  
  // Check user exists
  function checkUser() {
    const user = localStorage.getItem(USER_KEY);
    if (!user) {
      sessionStorage.setItem('returnTo', '/checkout.html');
      window.location.href = '/user-details.html';
      return null;
    }
    return JSON.parse(user);
  }
  
  // Load cart
  function loadCart() {
    const stored = localStorage.getItem(CART_KEY);
    cart = stored ? JSON.parse(stored) : [];
    if (cart.length === 0) {
      window.location.href = '/index.html';
    }
    return cart;
  }
  
  // Calculate totals
  function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = couponApplied && subtotal >= COUPON_MIN ? COUPON_DISCOUNT : 0;
    const subtotalAfterDiscount = subtotal - discount;
    const delivery = subtotalAfterDiscount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
    const total = subtotalAfterDiscount + delivery;
    
    return { subtotal, discount, subtotalAfterDiscount, delivery, total };
  }
  
  // Render UI
  function renderCheckout() {
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    displayName.textContent = user.name;
    displayPhone.textContent = `+91 ${user.phone}`;
    displayAddress.textContent = user.address;
    displayPincode.textContent = `📮 ${user.pincode}`;
    
    // Render items
    orderItemsList.innerHTML = '';
    cart.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'order-item-compact';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="order-item-image">
        <div class="order-item-details">
          <div>
            <div class="order-item-name">${item.name}</div>
            <span class="order-item-qty">Qty: ${item.quantity}</span>
          </div>
          <span class="order-item-price">₹${item.price * item.quantity}</span>
        </div>
      `;
      orderItemsList.appendChild(itemEl);
    });
    
    updateTotals();
  }
  
  function updateTotals() {
    const totals = calculateTotals();
    
    checkoutSubtotal.textContent = `₹${totals.subtotal}`;
    
    if (totals.discount > 0) {
      couponRow.style.display = 'flex';
      couponDiscount.textContent = `-₹${totals.discount}`;
    } else {
      couponRow.style.display = 'none';
    }
    
    if (totals.delivery === 0) {
      checkoutDelivery.textContent = 'FREE';
      checkoutDelivery.style.color = '#10b981';
    } else {
      checkoutDelivery.textContent = `₹${totals.delivery}`;
      checkoutDelivery.style.color = '';
    }
    
    checkoutTotal.textContent = `₹${totals.total}`;
    stickyTotal.textContent = `₹${totals.total}`;
  }
  
  function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    setTimeout(() => toastMessage.classList.remove('show'), 2500);
  }
  
  // Coupon
  applyCouponBtn.addEventListener('click', () => {
    const code = couponInput.value.trim().toUpperCase();
    
    if (code === COUPON_CODE) {
      const subtotal = calculateTotals().subtotal;
      if (subtotal >= COUPON_MIN) {
        couponApplied = true;
        updateTotals();
        couponMessage.textContent = '✅ Coupon applied! ₹20 off';
        couponMessage.className = 'coupon-message success';
        showToast('Coupon applied!', 'success');
      } else {
        couponMessage.textContent = `Add ₹${COUPON_MIN - subtotal} more to apply`;
        couponMessage.className = 'coupon-message error';
      }
    } else {
      couponMessage.textContent = 'Invalid coupon code';
      couponMessage.className = 'coupon-message error';
    }
  });
  
  // View items toggle
  let itemsVisible = true;
  viewItemsToggle.addEventListener('click', () => {
    itemsVisible = !itemsVisible;
    orderItemsList.style.display = itemsVisible ? 'block' : 'none';
    viewItemsToggle.textContent = itemsVisible ? 'View Items ▼' : 'View Items ▶';
  });
  
  // Place order
  placeOrderBtn.addEventListener('click', () => {
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    const totals = calculateTotals();
    const orderId = `OKM-${Date.now().toString(36).toUpperCase()}`;
    
    // Build WhatsApp message
    let message = `🛒 *OK Mart Order*\n\n`;
    message += `📋 *Order ID:* ${orderId}\n`;
    message += `👤 *Name:* ${user.name}\n`;
    message += `📱 *Phone:* ${user.phone}\n`;
    message += `🏠 *Address:* ${user.address}\n`;
    message += `📮 *Pincode:* ${user.pincode}\n\n`;
    message += `📋 *Items:*\n`;
    
    cart.forEach(item => {
      message += `  • ${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`;
    });
    
    message += `\n💰 *Total:* ₹${totals.total}`;
    if (totals.delivery === 0) message += ` (Free Delivery)`;
    if (totals.discount > 0) message += `\n🏷️ Coupon: -₹${totals.discount}`;
    
    message += `\n\n✅ Please confirm this order.`;
    
    // Save order
    const orders = JSON.parse(localStorage.getItem('okmart_orders') || '[]');
    orders.push({
      orderId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      total: totals.total,
      deliveryCharge: totals.delivery,
      subtotal: totals.subtotal,
      status: 'received',
      items: cart
    });
    localStorage.setItem('okmart_orders', JSON.stringify(orders));
    
    // Open WhatsApp
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    
    // Clear cart
    localStorage.removeItem(CART_KEY);
    
    // Redirect
    setTimeout(() => {
      window.location.href = `/success.html?order=${orderId}`;
    }, 500);
  });
  
  // Init
  const user = checkUser();
  if (user) {
    loadCart();
    renderCheckout();
  }
})();
