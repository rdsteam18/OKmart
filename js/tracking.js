// ===== OK MART - COMPLETE ORDER TRACKING SYSTEM =====

(function() {
  'use strict';

  // ========== DOM Elements ==========
  const trackInput = document.getElementById('trackInput');
  const trackBtn = document.getElementById('trackBtn');
  const trackBtnText = document.getElementById('trackBtnText');
  const trackSpinner = document.getElementById('trackSpinner');
  const loadingState = document.getElementById('loadingState');
  const searchSection = document.getElementById('searchSection');
  const orderTrackingContainer = document.getElementById('orderTrackingContainer');
  const multipleOrdersDiv = document.getElementById('multipleOrders');
  const noResultDiv = document.getElementById('noResult');
  const recentOrdersSection = document.getElementById('recentOrdersSection');
  const recentOrdersList = document.getElementById('recentOrdersList');
  const refreshBtn = document.getElementById('refreshBtn');

  // ========== State ==========
  let currentOrderId = null;
  let unsubscribeOrder = null;
  let currentMap = null;
  let currentMarker = null;
  let allProducts = [];

  // ========== Load Products for Images ==========
  async function loadProducts() {
    try {
      allProducts = await fetchProducts();
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  // ========== Load Recent Orders ==========
  function loadRecentOrders() {
    try {
      const recent = JSON.parse(localStorage.getItem('okmart_recent_orders') || '[]');
      if (recent.length === 0) {
        document.getElementById('noRecentOrders').style.display = 'block';
        return;
      }
      
      recentOrdersList.innerHTML = recent.slice(0, 5).map(order => `
        <div class="recent-order-item" onclick="trackOrderById('${order.id}')">
          <span class="recent-order-id">#${order.id.slice(0, 8).toUpperCase()}</span>
          <span class="status-badge status-${order.status || 'received'}">${order.status || 'Received'}</span>
          <span>₹${order.total || 0}</span>
        </div>
      `).join('');
    } catch(e) { 
      console.warn('Recent orders error:', e);
    }
  }

  // ========== Save to Recent Orders ==========
  function saveToRecentOrders(order) {
    try {
      let recent = JSON.parse(localStorage.getItem('okmart_recent_orders') || '[]');
      recent = recent.filter(o => o.id !== order.id);
      recent.unshift({ 
        id: order.id, 
        status: order.status || 'received', 
        total: order.total || 0,
        date: new Date().toISOString()
      });
      recent = recent.slice(0, 10);
      localStorage.setItem('okmart_recent_orders', JSON.stringify(recent));
      loadRecentOrders();
    } catch(e) {}
  }

  // ========== Track by ID (from recent) ==========
  window.trackOrderById = function(orderId) {
    trackInput.value = orderId;
    trackOrder();
  };

  // ========== Reset and Try Again ==========
  window.resetAndTryAgain = function() {
    trackInput.value = '';
    trackInput.focus();
    hideAllResults();
    searchSection.style.display = 'block';
    recentOrdersSection.style.display = 'block';
  };

  // ========== Main Track Function ==========
  async function trackOrder() {
    const query = trackInput.value.trim();
    if (!query) {
      showToast('Please enter phone number or order ID', 'error');
      return;
    }
    
    // Clear previous
    hideAllResults();
    showLoading(true);
    searchSection.style.display = 'none';
    recentOrdersSection.style.display = 'none';
    
    // Unsubscribe from previous listener
    if (unsubscribeOrder) {
      unsubscribeOrder();
      unsubscribeOrder = null;
    }
    
    // Clear map
    if (currentMap) {
      currentMap.remove();
      currentMap = null;
    }
    
    try {
      let orders = [];
      
      // Check if query is phone number (10 digits)
      if (query.match(/^\d{10}$/)) {
        // Search by phone number
        let snapshot = await db.collection('orders')
          .where('phone', '==', query)
          .orderBy('orderDate', 'desc')
          .get();
        
        if (snapshot.empty) {
          snapshot = await db.collection('orders')
            .where('customerPhone', '==', query)
            .orderBy('orderDate', 'desc')
            .get();
        }
        
        orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
      } else {
        // Search by order ID
        const cleanId = query.replace(/^#/, '');
        
        // Try exact match
        const doc = await db.collection('orders').doc(cleanId).get();
        if (doc.exists) {
          orders = [{ id: doc.id, ...doc.data() }];
        } else {
          // Try orderId field
          const snapshot = await db.collection('orders')
            .where('orderId', '==', cleanId)
            .limit(1)
            .get();
          orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      }
      
      showLoading(false);
      
      if (orders.length === 0) {
        showNoResult();
        return;
      }
      
      if (orders.length === 1) {
        // Single order - setup real-time listener
        setupRealTimeTracking(orders[0].id);
      } else {
        // Multiple orders
        showMultipleOrders(orders);
      }
      
    } catch (error) {
      console.error('Track error:', error);
      showLoading(false);
      showToast('Error finding order. Please try again.', 'error');
    }
  }

  // ========== Setup Real-time Tracking ==========
  function setupRealTimeTracking(orderId) {
    if (unsubscribeOrder) {
      unsubscribeOrder();
    }
    
    unsubscribeOrder = db.collection('orders').doc(orderId).onSnapshot((doc) => {
      if (doc.exists) {
        const order = { id: doc.id, ...doc.data() };
        saveToRecentOrders(order);
        renderOrderTracking(order);
        hideMultipleOrders();
        hideNoResult();
      } else {
        showNoResult();
      }
    }, (error) => {
      console.error('Snapshot error:', error);
      showToast('Error loading order updates', 'error');
    });
  }

  // ========== Render Order Tracking ==========
  function renderOrderTracking(order) {
    orderTrackingContainer.style.display = 'block';
    orderTrackingContainer.innerHTML = createOrderTrackingHTML(order);
    
    // Initialize map if coordinates exist
    if (order.location?.lat && order.location?.lng && order.status !== 'delivered' && order.status !== 'cancelled') {
      setTimeout(() => initTrackingMap(order.location.lat, order.location.lng, order.status), 100);
    }
    
    // Animate progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      const percent = getProgressPercent(order.status);
      setTimeout(() => { progressBar.style.width = `${percent}%`; }, 50);
    }
  }

  // ========== Create Order Tracking HTML ==========
  function createOrderTrackingHTML(order) {
    const status = order.status || 'received';
    const progressPercent = getProgressPercent(status);
    const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
    const items = order.items || [];
    
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const deliveryCharge = order.deliveryCharge || 0;
    const discount = order.discount || 0;
    const total = (subtotal + deliveryCharge) - discount;
    
    // Get product images for items that might not have them
    const enrichedItems = items.map(item => {
      const product = allProducts.find(p => p.id === item.id);
      if (product && !item.image) {
        item.image = product.image;
      }
      return item;
    });
    
    return `
      <div class="order-tracking-card">
        <!-- Order Header -->
        <div class="order-header">
          <div>
            <div class="order-id">#${order.orderId || order.id.slice(0, 8).toUpperCase()}</div>
            <div class="order-date">${orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div class="status-badge status-${status === 'out_for_delivery' ? 'out_for_delivery' : status}">
            ${getStatusIcon(status)} ${getStatusText(status)}
          </div>
        </div>
        
        <!-- Delivery Progress -->
        ${status !== 'cancelled' ? `
          <div class="delivery-progress">
            <div class="progress-bar" style="width: ${progressPercent}%"></div>
            <div class="progress-steps">
              <div class="progress-step ${progressPercent >= 25 ? 'active' : ''}">📋 Order</div>
              <div class="progress-step ${progressPercent >= 50 ? 'active' : ''}">🍳 Prep</div>
              <div class="progress-step ${progressPercent >= 75 ? 'active' : ''}">🛵 Delivery</div>
              <div class="progress-step ${progressPercent >= 100 ? 'active' : ''}">✅ Done</div>
            </div>
          </div>
        ` : ''}
        
        <!-- Delivery Information -->
        <div class="order-info-section">
          <div class="section-title">📍 Delivery Information</div>
          <div class="info-row">
            <span class="info-label">Customer</span>
            <span class="info-value">${escapeHtml(order.customerName || order.name || 'N/A')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${order.customerPhone || order.phone || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address</span>
            <span class="info-value">${escapeHtml(order.customerAddress || order.address || 'N/A')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Pincode</span>
            <span class="info-value">${order.pincode || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Delivery Type</span>
            <span class="info-value">${order.deliveryType === 'quick' ? '⚡ Quick (10-15 mins)' : '📅 Scheduled'}</span>
          </div>
          ${order.deliverySlot ? `
            <div class="info-row">
              <span class="info-label">Delivery Slot</span>
              <span class="info-value">${order.deliverySlot}</span>
            </div>
          ` : ''}
        </div>
        
        <!-- Map Section -->
        ${order.location?.lat && status !== 'cancelled' ? `
          <div class="map-section">
            <div class="section-title">📍 Delivery Location</div>
            <div id="trackMap" class="map-container"></div>
          </div>
        ` : ''}
        
        <!-- Order Timeline -->
        <div class="timeline-section">
          <div class="section-title">⏱️ Order Timeline</div>
          <div class="timeline">${createTimelineHTML(order)}</div>
        </div>
        
        <!-- Order Items -->
        <div class="items-section">
          <div class="section-title">🛍️ Order Items (${enrichedItems.length})</div>
          <div class="items-list">
            ${createItemsHTML(enrichedItems)}
          </div>
          <div class="order-summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>₹${subtotal}</span>
            </div>
            <div class="summary-row">
              <span>Delivery Charge</span>
              <span>${deliveryCharge === 0 ? 'FREE' : '₹' + deliveryCharge}</span>
            </div>
            ${discount > 0 ? `<div class="summary-row" style="color: #10b981;"><span>Discount</span><span>-₹${discount}</span></div>` : ''}
            <div class="summary-row summary-total">
              <span>Total Paid</span>
              <span>₹${total}</span>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
          <a href="https://wa.me/${order.customerPhone || order.phone}" target="_blank" class="btn-whatsapp">💬 WhatsApp Support</a>
          <a href="/" class="btn-home">🏠 Continue Shopping</a>
        </div>
      </div>
    `;
  }

  // ========== Create Timeline HTML ==========
  function createTimelineHTML(order) {
    const status = order.status || 'received';
    const createdAt = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
    const confirmedAt = order.confirmedAt?.toDate ? order.confirmedAt.toDate() : null;
    const preparingAt = order.preparingAt?.toDate ? order.preparingAt.toDate() : null;
    const outForDeliveryAt = order.outForDeliveryAt?.toDate ? order.outForDeliveryAt.toDate() : null;
    const deliveredAt = order.deliveredAt?.toDate ? order.deliveredAt.toDate() : null;
    
    const steps = [
      { key: 'received', title: 'Order Received', icon: '📋', time: createdAt, completed: true },
      { key: 'confirmed', title: 'Order Confirmed', icon: '✅', time: confirmedAt, completed: status !== 'received' && status !== 'cancelled' },
      { key: 'preparing', title: 'Preparing Your Order', icon: '🍳', time: preparingAt, completed: status === 'preparing' || status === 'out_for_delivery' || status === 'delivered' },
      { key: 'out_for_delivery', title: 'Out for Delivery', icon: '🛵', time: outForDeliveryAt, completed: status === 'out_for_delivery' || status === 'delivered' },
      { key: 'delivered', title: 'Delivered', icon: '🎉', time: deliveredAt, completed: status === 'delivered' }
    ];
    
    let currentReached = false;
    
    return steps.map(step => {
      let isCompleted = step.completed;
      let isActive = false;
      
      if (!currentReached && !isCompleted && step.key !== 'delivered') {
        isActive = true;
        currentReached = true;
      }
      
      if (status === 'cancelled') {
        isCompleted = false;
        isActive = false;
      }
      
      const timeStr = step.time ? step.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
      
      return `
        <div class="timeline-item">
          <div class="timeline-icon ${isCompleted ? 'completed' : (isActive ? 'active' : '')}">
            ${step.icon}
          </div>
          <div class="timeline-content">
            <div class="timeline-step">${step.title}</div>
            ${timeStr ? `<div class="timeline-time">${timeStr}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // ========== Create Items HTML ==========
  function createItemsHTML(items) {
    if (!items || items.length === 0) {
      return '<div style="text-align:center;color:#6b7280;">No items found</div>';
    }
    
    return items.map(item => `
      <div class="order-item">
        <img src="${item.image || 'https://via.placeholder.com/55'}" class="item-image" onerror="this.src='https://via.placeholder.com/55'">
        <div class="item-details">
          <div class="item-name">${escapeHtml(item.name)}</div>
          <div class="item-price">₹${item.price} × ${item.quantity}</div>
        </div>
        <div class="item-quantity">₹${(item.price * (item.quantity || 1)).toFixed(2)}</div>
      </div>
    `).join('');
  }

  // ========== Initialize Tracking Map ==========
  function initTrackingMap(lat, lng, status) {
    const mapContainer = document.getElementById('trackMap');
    if (!mapContainer) return;
    
    if (currentMap) {
      currentMap.remove();
      currentMap = null;
    }
    
    currentMap = L.map('trackMap').setView([lat, lng], 14);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(currentMap);
    
    // Destination marker
    const destinationIcon = L.divIcon({
      html: '📍',
      className: 'custom-marker',
      iconSize: [30, 30],
      popupAnchor: [0, -15]
    });
    
    currentMarker = L.marker([lat, lng], { icon: destinationIcon }).addTo(currentMap);
    currentMarker.bindPopup('<b>Delivery Location</b>').openPopup();
    
    // Delivery radius circle
    L.circle([lat, lng], {
      radius: 500,
      color: '#84c225',
      fillColor: '#84c225',
      fillOpacity: 0.1
    }).addTo(currentMap);
    
    // If out for delivery, show delivery partner
    if (status === 'out_for_delivery') {
      const deliveryLat = lat + 0.002;
      const deliveryLng = lng - 0.001;
      
      const deliveryIcon = L.divIcon({
        html: '🛵',
        className: 'custom-marker',
        iconSize: [35, 35]
      });
      
      const deliveryMarker = L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon }).addTo(currentMap);
      deliveryMarker.bindPopup('<b>Delivery Partner</b><br>On the way!').openPopup();
      
      // Draw route line
      const routePoints = [[deliveryLat, deliveryLng], [lat, lng]];
      L.polyline(routePoints, { color: '#84c225', weight: 3, dashArray: '5, 10' }).addTo(currentMap);
      
      // Fit bounds to show both
      const bounds = L.latLngBounds(routePoints);
      currentMap.fitBounds(bounds, { padding: [50, 50] });
    } else {
      currentMap.setView([lat, lng], 15);
    }
  }

  // ========== Show Multiple Orders ==========
  function showMultipleOrders(orders) {
    multipleOrdersDiv.style.display = 'block';
    const orderList = document.getElementById('orderList');
    
    orderList.innerHTML = orders.map(order => `
      <div class="order-list-item" onclick="trackOrderById('${order.id}')">
        <div>
          <strong>#${order.orderId || order.id.slice(0, 8).toUpperCase()}</strong>
          <div style="font-size:0.7rem;color:#6b7280;">${new Date(order.orderDate?.toDate()).toLocaleDateString()}</div>
        </div>
        <div class="status-badge status-${order.status || 'received'}">${order.status || 'Received'}</div>
        <div>₹${order.total || 0}</div>
      </div>
    `).join('');
  }

  // ========== Helper Functions ==========
  function getProgressPercent(status) {
    const map = { 
      received: 10, 
      confirmed: 25, 
      preparing: 50, 
      out_for_delivery: 75, 
      delivered: 100 
    };
    return map[status] || 0;
  }
  
  function getStatusIcon(status) {
    const icons = { 
      received: '⏳', 
      confirmed: '✅', 
      preparing: '🍳', 
      out_for_delivery: '🛵', 
      delivered: '🎉', 
      cancelled: '❌' 
    };
    return icons[status] || '📋';
  }
  
  function getStatusText(status) {
    const texts = { 
      received: 'Received', 
      confirmed: 'Confirmed', 
      preparing: 'Preparing', 
      out_for_delivery: 'Out for Delivery', 
      delivered: 'Delivered', 
      cancelled: 'Cancelled' 
    };
    return texts[status] || status;
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  // ========== UI Helpers ==========
  function hideAllResults() {
    orderTrackingContainer.style.display = 'none';
    multipleOrdersDiv.style.display = 'none';
    noResultDiv.style.display = 'none';
  }
  
  function hideMultipleOrders() {
    multipleOrdersDiv.style.display = 'none';
  }
  
  function hideNoResult() {
    noResultDiv.style.display = 'none';
  }
  
  function showLoading(show) {
    loadingState.style.display = show ? 'flex' : 'none';
    if (show) {
      trackBtnText.textContent = 'Searching...';
      trackSpinner.style.display = 'inline-block';
      trackBtn.disabled = true;
    } else {
      trackBtnText.textContent = '🔍 Track Order';
      trackSpinner.style.display = 'none';
      trackBtn.disabled = false;
    }
  }
  
  function showNoResult() {
    noResultDiv.style.display = 'block';
    orderTrackingContainer.style.display = 'none';
    multipleOrdersDiv.style.display = 'none';
    searchSection.style.display = 'block';
    recentOrdersSection.style.display = 'block';
  }
  
  function showToast(message, type) {
    const toast = document.getElementById('toastMessage');
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
  
  function refreshPage() {
    if (unsubscribeOrder) {
      unsubscribeOrder();
      unsubscribeOrder = null;
    }
    if (currentMap) {
      currentMap.remove();
      currentMap = null;
    }
    trackInput.value = '';
    hideAllResults();
    searchSection.style.display = 'block';
    recentOrdersSection.style.display = 'block';
    loadRecentOrders();
    showToast('Refreshed!', 'success');
  }

  // ========== Event Listeners ==========
  trackBtn.addEventListener('click', trackOrder);
  trackInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') trackOrder(); });
  refreshBtn.addEventListener('click', refreshPage);

  // ========== Initialize ==========
  async function init() {
    await loadProducts();
    loadRecentOrders();
    
    // Check URL for order ID parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('id');
    if (orderIdParam) {
      trackInput.value = orderIdParam;
      setTimeout(() => trackOrder(), 500);
    }
    
    console.log('✅ Order tracking system ready!');
  }
  
  init();
})();

