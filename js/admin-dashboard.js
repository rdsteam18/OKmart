// ===== OK MART - ADMIN DASHBOARD.JS =====
// Real-time dashboard statistics from Firebase Firestore

(function() {
  'use strict';
  
  const db = window.db || firebase.firestore();
  
  // ---------- DOM ELEMENTS ----------
  const totalOrdersEl = document.getElementById('totalOrders');
  const totalRevenueEl = document.getElementById('totalRevenue');
  const todayOrdersEl = document.getElementById('todayOrders');
  const pendingOrdersEl = document.getElementById('pendingOrders');
  
  const todayRevenueEl = document.getElementById('todayRevenue');
  const avgOrderValueEl = document.getElementById('avgOrderValue');
  const deliveredCountEl = document.getElementById('deliveredCount');
  const outForDeliveryEl = document.getElementById('outForDelivery');
  
  const recentOrdersTable = document.getElementById('recentOrdersTable');
  const currentDateEl = document.getElementById('currentDate');
  
  // ---------- SET CURRENT DATE ----------
  function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('en-IN', options);
  }
  
  // ---------- FORMAT CURRENCY ----------
  function formatCurrency(amount) {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  }
  
  // ---------- FORMAT DATE ----------
  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  
  // ---------- GET TODAY'S DATE STRING ----------
  function getTodayString() {
    return new Date().toISOString().split('T')[0];
  }
  
  // ---------- CALCULATE STATISTICS ----------
  function calculateStats(orders) {
    const today = getTodayString();
    
    // Total orders
    const totalOrders = orders.length;
    
    // Total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    
    // Today's orders
    const todayOrdersList = orders.filter(order => {
      const orderDate = order.date || order.orderDate || '';
      return orderDate.startsWith(today);
    });
    const todayOrders = todayOrdersList.length;
    
    // Today's revenue
    const todayRevenue = todayOrdersList.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    
    // Pending orders (not delivered and not cancelled)
    const pendingOrders = orders.filter(order => 
      order.status !== 'delivered' && order.status !== 'cancelled'
    ).length;
    
    // Delivered count
    const deliveredCount = orders.filter(order => order.status === 'delivered').length;
    
    // Out for delivery
    const outForDelivery = orders.filter(order => order.status === 'outfordelivery').length;
    
    // Average order value
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
    
    return {
      totalOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      pendingOrders,
      deliveredCount,
      outForDelivery,
      avgOrderValue
    };
  }
  
  // ---------- UPDATE DASHBOARD UI ----------
  function updateDashboard(stats) {
    // Main stats
    totalOrdersEl.textContent = stats.totalOrders;
    totalRevenueEl.textContent = formatCurrency(stats.totalRevenue);
    todayOrdersEl.textContent = stats.todayOrders;
    pendingOrdersEl.textContent = stats.pendingOrders;
    
    // Quick stats
    todayRevenueEl.textContent = formatCurrency(stats.todayRevenue);
    avgOrderValueEl.textContent = formatCurrency(stats.avgOrderValue);
    deliveredCountEl.textContent = stats.deliveredCount;
    outForDeliveryEl.textContent = stats.outForDelivery;
  }
  
  // ---------- UPDATE RECENT ORDERS TABLE ----------
  function updateRecentOrders(orders) {
    // Sort by date (newest first) and get top 10
    const recent = [...orders]
      .sort((a, b) => new Date(b.date || b.orderDate) - new Date(a.date || a.orderDate))
      .slice(0, 10);
    
    if (recent.length === 0) {
      recentOrdersTable.innerHTML = '<tr><td colspan="6" class="no-data">No orders yet</td></tr>';
      return;
    }
    
    recentOrdersTable.innerHTML = recent.map(order => {
      const orderId = order.orderId || (order.id ? order.id.slice(-8).toUpperCase() : 'N/A');
      const customerName = order.customerName || order.name || 'Customer';
      const phone = order.customerPhone || order.phone || '-';
      const total = Number(order.total) || 0;
      const status = order.status || 'received';
      const date = order.date || order.orderDate || '';
      
      return `
        <tr>
          <td style="font-weight:600;font-family:monospace;color:var(--primary-dark);">#${orderId}</td>
          <td>${customerName}</td>
          <td style="color:var(--muted);">${phone}</td>
          <td style="font-weight:700;">₹${total.toLocaleString('en-IN')}</td>
          <td><span class="status-badge status-${status}">${status}</span></td>
          <td style="color:var(--muted);font-size:0.85rem;">${formatDate(date)}</td>
        </tr>
      `;
    }).join('');
  }
  
  // ---------- LOAD ORDERS (REAL-TIME) ----------
  function loadOrdersRealtime() {
    console.log('🔥 Loading orders from Firestore...');
    
    db.collection('orders')
      .orderBy('orderDate', 'desc')
      .onSnapshot((snapshot) => {
        const orders = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          orders.push({
            id: doc.id,
            orderId: data.orderId || doc.id.slice(-8).toUpperCase(),
            customerName: data.customerName || data.name || 'Customer',
            phone: data.customerPhone || data.phone || '-',
            total: Number(data.total) || 0,
            status: data.status || 'received',
            date: data.orderDate || data.date || new Date().toISOString(),
            items: data.items || [],
            address: data.customerAddress || data.address || ''
          });
        });
        
        // Calculate stats
        const stats = calculateStats(orders);
        
        // Update UI
        updateDashboard(stats);
        updateRecentOrders(orders);
        
        console.log(`📊 Dashboard updated: ${stats.totalOrders} orders, ${formatCurrency(stats.totalRevenue)} revenue`);
        
      }, (error) => {
        console.error('❌ Error loading orders:', error);
        showError('Failed to load orders. Check Firebase connection.');
      });
  }
  
  // ---------- ERROR DISPLAY ----------
  function showError(message) {
    recentOrdersTable.innerHTML = `
      <tr>
        <td colspan="6" class="no-data" style="color:#ef4444;">
          ⚠️ ${message}
          <br><button onclick="location.reload()" style="margin-top:8px;padding:8px 16px;background:#2ecc71;color:white;border:none;border-radius:8px;cursor:pointer;">Retry</button>
        </td>
      </tr>
    `;
  }
  
  // ---------- MOBILE MENU ----------
  document.querySelector('.menu-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  
  // ---------- INITIALIZATION ----------
  function init() {
    setCurrentDate();
    loadOrdersRealtime();
    console.log('✅ Admin Dashboard initialized');
    
    // Update date every minute
    setInterval(setCurrentDate, 60000);
  }
  
  // Start
  init();
  
})();
