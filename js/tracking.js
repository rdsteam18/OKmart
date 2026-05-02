// ===== OK MART - ORDER TRACKING SYSTEM =====

let currentOrders = [];
let unsubscribeOrders = null;
let currentMap = null;
let currentMarker = null;

// DOM Elements
const trackInput = document.getElementById('trackInput');
const trackBtn = document.getElementById('trackBtn');
const trackBtnText = document.getElementById('trackBtnText');
const trackSpinner = document.getElementById('trackSpinner');
const loadingState = document.getElementById('loadingState');
const singleOrderResult = document.getElementById('singleOrderResult');
const multipleOrders = document.getElementById('multipleOrders');
const noResult = document.getElementById('noResult');
const recentOrdersSection = document.getElementById('recentOrdersSection');
const recentOrdersList = document.getElementById('recentOrdersList');

// Load recent orders from localStorage
function loadRecentOrders() {
  const recent = JSON.parse(localStorage.getItem('okmart_recent_orders') || '[]');
  if (recent.length === 0) {
    document.getElementById('noRecentOrders').style.display = 'block';
    return;
  }
  
  recentOrdersList.innerHTML = recent.slice(0, 5).map(order => `
    <div class="recent-order-item" onclick="trackOrderById('${order.id}')">
      <span class="recent-order-id">#${order.id.slice(0, 8).toUpperCase()}</span>
      <span class="recent-order-status status-badge status-${order.status}">${order.status}</span>
      <span>₹${order.total}</span>
    </div>
  `).join('');
}

// Save order to recent
function saveToRecentOrders(order) {
  let recent = JSON.parse(localStorage.getItem('okmart_recent_orders') || '[]');
  recent = recent.filter(o => o.id !== order.id);
  recent.unshift({ id: order.id, status: order.status, total: order.total, date: new Date().toISOString() });
  recent = recent.slice(0, 10);
  localStorage.setItem('okmart_recent_orders', JSON.stringify(recent));
  loadRecentOrders();
}

// Track by ID (from recent orders)
window.trackOrderById = function(orderId) {
  document.getElementById('trackInput').value = orderId;
  trackOrder();
};

