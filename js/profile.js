// ===== OK MART - PROFILE.JS =====
// Complete profile page functionality

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const USER_KEY = 'okmart_user';
  const WISHLIST_KEY = 'okmart_wishlist';
  const ORDERS_KEY = 'okmart_orders';
  const WHATSAPP_NUMBER = '919982239821';
  
  let userData = {};
  
  // DOM Elements
  const profileName = document.getElementById('profileName');
  const profilePhone = document.getElementById('profilePhone');
  const avatarIcon = document.getElementById('avatarIcon');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const editProfileModal = document.getElementById('editProfileModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const editName = document.getElementById('editName');
  const editPhone = document.getElementById('editPhone');
  const editEmail = document.getElementById('editEmail');
  
  const addressModal = document.getElementById('addressModal');
  const closeAddressModal = document.getElementById('closeAddressModal');
  const savedAddressesList = document.getElementById('savedAddressesList');
  const addAddressBtn = document.getElementById('addAddressBtn');
  
  const totalOrders = document.getElementById('totalOrders');
  const totalSaved = document.getElementById('totalSaved');
  const memberSince = document.getElementById('memberSince');
  const menuOrdersCount = document.getElementById('menuOrdersCount');
  const menuWishlistCount = document.getElementById('menuWishlistCount');
  const quickWishlistCount = document.getElementById('quickWishlistCount');
  
  const savedAddressBtn = document.getElementById('savedAddressBtn');
  const paymentMethodsBtn = document.getElementById('paymentMethodsBtn');
  const helpSupportBtn = document.getElementById('helpSupportBtn');
  const aboutBtn = document.getElementById('aboutBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  const toastMessage = document.getElementById('toastMessage');
  
  // Quick action cards
  const quickActionCards = document.querySelectorAll('.quick-action-card');
  
  // ---------- DATA LOADING ----------
  
  function loadUserData() {
    const stored = localStorage.getItem(USER_KEY);
    userData = stored ? JSON.parse(stored) : { name: '', phone: '', email: '', createdAt: new Date().toISOString() };
    return userData;
  }
  
  function saveUserData(data) {
    userData = { ...userData, ...data };
    if (!userData.createdAt) {
      userData.createdAt = new Date().toISOString();
    }
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    updateProfileUI();
  }
  
  function loadWishlist() {
    const stored = localStorage.getItem(WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  function loadOrders() {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  // ---------- UI UPDATES ----------
  
  function updateProfileUI() {
    if (profileName) {
      const name = userData.name || 'Guest User';
      profileName.textContent = name;
      avatarIcon.textContent = name.charAt(0).toUpperCase() || '👤';
    }
    if (profilePhone) {
      profilePhone.textContent = userData.phone ? `+91 ${userData.phone}` : 'Add phone number';
    }
  }
  
  function updateStats() {
    const orders = loadOrders();
    const wishlist = loadWishlist();
    
    if (totalOrders) {
      totalOrders.textContent = orders.length;
    }
    
    if (menuOrdersCount) {
      menuOrdersCount.textContent = orders.length;
      menuOrdersCount.classList.toggle('visible', orders.length > 0);
    }
    
    const wishlistCount = wishlist.length;
    if (menuWishlistCount) {
      menuWishlistCount.textContent = wishlistCount;
      menuWishlistCount.classList.toggle('visible', wishlistCount > 0);
    }
    if (quickWishlistCount) {
      quickWishlistCount.textContent = wishlistCount;
      quickWishlistCount.classList.toggle('visible', wishlistCount > 0);
    }
    
    // Calculate total saved
    const totalSavedAmount = orders.reduce((sum, order) => {
      return sum + (order.itemDiscount || 0) + (order.couponDiscount || 0);
    }, 0);
    if (totalSaved) {
      totalSaved.textContent = `₹${totalSavedAmount}`;
    }
    
    // Member since
    if (memberSince && userData.createdAt) {
      const date = new Date(userData.createdAt);
      memberSince.textContent = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => {
      if (b) b.textContent = total;
    });
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
  
  // ---------- MODAL FUNCTIONS ----------
  
  function openEditModal() {
    editName.value = userData.name || '';
    editPhone.value = userData.phone || '';
    editEmail.value = userData.email || '';
    editProfileModal.classList.add('active');
  }
  
  function closeEditModalFunc() {
    editProfileModal.classList.remove('active');
  }
  
  function openAddressModal() {
    renderSavedAddresses();
    addressModal.classList.add('active');
  }
  
  function closeAddressModalFunc() {
    addressModal.classList.remove('active');
  }
  
  function renderSavedAddresses() {
    const addresses = JSON.parse(localStorage.getItem('okmart_saved_addresses') || '[]');
    
    if (addresses.length === 0) {
      savedAddressesList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No saved addresses yet</p>';
      return;
    }
    
    savedAddressesList.innerHTML = '';
    addresses.forEach((addr, index) => {
      const addrEl = document.createElement('div');
      addrEl.className = 'address-item';
      addrEl.innerHTML = `
        <span class="address-type">${addr.type || 'Home'}</span>
        <div class="address-text">${addr.address}</div>
        <div class="address-pincode">📮 ${addr.pincode}</div>
      `;
      savedAddressesList.appendChild(addrEl);
    });
  }
  
  function addNewAddress() {
    const address = prompt('Enter your full address:');
    if (address && address.trim()) {
      const pincode = prompt('Enter pincode:');
      if (pincode && /^\d{6}$/.test(pincode)) {
        const addresses = JSON.parse(localStorage.getItem('okmart_saved_addresses') || '[]');
        addresses.push({
          type: 'Home',
          address: address.trim(),
          pincode: pincode
        });
        localStorage.setItem('okmart_saved_addresses', JSON.stringify(addresses));
        renderSavedAddresses();
        showToast('Address saved!', 'success');
      } else {
        showToast('Invalid pincode', 'error');
      }
    }
  }
  
  // ---------- WHATSAPP SUPPORT ----------
  
  function openWhatsAppSupport() {
    const message = `Hello OK Mart,\n\nI need help with my account.\n\nName: ${userData.name || 'Guest'}\nPhone: ${userData.phone || 'Not provided'}\n\nPlease assist me.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  }
  
  // ---------- LOGOUT ----------
  
  function handleLogout() {
    if (confirm('Are you sure you want to logout? This will clear your profile data.')) {
      localStorage.removeItem(USER_KEY);
      userData = { name: '', phone: '', email: '' };
      updateProfileUI();
      showToast('Logged out successfully', 'success');
      
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 800);
    }
  }
  
  // ---------- EVENT LISTENERS ----------
  
  // Edit Profile
  if (editProfileBtn) editProfileBtn.addEventListener('click', openEditModal);
  if (closeEditModal) closeEditModal.addEventListener('click', closeEditModalFunc);
  if (editProfileModal) {
    editProfileModal.addEventListener('click', (e) => {
      if (e.target === editProfileModal) closeEditModalFunc();
    });
  }
  
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      const name = editName.value.trim();
      const phone = editPhone.value.trim().replace(/\D/g, '');
      const email = editEmail.value.trim();
      
      if (!name) {
        showToast('Please enter your name', 'error');
        return;
      }
      
      if (phone && !/^\d{10}$/.test(phone)) {
        showToast('Invalid phone number', 'error');
        return;
      }
      
      saveUserData({ name, phone, email });
      closeEditModalFunc();
      showToast('Profile updated!', 'success');
    });
  }
  
  // Address Modal
  if (savedAddressBtn) savedAddressBtn.addEventListener('click', openAddressModal);
  if (closeAddressModal) closeAddressModal.addEventListener('click', closeAddressModalFunc);
  if (addressModal) {
    addressModal.addEventListener('click', (e) => {
      if (e.target === addressModal) closeAddressModalFunc();
    });
  }
  if (addAddressBtn) addAddressBtn.addEventListener('click', addNewAddress);
  
  // Quick Action Cards
  quickActionCards.forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      
      switch (action) {
        case 'orders':
          window.location.href = '/orders.html';
          break;
        case 'wishlist':
          window.location.href = '/wishlist.html';
          break;
        case 'support':
          openWhatsAppSupport();
          break;
        case 'offers':
          window.location.href = '/offers.html';
          break;
      }
    });
  });
  
  // Menu Items
  if (helpSupportBtn) helpSupportBtn.addEventListener('click', openWhatsAppSupport);
  if (paymentMethodsBtn) {
    paymentMethodsBtn.addEventListener('click', () => {
      showToast('Cash on Delivery & UPI available', 'info');
    });
  }
  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
      alert('OK Mart v2.0.0\nFresh groceries delivered in 10-12 minutes!\n\nContact: +91 99822 39821\n\nServing your neighborhood with love ❤️');
    });
  }
  
  // Logout
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  
  // ---------- INITIALIZATION ----------
  
  function init() {
    loadUserData();
    
    // Save user if first time
    if (!userData.createdAt) {
      userData.createdAt = new Date().toISOString();
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
    
    updateProfileUI();
    updateStats();
    updateCartBadge();
    
    console.log('✅ Profile page initialized');
  }
  
  init();
  
})();
