// ===== OK MART - USER PROFILE PAGE =====

(function() {
  'use strict';

  // ========== DOM Elements ==========
  const loadingState = document.getElementById('loadingState');
  const profileContent = document.getElementById('profileContent');
  
  // User Info Elements
  const displayName = document.getElementById('displayName');
  const displayPhone = document.getElementById('displayPhone');
  const displayEmail = document.getElementById('displayEmail');
  const editUserInfoBtn = document.getElementById('editUserInfoBtn');
  const userInfoDisplay = document.getElementById('userInfoDisplay');
  const userInfoEdit = document.getElementById('userInfoEdit');
  const editName = document.getElementById('editName');
  const editPhone = document.getElementById('editPhone');
  const editEmail = document.getElementById('editEmail');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const saveUserInfoBtn = document.getElementById('saveUserInfoBtn');
  
  // Address Elements
  const addressList = document.getElementById('addressList');
  const addAddressBtn = document.getElementById('addAddressBtn');
  const addressModal = document.getElementById('addressModal');
  const modalTitle = document.getElementById('modalTitle');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const saveAddressBtn = document.getElementById('saveAddressBtn');
  
  // Address Form Fields
  const addressName = document.getElementById('addressName');
  const addressPhone = document.getElementById('addressPhone');
  const addressLine = document.getElementById('addressLine');
  const addressCity = document.getElementById('addressCity');
  const addressPincode = document.getElementById('addressPincode');
  const addressLandmark = document.getElementById('addressLandmark');
  const setAsDefault = document.getElementById('setAsDefault');
  
  // Orders Elements
  const ordersList = document.getElementById('ordersList');
  const ordersCount = document.getElementById('ordersCount');
  const orderModal = document.getElementById('orderModal');
  const orderModalBody = document.getElementById('orderModalBody');
  const closeOrderModalBtn = document.getElementById('closeOrderModalBtn');
  
  // Saved Items Elements
  const savedItemsList = document.getElementById('savedItemsList');
  const clearSavedBtn = document.getElementById('clearSavedBtn');
  
  // Settings Elements
  const darkModeToggle = document.getElementById('darkModeToggle');
  const notificationToggle = document.getElementById('notificationToggle');
  
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  
  // ========== State ==========
  let userInfo = {
    name: '',
    phone: '',
    email: ''
  };
  let addresses = [];
  let editingAddressId = null;
  let allOrders = [];
  let savedItems = [];

  // ========== Load Data ==========
  async function loadData() {
    try {
      loadingState.style.display = 'block';
      
      // Load user info from localStorage
      loadUserInfo();
      
      // Load addresses from localStorage
      loadAddresses();
      
      // Load saved items from localStorage
      loadSavedItems();
      
      // Load orders from Firebase
      await loadOrders();
      
      // Load preferences
      loadPreferences();
      
      // Render all sections
      renderUserInfo();
      renderAddresses();
      renderSavedItems();
      renderOrders();
      
      loadingState.style.display = 'none';
      profileContent.style.display = 'block';
      
    } catch (error) {
      console.error('Error loading profile:', error);
      loadingState.innerHTML = '<div class="spinner"></div><p>Error loading profile. Please refresh.</p>';
    }
  }

  // ========== User Info Functions ==========
  function loadUserInfo() {
    // Check active login first
    const activeUser = localStorage.getItem('okmart_user');
    if (activeUser) {
      try {
        const u = JSON.parse(activeUser);
        userInfo.name = u.name || '';
        userInfo.phone = (u.phone || '').replace('+91', '').replace(/\s/g, '') || '';
        userInfo.email = u.email || '';
        return;
      } catch(e) {}
    }

    const savedUser = localStorage.getItem('okmart_user_details');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        userInfo.name = user.name || '';
        userInfo.phone = user.phone || '';
        userInfo.email = user.email || '';
      } catch(e) {}
    }
  }

  async function saveUserInfo() {
    localStorage.setItem('okmart_user_details', JSON.stringify(userInfo));
    
    // Sync back to main login session key
    const activeUser = localStorage.getItem('okmart_user');
    if (activeUser) {
      try {
        const u = JSON.parse(activeUser);
        u.name = userInfo.name;
        u.phone = userInfo.phone;
        u.email = userInfo.email;
        localStorage.setItem('okmart_user', JSON.stringify(u));
        
        // Save to Firebase Firestore under users/{uid}
        if (typeof db !== 'undefined' && u.uid) {
          await db.collection('users').doc(u.uid).set({
            name: userInfo.name,
            phone: userInfo.phone,
            email: userInfo.email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      } catch(e) {}
    }

    // Also save to localStorage for checkout
    const addressForCheckout = {
      name: userInfo.name,
      phone: userInfo.phone,
      email: userInfo.email,
      address: addresses.find(a => a.isDefault)?.address || (addresses[0]?.address || ''),
      city: addresses.find(a => a.isDefault)?.city || (addresses[0]?.city || ''),
      pincode: addresses.find(a => a.isDefault)?.pincode || (addresses[0]?.pincode || '')
    };
    localStorage.setItem('okmart_user_address', JSON.stringify(addressForCheckout));
  }

  function renderUserInfo() {
    displayName.textContent = userInfo.name || 'Not set';
    displayPhone.textContent = userInfo.phone || 'Not set';
    displayEmail.textContent = userInfo.email || 'Not set';
    
    editName.value = userInfo.name;
    editPhone.value = userInfo.phone;
    editEmail.value = userInfo.email;
  }

  function showEditUserForm() {
    userInfoDisplay.style.display = 'none';
    userInfoEdit.style.display = 'block';
  }

  function hideEditUserForm() {
    userInfoDisplay.style.display = 'block';
    userInfoEdit.style.display = 'none';
  }

  function saveUserChanges() {
    userInfo.name = editName.value.trim();
    userInfo.phone = editPhone.value.trim();
    userInfo.email = editEmail.value.trim();
    
    if (!userInfo.name) {
      showToast('Please enter your name', 'error');
      return;
    }
    
    if (!userInfo.phone || userInfo.phone.length !== 10) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }
    
    saveUserInfo();
    renderUserInfo();
    hideEditUserForm();
    showToast('Profile updated!', 'success');
  }

  // ========== Address Functions ==========
  async function loadAddresses() {
    const savedAddresses = localStorage.getItem('okmart_user_addresses');
    if (savedAddresses) {
      try {
        addresses = JSON.parse(savedAddresses);
      } catch(e) { addresses = []; }
    }
    
    // Also check old format
    const oldAddress = localStorage.getItem('okmart_user_address');
    if (oldAddress && addresses.length === 0) {
      try {
        const addr = JSON.parse(oldAddress);
        if (addr.name && addr.phone && addr.address) {
          addresses.push({
            id: Date.now().toString(),
            name: addr.name,
            phone: addr.phone,
            address: addr.address,
            city: addr.city || '',
            pincode: addr.pincode || '',
            landmark: addr.landmark || '',
            isDefault: true
          });
          saveAddresses();
        }
      } catch(e) {}
    }

    // Try loading addresses from Firestore (users collection) for persistence
    const activeUser = localStorage.getItem('okmart_user');
    if (activeUser && typeof db !== 'undefined') {
      try {
        const u = JSON.parse(activeUser);
        if (u.uid) {
          const userDoc = await db.collection('users').doc(u.uid).get();
          if (userDoc.exists) {
            const data = userDoc.data();
            if (data.addresses && Array.isArray(data.addresses) && data.addresses.length > 0) {
              addresses = data.addresses;
              localStorage.setItem('okmart_user_addresses', JSON.stringify(addresses));
              renderAddresses();
            }
          }
        }
      } catch(dbErr) {
        console.warn('Could not fetch addresses from Firestore:', dbErr.message);
      }
    }
  }

  async function saveAddresses() {
    localStorage.setItem('okmart_user_addresses', JSON.stringify(addresses));
    
    // Also save default address for checkout
    const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
    if (defaultAddress) {
      const addressForCheckout = {
        name: defaultAddress.name,
        phone: defaultAddress.phone,
        address: defaultAddress.address,
        city: defaultAddress.city,
        pincode: defaultAddress.pincode,
        landmark: defaultAddress.landmark
      };
      // Merge with user info
      const userDetails = {
        name: userInfo.name || defaultAddress.name,
        phone: userInfo.phone || defaultAddress.phone,
        email: userInfo.email,
        ...addressForCheckout
      };
      localStorage.setItem('okmart_user_address', JSON.stringify(userDetails));
    }

    // Sync saved addresses to Firestore users collection
    const activeUser = localStorage.getItem('okmart_user');
    if (activeUser && typeof db !== 'undefined') {
      try {
        const u = JSON.parse(activeUser);
        if (u.uid) {
          await db.collection('users').doc(u.uid).set({
            addresses: addresses
          }, { merge: true });
        }
      } catch(dbErr) {
        console.warn('Could not sync addresses to Firestore:', dbErr.message);
      }
    }
  }

  function renderAddresses() {
    if (!addressList) return;
    
    if (addresses.length === 0) {
      addressList.innerHTML = '<div class="no-address">📭 No saved addresses. Click + Add to add one.</div>';
      return;
    }
    
    addressList.innerHTML = addresses.map(addr => `
      <div class="address-item ${addr.isDefault ? 'default' : ''}">
        ${addr.isDefault ? '<span class="default-badge">Default</span>' : ''}
        <div class="address-name">${escapeHtml(addr.name)}</div>
        <div class="address-phone">📞 ${escapeHtml(addr.phone)}</div>
        <div class="address-text">📍 ${escapeHtml(addr.address)} ${addr.city ? ', ' + escapeHtml(addr.city) : ''} ${addr.pincode ? '- ' + escapeHtml(addr.pincode) : ''}</div>
        ${addr.landmark ? `<div class="address-text">🏷️ Landmark: ${escapeHtml(addr.landmark)}</div>` : ''}
        <div class="address-actions">
          ${!addr.isDefault ? `<button class="address-action-btn default-btn" onclick="setDefaultAddress('${addr.id}')">Set as Default</button>` : ''}
          <button class="address-action-btn edit-btn" onclick="editAddress('${addr.id}')">Edit</button>
          <button class="address-action-btn delete-btn" onclick="deleteAddress('${addr.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function openAddAddressModal() {
    editingAddressId = null;
    modalTitle.textContent = 'Add New Address';
    addressName.value = userInfo.name || '';
    addressPhone.value = userInfo.phone || '';
    addressLine.value = '';
    addressCity.value = '';
    addressPincode.value = '';
    addressLandmark.value = '';
    setAsDefault.checked = addresses.length === 0;
    addressModal.classList.add('active');
  }

  function editAddress(id) {
    const address = addresses.find(a => a.id === id);
    if (!address) return;
    
    editingAddressId = id;
    modalTitle.textContent = 'Edit Address';
    addressName.value = address.name;
    addressPhone.value = address.phone;
    addressLine.value = address.address;
    addressCity.value = address.city || '';
    addressPincode.value = address.pincode || '';
    addressLandmark.value = address.landmark || '';
    setAsDefault.checked = address.isDefault;
    addressModal.classList.add('active');
  }

  function saveAddress() {
    const name = addressName.value.trim();
    const phone = addressPhone.value.trim();
    const addrLine = addressLine.value.trim();
    const city = addressCity.value.trim();
    const pincode = addressPincode.value.trim();
    
    if (!name) {
      showToast('Please enter name', 'error');
      return;
    }
    if (!phone || phone.length !== 10) {
      showToast('Please enter valid 10-digit phone number', 'error');
      return;
    }
    if (!addrLine) {
      showToast('Please enter address', 'error');
      return;
    }
    
    const addressData = {
      id: editingAddressId || Date.now().toString(),
      name: name,
      phone: phone,
      address: addrLine,
      city: city,
      pincode: pincode,
      landmark: addressLandmark.value.trim(),
      isDefault: setAsDefault.checked
    };
    
    if (editingAddressId) {
      // Update existing
      const index = addresses.findIndex(a => a.id === editingAddressId);
      if (index !== -1) {
        addresses[index] = addressData;
      }
    } else {
      // Add new
      addresses.push(addressData);
    }
    
    // Handle default address logic
    if (addressData.isDefault) {
      addresses.forEach(a => {
        if (a.id !== addressData.id) a.isDefault = false;
      });
    } else if (addresses.filter(a => a.isDefault).length === 0 && addresses.length > 0) {
      addresses[0].isDefault = true;
    }
    
    saveAddresses();
    renderAddresses();
    closeAddressModal();
    showToast(editingAddressId ? 'Address updated!' : 'Address added!', 'success');
  }

  function deleteAddress(id) {
    if (confirm('Are you sure you want to delete this address?')) {
      addresses = addresses.filter(a => a.id !== id);
      // If no default address exists, set first as default
      if (addresses.filter(a => a.isDefault).length === 0 && addresses.length > 0) {
        addresses[0].isDefault = true;
      }
      saveAddresses();
      renderAddresses();
      showToast('Address deleted', 'success');
    }
  }

  window.setDefaultAddress = function(id) {
    addresses.forEach(a => {
      a.isDefault = (a.id === id);
    });
    saveAddresses();
    renderAddresses();
    showToast('Default address updated', 'success');
  };

  window.editAddress = editAddress;
  window.deleteAddress = deleteAddress;

  function closeAddressModal() {
    addressModal.classList.remove('active');
    editingAddressId = null;
  }

  // ========== Orders Functions ==========
  async function loadOrders() {
    const phone = userInfo.phone;
    if (!phone) return;
    
    try {
      const snapshot = await db.collection('orders')
        .where('phone', '==', phone)
        .orderBy('orderDate', 'desc')
        .get();
      
      allOrders = [];
      snapshot.forEach(doc => {
        allOrders.push({ id: doc.id, ...doc.data() });
      });
      
      if (snapshot.empty) {
        // Also check customerPhone field
        const snapshot2 = await db.collection('orders')
          .where('customerPhone', '==', phone)
          .orderBy('orderDate', 'desc')
          .get();
        snapshot2.forEach(doc => {
          allOrders.push({ id: doc.id, ...doc.data() });
        });
      }
      
    } catch (error) {
      console.error('Error loading orders:', error);
      allOrders = [];
    }
  }

  function renderOrders() {
    if (!ordersList) return;
    
    const count = allOrders.length;
    ordersCount.textContent = `${count} order${count !== 1 ? 's' : ''}`;
    
    if (count === 0) {
      ordersList.innerHTML = '<div class="no-orders">📭 No orders yet. Start shopping!</div>';
      return;
    }
    
    ordersList.innerHTML = allOrders.map(order => {
      const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
      return `
        <div class="order-item" onclick="viewOrderDetails('${order.id}')">
          <div class="order-header">
            <span class="order-id">#${order.orderId || order.id.slice(0, 8).toUpperCase()}</span>
            <span class="order-status status-${order.status || 'received'}">${order.status || 'Received'}</span>
          </div>
          <div class="order-details">
            <span>📅 ${orderDate.toLocaleDateString('en-IN')}</span>
            <span>💰 ₹${order.total || 0}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  window.viewOrderDetails = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
    const itemsHtml = (order.items || []).map(item => `
      <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e5e7eb;">
        <span>${escapeHtml(item.name)} × ${item.quantity}</span>
        <span>₹${item.price * item.quantity}</span>
      </div>
    `).join('');
    
    orderModalBody.innerHTML = `
      <div style="margin-bottom:16px;">
        <strong>Order ID:</strong> #${order.orderId || order.id.slice(0, 8).toUpperCase()}<br>
        <strong>Date:</strong> ${orderDate.toLocaleString('en-IN')}<br>
        <strong>Status:</strong> <span class="order-status status-${order.status}">${order.status || 'Received'}</span><br>
        <strong>Delivery Type:</strong> ${order.deliveryType === 'quick' ? '⚡ Quick' : '📅 Scheduled'}
      </div>
      <div style="margin-bottom:16px;">
        <strong>Delivery Address:</strong><br>
        ${escapeHtml(order.address || order.customerAddress || 'N/A')}
      </div>
      <div style="margin-bottom:16px;">
        <strong>Items:</strong>
        ${itemsHtml}
      </div>
      <div style="margin-top:16px; padding-top:12px; border-top:1px solid #e5e7eb;">
        <strong>Total: ₹${order.total || 0}</strong>
      </div>
    `;
    
    orderModal.classList.add('active');
  };

  function closeOrderModal() {
    orderModal.classList.remove('active');
  }

  // ========== Saved Items Functions ==========
  function loadSavedItems() {
    const saved = localStorage.getItem('okmart_saved_for_later');
    if (saved) {
      try {
        savedItems = JSON.parse(saved);
      } catch(e) { savedItems = []; }
    }
  }

  function saveSavedItems() {
    localStorage.setItem('okmart_saved_for_later', JSON.stringify(savedItems));
  }

  function renderSavedItems() {
    if (!savedItemsList) return;
    
    if (savedItems.length === 0) {
      savedItemsList.innerHTML = '<div class="no-saved-items">📭 No saved items. Save items from cart for later!</div>';
      return;
    }
    
    savedItemsList.innerHTML = savedItems.map(item => `
      <div class="saved-item">
        <img src="${item.image}" class="saved-item-image" onerror="this.src='https://via.placeholder.com/55'">
        <div class="saved-item-details">
          <div class="saved-item-name">${escapeHtml(item.name)}</div>
          <div class="saved-item-price">₹${item.price}</div>
        </div>
        <div class="saved-item-actions">
          <button class="move-to-cart-btn" onclick="moveToCart('${item.id}')">Move to Cart</button>
          <button class="remove-saved-btn" onclick="removeSavedItem('${item.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  }

  window.moveToCart = function(productId) {
    const item = savedItems.find(i => i.id === productId);
    if (!item) return;
    
    // Get current cart
    const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
    const existing = cart.find(i => i.id === productId);
    
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      cart.push(item);
    }
    
    localStorage.setItem('okmart_cart', JSON.stringify(cart));
    
    // Remove from saved
    savedItems = savedItems.filter(i => i.id !== productId);
    saveSavedItems();
    renderSavedItems();
    
    showToast(`${item.name} moved to cart!`, 'success');
  };

  window.removeSavedItem = function(productId) {
    savedItems = savedItems.filter(i => i.id !== productId);
    saveSavedItems();
    renderSavedItems();
    showToast('Item removed from saved', 'success');
  };

  function clearAllSavedItems() {
    if (confirm('Are you sure you want to clear all saved items?')) {
      savedItems = [];
      saveSavedItems();
      renderSavedItems();
      showToast('All saved items cleared', 'success');
    }
  }

  // ========== Preferences Functions ==========
  function loadPreferences() {
    const darkMode = localStorage.getItem('okmart_dark_mode') === 'true';
    const notifications = localStorage.getItem('okmart_notifications') !== 'false';
    
    darkModeToggle.checked = darkMode;
    notificationToggle.checked = notifications;
    
    if (darkMode) {
      document.body.classList.add('dark-mode');
    }
  }

  function toggleDarkMode() {
    const isDark = darkModeToggle.checked;
    localStorage.setItem('okmart_dark_mode', isDark);
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  function toggleNotifications() {
    const isEnabled = notificationToggle.checked;
    localStorage.setItem('okmart_notifications', isEnabled);
    if (isEnabled && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    showToast(isEnabled ? 'Notifications enabled' : 'Notifications disabled', 'success');
  }

  // ========== Logout ==========
  function logout() {
    if (confirm('Are you sure you want to logout?')) {
      // Clear all user data from localStorage
      localStorage.removeItem('okmart_user');
      localStorage.removeItem('okmart_user_details');
      localStorage.removeItem('okmart_user_address');
      localStorage.removeItem('okmart_user_addresses');
      localStorage.removeItem('okmart_saved_for_later');
      localStorage.removeItem('okmart_cart');
      localStorage.removeItem('okmart_wishlist');
      localStorage.removeItem('okmart_dark_mode');
      
      showToast('Logged out successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  }

  // ========== Helper Functions ==========
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  function showToast(message, type) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ========== Event Listeners ==========
  function initEventListeners() {
    editUserInfoBtn?.addEventListener('click', showEditUserForm);
    cancelEditBtn?.addEventListener('click', hideEditUserForm);
    saveUserInfoBtn?.addEventListener('click', saveUserChanges);
    
    addAddressBtn?.addEventListener('click', openAddAddressModal);
    closeModalBtn?.addEventListener('click', closeAddressModal);
    cancelModalBtn?.addEventListener('click', closeAddressModal);
    saveAddressBtn?.addEventListener('click', saveAddress);
    
    closeOrderModalBtn?.addEventListener('click', closeOrderModal);
    orderModal?.addEventListener('click', (e) => {
      if (e.target === orderModal) closeOrderModal();
    });
    
    addressModal?.addEventListener('click', (e) => {
      if (e.target === addressModal) closeAddressModal();
    });
    
    clearSavedBtn?.addEventListener('click', clearAllSavedItems);
    
    darkModeToggle?.addEventListener('change', toggleDarkMode);
    notificationToggle?.addEventListener('change', toggleNotifications);
    
    logoutBtn?.addEventListener('click', logout);
  }

  // ========== Initialize ==========
  function init() {
    initEventListeners();
    loadData();
    console.log('✅ Profile page initialized');
  }
  
  init();
})();

