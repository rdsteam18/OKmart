// ===== OK MART - ORDER MANAGEMENT =====
(function() {
  const db = window.db;
  
  const ordersList = document.getElementById('ordersList');
  const orderDetailModal = document.getElementById('orderDetailModal');
  const toast = document.getElementById('toast');
  
  let currentOrderId = null;
  let currentStatusFilter = 'all';
  
  // Mobile menu
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
  });
  
  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentStatusFilter = tab.dataset.status;
      loadOrders();
    });
  });
  
  // Close detail modal
  document.getElementById('closeDetailModal')?.addEventListener('click', () => {
    orderDetailModal.classList.remove('active');
  });
  
  function loadOrders() {
    let query = db.collection('orders').orderBy('orderDate', 'desc');
    
    if (currentStatusFilter !== 'all') {
      query = query.where('status', '==', currentStatusFilter);
    }
    
    query.onSnapshot((snapshot) => {
      const orders = [];
      snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
      
      ordersList.innerHTML = orders.length === 0
        ? '<p class="loading-text">No orders found</p>'
        : orders.map(o => `
          <div class="order-admin-card" onclick="window.viewOrder('${o.id}')">
            <div class="order-admin-header">
              <span class="order-id">#${o.orderId || o.id.slice(-8)}</span>
              <span class="order-status status-${o.status || 'received'}">${o.status || 'received'}</span>
            </div>
            <div><strong>${o.customerName || o.name || 'Customer'}</strong></div>
            <div class="order-admin-header">
              <span class="order-admin-total">₹${o.total || 0}</span>
              <span class="order-admin-date">${o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN') : '-'}</span>
            </div>
          </div>
        `).join('');
    });
  }
  
  window.viewOrder = (orderId) => {
    currentOrderId = orderId;
    db.collection('orders').doc(orderId).get().then(doc => {
      if (!doc.exists) return;
      
      const order = doc.data();
      
      document.getElementById('detailOrderId').textContent = `#${order.orderId || orderId.slice(-8)}`;
      document.getElementById('detailCustomerInfo').innerHTML = `
        <p><strong>👤 ${order.customerName || order.name || 'Customer'}</strong></p>
        <p>📱 +91 ${order.customerPhone || order.phone || '-'}</p>
        <p>🏠 ${order.customerAddress || order.address || '-'}</p>
        <p>📅 ${order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
      `;
      
      const items = order.items || [];
      document.getElementById('detailOrderItems').innerHTML = `
        <table style="width:100%;border-collapse:collapse;">
          ${items.map(item => `
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:8px;">${item.name} x${item.quantity}</td>
              <td style="padding:8px;text-align:right;font-weight:600;">₹${item.price * item.quantity}</td>
            </tr>
          `).join('')}
        </table>
      `;
      
      document.getElementById('detailOrderTotal').innerHTML = `
        <div style="display:flex;justify-content:space-between;padding:12px 0;font-weight:700;font-size:1.1rem;">
          <span>Total</span><span>₹${order.total || 0}</span>
        </div>
      `;
      
      document.getElementById('statusUpdate').value = order.status || 'received';
      orderDetailModal.classList.add('active');
    });
  };
  
  // Update status
  document.getElementById('updateStatusBtn')?.addEventListener('click', async () => {
    if (!currentOrderId) return;
    
    const newStatus = document.getElementById('statusUpdate').value;
    
    try {
      await db.collection('orders').doc(currentOrderId).update({ status: newStatus });
      orderDetailModal.classList.remove('active');
      showToast('Status updated!', 'success');
    } catch (error) {
      showToast('Error updating status', 'error');
    }
  });
  
  function showToast(msg, type = 'info') {
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
  
  // Initial load
  loadOrders();
  
})();

