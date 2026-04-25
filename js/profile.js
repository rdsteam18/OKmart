// ===== OK MART - PROFILE.JS =====
// Complete user profile with orders, wishlist, offers, support

(function() {
  'use strict';
  
  const USER_KEY = 'okmart_user';
  const WISHLIST_KEY = 'okmart_wishlist';
  const CART_KEY = 'okmart_cart';
  const WHATSAPP_NUMBER = '919982239821';
  
  // ========== STATE ==========
  let userData = {};
  let openSection = null;
  
  // ========== DOM ELEMENTS ==========
  const profileName = document.getElementById('profileName');
  const profilePhone = document.getElementById('profilePhone');
  const profileAvatar = document.getElementById('profileAvatar');
  const statOrders = document.getElementById('statOrders');
  const statWishlist = document.getElementById('statWishlist');
  const statSaved = document.getElementById('statSaved');
  const wishlistBadge = document.getElementById('wishlistBadge');
  
  const ordersList = document.getElementById('ordersList');
  const ordersLoading = document.getElementById('ordersLoading');
  const noOrders = document.getElementById('noOrders');
  const ordersContent = document.getElementById('ordersContent');
  
  const offersList = document.getElementById('offersList');
  const offersLoading = document.getElementById('offersLoading');
  const offersContent = document.getElementById('offersContent');
  
  const editModal = document.getElementById('editModal');
  const toastMessage = document.getElementById('toastMessage');
  
  // ========== USER DATA ==========
  function loadUserData() {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      userData = JSON.parse(stored);
      profileName.textContent = userData.name || 'Guest User';
      profilePhone.textContent = userData.phone ? '+91 ' + userData.phone : 'Add your details';
      profileAvatar.textContent = (userData.name || 'G').charAt(0).toUpperCase();
    }
  }
  
  function updateStats() {
    const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    const orders = JSON.parse(localStorage.getItem('okmart_orders') || '[]');
    const saved = orders.reduce((sum, o) => sum + (o.couponDiscount || 0) + ((o.subtotal || 0) - (o.total || 0) + (o.delivery || 0)), 0);
    
    statOrders.textContent = orders.length;
    statWishlist.textContent = wishlist.length;
    statSaved.textContent = '₹' + Math.abs(Math.round(saved));
    wishlistBadge.textContent = wishlist.length;
  }
  
  // ========== MODAL ==========
  document.getElementById('editProfileBtn').addEventListener('click', () => {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editPhone').value = user.phone || '';
    document.getElementById('editAddress').value = user.address || '';
    document.getElementById('editPincode').value = user.pincode || '';
    editModal.classList.add('active');
  });
  
  document.getElementById('closeModal').addEventListener('click', () => editModal.classList.remove('active'));
  editModal.addEventListener('click', (e) => { if (e.target === editModal) editModal.classList.remove('active'); });
  
  document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const data = {
      name: document.getElementById('editName').value.trim(),
      phone: document.getElementById('editPhone').value.trim().replace(/\D/g, ''),
      address: document.getElementById('editAddress').value.trim(),
      pincode: document.getElementById('editPincode').value.trim()
    };
    
    if (!data.name || !data.phone) {
      showToast('Name and phone are required', 'error');
      return;
    }
    
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    loadUserData();
    editModal.classList.remove('active');
    showToast('Profile updated!', 'success');
  });
  
  // ========== SECTION TOGGLE ==========
  window.toggleSection = function(section) {
    const content = document.getElementById(section + 'Content');
    const arrow = document.getElementById(section + 'Arrow');
    
    if (content.style.display === 'none' || !content.style.display) {
      content.style.display = 'block';
      if (arrow) arrow.classList.add('open');
      openSection = section;
      
      if (section === 'orders' && !ordersList.hasChildNodes()) loadOrders();
      if (section === 'offers' && !offersList.hasChildNodes()) loadOffers();
    } else {
      content.style.display = 'none';
      if (arrow) arrow.classList.remove('open');
      openSection = null;
    }
  };
  
  window.scrollToSection = function(section) {
    const el = document.getElementById(section + 'Section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => toggleSection(section), 300);
    }
  };
  
  // ========== LOAD ORDERS ==========
  async function loadOrders() {
    ordersLoading.style.display = 'block';
    noOrders.style.display = 'none';
    
    const phone = userData.phone;
    if (!phone) {
      ordersLoading.style.display = 'none';
      ordersList.innerHTML = '';
      return;
    }
    
    try {
      // Fetch from Firebase
      const snap1 = await db.collection('orders').where('customerPhone', '==', phone).get();
      const allOrders = [];
      snap1.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));
      
      // Also check phone field
      const snap2 = await db.collection('orders').where('phone', '==', phone).get();
      snap2.forEach(doc => {
        if (!allOrders.find(o => o.id === doc.id)) allOrders.push({ id: doc.id, ...doc.data() });
      });
      
      // Merge with local orders
      const localOrders = JSON.parse(localStorage.getItem('okmart_orders') || '[]');
      localOrders.forEach(o => {
        if (!allOrders.find(a => a.orderId === o.orderId)) allOrders.push(o);
      });
      
      allOrders.sort((a, b) => new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date));
      
      ordersLoading.style.display = 'none';
      
      if (allOrders.length === 0) {
        noOrders.style.display = 'block';
        return;
      }
      
      ordersList.innerHTML = allOrders.slice(0, 10).map(order => {
        const status = order.status || 'received';
        return `
          <div class="order-mini-card" onclick="window.location.href='/tracking.html?order=${order.orderId || ''}'">
            <div class="order-mini-row">
              <span class="order-mini-id">#${order.orderId || (order.id ? order.id.slice(-8).toUpperCase() : 'N/A')}</span>
              <span class="order-mini-total">₹${Number(order.total || 0).toLocaleString('en-IN')}</span>
            </div>
            <div class="order-mini-row">
              <span class="order-mini-date">${new Date(order.orderDate || order.date).toLocaleDateString('en-IN')}</span>
              <span class="status-dot status-${status}">${status}</span>
            </div>
          </div>
        `;
      }).join('');
      
    } catch (err) {
      ordersLoading.style.display = 'none';
      ordersList.innerHTML = '<p style="color:var(--muted);">Could not load orders</p>';
    }
  }
  
  // ========== LOAD OFFERS ==========
  async function loadOffers() {
    offersLoading.style.display = 'block';
    
    try {
      const snap = await db.collection('offers').where('active', '==', true).get();
      offersLoading.style.display = 'none';
      
      if (snap.empty) {
        offersList.innerHTML = '<p style="color:var(--muted);">No active offers</p>';
        return;
      }
      
      offersList.innerHTML = '';
      snap.forEach(doc => {
        const o = doc.data();
        const card = document.createElement('div');
        card.className = 'offer-mini-card';
        card.innerHTML = `
          <div>
            <div class="offer-code">${o.code}</div>
            <div class="offer-desc">${o.type === 'flat' ? '₹' + o.discount + ' OFF' : o.discount + '% OFF'} · Min ₹${o.minOrder}</div>
          </div>
          <span class="offer-value">${o.type === 'flat' ? '₹' + o.discount : o.discount + '%'}</span>
        `;
        offersList.appendChild(card);
      });
      
    } catch (err) {
      offersLoading.style.display = 'none';
      offersList.innerHTML = '<p style="color:var(--muted);">Could not load offers</p>';
    }
  }
  
  // ========== SUPPORT & REFUND ==========
  window.openSupport = function() {
    const msg = 'Hello OK Mart,\n\nI need help with my account.\n\nPlease assist me.';
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };
  
  window.openRefund = function() {
    const orderId = prompt('Enter your Order ID for complaint:');
    if (orderId) {
      const msg = `Hello OK Mart,\n\nI want to file a complaint/refund request.\n\n📋 Order ID: ${orderId}\n\nPlease look into this matter.`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };
  
  // ========== LOGOUT ==========
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your profile data?')) {
      localStorage.removeItem(USER_KEY);
      location.reload();
    }
  });
  
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
  
  // ========== INIT ==========
  function init() {
    loadUserData();
    updateStats();
    console.log('✅ Profile page ready');
  }
  
  init();
  
})();
