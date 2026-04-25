// ===== OK MART - ORDER TRACKING.JS =====
// Complete order tracking with Firebase

(function() {
  'use strict';
  
  // ========== STATUS CONFIG ==========
  const STATUS_STEPS = ['received', 'preparing', 'outfordelivery', 'delivered'];
  const STATUS_ICONS = { received: '📋', preparing: '🔪', outfordelivery: '🚚', delivered: '✅' };
  const STATUS_LABELS = { received: 'Received', preparing: 'Preparing', outfordelivery: 'Out for Delivery', delivered: 'Delivered' };
  
  // ========== DOM ELEMENTS ==========
  const trackInput = document.getElementById('trackInput');
  const trackBtn = document.getElementById('trackBtn');
  const trackBtnText = document.getElementById('trackBtnText');
  const trackSpinner = document.getElementById('trackSpinner');
  const loadingState = document.getElementById('loadingState');
  const singleOrderResult = document.getElementById('singleOrderResult');
  const multipleOrders = document.getElementById('multipleOrders');
  const orderList = document.getElementById('orderList');
  const noResult = document.getElementById('noResult');
  const recentOrdersList = document.getElementById('recentOrdersList');
  const noRecentOrders = document.getElementById('noRecentOrders');
  const toastMessage = document.getElementById('toastMessage');
  
  // ========== TRACK ORDER ==========
  async function trackOrder() {
    const input = trackInput.value.trim();
    if (!input) {
      showToast('Please enter phone number or order ID', 'error');
      return;
    }
    
    // Show loading
    trackBtn.disabled = true;
    trackBtnText.style.display = 'none';
    trackSpinner.style.display = 'inline-block';
    loadingState.style.display = 'block';
    singleOrderResult.style.display = 'none';
    multipleOrders.style.display = 'none';
    noResult.style.display = 'none';
    
    try {
      let results = [];
      
      // Try exact document ID match first
      const docSnap = await db.collection('orders').doc(input).get();
      if (docSnap.exists) {
        results = [{ id: docSnap.id, ...docSnap.data() }];
      } else {
        // Search by orderId field
        const orderIdSnap = await db.collection('orders').where('orderId', '==', input).get();
        orderIdSnap.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        
        if (results.length === 0) {
          // Search by phone
          const phoneSnap = await db.collection('orders').where('customerPhone', '==', input).get();
          phoneSnap.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
          
          // Also try 'phone' field
          if (results.length === 0) {
            const phoneSnap2 = await db.collection('orders').where('phone', '==', input).get();
            phoneSnap2.forEach(doc => {
              if (!results.find(r => r.id === doc.id)) results.push({ id: doc.id, ...doc.data() });
            });
          }
        }
      }
      
      // Sort by date (newest first)
      results.sort((a, b) => new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date));
      
      // Hide loading
      loadingState.style.display = 'none';
      
      if (results.length === 0) {
        noResult.style.display = 'block';
      } else if (results.length === 1) {
        showSingleOrder(results[0]);
      } else {
        showMultipleOrders(results);
      }
      
    } catch (err) {
      console.error('Search error:', err);
      loadingState.style.display = 'none';
      noResult.style.display = 'block';
      showToast('Error searching. Try again.', 'error');
    }
    
    // Reset button
    trackBtn.disabled = false;
    trackBtnText.style.display = 'inline';
    trackSpinner.style.display = 'none';
  }
  
  // ========== DISPLAY SINGLE ORDER ==========
  function showSingleOrder(order) {
    singleOrderResult.style.display = 'block';
    
    const currentStatus = order.status || 'received';
    const currentIdx = STATUS_STEPS.indexOf(currentStatus);
    
    // Build status steps
    let stepsHTML = '<div class="status-steps">';
    STATUS_STEPS.forEach((step, idx) => {
      let stepClass = '';
      if (idx < currentIdx) stepClass = 'completed';
      else if (idx === currentIdx) stepClass = 'active';
      
      stepsHTML += `
        <div class="status-step ${stepClass}">
          <div class="step-circle">${STATUS_ICONS[step]}</div>
          <span class="step-label">${STATUS_LABELS[step]}</span>
        </div>
      `;
      if (idx < 3) {
        stepsHTML += `<div class="step-line ${idx < currentIdx ? 'completed' : ''}"></div>`;
      }
    });
    stepsHTML += '</div>';
    
    // Build items list
    const items = order.items || [];
    let itemsHTML = items.map(item => `
      <div class="detail-item-row">
        <span>${item.name} x${item.quantity}</span>
        <span style="font-weight:600;">₹${(item.price || 0) * (item.quantity || 1)}</span>
      </div>
    `).join('');
    
    singleOrderResult.innerHTML = `
      <div class="order-result-card">
        <div class="order-id-display">#${order.orderId || order.id?.slice(-8).toUpperCase() || 'N/A'}</div>
        <div class="order-date-display">📅 ${new Date(order.orderDate || order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        
        <span class="status-badge status-${currentStatus}">${STATUS_LABELS[currentStatus] || currentStatus}</span>
        
        <div class="status-tracker">${stepsHTML}</div>
        
        <div class="order-details">
          <div class="detail-heading">📋 Order Items</div>
          <div class="detail-items-list">${itemsHTML || '<p style="color:var(--muted);">No items</p>'}</div>
          
          <div class="customer-info-section">
            <p><strong>👤 ${order.customerName || order.name || 'Customer'}</strong></p>
            <p>📱 ${order.customerPhone || order.phone || '-'}</p>
            <p>🏠 ${order.customerAddress || order.address || '-'}</p>
          </div>
          
          <div class="total-display">
            <span>Total Amount</span>
            <span>₹${Number(order.total || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  // ========== DISPLAY MULTIPLE ORDERS ==========
  function showMultipleOrders(orders) {
    multipleOrders.style.display = 'block';
    
    orderList.innerHTML = orders.map(order => {
      const status = order.status || 'received';
      return `
        <div class="order-mini-card" onclick="window.showSingleOrderById('${order.id}')">
          <div class="order-mini-header">
            <span class="order-mini-id">#${order.orderId || order.id?.slice(-8).toUpperCase()}</span>
            <span class="order-mini-total">₹${Number(order.total || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="order-mini-footer">
            <span>${new Date(order.orderDate || order.date).toLocaleDateString('en-IN')}</span>
            <span class="status-badge status-${status}">${STATUS_LABELS[status] || status}</span>
          </div>
        </div>
      `;
    }).join('');
    
    singleOrderResult.style.display = 'none';
  }
  
  // ========== GLOBAL FUNCTION ==========
  window.showSingleOrderById = (id) => {
    const order = window._allOrders?.find(o => o.id === id);
    if (order) {
      multipleOrders.style.display = 'none';
      showSingleOrder(order);
    }
  };
  
  // ========== RECENT ORDERS (LOCAL) ==========
  function loadRecentOrders() {
    const orders = JSON.parse(localStorage.getItem('okmart_orders') || '[]');
    
    if (orders.length === 0) return;
    
    noRecentOrders.style.display = 'none';
    
    // Sort by newest
    orders.sort((a, b) => new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date));
    
    recentOrdersList.innerHTML = orders.slice(0, 5).map(order => {
      const status = order.status || 'received';
      return `
        <div class="order-mini-card" onclick="window.trackLocalOrder('${order.orderId}')">
          <div class="order-mini-header">
            <span class="order-mini-id">#${order.orderId || 'N/A'}</span>
            <span class="order-mini-total">₹${Number(order.total || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="order-mini-footer">
            <span>${new Date(order.orderDate || order.date).toLocaleDateString('en-IN')}</span>
            <span class="status-badge status-${status}">${STATUS_LABELS[status] || status}</span>
          </div>
        </div>
      `;
    }).join('');
  }
  
  window.trackLocalOrder = (orderId) => {
    trackInput.value = orderId;
    trackOrder();
  };
  
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
  
  // ========== EVENT LISTENERS ==========
  trackBtn.addEventListener('click', trackOrder);
  
  trackInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') trackOrder();
  });
  
  // ========== AUTO-FILL FROM URL ==========
  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');
    const phone = params.get('phone');
    
    if (orderId) {
      trackInput.value = orderId;
      trackOrder();
    } else if (phone) {
      trackInput.value = phone;
      trackOrder();
    }
  }
  
  // ========== INIT ==========
  function init() {
    loadRecentOrders();
    checkUrlParams();
    
    // Store orders globally for mini card click
    window._allOrders = [];
    
    console.log('✅ Tracking page ready');
  }
  
  init();
  
})();
