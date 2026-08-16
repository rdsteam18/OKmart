// ===== OK MART - COMPLETE CHECKOUT PAGE =====

(function() {
  'use strict';

  // ========== DOM Elements ==========
  const loadingState = document.getElementById('loadingState');
  const checkoutContent = document.getElementById('checkoutContent');
  const addressDisplayDiv = document.getElementById('addressDisplay');
  const orderItemsList = document.getElementById('orderItemsList');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryDelivery = document.getElementById('summaryDelivery');
  const summaryTotal = document.getElementById('summaryTotal');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const successModal = document.getElementById('successModal');
  const trackOrderBtn = document.getElementById('trackOrderBtn');
  const continueShoppingBtn = document.getElementById('continueShoppingBtn');
  const deliverySlotContainer = document.getElementById('deliverySlotContainer');
  const deliverySlot = document.getElementById('deliverySlot');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');

  // ========== State ==========
  let cart = [];
  let allProducts = [];
  let userAddress = null;
  let currentDeliveryType = 'quick';
  let currentPaymentMethod = 'cod';
  let deliveryCharge = window.BASE_DELIVERY_CHARGE || 39;
  // ✅ common.js का centralized threshold use करें
  const FREE_DELIVERY_THRESHOLD = window.FREE_DELIVERY_THRESHOLD || 199;
  const ADMIN_WHATSAPP = '919982239821';

  // ========== Load Data ==========
  async function loadData() {
    try {
      loadingState.style.display = 'block';
      
      // Load products
      if (window.fetchProducts) {
        allProducts = await fetchProducts();
      }
      
      // Load cart
      loadCart();
      
      // Load user address from localStorage
      loadUserAddress();
      
      // Render address section
      renderAddressSection();
      
      // Render order summary
      renderOrderSummary();
      
      loadingState.style.display = 'none';
      checkoutContent.style.display = 'grid';
      
    } catch (error) {
      console.error('Error loading data:', error);
      loadingState.innerHTML = '<div class="spinner"></div><p>Error loading checkout. Please refresh.</p>';
    }
  }

  // ========== Load Cart ==========
  function loadCart() {
    const savedCart = localStorage.getItem('okmart_cart');
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch(e) { 
        cart = []; 
      }
    }
    
    if (cart.length === 0) {
      window.location.href = '/cart.html';
    }
  }

  // ========== Load User Address ==========
  function loadUserAddress() {
    const savedAddress = localStorage.getItem('okmart_user_address');
    if (savedAddress) {
      try {
        userAddress = JSON.parse(savedAddress);
      } catch(e) {
        userAddress = null;
      }
    }
  }

  // ========== Render Address Section ==========
  function renderAddressSection() {
    if (!addressDisplayDiv) return;
    
    if (userAddress && userAddress.name && userAddress.phone && userAddress.address) {
      addressDisplayDiv.innerHTML = `
        <div class="address-card">
          <div class="address-name">${escapeHtml(userAddress.name)}</div>
          <div class="address-phone">📞 ${escapeHtml(userAddress.phone)}</div>
          <div class="address-text">📍 ${escapeHtml(userAddress.address)} ${userAddress.city ? ', ' + escapeHtml(userAddress.city) : ''} ${userAddress.pincode ? '- ' + escapeHtml(userAddress.pincode) : ''}</div>
          <button class="edit-address-btn" id="editAddressBtn">Edit Address</button>
        </div>
      `;
      
      const editBtn = document.getElementById('editAddressBtn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          window.location.href = '/profile.html';
        });
      }
    } else {
      addressDisplayDiv.innerHTML = `
        <div class="no-address-card">
          <div class="no-address-icon">⚠️</div>
          <h3>Delivery Address Required</h3>
          <p>Please add your delivery address to continue</p>
          <button class="add-address-btn" id="addAddressBtn">Add Address →</button>
        </div>
      `;
      
      const addBtn = document.getElementById('addAddressBtn');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          window.location.href = '/profile.html';
        });
      }
    }
  }

  // ========== Render Order Summary ==========
  function renderOrderSummary() {
    let subtotal = 0;
    const items = cart.map(item => {
      const product = allProducts.find(p => p.id === item.id) || item;
      const quantity = item.quantity || 1;
      const itemTotal = product.price * quantity;
      subtotal += itemTotal;
      
      return `
        <div class="order-item">
          <img src="${product.image}" class="order-item-image" onerror="this.src='https://via.placeholder.com/50'">
          <div class="order-item-details">
            <div class="order-item-name">${escapeHtml(product.name)}</div>
            <div class="order-item-price">₹${product.price} × ${quantity}</div>
          </div>
          <div class="order-item-quantity">₹${itemTotal}</div>
        </div>
      `;
    }).join('');
    
    orderItemsList.innerHTML = items || '<div style="text-align:center;padding:20px;color:#6b7280;">No items</div>';
    
    // Calculate delivery charge dynamically
    const settings = typeof window.getStoreSettings === 'function' ? window.getStoreSettings() : {};
    const deliveryCalc = typeof window.calculateDelivery === 'function'
      ? window.calculateDelivery(subtotal)
      : { deliveryCharge: subtotal >= (window.FREE_DELIVERY_THRESHOLD || 199) ? 0 : 39, threshold: 199, remainingForFree: Math.max(0, 199 - subtotal), percentForFree: Math.min(100, (subtotal / 199) * 100) };
      
    let delivery = deliveryCalc.deliveryCharge;
    if (currentDeliveryType === 'scheduled' && delivery > 0) {
      delivery = Math.round(delivery * 0.75); // Scheduled discount
    }
    deliveryCharge = delivery;
    
    const handlingFee = settings.handlingFee || settings.packagingFee || 0;
    const convenienceFee = settings.convenienceFee || 0;
    const total = subtotal + deliveryCharge + handlingFee + convenienceFee;
    
    summarySubtotal.textContent = `₹${subtotal}`;
    summaryDelivery.textContent = deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`;
    summaryTotal.textContent = `₹${total}`;
    
    // Update free delivery progress
    const threshold = deliveryCalc.threshold || window.FREE_DELIVERY_THRESHOLD || 199;
    const remaining = Math.max(0, threshold - subtotal);
    const percent = Math.min(100, (subtotal / threshold) * 100);
    progressFill.style.width = `${percent}%`;
    if (remaining <= 0) {
      progressLabel.innerHTML = '🎉 Free delivery unlocked! 🎉';
    } else {
      progressLabel.innerHTML = `Add ₹${remaining} more for FREE delivery 🎁`;
    }
  }

  // ========== Update Delivery Charge ==========
  function updateDeliveryCharge() {
    const selected = document.querySelector('input[name="deliveryType"]:checked');
    if (selected) {
      currentDeliveryType = selected.value;
    }
    renderOrderSummary();
  }

  // ========== Toggle Delivery Slot ==========
  function toggleDeliverySlot() {
    const selected = document.querySelector('input[name="deliveryType"]:checked');
    if (selected && selected.value === 'scheduled') {
      deliverySlotContainer.style.display = 'block';
    } else {
      deliverySlotContainer.style.display = 'none';
    }
    updateDeliveryCharge();
  }

  // ========== Update Payment Method ==========
  function updatePaymentMethod() {
    const selected = document.querySelector('input[name="paymentMethod"]:checked');
    if (selected) {
      currentPaymentMethod = selected.value;
    }
  }

  // ========== Generate Order ID ==========
  function generateOrderId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let result = 'ORD-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ========== FORMAT WHATSAPP MESSAGE ==========
  function formatWhatsAppMessage(orderData, orderId) {
    const itemsList = orderData.items.map(item => {
      const product = allProducts.find(p => p.id === item.id) || item;
      return `  • ${product.name} x${item.quantity} - ₹${(product.price * item.quantity).toFixed(2)}`;
    }).join('\n');
    
    const paymentMethodText = orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment';
    const deliveryTimeText = orderData.deliveryType === 'quick' ? '⚡ Quick (10-15 mins)' : orderData.deliverySlot || 'Scheduled';
    
    return `🛒 *OK Mart Order*

📋 *Order ID:* #${orderId}

👤 *Name:* ${orderData.name}
📱 *Phone:* ${orderData.phone}
🏠 *Address:* ${orderData.address}
📮 *Pincode:* ${orderData.pincode || 'N/A'}
🕐 *Delivery Time:* ${deliveryTimeText}

📋 *Order Items:*
${itemsList}

💰 *Subtotal:* ₹${orderData.subtotal}
🚚 *Delivery:* ₹${orderData.deliveryCharge}

💵 *Total:* ₹${orderData.total}
💳 *Payment:* ${paymentMethodText}

✅ Please confirm this order.

📦 Track: ${window.location.origin}/track-order.html?id=${orderId}`;
  }

  // ========== SEND WHATSAPP NOTIFICATION TO ADMIN ==========
  async function sendWhatsAppNotification(orderData, orderId) {
    try {
      const message = formatWhatsAppMessage(orderData, orderId);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodedMessage}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
      console.log('📱 WhatsApp notification sent to admin');
      return true;
    } catch (error) {
      console.error('WhatsApp error:', error);
      return false;
    }
  }

  // ========== SAVE ORDER TO FIREBASE ==========
  async function saveOrderToFirebase(orderData) {
    try {
      const orderToSave = {
        ...orderData,
        orderDate: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'received',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('orders').add(orderToSave);
      return docRef.id;
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  }

  // ========== PLACE ORDER ==========
  async function placeOrder() {
    // Validate address
    if (!userAddress || !userAddress.name || !userAddress.phone || !userAddress.address) {
      showToast('Please add your delivery address first', 'error');
      window.location.href = '/profile.html';
      return;
    }
    
    // Validate cart
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      window.location.href = '/cart.html';
      return;
    }
    
    const settings = typeof window.getStoreSettings === 'function' ? window.getStoreSettings() : {};
    
    // Store open check
    if (settings.isStoreOpen === false) {
      showToast(settings.storeClosedNotice || 'Store is currently closed. We cannot process orders at this time.', 'error');
      return;
    }
    
    // Min order check
    const minOrder = Number(settings.minOrderAmount || 0);
    if (minOrder > 0 && subtotal < minOrder) {
      showToast(`Minimum order amount is ₹${minOrder}. Please add ₹${minOrder - subtotal} more items.`, 'error');
      return;
    }
    
    const deliveryCalc = typeof window.calculateDelivery === 'function'
      ? window.calculateDelivery(subtotal)
      : { deliveryCharge: subtotal >= (window.FREE_DELIVERY_THRESHOLD || 199) ? 0 : 39 };
      
    let delivery = deliveryCalc.deliveryCharge;
    if (currentDeliveryType === 'scheduled' && delivery > 0) {
      delivery = Math.round(delivery * 0.75);
    }
    deliveryCharge = delivery;
    
    const handlingFee = settings.handlingFee || settings.packagingFee || 0;
    const convenienceFee = settings.convenienceFee || 0;
    const total = subtotal + deliveryCharge + handlingFee + convenienceFee;
    
    // Get delivery slot
    let deliverySlotValue = null;
    if (currentDeliveryType === 'scheduled') {
      deliverySlotValue = deliverySlot.value;
    }
    
    // Prepare order data
    const orderId = generateOrderId();
    
    const orderData = {
      orderId: orderId,
      name: userAddress.name,
      phone: userAddress.phone,
      email: userAddress.email || null,
      address: userAddress.address,
      city: userAddress.city || null,
      pincode: userAddress.pincode || null,
      landmark: userAddress.landmark || null,
      deliveryType: currentDeliveryType,
      deliverySlot: deliverySlotValue,
      paymentMethod: currentPaymentMethod,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image
      })),
      subtotal: subtotal,
      deliveryCharge: deliveryCharge,
      total: total,
      status: 'received'
    };
    
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Placing Order...';
    
    try {
      // Save to Firebase
      const docId = await saveOrderToFirebase(orderData);
      
      // Send WhatsApp notification to admin
      await sendWhatsAppNotification(orderData, docId);
      
      // Clear cart
      localStorage.removeItem('okmart_cart');
      localStorage.removeItem('okmart_applied_coupon');
      
      // Show success modal
      trackOrderBtn.onclick = () => {
        window.location.href = `/track-order.html?id=${docId}`;
      };
      
      continueShoppingBtn.onclick = () => {
        window.location.href = '/';
      };
      
      successModal.classList.add('active');
      showToast('Order placed successfully!', 'success');
      
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('Error placing order. Please try again.', 'error');
    } finally {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order →';
    }
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
    // Delivery options
    document.querySelectorAll('input[name="deliveryType"]').forEach(radio => {
      radio.addEventListener('change', () => {
        toggleDeliverySlot();
      });
    });
    
    // Payment method
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
      radio.addEventListener('change', updatePaymentMethod);
    });
    
    // Place order button
    placeOrderBtn?.addEventListener('click', placeOrder);
    
    // Close modal on outside click
    successModal?.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.classList.remove('active');
        window.location.href = '/';
      }
    });
  }

  // ========== Initialize ==========
  function init() {
    initEventListeners();
    loadData();
    if (typeof window.onStoreSettingsChange === 'function') {
      window.onStoreSettingsChange(() => {
        renderOrderSummary();
      });
    }
    console.log('✅ Checkout page initialized with dynamic settings');
  }
  
  init();
})();
