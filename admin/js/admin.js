// ===== OK MART - ADMIN DASHBOARD =====
(function() {
  const db = window.db;
  
  const totalOrdersEl = document.getElementById('totalOrders');
  const todayOrdersEl = document.getElementById('todayOrders');
  const totalRevenueEl = document.getElementById('totalRevenue');
  const pendingOrdersEl = document.getElementById('pendingOrders');
  const recentOrdersList = document.getElementById('recentOrdersList');
  const revenueTodayEl = document.getElementById('revenueToday');
  const avgOrderValueEl = document.getElementById('avgOrderValue');
  const productsCountEl = document.getElementById('productsCount');
  const currentDateEl = document.getElementById('currentDate');
  
  // Set date
  currentDateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  
  // Mobile menu toggle
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
  });
  
  // Real-time orders listener
  db.collection('orders').onSnapshot((snapshot) => {
    const orders = [];
    snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.date === today || (o.orderDate && o.orderDate.startsWith(today)));
    const pending = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    totalOrdersEl.textContent = orders.length;
    todayOrdersEl.textContent = todayOrders.length;
    totalRevenueEl.textContent = `₹${totalRevenue}`;
    pendingOrdersEl.textContent = pending.length;
    revenueTodayEl.textContent = `₹${todayRevenue}`;
    avgOrderValueEl.textContent = orders.length > 0 ? `₹${Math.round(totalRevenue / orders.length)}` : '₹0';
    
    // Recent orders
    const recent = [...orders].sort((a, b) => new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date)).slice(0, 5);
    recentOrdersList.innerHTML = recent.map(o => `
      <div class="order-row">
        <span class="order-id">#${o.orderId || o.id}</span>
        <span>${o.customerName || o.name || 'Customer'}</span>
        <span>₹${o.total || 0}</span>
        <span class="order-status status-${o.status || 'received'}">${o.status || 'received'}</span>
      </div>
    `).join('') || '<p class="loading-text">No orders yet</p>';
  });
  
  // Products count
  db.collection('products').onSnapshot((snapshot) => {
    productsCountEl.textContent = snapshot.size;
  });
  
})();

