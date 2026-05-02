// ===== OK MART - ORDER DETAIL PAGE =====

(function() {
  'use strict';

  // DOM Elements
  const loadingState = document.getElementById('loadingState');
  const container = document.getElementById('orderDetailContainer');
  const errorState = document.getElementById('errorState');

  // Order Data
  let currentOrder = null;
  let map = null;
  let mapMarker = null;

  // Get Order ID from URL
  function getOrderId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  // Initialize Page
  async function init() {
    const orderId = getOrderId();
    
    if (!orderId) {
      showError();
      return;
    }

    await loadOrder(orderId);
  }

  // Load Order from Firestore
  async function loadOrder(orderId) {
    try {
      showLoading(true);
      
      const orderDoc = await db.collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) {
        showError();
        return;
      }
      
      currentOrder = { id: orderDoc.id, ...orderDoc.data() };
      renderOrder(currentOrder);
      setupListeners();
      
      showLoading(false);
      showContainer(true);
      
    } catch (error) {
      console.error('Error loading order:', error);
      showError();
    }
  }

  // Render Order Data
  function renderOrder(order) {
    // Basic Info
    document.getElementById('orderId').textContent = `#${order.id.slice(0, 8)}`;
    document.getElementById('orderDate').textContent = formatDate(order.createdAt);
    
    // Customer Info
    document.getElementById('customerName').textContent = order.name || 'N/A';
    document.getElementById('customerPhone').textContent = order.phone || 'N/A';
    document.getElementById('customerEmail').textContent = order.email || 'N/A';
    document.getElementById('customerAddress').textContent = order.address || 'N/A';
    document.getElementById('customerPincode').textContent = order.pincode || 'N/A';
    
    // Delivery Info
    document.getElementById('deliveryType').textContent = order.deliveryType || 'Quick';
    document.getElementById('deliverySlot').textContent = order.deliverySlot || 'ASAP';
    document.getElementById('deliveryCharge').textContent = `₹${order.deliveryCharge || 0}`;
    document.getElementById('deliveryDistance').textContent = order.distance ? `${order.distance.toFixed(1)} km` : 'N/A';
    
    // Status
    const statusSelect = document.getElementById('orderStatusSelect');
    if (statusSelect) {
      statusSelect.value = order.status || 'pending';
    }
    
    // Items
    renderItems(order.items || []);
    
    // Summary
    renderSummary(order);
    
    // Timeline
    renderTimeline(order);
    
    // Map
    if (order.location && order.location.lat && order.location.lng) {
      initMap(order.location.lat, order.location.lng);
      setupGoogleMapsLink(order.location.lat, order.location.lng);
    } else {
      document.querySelector('.map-card').style.display = 'none';
    }
  }

  // Render Order Items
  function renderItems(items) {
    const containerEl = document.getElementById('orderItemsList');
    const itemsCount = document.getElementById('itemsCount');
    
    if (!items || items.length === 0) {
      containerEl.innerHTML = '<div class="empty-state-small">No items found</div>';
      itemsCount.textContent = '0 items';
      return;
    }
    
    itemsCount.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
    
    let subtotal = 0;
    
    containerEl.innerHTML = items.map(item => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      subtotal += itemTotal;
      
      return `
        <div class="order-item">
          <img src="${item.image || '/assets/images/placeholder.png'}" 
               class="item-image" 
               onerror="this.src='/assets/images/placeholder.png'"
               alt="${item.name}">
          <div class="item-details">
            <div class="item-name">${item.name}</div>
            <div class="item-unit">${item.unit || ''}</div>
            <div class="item-price-row">
              <span class="item-qty">Qty: ${item.quantity || 1}</span>
              <span class="item-price">₹${item.price || 0}</span>
            </div>
          </div>
          <div class="item-total">₹${itemTotal}</div>
        </div>
      `;
    }).join('');
    
    // Store subtotal for summary
    window.currentSubtotal = subtotal;
  }

  // Render Order Summary
  function renderSummary(order) {
    const subtotal = window.currentSubtotal || 0;
    const deliveryFee = order.deliveryCharge || 0;
    const discount = order.discount || 0;
    const total = (subtotal + deliveryFee) - discount;
    
    document.getElementById('subtotal').textContent = `₹${subtotal}`;
    document.getElementById('summaryDeliveryFee').textContent = `₹${deliveryFee}`;
    document.getElementById('discountAmount').textContent = `-₹${discount}`;
    document.getElementById('orderTotal').textContent = `₹${total}`;
  }

  // Render Timeline
  function renderTimeline(order) {
    const timelineEl = document.getElementById('orderTimeline');
    const status = order.status || 'pending';
    const createdAt = order.createdAt;
    
    const timelineSteps = [
      { key: 'pending', title: 'Order Placed', icon: '🛒', time: createdAt },
      { key: 'confirmed', title: 'Order Confirmed', icon: '✅' },
      { key: 'preparing', title: 'Preparing', icon: '🍳' },
      { key: 'out_for_delivery', title: 'Out for Delivery', icon: '🛵' },
      { key: 'delivered', title: 'Delivered', icon: '🎉' }
    ];
    
    let currentStepReached = false;
    
    timelineEl.innerHTML = timelineSteps.map(step => {
      let isCompleted = false;
      let timeStr = '';
      
      if (!currentStepReached) {
        if (step.key === status || (status === 'delivered' && step.key === 'delivered')) {
          isCompleted = true;
          currentStepReached = true;
          timeStr = 'Now';
        } else if (status === 'cancelled') {
          isCompleted = false;
          currentStepReached = true;
        } else if (step.key !== 'pending') {
          isCompleted = false;
        } else {
          isCompleted = true;
          timeStr = formatTime(createdAt);
        }
      }
      
      if (step.key === 'pending' && status !== 'pending' && status !== 'cancelled') {
        isCompleted = true;
      }
      
      if (status === 'delivered' && step.key === 'delivered') {
        isCompleted = true;
        timeStr = formatDate(order.deliveredAt) || formatTime(createdAt);
      }
      
      return `
        <div class="timeline-item">
          <div class="timeline-icon ${isCompleted ? 'completed' : ''}">
            ${step.icon}
          </div>
          <div class="timeline-content">
            <div class="timeline-title">${step.title}</div>
            ${timeStr ? `<div class="timeline-time">${timeStr}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Initialize Map
  function initMap(lat, lng) {
    const mapContainer = document.getElementById('orderMap');
    if (!mapContainer) return;
    
    if (map) {
      map.remove();
    }
    
    map = L.map('orderMap').setView([lat, lng], 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    }).addTo(map);
    
    mapMarker = L.marker([lat, lng]).addTo(map);
    
    // Add circle for delivery radius
    L.circle([lat, lng], {
      radius: 500,
      color: '#2ecc71',
      fillColor: '#2ecc71',
      fillOpacity: 0.1
    }).addTo(map);
  }

  // Setup Google Maps Link
  function setupGoogleMapsLink(lat, lng) {
    const link = document.getElementById('openInGoogleMaps');
    if (link) {
      link.href = `https://www.google.com/maps?q=${lat},${lng}`;
    }
  }

  // Update Order Status
  async function updateOrderStatus() {
    const orderId = currentOrder?.id;
    const newStatus = document.getElementById('orderStatusSelect').value;
    
    if (!orderId || !newStatus) return;
    
    const confirmed = confirm(`Change order status to "${newStatus.toUpperCase()}"?`);
    if (!confirmed) return;
    
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      
      if (newStatus === 'delivered') {
        updateData.deliveredAt = new Date().toISOString();
      }
      
      await db.collection('orders').doc(orderId).update(updateData);
      
      // Update local
      currentOrder.status = newStatus;
      if (newStatus === 'delivered') {
        currentOrder.deliveredAt = new Date().toISOString();
      }
      
      // Re-render timeline
      renderTimeline(currentOrder);
      
      alert('✅ Order status updated successfully!');
      
    } catch (error) {
      console.error('Error updating status:', error);
      alert('❌ Failed to update status. Please try again.');
    }
  }

  // Delete Order
  async function deleteOrder() {
    const orderId = currentOrder?.id;
    
    const confirmed = confirm('⚠️ Are you SURE you want to DELETE this order?\n\nThis action CANNOT be undone!');
    if (!confirmed) return;
    
    try {
      await db.collection('orders').doc(orderId).delete();
      alert('✅ Order deleted successfully!');
      window.location.href = 'orders.html';
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('❌ Failed to delete order. Please try again.');
    }
  }

  // Print Order
  function printOrder() {
    const printContent = document.getElementById('orderDetailContainer').cloneNode(true);
    const originalTitle = document.title;
    
    document.title = `Order_${currentOrder?.id?.slice(0, 8)}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${document.title}</title>
          <link rel="stylesheet" href="../css/common.css">
          <link rel="stylesheet" href="../css/order-detail.css">
          <style>
            body { padding: 20px; }
            .action-buttons, .btn-update, .status-select, .back-btn, .map-actions { display: none; }
            .order-header-card { margin-top: 0; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    document.title = originalTitle;
  }

  // Send WhatsApp
  function sendWhatsApp() {
    if (!currentOrder) return;
    
    const phone = currentOrder.phone;
    const orderId = currentOrder.id.slice(0, 8);
    const total = document.getElementById('orderTotal').textContent;
    
    const message = `🛒 *OK Mart Order Update*\n\nOrder ID: #${orderId}\nStatus: ${currentOrder.status}\nTotal: ${total}\n\nThank you for shopping with OK Mart! 🚀`;
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Setup Event Listeners
  function setupListeners() {
    const updateBtn = document.getElementById('updateStatusBtn');
    if (updateBtn) {
      updateBtn.addEventListener('click', updateOrderStatus);
    }
    
    const deleteBtn = document.getElementById('deleteOrderBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', deleteOrder);
    }
    
    const printBtn = document.getElementById('printOrderBtn');
    if (printBtn) {
      printBtn.addEventListener('click', printOrder);
    }
    
    const whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', sendWhatsApp);
    }
  }

  // Helper Functions
  function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function formatTime(timestamp) {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function showLoading(show) {
    if (loadingState) {
      loadingState.style.display = show ? 'flex' : 'none';
    }
  }
  
  function showContainer(show) {
    if (container) {
      container.style.display = show ? 'block' : 'none';
    }
  }
  
  function showError() {
    showLoading(false);
    if (errorState) {
      errorState.style.display = 'block';
    }
  }

  // Start
  init();
})();
