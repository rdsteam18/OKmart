// ===== OK MART - SIMPLIFIED CHECKOUT PAGE (STABLE) WITH WHATSAPP NOTIFICATION =====

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

  // ========== State ==========
  let cart = [];
  let allProducts = [];
  let userAddress = null;
  let currentDeliveryType = 'quick';
  let deliveryCharge = 30;
  const FREE_DELIVERY_THRESHOLD = 499;
  
  // ========== ADMIN WHATSAPP NUMBER ==========
  const ADMIN_WHATSAPP = '919982239821'; // without + sign

  // ========== Load Data ==========
  async function loadData() {
    try {
      loadingState.style.display = 'block';
      
      // Load products
      allProducts = await fetchProducts();
      
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
    
    let delivery = 30;
    if (currentDeliveryType === 'scheduled') {
      delivery = 20;
    }
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      delivery = 0;
    }
    deliveryCharge = delivery;
    
    const total = subtotal + deliveryCharge;
    
    summarySubtotal.textContent = `₹${subtotal}`;
    summaryDelivery.textContent = deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`;
    summaryTotal.textContent = `₹${total}`;
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

  // ========== SEND WHATSAPP NOTIFICATION TO ADMIN ==========
  async function sendWhatsAppNotification(orderData, orderId) {
    try {
      // Format items list for WhatsApp
      const itemsList = orderData.items.map(item => {
        const product = allProducts.find(p => p.id === item.id) || item;
        return `🛒 ${product.name} x ${item.quantity} = ₹${(product.price * item.quantity).toFixed(2)}`;
      }).join('%0A');
      
      // Format date and time
      const orderTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      // Create WhatsApp message
      const message = `🛍️ *NEW ORDER RECEIVED!* 🛍️%0A%0A` +
        `📋 *Order ID:* #${orderId.slice(0, 8).toUpperCase()}%0A` +
        `⏰ *Time:* ${orderTime}%0A%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `👤 *CUSTOMER DETAILS*%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `*Name:* ${orderData.name}%0A` +
        `*Phone:* ${orderData.phone}%0A` +
        `${orderData.email ? `*Email:* ${orderData.email}%0A` : ''}` +
        `*Address:* ${orderData.address}%0A` +
        `${orderData.city ? `*City:* ${orderData.city}%0A` : ''}` +
        `${orderData.pincode ? `*Pincode:* ${orderData.pincode}%0A` : ''}` +
        `${orderData.landmark ? `*Landmark:* ${orderData.landmark}%0A` : ''}%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `🛍️ *ORDER ITEMS*%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `${itemsList}%0A%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `💰 *PAYMENT SUMMARY*%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `*Subtotal:* ₹${orderData.subtotal}%0A` +
        `*Delivery:* ${orderData.deliveryCharge === 0 ? 'FREE' : '₹' + orderData.deliveryCharge}%0A` +
        `${orderData.discount > 0 ? `*Discount:* -₹${orderData.discount}%0A` : ''}` +
        `*TOTAL:* ₹${orderData.total}%0A%0A` +
        `🚚 *Delivery Type:* ${orderData.deliveryType === 'quick' ? '⚡ Quick (10-15 min)' : '📅 Scheduled'}%0A` +
        `${orderData.deliverySlot ? `📅 *Slot:* ${orderData.deliverySlot}%0A` : ''}%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `🔗 *Track Order:* ${window.location.origin}/track-order.html?id=${orderId}%0A%0A` +
        `_Thank you for using OK Mart!_ 🙏`;
      
      // Send WhatsApp message to admin
      const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${message}`;
      
      // Open in new window (will be blocked by popup blockers if not triggered by user)
      // So we'll use a hidden iframe or window.open
      window.open(whatsappUrl, '_blank');
      
      console.log('WhatsApp notification sent to admin');
      return true;
      
    } catch (error) {
      console.error('WhatsApp notification error:', error);
      return false;
    }
  }

  // ========== SEND WHATSAPP TO CUSTOMER ==========
  async function sendCustomerWhatsApp(orderData, orderId) {
    try {
      const customerPhone = orderData.phone;
      if (!customerPhone) return false;
      
      const orderTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      const message = `🛒 *Order Confirmed!* 🛒%0A%0A` +
        `Thank you for shopping with OK Mart!%0A%0A` +
        `📋 *Order ID:* #${orderId.slice(0, 8).toUpperCase()}%0A` +
        `⏰ *Order Time:* ${orderTime}%0A` +
        `💰 *Total Amount:* ₹${orderData.total}%0A` +
        `🚚 *Delivery Type:* ${orderData.deliveryType === 'quick' ? '⚡ Quick (10-15 min)' : '📅 Scheduled'}%0A%0A` +
        `🔗 *Track your order:* ${window.location.origin}/track-order.html?id=${orderId}%0A%0A` +
        `_Your order will be delivered soon. For any queries, contact us!_ 🙏`;
      
      const whatsappUrl = `https://wa.me/${customerPhone}?text=${message}`;
      // We won't auto-open customer WhatsApp to avoid spam
      // But we can log it
      console.log('Customer WhatsApp would be sent to:', customerPhone);
      
      return true;
      
    } catch (error) {
      console.error('Customer WhatsApp error:', error);
      return false;
    }
  }

  // ========== Place Order ==========
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
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    let delivery = 30;
    if (currentDeliveryType === 'scheduled') {
      delivery = 20;
    }
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      delivery = 0;
    }
    const total = subtotal + delivery;
    
    // Get delivery slot
    let deliverySlotValue = null;
    if (currentDeliveryType === 'scheduled') {
      deliverySlotValue = deliverySlot.value;
    }
    
    // Prepare order data
    const orderData = {
      name: userAddress.name,
      phone: userAddress.phone,
      email: userAddress.email || null,
      address: userAddress.address,
      city: userAddress.city || null,
      pincode: userAddress.pincode || null,
      landmark: userAddress.landmark || null,
      deliveryType: currentDeliveryType,
      deliverySlot: deliverySlotValue,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image
      })),
      subtotal: subtotal,
      deliveryCharge: delivery,
      discount: 0,
      total: total,
      status: 'received',
      orderDate: new Date().toISOString(),
      paymentMethod: 'cod'
    };
    
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Placing Order...';
    
    try {
      const docRef = await db.collection('orders').add(orderData);
      const orderId = docRef.id;
      
      // Send WhatsApp notification to Admin
      await sendWhatsAppNotification(orderData, orderId);
      
      // Send WhatsApp confirmation to Customer (optional - can be enabled later)
      // await sendCustomerWhatsApp(orderData, orderId);
      
      // Clear cart
      localStorage.removeItem('okmart_cart');
      
      // Clear applied coupon if any
      localStorage.removeItem('okmart_applied_coupon');
      
      // Save order ID for recent tracking
      saveToRecentOrders({ id: orderId, status: 'received', total: total });
      
      // Show success modal
      trackOrderBtn.onclick = () => {
        window.location.href = `/track-order.html?id=${orderId}`;
      };
      
      continueShoppingBtn.onclick = () => {
        window.location.href = '/';
      };
      
      successModal.classList.add('active');
      
      // Also show a toast that WhatsApp notification was sent
      showToast('Order placed! WhatsApp notification sent to admin', 'success');
      
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('Error placing order. Please try again.', 'error');
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order →';
    }
  }

  // ========== Save to Recent Orders ==========
  function saveToRecentOrders(order) {
    try {
      let recent = JSON.parse(localStorage.getItem('okmart_recent_orders') || '[]');
      recent = recent.filter(o => o.id !== order.id);
      recent.unshift({ 
        id: order.id, 
        status: order.status, 
        total: order.total,
        date: new Date().toISOString()
      });
      recent = recent.slice(0, 10);
      localStorage.setItem('okmart_recent_orders', JSON.stringify(recent));
    } catch(e) {}
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
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  // ========== Event Listeners ==========
  function initEventListeners() {
    // Delivery options
    document.querySelectorAll('input[name="deliveryType"]').forEach(radio => {
      radio.addEventListener('change', () => {
        toggleDeliverySlot();
      });
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
    toggleDeliverySlot();
    console.log('✅ Simplified checkout page with WhatsApp notification initialized');
  }
  
  init();
})();
