// ===== OK MART - ORDERS.JS =====
// Complete orders page with order history and "Order Again" feature

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const ORDERS_KEY = 'okmart_orders';
  const WHATSAPP_NUMBER = '919982239821';
  
  let allOrders = [];
  let filteredOrders = [];
  let currentFilter = 'all';
  let currentOrder = null;
  
  // DOM Elements
  const ordersLoadingState = document.getElementById('ordersLoadingState');
  const ordersContainer = document.getElementById('ordersContainer');
  const ordersList = document.getElementById('ordersList');
  const emptyOrdersState = document.getElementById('emptyOrdersState');
  const suggestionGrid = document.getElementById('suggestionGrid');
  
  const totalOrdersCount = document.getElementById('totalOrdersCount');
  const totalSpent = document.getElementById('totalSpent');
  const activeOrdersCount = document.getElementById('activeOrdersCount');
  
  const filterTabs = document.querySelectorAll('.filter-tab');
  
  // Modal Elements
  const modalOverlay = document.getElementById('orderModalOverlay');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalOrderId = document.getElementById('modalOrderId');
  const modalOrderDateTime = document.getElementById('modalOrderDateTime');
  const modalOrderStatus = document.getElementById('modalOrderStatus');
  const modalPaymentMethod = document.getElementById('modalPaymentMethod');
  const modalCustomerName = document.getElementById('modalCustomerName');
  const modalCustomerPhone = document.getElementById('modalCustomerPhone');
  const modalCustomerAddress = document.getElementById('modalCustomerAddress');
  const modalOrderItems = document.getElementById('modalOrderItems');
  const modalSubtotal = document.getElementById('modalSubtotal');
  const modalCouponRow = document.getElementById('modalCouponRow');
  const modalCouponDiscount = document.getElementById('modalCouponDiscount');
  const modalDelivery = document.getElementById('modalDelivery');
  const modalTotal = document.getElementById('modalTotal');
  
  const orderAgainBtn = document.getElementById('orderAgainBtn');
  const trackOrderBtn = document.getElementById('trackOrderBtn');
  const supportBtn = document.getElementById('supportBtn');
  
  const toastMessage = document.getElementById('toastMessage');
  
  // Status display mapping
  const STATUS_DISPLAY = {
    'received': '📋 Received',
    'preparing': '🟡 Preparing',
    'outfordelivery': '🚚 Out for Delivery',
    'delivered': '✅ Delivered',
    'cancelled': '❌ Cancelled'
  };
  
  // ---------- DATA LOADING ----------
  
  async function loadOrders() {
    // ✅ Step 1: Firebase se load karo (if user logged in)
    try {
      const userJson = localStorage.getItem('okmart_user');
      const user = userJson ? JSON.parse(userJson) : null;
      
      if (user && user.phone && typeof db !== 'undefined') {
        // Firebase se orders load karo
        const snapshot = await db.collection('orders')
          .where('phone', '==', user.phone.replace('+91', '').replace(/\s/g,''))
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();
        
        if (!snapshot.empty) {
          allOrders = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            allOrders.push({
              ...data,
              firebaseId: doc.id,
              // Normalize date field (Firebase Timestamp vs string)
              date: data.createdAt 
                ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt)
                : (data.date || new Date().toISOString())
            });
          });
          
          // ✅ Sync to localStorage as backup
          localStorage.setItem(ORDERS_KEY, JSON.stringify(allOrders));
          return allOrders;
        }
      }
    } catch (firebaseError) {
      console.warn('Firebase orders load failed, using localStorage:', firebaseError.message);
    }
    
    // ⚠️ Fallback: localStorage se load karo
    const stored = localStorage.getItem(ORDERS_KEY);
    allOrders = stored ? JSON.parse(stored) : [];
    
    // Sort by date (newest first)
    allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return allOrders;
  }
  
  function filterOrders() {
    if (currentFilter === 'all') {
      filteredOrders = [...allOrders];
    } else if (currentFilter === 'active') {
      filteredOrders = allOrders.filter(o => 
        o.status === 'received' || o.status === 'preparing' || o.status === 'outfordelivery'
      );
    } else if (currentFilter === 'delivered') {
      filteredOrders = allOrders.filter(o => o.status === 'delivered');
    }
    
    return filteredOrders;
  }
  
  // ---------- RENDERING ----------
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
    
    // Get preview images
    const previewImages = order.items.slice(0, 3).map(item => 
      `<img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/32?text=OK'">`
    ).join('');
    
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
        <div class="preview-images">${previewImages}</div>
        <span class="preview-text">${getItemsPreview(order.items)}</span>
      </div>
      <div class="order-footer">
        <span class="order-total">₹${order.total || 0}</span>
        <button class="order-again-small" data-order-id="${order.orderId}">
          🔄 Order Again
        </button>
      </div>
    `;
    
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('order-again-small')) {
        openOrderModal(order);
      }
    });
    
    card.querySelector('.order-again-small').addEventListener('click', (e) => {
      e.stopPropagation();
      orderAgain(order);
    });
    
    return card;
  }
  
  function renderOrdersList() {
    filterOrders();
    
    if (ordersList) {
      ordersList.innerHTML = '';
      
      if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
            <span style="font-size: 3rem; opacity: 0.5; display: block; margin-bottom: 16px;">📭</span>
            <p>No ${currentFilter === 'active' ? 'active' : currentFilter === 'delivered' ? 'delivered' : ''} orders found</p>
          </div>
        `;
        return;
      }
      
      filteredOrders.forEach(order => {
        ordersList.appendChild(renderOrderCard(order));
      });
    }
  }
  
  function updateStats() {
    const total = allOrders.length;
    const spent = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const active = allOrders.filter(o => 
      o.status === 'received' || o.status === 'preparing' || o.status === 'outfordelivery'
    ).length;
    
    if (totalOrdersCount) totalOrdersCount.textContent = total;
    if (totalSpent) totalSpent.textContent = `₹${spent}`;
    if (activeOrdersCount) activeOrdersCount.textContent = active;
  }
  
  function updateUI() {
    if (ordersLoadingState) ordersLoadingState.style.display = 'none';
    
    if (allOrders.length === 0) {
      ordersContainer.style.display = 'none';
      emptyOrdersState.style.display = 'block';
      loadSuggestedProducts();
    } else {
      ordersContainer.style.display = 'block';
      emptyOrdersState.style.display = 'none';
      updateStats();
      renderOrdersList();
    }
  }
  
  async function loadSuggestedProducts() {
    try {
      const response = await fetch('/data/dairy.json');
      if (response.ok) {
        const data = await response.json();
        const products = data.products.slice(0, 4);
        
        suggestionGrid.innerHTML = '';
        products.forEach(product => {
          const card = document.createElement('div');
          card.className = 'product-card';
          card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3 class="product-name">${product.name}</h3>
            <div class="price-row">
              <span class="current-price">₹${product.price}</span>
            </div>
            <button class="add-btn">ADD</button>
          `;
          suggestionGrid.appendChild(card);
        });
      }
    } catch (e) {}
  }
  
  // ---------- MODAL FUNCTIONS ----------
  
  function openOrderModal(order) {
    currentOrder = order;
    
    modalOrderId.textContent = `#${order.orderId || 'OKM001'}`;
    modalOrderDateTime.textContent = `${formatDate(order.date)} ${order.time ? '· ' + order.time : ''}`;
    
    const statusText = STATUS_DISPLAY[order.status] || STATUS_DISPLAY.received;
    modalOrderStatus.textContent = statusText;
    modalOrderStatus.className = `status-badge ${order.status || 'received'}`;
    
    modalPaymentMethod.textContent = order.paymentMethod || 'Cash on Delivery';
    
    // Customer details
    modalCustomerName.textContent = order.customerName || 'Customer';
    modalCustomerPhone.textContent = order.customerPhone ? `+91 ${order.customerPhone}` : '-';
    modalCustomerAddress.textContent = order.customerAddress || 'Address not available';
    
    // Render items
    renderModalItems(order.items);
    
    // Update totals
    const subtotal = order.subtotal || order.total - (order.deliveryCharge || 0);
    const delivery = order.deliveryCharge || 0;
    const total = order.total || 0;
    const couponDiscount = order.couponDiscount || 0;
    
    modalSubtotal.textContent = `₹${subtotal}`;
    
    if (couponDiscount > 0) {
      modalCouponRow.style.display = 'flex';
      modalCouponDiscount.textContent = `-₹${couponDiscount}`;
    } else {
      modalCouponRow.style.display = 'none';
    }
    
    modalDelivery.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
    modalTotal.textContent = `₹${total}`;
    
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
  
  // ---------- ORDER AGAIN ----------
  
  function orderAgain(order) {
    if (!order || !order.items || order.items.length === 0) {
      showToast('No items to reorder', 'error');
      return;
    }
    
    localStorage.removeItem(CART_KEY);
    
    const cartItems = order.items.map(item => ({
      id: item.id || `reorder_${Date.now()}_${Math.random()}`,
      name: item.name,
      price: item.price,
      mrp: item.mrp || item.price,
      image: item.image || 'https://via.placeholder.com/100',
      unit: item.unit || '',
      quantity: item.quantity
    }));
    
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    
    if (window.OKMart && window.OKMart.updateStickyCartBar) {
      window.OKMart.updateStickyCartBar();
    }
    
    showToast(`${cartItems.length} items added to cart!`, 'success');
    closeModal();
    
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
  
  // ---------- SUPPORT ----------
  
  function openSupport(order) {
    const message = `Hello OK Mart,\n\nI need help with my order.\n\nOrder ID: ${order.orderId}\nStatus: ${order.status}\n\nPlease assist me.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  }
  
  // ---------- TOAST ----------
  
  function showToast(message, type = 'info') {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => toastMessage.classList.remove('show'), 2500);
  }
  
  // ---------- EVENT LISTENERS ----------
  
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderOrdersList();
    });
  });
  
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }
  
  if (orderAgainBtn) {
    orderAgainBtn.addEventListener('click', () => {
      if (currentOrder) orderAgain(currentOrder);
    });
  }
  
  if (trackOrderBtn) {
    trackOrderBtn.addEventListener('click', () => {
      if (currentOrder) trackOrder(currentOrder);
    });
  }
  
  if (supportBtn) {
    supportBtn.addEventListener('click', () => {
      if (currentOrder) openSupport(currentOrder);
    });
  }
  
  // Swipe down to close modal
  const modal = document.getElementById('orderModal');
  let startY = 0;
  if (modal) {
    modal.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });
    
    modal.addEventListener('touchmove', (e) => {
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 50) closeModal();
    }, { passive: true });
  }
  
  // Update cart badge
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => {
      if (b) b.textContent = total;
// ---------- MODAL FUNCTIONS ----------

function openOrderModal(order) {
  currentOrder = order;
  
  modalOrderId.textContent = `#${order.orderId || 'OKM001'}`;
  modalOrderDateTime.textContent = `${formatDate(order.date)} ${order.time ? '· ' + order.time : ''}`;
  
  const statusText = STATUS_DISPLAY[order.status] || STATUS_DISPLAY.received;
  modalOrderStatus.textContent = statusText;
  modalOrderStatus.className = `status-badge ${order.status || 'received'}`;
  
  modalPaymentMethod.textContent = order.paymentMethod || 'Cash on Delivery';
  
  // Customer details
  modalCustomerName.textContent = order.customerName || 'Customer';
  modalCustomerPhone.textContent = order.customerPhone ? `+91 ${order.customerPhone}` : '-';
  modalCustomerAddress.textContent = order.customerAddress || 'Address not available';
  
  // Render items
  renderModalItems(order.items);
  
  // Update totals
  const subtotal = order.subtotal || order.total - (order.deliveryCharge || 0);
  const delivery = order.deliveryCharge || 0;
  const total = order.total || 0;
  const couponDiscount = order.couponDiscount || 0;
  
  modalSubtotal.textContent = `₹${subtotal}`;
  
  if (couponDiscount > 0) {
    modalCouponRow.style.display = 'flex';
    modalCouponDiscount.textContent = `-₹${couponDiscount}`;
  } else {
    modalCouponRow.style.display = 'none';
  }
  
  modalDelivery.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
  modalTotal.textContent = `₹${total}`;
  
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

// ---------- ORDER AGAIN ----------

function orderAgain(order) {
  if (!order || !order.items || order.items.length === 0) {
    showToast('No items to reorder', 'error');
    return;
  }
  
  localStorage.removeItem(CART_KEY);
  
  const cartItems = order.items.map(item => ({
    id: item.id || `reorder_${Date.now()}_${Math.random()}`,
    name: item.name,
    price: item.price,
    mrp: item.mrp || item.price,
    image: item.image || 'https://via.placeholder.com/100',
    unit: item.unit || '',
    quantity: item.quantity
  }));
  
  localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  
  if (window.OKMart && window.OKMart.updateStickyCartBar) {
    window.OKMart.updateStickyCartBar();
  }
  
  showToast(`${cartItems.length} items added to cart!`, 'success');
  closeModal();
  
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

// ---------- SUPPORT ----------

function openSupport(order) {
  const message = `Hello OK Mart,\n\nI need help with my order.\n\nOrder ID: ${order.orderId}\nStatus: ${order.status}\n\nPlease assist me.`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

// ---------- TOAST ----------

function showToast(message, type = 'info') {
  if (!toastMessage) return;
  
  toastMessage.textContent = message;
  toastMessage.className = `toast-message ${type}`;
  toastMessage.classList.add('show');
  
  setTimeout(() => toastMessage.classList.remove('show'), 2500);
}

// ---------- EVENT LISTENERS ----------

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    renderOrdersList();
  });
});

if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

if (orderAgainBtn) {
  orderAgainBtn.addEventListener('click', () => {
    if (currentOrder) orderAgain(currentOrder);
  });
}

if (trackOrderBtn) {
  trackOrderBtn.addEventListener('click', () => {
    if (currentOrder) trackOrder(currentOrder);
  });
}

if (supportBtn) {
  supportBtn.addEventListener('click', () => {
    if (currentOrder) openSupport(currentOrder);
  });
}

// Swipe down to close modal
const modal = document.getElementById('orderModal');
let startY = 0;
if (modal) {
  modal.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });
  
  modal.addEventListener('touchmove', (e) => {
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 50) closeModal();
  }, { passive: true });
}

// Update cart badge
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-badge').forEach(b => {
    if (b) b.textContent = total;
  });
}

// ---------- INITIALIZATION ----------

async function init() {
  // Show loading state
  if (ordersLoadingState) ordersLoadingState.style.display = 'block';
  
  await loadOrders();
  updateUI();
  updateCartBadge();
}

init();

})();
