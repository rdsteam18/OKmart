// ===== OK MART - ORDERS.JS =====
// Order history page with order details modal and "Order Again" feature

(function() {
  'use strict';
  
  // ---------- STATE ----------
  let allOrders = [];
  let currentOrder = null;
  
  // DOM Elements
  const ordersLoadingState = document.getElementById('ordersLoadingState');
  const ordersContainer = document.getElementById('ordersContainer');
  const ordersList = document.getElementById('ordersList');
  const emptyOrdersState = document.getElementById('emptyOrdersState');
  
  // Modal Elements
  const modalOverlay = document.getElementById('orderModalOverlay');
  const modal = document.getElementById('orderModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalOrderId = document.getElementById('modalOrderId');
  const modalOrderDate = document.getElementById('modalOrderDate');
  const modalOrderStatus = document.getElementById('modalOrderStatus');
  const modalOrderItems = document.getElementById('modalOrderItems');
  const modalSubtotal = document.getElementById('modalSubtotal');
  const modalDelivery = document.getElementById('modalDelivery');
  const modalTotal = document.getElementById('modalTotal');
  const orderAgainBtn = document.getElementById('orderAgainBtn');
  const trackOrderBtn = document.getElementById('trackOrderBtn');
  const toastMessage = document.getElementById('toastMessage');
  
  // Status display mapping
  const STATUS_DISPLAY = {
    'received': '📋 Received',
    'preparing': '🟡 Preparing',
    'outfordelivery': '🚚 Out for Delivery',
    'delivered': '✅ Delivered'
  };
  
  // ---------- DATA LOADING ----------
  
  function loadOrders() {
    const stored = localStorage.getItem('okmart_orders');
    allOrders = stored ? JSON.parse(stored) : [];
    
    // Sort by date (newest first)
    allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return allOrders;
  }
  
  // ---------- RENDERING ----------
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  function getItemsPreview(items) {
    if (!items || items.length === 0) return 'No items';
    const names = items.slice(0, 3).map(item => item.name.split(' ')[0]);
    const preview = names.join(', ');
    return items.length > 3 ? `${preview} +${items.length - 3} more` : preview;
  }
  
  function renderOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.dataset.orderId = order.orderId;
    
    const statusClass = order.status || 'received';
    const statusText = STATUS_DISPLAY[order.status] || STATUS_DISPLAY.received;
    
    card.innerHTML = `
      <div class="order-card-header">
        <span class="order-id">#${order.orderId || 'OKM001'}</span>
        <span class="order-status ${statusClass}">${statusText}</span>
      </div>
      <div class="order-details">
        <span class="order-date">
          <span>📅</span> ${formatDate(order.date)} ${order.time ? '· ' + order.time : ''}
        </span>
      </div>
      <div class="order-items-preview">
        ${getItemsPreview(order.items)}
      </div>
      <div class="order-footer">
        <span class="order-total">₹${order.total || 0}</span>
        <button class="order-again-small" data-order-id="${order.orderId}">
          🔄 Order Again
        </button>
      </div>
    `;
    
    // Open modal on card click (except on Order Again button)
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('order-again-small')) {
        openOrderModal(order);
      }
    });
    
    // Order Again button
    const orderAgainBtn = card.querySelector('.order-again-small');
    orderAgainBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      orderAgain(order);
    });
    
    return card;
  }
  
  function renderOrdersList() {
    if (ordersList) {
      ordersList.innerHTML = '';
      
      allOrders.forEach(order => {
        ordersList.appendChild(renderOrderCard(order));
      });
    }
  }
  
  function updateUI() {
    if (ordersLoadingState) {
      ordersLoadingState.style.display = 'none';
    }
    
    if (allOrders.length === 0) {
      ordersContainer.style.display = 'none';
      emptyOrdersState.style.display = 'block';
    } else {
      ordersContainer.style.display = 'block';
      emptyOrdersState.style.display = 'none';
      renderOrdersList();
    }
  }
  
  // ---------- MODAL FUNCTIONS ----------
  
  function openOrderModal(order) {
    currentOrder = order;
    
    // Update modal content
    modalOrderId.textContent = `#${order.orderId || 'OKM001'}`;
    modalOrderDate.textContent = `${formatDate(order.date)} ${order.time ? '· ' + order.time : ''}`;
    
    const statusText = STATUS_DISPLAY[order.status] || STATUS_DISPLAY.received;
    modalOrderStatus.textContent = statusText;
    modalOrderStatus.className = `status-badge ${order.status || 'received'}`;
    
    // Render items
    renderModalItems(order.items);
    
    // Update totals
    const subtotal = order.subtotal || order.total - (order.deliveryCharge || 0);
    const delivery = order.deliveryCharge || 0;
    const total = order.total || 0;
    
    modalSubtotal.textContent = `₹${subtotal}`;
    modalDelivery.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
    modalTotal.textContent = `₹${total}`;
    
    // Show modal
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function renderModalItems(items) {
    if (!modalOrderItems) return;
    
    modalOrderItems.innerHTML = '';
    
    if (!items || items.length === 0) {
      modalOrderItems.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No items</p>';
      return;
    }
    
    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'modal-order-item';
      itemEl.innerHTML = `
        <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}" class="item-image" onerror="this.src='https://via.placeholder.com/50?text=OK'">
        <div class="item-details">
          <div class="item-name">${item.name}</div>
          <div class="item-qty">Qty: ${item.quantity}</div>
        </div>
        <div class="item-price">₹${item.price * item.quantity}</div>
      `;
      modalOrderItems.appendChild(itemEl);
    });
  }
  
  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    currentOrder = null;
  }
  
  // ---------- ORDER AGAIN FUNCTION ----------
  
  function orderAgain(order) {
    if (!order || !order.items || order.items.length === 0) {
      showToast('No items to reorder', 'error');
      return;
    }
    
    // Clear current cart
    localStorage.removeItem('okmart_cart');
    
    // Create new cart with items from the order
    const cartItems = order.items.map(item => ({
      id: item.id || `reorder_${Date.now()}_${Math.random()}`,
      name: item.name,
      price: item.price,
      mrp: item.mrp || item.price,
      image: item.image || 'https://via.placeholder.com/100',
      unit: item.unit || '',
      quantity: item.quantity
    }));
    
    // Save to cart
    localStorage.setItem('okmart_cart', JSON.stringify(cartItems));
    
    // Update cart UI if available
    if (window.OKMart && window.OKMart.updateStickyCartBar) {
      window.OKMart.updateStickyCartBar();
    }
    
    // Show success message
    showToast(`${cartItems.length} items added to cart!`, 'success');
    
    // Close modal
    closeModal();
    
    // Redirect to cart page after short delay
    setTimeout(() => {
      window.location.href = '/cart.html';
    }, 800);
  }
  
  // ---------- TRACK ORDER ----------
  
  function trackOrder(order) {
    if (order && order.orderId) {
      window.location.href = `/track.html?order=${order.orderId}`;
    } else {
      window.location.href = '/track.html';
    }
  }
  
  // ---------- TOAST ----------
  
  function showToast(message, type = 'info') {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 2500);
  }
  
  // ---------- EVENT LISTENERS ----------
  
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }
  
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
  
  if (orderAgainBtn) {
    orderAgainBtn.addEventListener('click', () => {
      if (currentOrder) {
        orderAgain(currentOrder);
      }
    });
  }
  
  if (trackOrderBtn) {
    trackOrderBtn.addEventListener('click', () => {
      if (currentOrder) {
        trackOrder(currentOrder);
      }
    });
  }
  
  // Swipe down to close modal
  let startY = 0;
  if (modal) {
    modal.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });
    
    modal.addEventListener('touchmove', (e) => {
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 50) {
        closeModal();
      }
    }, { passive: true });
  }
  
  // ---------- SAVE ORDER FUNCTION (for checkout integration) ----------
  
  function saveOrder(orderData) {
    const orders = JSON.parse(localStorage.getItem('okmart_orders') || '[]');
    
    const newOrder = {
      orderId: orderData.orderId || `OKM-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      total: orderData.total || 0,
      deliveryCharge: orderData.deliveryCharge || 0,
      subtotal: orderData.subtotal || orderData.total || 0,
      status: orderData.status || 'received',
      paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
      items: orderData.items || []
    };
    
    orders.push(newOrder);
    localStorage.setItem('okmart_orders', JSON.stringify(orders));
    
    console.log('✅ Order saved:', newOrder.orderId);
    return newOrder;
  }
  
  // ---------- INITIALIZATION ----------
  
  function init() {
    loadOrders();
    updateUI();
    
    // Update cart badge
    const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      if (badge) badge.textContent = totalItems;
    });
    
    console.log('✅ Orders page initialized |', allOrders.length, 'orders');
  }
  
  init();
  
  // Expose for checkout integration
  window.OKMartOrders = {
    saveOrder,
    loadOrders: () => allOrders,
    refresh: init
  };
  
})();
