// ===== OK MART - PROFILE.JS =====
// Profile page with WhatsApp support, refund system, and wishlist

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const WHATSAPP_NUMBER = '919982239821';
  
  // ---------- STATE ----------
  let userData = {};
  let wishlist = [];
  
  // DOM Elements
  const profileName = document.getElementById('profileName');
  const profilePhone = document.getElementById('profilePhone');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const editProfileModal = document.getElementById('editProfileModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const editName = document.getElementById('editName');
  const editPhone = document.getElementById('editPhone');
  const editEmail = document.getElementById('editEmail');
  
  const refundModal = document.getElementById('refundModal');
  const closeRefundModal = document.getElementById('closeRefundModal');
  const submitRefundBtn = document.getElementById('submitRefundBtn');
  const refundOrderId = document.getElementById('refundOrderId');
  const refundReason = document.getElementById('refundReason');
  const refundDetails = document.getElementById('refundDetails');
  
  const wishlistCount = document.getElementById('wishlistCount');
  const logoutBtn = document.getElementById('logoutBtn');
  const toastMessage = document.getElementById('toastMessage');
  
  // Quick action cards
  const quickActionCards = document.querySelectorAll('.quick-action-card');
  
  // Menu items
  const helpSupportBtn = document.getElementById('helpSupportBtn');
  const refundRequestBtn = document.getElementById('refundRequestBtn');
  const savedAddressBtn = document.getElementById('savedAddressBtn');
  const aboutBtn = document.getElementById('aboutBtn');
  
  // ---------- DATA LOADING ----------
  
  function loadUserData() {
    const stored = localStorage.getItem('okmart_user_data');
    userData = stored ? JSON.parse(stored) : { name: '', phone: '', email: '' };
    return userData;
  }
  
  function saveUserData(data) {
    userData = { ...userData, ...data };
    localStorage.setItem('okmart_user_data', JSON.stringify(userData));
    updateProfileUI();
  }
  
  function loadWishlist() {
    const stored = localStorage.getItem('okmart_wishlist');
    wishlist = stored ? JSON.parse(stored) : [];
    return wishlist;
  }
  
  function saveWishlist(items) {
    wishlist = items;
    localStorage.setItem('okmart_wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
  }
  
  // ---------- UI UPDATES ----------
  
  function updateProfileUI() {
    if (profileName) {
      profileName.textContent = userData.name || 'Guest User';
    }
    if (profilePhone) {
      profilePhone.textContent = userData.phone ? `+91 ${userData.phone}` : 'Add phone number';
    }
  }
  
  function updateWishlistCount() {
    if (wishlistCount) {
      const count = wishlist.length;
      wishlistCount.textContent = count;
      wishlistCount.style.display = count > 0 ? 'inline-block' : 'none';
    }
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
  
  // ---------- WHATSAPP FUNCTIONS ----------
  
  function openWhatsApp(message) {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(url, '_blank');
  }
  
  function sendHelpSupport() {
    const message = `Hello OK Mart,

I need help regarding my order.

🧾 Order ID: ______
📦 Issue Type: (Refund / Wrong Item / Missing Item / Late Delivery / Other)
📝 Problem Details: ______

Please assist me as soon as possible.`;
    
    openWhatsApp(message);
  }
  
  function sendRefundRequest(orderId, reason, details) {
    const message = `Hello OK Mart,

I want to request a refund.

🧾 Order ID: ${orderId || '______'}
📦 Reason: ${reason || '______'}
📝 Details: ${details || '______'}

Please process my refund request.`;
    
    openWhatsApp(message);
    showToast('Opening WhatsApp...', 'success');
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
  
  function openRefundModal() {
    refundModal.classList.add('active');
  }
  
  function closeRefundModalFunc() {
    refundModal.classList.remove('active');
  }
  
  // ---------- EVENT LISTENERS ----------
  
  // Edit Profile
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', openEditModal);
  }
  
  if (closeEditModal) {
    closeEditModal.addEventListener('click', closeEditModalFunc);
  }
  
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
        showToast('Please enter a valid 10-digit phone number', 'error');
        return;
      }
      
      saveUserData({ name, phone, email });
      closeEditModalFunc();
      showToast('Profile updated successfully!', 'success');
    });
  }
  
  // Refund Modal
  if (refundRequestBtn) {
    refundRequestBtn.addEventListener('click', openRefundModal);
  }
  
  if (closeRefundModal) {
    closeRefundModal.addEventListener('click', closeRefundModalFunc);
  }
  
  if (refundModal) {
    refundModal.addEventListener('click', (e) => {
      if (e.target === refundModal) closeRefundModalFunc();
    });
  }
  
  if (submitRefundBtn) {
    submitRefundBtn.addEventListener('click', () => {
      const orderId = refundOrderId.value.trim();
      const reason = refundReason.value;
      const details = refundDetails.value.trim();
      
      if (!orderId) {
        showToast('Please enter Order ID', 'error');
        return;
      }
      
      sendRefundRequest(orderId, reason, details);
      closeRefundModalFunc();
      
      // Clear form
      refundOrderId.value = '';
      refundDetails.value = '';
    });
  }
  
  // Quick Action Cards
  quickActionCards.forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      
      switch (action) {
        case 'orders':
          window.location.href = '/orders.html';
          break;
        case 'support':
          sendHelpSupport();
          break;
        case 'refund':
          openRefundModal();
          break;
        case 'offers':
          window.location.href = '/offers.html';
          break;
      }
    });
  });
  
  // Menu Items
  if (helpSupportBtn) {
    helpSupportBtn.addEventListener('click', sendHelpSupport);
  }
  
  if (savedAddressBtn) {
    savedAddressBtn.addEventListener('click', () => {
      const addresses = localStorage.getItem('okmart_saved_addresses');
      if (addresses) {
        const parsed = JSON.parse(addresses);
        showToast(`${parsed.length} address(es) saved`, 'info');
      } else {
        showToast('No saved addresses yet', 'info');
      }
    });
  }
  
  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
      alert('OK Mart v1.0.0\nFresh groceries delivered in 10 minutes!\n\nContact: +91 99822 39821');
    });
  }
  
  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('okmart_user_data');
        userData = { name: '', phone: '', email: '' };
        updateProfileUI();
        showToast('Logged out successfully', 'success');
        
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 800);
      }
    });
  }
  
  // ---------- INITIALIZATION ----------
  
  function init() {
    loadUserData();
    loadWishlist();
    updateProfileUI();
    updateWishlistCount();
    
    // Update cart badge
    const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      if (badge) badge.textContent = totalItems;
    });
    
    console.log('✅ Profile page initialized');
  }
  
  init();
  
  // Expose functions
  window.OKMartProfile = {
    getUserData: () => userData,
    getWishlist: () => wishlist,
    addToWishlist: (productId) => {
      if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        saveWishlist(wishlist);
        return true;
      }
      return false;
    },
    removeFromWishlist: (productId) => {
      const index = wishlist.indexOf(productId);
      if (index > -1) {
        wishlist.splice(index, 1);
        saveWishlist(wishlist);
        return true;
      }
      return false;
    },
    isInWishlist: (productId) => wishlist.includes(productId)
  };
  
})();