// Main track function
async function trackOrder() {
  const query = trackInput.value.trim();
  if (!query) {
    showToast('Please enter phone number or order ID', 'error');
    return;
  }
  
  // Clear previous results
  hideAllResults();
  showLoading(true);
  
  // Unsubscribe from previous listener
  if (unsubscribeOrders) {
    unsubscribeOrders();
    unsubscribeOrders = null;
  }
  
  try {
    let orders = [];
    
    // Check if query is phone number or order ID
    if (query.match(/^\d{10}$/)) {
      // Search by phone number
      const snapshot = await db.collection('orders')
        .where('phone', '==', query)
        .orderBy('orderDate', 'desc')
        .get();
      
      orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (orders.length === 0) {
        // Also check customerPhone field
        const snapshot2 = await db.collection('orders')
          .where('customerPhone', '==', query)
          .orderBy('orderDate', 'desc')
          .get();
        orders = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
    } else {
      // Search by order ID (exact match or partial)
      const cleanId = query.replace(/^#/, '');
      
      // First try exact match
      const doc = await db.collection('orders').doc(cleanId).get();
      if (doc.exists) {
        orders = [{ id: doc.id, ...doc.data() }];
      } else {
        // Try searching by orderId field
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
      // Single order - set up real-time listener
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

// Setup real-time tracking for a single order
function setupRealTimeTracking(orderId) {
  if (unsubscribeOrders) {
    unsubscribeOrders();
  }
  
  unsubscribeOrders = db.collection('orders').doc(orderId).onSnapshot((doc) => {
    if (doc.exists) {
      const order = { id: doc.id, ...doc.data() };
      saveToRecentOrders(order);
      renderOrderDetails(order);
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

// Render single order details
function renderOrderDetails(order) {
  singleOrderResult.style.display = 'block';
  singleOrderResult.innerHTML = createOrderHTML(order);
  
  // Initialize map if coordinates exist
  if (order.location?.lat && order.location?.lng && order.status !== 'delivered' && order.status !== 'cancelled') {
    setTimeout(() => initTrackingMap(order.location.lat, order.location.lng, order.status), 100);
  }
  
  // Auto-refresh progress bar animation
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    const percent = getProgressPercent(order.status);
    progressBar.style.width = `${percent}%`;
  }
}

// Create Order HTML
function createOrderHTML(order) {
  const status = order.status || 'pending';
  const isDelivered = status === 'delivered';
  const isCancelled = status === 'cancelled';
  const progressPercent = getProgressPercent(status);
  
  const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
  
  return `
    <div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">#${order.orderId || order.id.slice(0, 8).toUpperCase()}</div>
          <div class="order-date">${orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div class="status-badge status-${status === 'out_for_delivery' ? 'out_for_delivery' : status}">
          ${getStatusIcon(status)} ${getStatusText(status)}
        </div>
      </div>
      
      ${!isCancelled ? `
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
      
      <div class="order-info-section">
        <div class="section-title">📍 Delivery Information</div>
        <div class="info-row"><span class="info-label">Customer</span><span class="info-value">${order.customerName || order.name || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${order.customerPhone || order.phone || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Address</span><span class="info-value">${order.customerAddress || order.address || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Pincode</span><span class="info-value">${order.pincode || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Delivery Type</span><span class="info-value">${order.deliveryType === 'quick' ? '⚡ Quick (10-15 mins)' : '📅 Scheduled'}</span></div>
      </div>
      
      ${order.location?.lat && !isCancelled ? `
        <div class="map-section">
          <div class="section-title">📍 Delivery Location</div>
          <div id="trackMap" class="map-container"></div>
        </div>
      ` : ''}
      
      <div class="timeline-section">
        <div class="section-title">⏱️ Order Timeline</div>
        <div class="timeline">${createTimelineHTML(order)}</div>
      </div>
      
      <div class="items-section">
        <div class="section-title">🛍️ Order Items (${order.items?.length || 0})</div>
        <div class="items-list">${createItemsHTML(order.items || [])}</div>
        ${createSummaryHTML(order)}
      </div>
      
      <div class="action-buttons">
        <a href="https://wa.me/${order.customerPhone || order.phone}" target="_blank" class="btn-whatsapp">💬 WhatsApp Support</a>
        <a href="/" class="btn-home">🏠 Continue Shopping</a>
      </div>
    </div>
  `;
}

// Create Timeline HTML
function createTimelineHTML(order) {
  const status = order.status || 'pending';
  const createdAt = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
  const confirmedAt = order.confirmedAt?.toDate ? order.confirmedAt.toDate() : null;
  const preparingAt = order.preparingAt?.toDate ? order.preparingAt.toDate() : null;
  const outForDeliveryAt = order.outForDeliveryAt?.toDate ? order.outForDeliveryAt.toDate() : null;
  const deliveredAt = order.deliveredAt?.toDate ? order.deliveredAt.toDate() : null;
  
  const steps = [
    { key: 'pending', title: 'Order Placed', icon: '📋', time: createdAt, completed: true },
    { key: 'confirmed', title: 'Order Confirmed', icon: '✅', time: confirmedAt, completed: status !== 'pending' && status !== 'cancelled' },
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
        <div class="timeline-icon ${isCompleted ? 'completed' : (isActive ? 'active' : '')}">${step.icon}</div>
        <div class="timeline-content">
          <div class="timeline-step">${step.title}</div>
          ${timeStr ? `<div class="timeline-time">${timeStr}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Create Items HTML
function createItemsHTML(items) {
  if (!items || items.length === 0) return '<div style="text-align:center;color:var(--muted);">No items found</div>';
  
  return items.map(item => `
    <div class="order-item">
      <img src="${item.image || 'https://via.placeholder.com/55'}" class="item-image" onerror="this.src='https://via.placeholder.com/55'">
      <div class="item-details">
        <div class="item-name">${item.name}</div>
        <div class="item-price">₹${item.price} × ${item.quantity}</div>
      </div>
      <div class="item-quantity">₹${(item.price * item.quantity).toFixed(2)}</div>
    </div>
  `).join('');
}

// Create Summary HTML
function createSummaryHTML(order) {
  const subtotal = order.subtotal || calculateSubtotal(order.items);
  const deliveryCharge = order.deliveryCharge || 0;
  const discount = order.discount || 0;
  const total = (subtotal + deliveryCharge) - discount;
  
  return `
    <div class="order-summary">
      <div class="summary-row"><span>Subtotal</span><span>₹${subtotal}</span></div>
      <div class="summary-row"><span>Delivery Charge</span><span>₹${deliveryCharge}</span></div>
      ${discount > 0 ? `<div class="summary-row" style="color: var(--primary);"><span>Discount</span><span>-₹${discount}</span></div>` : ''}
      <div class="summary-row summary-total"><span>Total Paid</span><span>₹${total}</span></div>
    </div>
  `;
}

// Show multiple orders
function showMultipleOrders(orders) {
  multipleOrders.style.display = 'block';
  const orderList = document.getElementById('orderList');
  
  orderList.innerHTML = orders.map(order => `
    <div class="order-list-item" onclick="trackOrderById('${order.id}')">
      <div>
        <strong>#${order.orderId || order.id.slice(0, 8).toUpperCase()}</strong>
        <div style="font-size:.7rem;color:var(--muted);">${new Date(order.orderDate?.toDate()).toLocaleDateString()}</div>
      </div>
      <div class="status-badge status-${order.status}">${order.status}</div>
      <div>₹${order.total || 0}</div>
    </div>
  `).join('');
}

// Initialize Map
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
  
  // Add delivery radius circle
  L.circle([lat, lng], {
    radius: 500,
    color: '#2ecc71',
    fillColor: '#2ecc71',
    fillOpacity: 0.1
  }).addTo(currentMap);
  
  // If out for delivery, show delivery partner
  if (status === 'out_for_delivery') {
    const deliveryLat = lat + 0.002;
    const deliveryLng = lng - 0.001;
    
    const deliveryIcon = L.divIcon({
      html: '🛵',
      className: 'custom-marker',
      iconSize: [30, 30]
    });
    
    const deliveryMarker = L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon }).addTo(currentMap);
    deliveryMarker.bindPopup('<b>Delivery Partner</b><br>On the way!').openPopup();
    
    const bounds = L.latLngBounds([[lat, lng], [deliveryLat, deliveryLng]]);
    currentMap.fitBounds(bounds, { padding: [50, 50] });
  } else {
    currentMap.setView([lat, lng], 15);
  }
}

// Helper Functions
function getProgressPercent(status) {
  const map = { pending: 10, confirmed: 25, preparing: 50, out_for_delivery: 75, delivered: 100 };
  return map[status] || 0;
}

function getStatusIcon(status) {
  const icons = { pending: '⏳', confirmed: '✅', preparing: '🍳', out_for_delivery: '🛵', delivered: '🎉', cancelled: '❌' };
  return icons[status] || '📋';
}

function getStatusText(status) {
  const texts = { pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
  return texts[status] || status;
}

function calculateSubtotal(items) {
  if (!items) return 0;
  return items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
}

// UI Helpers
function hideAllResults() {
  singleOrderResult.style.display = 'none';
  multipleOrders.style.display = 'none';
  noResult.style.display = 'none';
}

function hideMultipleOrders() {
  multipleOrders.style.display = 'none';
}

function hideNoResult() {
  noResult.style.display = 'none';
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
  noResult.style.display = 'block';
  singleOrderResult.style.display = 'none';
  multipleOrders.style.display = 'none';
}

function showToast(msg, type) {
  const toast = document.getElementById('toastMessage');
  toast.textContent = msg;
  toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#1a1e2b';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Event Listeners
trackBtn.addEventListener('click', trackOrder);
trackInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') trackOrder();
});

// Initialize
loadRecentOrders();

console.log('✅ Tracking system ready!');
