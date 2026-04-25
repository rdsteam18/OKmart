// ===== OK MART - CHECKOUT.JS =====
// Complete checkout with user details, Firebase, WhatsApp

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const USER_KEY = 'okmart_user';
  const WHATSAPP_NUMBER = '919982239821';
  const FREE_THRESHOLD = 199;
  const DELIVERY_FEE = 20;
  
  // ========== STATE ==========
  let cart = [];
  let couponDiscount = 0;
  let appliedCouponCode = null;
  let editOpen = false;
  
  // ========== DOM ELEMENTS ==========
  const displayName = document.getElementById('displayName');
  const displayPhone = document.getElementById('displayPhone');
  const displayAddress = document.getElementById('displayAddress');
  const displayPincode = document.getElementById('displayPincode');
  
  const editDetailsToggle = document.getElementById('editDetailsToggle');
  const editToggleText = document.getElementById('editToggleText');
  const detailsEdit = document.getElementById('detailsEdit');
  
  const editName = document.getElementById('editName');
  const editPhone = document.getElementById('editPhone');
  const editAddress = document.getElementById('editAddress');
  const editPincode = document.getElementById('editPincode');
  
  const orderItemsList = document.getElementById('orderItemsList');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryCouponDiscount = document.getElementById('summaryCouponDiscount');
  const summaryDelivery = document.getElementById('summaryDelivery');
  const summaryTotal = document.getElementById('summaryTotal');
  const couponRow = document.getElementById('couponRow');
  const freeOnionRow = document.getElementById('freeOnionRow');
  
  const appliedCouponCard = document.getElementById('appliedCouponCard');
  const checkoutCouponCode = document.getElementById('checkoutCouponCode');
  const checkoutCouponSavings = document.getElementById('checkoutCouponSavings');
  
  const barTotal = document.getElementById('barTotal');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const placeOrderText = document.getElementById('placeOrderText');
  const orderSpinner = document.getElementById('orderSpinner');
  
  const upsellSlider = document.getElementById('upsellSlider');
  const toastMessage = document.getElementById('toastMessage');
  
  // ========== USER DETAILS ==========
  function loadUserData() {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      const user = JSON.parse(stored);
      displayName.textContent = user.name || '-';
      displayPhone.textContent = user.phone ? '+91 ' + user.phone : '-';
      displayAddress.textContent = user.address || '-';
      displayPincode.textContent = user.pincode || '-';
      
      editName.value = user.name || '';
      editPhone.value = user.phone || '';
      editAddress.value = user.address || '';
      editPincode.value = user.pincode || '';
    }
  }
  
  function saveUserData() {
    const user = {
      name: editName.value.trim(),
      phone: editPhone.value.trim().replace(/\D/g, ''),
      address: editAddress.value.trim(),
      pincode: editPincode.value.trim()
    };
    
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    displayName.textContent = user.name || '-';
    displayPhone.textContent = user.phone ? '+91 ' + user.phone : '-';
    displayAddress.textContent = user.address || '-';
    displayPincode.textContent = user.pincode || '-';
    
    showToast('Details saved!', 'success');
  }
  
  // Toggle edit mode
  editDetailsToggle.addEventListener('click', () => {
    editOpen = !editOpen;
    detailsEdit.style.display = editOpen ? 'block' : 'none';
    editToggleText.textContent = editOpen ? 'Cancel' : 'Edit';
  });
  
  document.getElementById('saveDetailsBtn').addEventListener('click', () => {
    if (!editName.value.trim() || !editPhone.value.trim() || !editAddress.value.trim() || !editPincode.value.trim()) {
      showToast('Please fill all fields', 'error');
      return;
    }
    saveUserData();
    editOpen = false;
    detailsEdit.style.display = 'none';
    editToggleText.textContent = 'Edit';
  });
  
  // ========== CART ==========
  function loadCart() {
    const stored = localStorage.getItem(CART_KEY);
    cart = stored ? JSON.parse(stored) : [];
    
    if (cart.length === 0) {
      window.location.href = '/cart.html';
      return;
    }
    
    // Check for coupon from cart page
    const cartData = sessionStorage.getItem('checkout_coupon');
    if (cartData) {
      const data = JSON.parse(cartData);
      couponDiscount = data.discount || 0;
      appliedCouponCode = data.code || null;
    }
  }
  
  function calculateTotals() {
    const subtotal = cart.filter(i => !i.isFree).reduce((s, i) => s + (i.price * i.quantity), 0);
    const hasFreeOnion = cart.some(i => i.id === 'free_onion');
    const delivery = subtotal >= FREE_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = Math.max(0, subtotal - couponDiscount + delivery);
    return { subtotal, hasFreeOnion, delivery, total };
  }
  
  // ========== RENDER ==========
  function renderOrderSummary() {
    const totals = calculateTotals();
    
    // Items
    orderItemsList.innerHTML = cart.map(item => `
      <div class="order-item-row">
        <img src="${item.image}" alt="${item.name}" class="order-item-image" onerror="this.src='https://via.placeholder.com/45'">
        <div class="order-item-info">
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-qty">Qty: ${item.quantity}</div>
        </div>
        <div class="order-item-price">${item.isFree ? 'FREE' : '₹' + (item.price * item.quantity)}</div>
      </div>
    `).join('');
    
    // Price breakdown
    summarySubtotal.textContent = '₹' + totals.subtotal;
    
    if (couponDiscount > 0) {
      couponRow.style.display = 'flex';
      summaryCouponDiscount.textContent = '-₹' + couponDiscount;
    } else {
      couponRow.style.display = 'none';
    }
    
    freeOnionRow.style.display = totals.hasFreeOnion ? 'flex' : 'none';
    summaryDelivery.textContent = totals.delivery === 0 ? 'FREE' : '₹' + totals.delivery;
    summaryTotal.textContent = '₹' + totals.total;
    barTotal.textContent = '₹' + totals.total;
    
    // Coupon card
    if (appliedCouponCode) {
      appliedCouponCard.style.display = 'block';
      checkoutCouponCode.textContent = appliedCouponCode;
      checkoutCouponSavings.textContent = '-₹' + couponDiscount;
    } else {
      appliedCouponCard.style.display = 'none';
    }
  }
  
  // ========== UPSELL ==========
  async function loadUpsellProducts() {
    try {
      const snapshot = await db.collection('products')
        .where('popular', '==', true)
        .limit(8)
        .get();
      
      upsellSlider.innerHTML = '';
      
      snapshot.forEach(doc => {
        const p = { id: doc.id, ...doc.data() };
        if (cart.some(i => i.id === p.id)) return;
        
        const card = document.createElement('div');
        card.className = 'mini-product-card';
        card.innerHTML = `
          <img src="${p.image}" alt="${p.name}" class="mini-product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/140'">
          <div class="mini-product-name">${p.name}</div>
          <div class="mini-product-price">₹${p.price}</div>
          <button class="mini-add-btn">+ Add</button>
        `;
        card.querySelector('.mini-add-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          addToCartDirect(p);
        });
        upsellSlider.appendChild(card);
      });
      
      if (upsellSlider.children.length === 0) {
        upsellSlider.innerHTML = '<p style="color:var(--muted);padding:20px;">No suggestions</p>';
      }
    } catch (err) {
      upsellSlider.innerHTML = '<p style="color:var(--muted);">Could not load</p>';
    }
  }
  
  function addToCartDirect(product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, mrp: product.mrp, image: product.image, unit: product.unit, quantity: 1 });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderOrderSummary();
    showToast(`${product.name} added!`, 'success');
  }
  
  // ========== PLACE ORDER ==========
  async function placeOrder() {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    
    if (!user.name || !user.phone || !user.address) {
      showToast('Please enter your delivery details', 'error');
      editOpen = true;
      detailsEdit.style.display = 'block';
      editToggleText.textContent = 'Cancel';
      return;
    }
    
    // Disable button
    placeOrderBtn.disabled = true;
    placeOrderText.style.display = 'none';
    orderSpinner.style.display = 'inline-block';
    
    const totals = calculateTotals();
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    
    const orderData = {
      orderId: orderId,
      customerName: user.name,
      customerPhone: user.phone,
      phone: user.phone,
      name: user.name,
      customerAddress: user.address,
      address: user.address,
      pincode: user.pincode || '',
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image
      })),
      subtotal: totals.subtotal,
      delivery: totals.delivery,
      total: totals.total,
      couponDiscount: couponDiscount,
      couponCode: appliedCouponCode,
      status: 'received',
      orderDate: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };
    
    try {
      // Save to Firebase
      await db.collection('orders').add(orderData);
      console.log('✅ Order saved:', orderId);
      
      // Build WhatsApp message
      let message = '🛒 *New Order – OK Mart*\n\n';
      message += `👤 *Name:* ${user.name}\n`;
      message += `📱 *Phone:* ${user.phone}\n`;
      message += `🏠 *Address:* ${user.address}\n`;
      if (user.pincode) message += `📮 *Pincode:* ${user.pincode}\n`;
      message += '\n🧾 *Items:*\n';
      cart.forEach(i => {
        message += `  • ${i.name} x${i.quantity} - ₹${i.price * i.quantity}\n`;
      });
      message += `\n💰 *Total:* ₹${totals.total}\n`;
      message += `🆔 *Order ID:* ${orderId}\n\n`;
      message += `📦 Track: ${window.location.origin}/tracking.html\n`;
      message += '✅ Please confirm this order.';
      
      // Save to local orders
      const orders = JSON.parse(localStorage.getItem('okmart_orders') || '[]');
      orders.push(orderData);
      localStorage.setItem('okmart_orders', JSON.stringify(orders));
      
      // Clear cart
      localStorage.removeItem(CART_KEY);
      sessionStorage.removeItem('checkout_coupon');
      
      // Open WhatsApp
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
      
      // Redirect
      setTimeout(() => {
        window.location.href = '/success.html?order=' + orderId;
      }, 500);
      
    } catch (err) {
      console.error('Order failed:', err);
      showToast('Failed to place order. Try again.', 'error');
      placeOrderBtn.disabled = false;
      placeOrderText.style.display = 'inline';
      orderSpinner.style.display = 'none';
    }
  }
  
  placeOrderBtn.addEventListener('click', placeOrder);
  
  // ========== TOAST ==========
  function showToast(msg, type = 'info') {
    const toast = toastMessage;
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#1a1e2b';
    toast.style.color = 'white';
    toast.classList.add('show');
    clearTimeout(window._t);
    window._t = setTimeout(() => toast.classList.remove('show'), 2500);
  }
  
  // ========== INIT ==========
  async function init() {
    loadCart();
    loadUserData();
    renderOrderSummary();
    await loadUpsellProducts();
    console.log('✅ Checkout ready');
  }
  
  init();
  
})();
