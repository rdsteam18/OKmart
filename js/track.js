// ===== OK MART - TRACK.JS =====
// Order tracking system using localStorage

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const ORDERS_STORAGE_KEY = 'okmart_orders';
  
  // Status display mapping
  const STATUS_DISPLAY = {
    'received': { label: 'Order Received', icon: '📋', color: 'received' },
    'preparing': { label: 'Preparing', icon: '🔪', color: 'preparing' },
    'outfordelivery': { label: 'Out for Delivery', icon: '🚚', color: 'outfordelivery' },
    'delivered': { label: 'Delivered', icon: '✅', color: 'delivered' }
  };
  
  // Status order for progress
  const STATUS_ORDER = ['received', 'preparing', 'outfordelivery', 'delivered'];
  
  // ---------- DOM ELEMENTS ----------
  const trackPhoneInput = document.getElementById('trackPhoneInput');
  const trackSearchBtn = document.getElementById('trackSearchBtn');
  const trackLoading = document.getElementById('trackLoading');
  const trackResultSection = document.getElementById('trackResultSection');
  const orderFoundCard = document.getElementById('orderFoundCard');
  const noOrderCard = document.getElementById('noOrderCard');
  const noOrderMessage = document.getElementById('noOrderMessage');
  const tryAgainBtn = document.getElementById('tryAgainBtn');
  
  // Display elements
  const displayOrderId = document.getElementById('displayOrderId');
  const displayOrderDate = document.getElementById('displayOrderDate');
  const displayOrderStatus = document.getElementById('displayOrderStatus');
  const deliveryEstimateText = document.getElementById('deliveryEstimateText');
  const deliveryEstimateSection = document.getElementById('deliveryEstimateSection');
  const orderItemsList = document.getElementById('orderItemsList');
  const displayCustomerName = document.getElementById('displayCustomerName');
  const displayCustomerPhone = document.getElementById('displayCustomerPhone');
  const displayCustomerAddress = document.getElementById('displayCustomerAddress');
  const displayOrderTotal = document.getElementById('displayOrderTotal');
  const displayPaymentMethod = document.getElementById('displayPaymentMethod');
  
  // ---------- UTILITY FUNCTIONS ----------
  
  function getOrders() {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  function saveOrders(orders) {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }
  
  function findOrdersByPhone(phone) {
    const orders = getOrders();
    const cleanPhone = phone.replace(/\D/g, '');
    return orders.filter(order => order.phone === cleanPhone);
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getStatusIndex(status) {
    return STATUS_ORDER.indexOf(status);
  }
  
  function updateProgressBar(currentStatus) {
    const steps = document.querySelectorAll('.progress-step');
    const lines = document.querySelectorAll('.progress-line');
    const currentIndex = getStatusIndex(currentStatus);
    
    steps.forEach((step, index) => {
      const stepStatus = step.dataset.status;
      const stepIndex = STATUS_ORDER.indexOf(stepStatus);
      
      step.classList.remove('completed', 'active');
      
      if (stepIndex < currentIndex) {
        step.classList.add('completed');
      } else if (stepIndex === currentIndex) {
        step.classList.add('active');
      }
    });
    
    lines.forEach((line, index) => {
      line.classList.remove('completed');
      if (index < currentIndex) {
        line.classList.add('completed');
      }
    });
  }
  
  function getEstimatedDeliveryText(status) {
    switch (status) {
      case 'received':
        return 'Estimated delivery: 20-25 mins';
      case 'preparing':
        return 'Estimated delivery: 10-15 mins';
      case 'outfordelivery':
        return 'Your order is on the way! 5-10 mins';
      case 'delivered':
        return 'Order delivered successfully!';
      default:
        return 'Estimated delivery: 15-20 mins';
    }
  }
  
  // ---------- RENDER FUNCTIONS ----------
  
  function renderOrderDetails(order) {
    // Order header
    if (displayOrderId) {
      displayOrderId.textContent = `#${order.orderId || 'OKM' + Date.now().toString(36)}`;
    }
    if (displayOrderDate) {
      displayOrderDate.textContent = `Placed on ${formatDate(order.orderDate)} at ${formatTime(order.orderDate)}`;
    }
    
    // Status
    const statusInfo = STATUS_DISPLAY[order.status] || STATUS_DISPLAY.received;
    if (displayOrderStatus) {
      displayOrderStatus.textContent = statusInfo.label;
      displayOrderStatus.dataset.status = order.status;
      displayOrderStatus.className = `status-badge status-${statusInfo.color}`;
    }
    
    // Progress bar
    updateProgressBar(order.status);
    
    // Delivery estimate
    if (deliveryEstimateText) {
      if (order.status === 'delivered') {
        deliveryEstimateSection.style.display = 'none';
      } else {
        deliveryEstimateSection.style.display = 'flex';
        deliveryEstimateText.textContent = order.estimatedDelivery || getEstimatedDeliveryText(order.status);
      }
    }
    
    // Order items
    if (orderItemsList) {
      orderItemsList.innerHTML = '';
      order.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'order-item-row';
        row.innerHTML = `
          <div class="item-name">
            <span>${item.name}</span>
            <span class="item-quantity">x${item.quantity}</span>
          </div>
          <span class="item-price">₹${item.price * item.quantity}</span>
        `;
        orderItemsList.appendChild(row);
      });
    }
    
    // Customer details
    if (displayCustomerName) {
      displayCustomerName.textContent = order.customerName || '-';
    }
    if (displayCustomerPhone) {
      displayCustomerPhone.textContent = order.phone || '-';
    }
    if (displayCustomerAddress) {
      displayCustomerAddress.textContent = order.customerAddress || '-';
    }
    
    // Total
    if (displayOrderTotal) {
      displayOrderTotal.textContent = `₹${order.total || 0}`;
    }
    if (displayPaymentMethod) {
      displayPaymentMethod.textContent = order.paymentMethod || 'Cash on Delivery';
    }
  }
  
  function showOrderFound(order) {
    orderFoundCard.style.display = 'block';
    noOrderCard.style.display = 'none';
    trackResultSection.style.display = 'block';
    renderOrderDetails(order);
  }
  
  function showNoOrder(phone) {
    orderFoundCard.style.display = 'none';
    noOrderCard.style.display = 'block';
    trackResultSection.style.display = 'block';
    
    if (noOrderMessage && phone) {
      noOrderMessage.textContent = `We couldn't find any order with phone number +91 ${phone}`;
    }
  }
  
  function showLoading() {
    trackLoading.style.display = 'block';
    trackResultSection.style.display = 'none';
  }
  
  function hideLoading() {
    trackLoading.style.display = 'none';
  }
  
  // ---------- SEARCH FUNCTION ----------
  
  function searchOrder(phone) {
    if (!phone || phone.length < 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    
    showLoading();
    
    // Simulate network delay for better UX
    setTimeout(() => {
      const orders = findOrdersByPhone(phone);
      
      hideLoading();
      
      if (orders.length > 0) {
        // Show most recent order first
        const latestOrder = orders.sort((a, b) => 
          new Date(b.orderDate) - new Date(a.orderDate)
        )[0];
        showOrderFound(latestOrder);
      } else {
        showNoOrder(phone);
      }
    }, 500);
  }
  
  // ---------- EVENT LISTENERS ----------
  
  if (trackSearchBtn) {
    trackSearchBtn.addEventListener('click', () => {
      const phone = trackPhoneInput?.value.trim();
      searchOrder(phone);
    });
  }
  
  if (trackPhoneInput) {
    trackPhoneInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const phone = e.target.value.trim();
        searchOrder(phone);
      }
    });
    
    // Only allow numbers
    trackPhoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  }
  
  if (tryAgainBtn) {
    tryAgainBtn.addEventListener('click', () => {
      trackResultSection.style.display = 'none';
      if (trackPhoneInput) {
        trackPhoneInput.value = '';
        trackPhoneInput.focus();
      }
    });
  }
  
  // ---------- INITIALIZATION ----------
  
  function init() {
    // Check for phone in URL (if coming from checkout)
    const params = new URLSearchParams(window.location.search);
    const phoneParam = params.get('phone');
    
    if (phoneParam) {
      if (trackPhoneInput) {
        trackPhoneInput.value = phoneParam;
      }
      searchOrder(phoneParam);
    }
    
    // Update cart badge
    if (window.OKMart && window.OKMart.getCartItems) {
      const cart = window.OKMart.getCartItems();
      const badges = document.querySelectorAll('.cart-badge');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      badges.forEach(badge => {
        if (badge) badge.textContent = totalItems;
      });
    }
  }
  
  init();
  
  // Expose for debugging and checkout integration
  window.OKMartTrack = {
    searchOrder,
    getOrders,
    addOrder: (order) => {
      const orders = getOrders();
      orders.push({
        ...order,
        orderDate: order.orderDate || new Date().toISOString(),
        status: order.status || 'received'
      });
      saveOrders(orders);
      return order;
    },
    updateOrderStatus: (orderId, status) => {
      const orders = getOrders();
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        order.status = status;
        saveOrders(orders);
        return true;
      }
      return false;
    }
  };
  
})();
