// ===== OK MART - ADVANCED CHECKOUT PAGE =====

(function() {
  'use strict';

  // ========== DOM Elements ==========
  const loadingState = document.getElementById('loadingState');
  const checkoutContent = document.getElementById('checkoutContent');
  const fullName = document.getElementById('fullName');
  const phoneNumber = document.getElementById('phoneNumber');
  const email = document.getElementById('email');
  const addressLine = document.getElementById('addressLine');
  const city = document.getElementById('city');
  const pincode = document.getElementById('pincode');
  const landmark = document.getElementById('landmark');
  const savedAddressSelect = document.getElementById('savedAddressSelect');
  const savedAddressesDiv = document.getElementById('savedAddresses');
  const pincodeStatus = document.getElementById('pincodeStatus');
  const mapSection = document.getElementById('mapSection');
  const checkoutMap = document.getElementById('checkoutMap');
  const useCurrentLocationBtn = document.getElementById('useCurrentLocationBtn');
  const selectOnMapBtn = document.getElementById('selectOnMapBtn');
  const closeMapBtn = document.getElementById('closeMapBtn');
  const confirmLocationBtn = document.getElementById('confirmLocationBtn');
  const orderItemsList = document.getElementById('orderItemsList');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryDiscount = document.getElementById('summaryDiscount');
  const summaryDiscountRow = document.getElementById('summaryDiscountRow');
  const summaryDelivery = document.getElementById('summaryDelivery');
  const summaryTotal = document.getElementById('summaryTotal');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const couponCode = document.getElementById('couponCode');
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const couponMessage = document.getElementById('couponMessage');
  const appliedCouponBadge = document.getElementById('appliedCouponBadge');
  const appliedCouponCodeSpan = document.getElementById('appliedCouponCode');
  const removeCouponBtn = document.getElementById('removeCouponBtn');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const successModal = document.getElementById('successModal');
  const trackOrderBtn = document.getElementById('trackOrderBtn');
  const continueShoppingBtn = document.getElementById('continueShoppingBtn');
  const quickPrice = document.getElementById('quickPrice');
  const scheduledPrice = document.getElementById('scheduledPrice');
  const deliverySlotContainer = document.getElementById('deliverySlotContainer');
  const deliverySlot = document.getElementById('deliverySlot');

  // ========== State ==========
  let cart = [];
  let allProducts = [];
  let coupons = [];
  let appliedCoupon = null;
  let selectedLat = null;
  let selectedLng = null;
  let selectedAddress = null;
  let isServiceable = false;
  let deliveryCharge = 39;
  let currentDeliveryType = 'quick';
  let checkoutMapInstance = null;
  let mapMarker = null;
  const FREE_DELIVERY_THRESHOLD = 199;
  const BASE_DELIVERY_CHARGE = 39;

  // ========== Load Data ==========
  async function loadData() {
    try {
      loadingState.style.display = 'block';
      
      // Load products
      allProducts = await fetchProducts();
      
      // Load coupons from Firebase
      await loadCoupons();
      
      // Load cart
      loadCart();
      
      // Load saved user details
      loadSavedUserDetails();
      
      // Load saved location
      loadSavedLocation();
      
      loadingState.style.display = 'none';
      checkoutContent.style.display = 'grid';
      
      renderOrderSummary();
      updateDeliveryCharge();
      
    } catch (error) {
      console.error('Error loading data:', error);
      loadingState.innerHTML = '<div class="spinner"></div><p>Error loading checkout. Please refresh.</p>';
    }
  }

  // ========== Load Cart ==========
  function loadCart() {
    const savedCart = localStorage.getItem('okmart_cart');
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch(e) { cart = []; }
    }
    
    if (cart.length === 0) {
      window.location.href = '/cart.html';
    }
  }

  // ========== Load Saved User Details ==========
  function loadSavedUserDetails() {
    const savedUser = localStorage.getItem('okmart_user_details');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (fullName) fullName.value = user.name || '';
        if (phoneNumber) phoneNumber.value = user.phone || '';
        if (email) email.value = user.email || '';
        if (addressLine) addressLine.value = user.address || '';
        if (city) city.value = user.city || '';
        if (pincode) pincode.value = user.pincode || '';
        if (landmark) landmark.value = user.landmark || '';
      } catch(e) {}
    }
    
    // Load saved addresses dropdown
    const savedAddresses = localStorage.getItem('okmart_saved_addresses');
    if (savedAddresses) {
      try {
        const addresses = JSON.parse(savedAddresses);
        if (addresses.length > 0) {
          savedAddressesDiv.style.display = 'block';
          savedAddressSelect.innerHTML = '<option value="">Select saved address</option>' + 
            addresses.map((addr, i) => `<option value="${i}">${addr.name} - ${addr.address.substring(0, 30)}...</option>`).join('');
        }
      } catch(e) {}
    }
  }

  // ========== Save User Details ==========
  function saveUserDetails() {
    const userDetails = {
      name: fullName.value,
      phone: phoneNumber.value,
      email: email.value,
      address: addressLine.value,
      city: city.value,
      pincode: pincode.value,
      landmark: landmark.value,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('okmart_user_details', JSON.stringify(userDetails));
  }

  // ========== Load Saved Location ==========
  function loadSavedLocation() {
    const savedLocation = localStorage.getItem('okmart_selected_location');
    if (savedLocation) {
      try {
        const loc = JSON.parse(savedLocation);
        selectedLat = loc.lat;
        selectedLng = loc.lng;
        selectedAddress = loc.address;
        if (addressLine && !addressLine.value) {
          addressLine.value = loc.address || '';
        }
      } catch(e) {}
    }
  }

  // ========== Load Coupons ==========
  async function loadCoupons() {
    try {
      const snapshot = await db.collection('offers')
        .where('active', '==', true)
        .get();
      
      coupons = [];
      snapshot.forEach(doc => {
        coupons.push({ id: doc.id, ...doc.data() });
      });
      
      // Check for applied coupon from cart
      const savedCoupon = localStorage.getItem('okmart_applied_coupon');
      if (savedCoupon) {
        try {
          appliedCoupon = JSON.parse(savedCoupon);
          appliedCouponCodeSpan.textContent = appliedCoupon.code;
          appliedCouponBadge.style.display = 'flex';
          updateOrderSummary();
        } catch(e) {}
      }
      
    } catch (error) {
      console.error('Error loading coupons:', error);
    }
  }

  // ========== Render Order Summary ==========
  function renderOrderSummary() {
    let subtotal = 0;
    const items = cart.map(item => {
      const product = allProducts.find(p => p.id === item.id) || item;
      const quantity = item.quantity || 1;
      const itemTotal = product.price * quantity;
      subtotal += itemTotal;
      
      return `
        <div class="order-item">
          <img src="${product.image}" class="order-item-image" onerror="this.src='https://via.placeholder.com/50'">
          <div class="order-item-details">
            <div class="order-item-name">${escapeHtml(product.name)}</div>
            <div class="order-item-price">₹${product.price} × ${quantity}</div>
          </div>
          <div class="order-item-quantity">₹${itemTotal}</div>
        </div>
      `;
    }).join('');
    
    orderItemsList.innerHTML = items || '<div style="text-align:center;padding:20px;">No items</div>';
    
    // Update summary
    const discount = appliedCoupon ? calculateDiscount(subtotal) : 0;
    const afterDiscount = subtotal - discount;
    let delivery = deliveryCharge;
    if (afterDiscount >= FREE_DELIVERY_THRESHOLD) delivery = 0;
    const total = afterDiscount + delivery;
    
    summarySubtotal.textContent = `₹${subtotal}`;
    
    if (discount > 0) {
      summaryDiscountRow.style.display = 'flex';
      summaryDiscount.textContent = `-₹${discount}`;
    } else {
      summaryDiscountRow.style.display = 'none';
    }
    
    summaryDelivery.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
    summaryTotal.textContent = `₹${total}`;
    
    // Update progress bar
    const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - afterDiscount);
    const percent = Math.min(100, (afterDiscount / FREE_DELIVERY_THRESHOLD) * 100);
    progressFill.style.width = `${percent}%`;
    progressLabel.innerHTML = remaining <= 0 ? '🎉 Free delivery unlocked!' : `Add ₹${remaining} more for FREE delivery`;
  }

  // ========== Calculate Discount ==========
  function calculateDiscount(subtotal) {
    if (!appliedCoupon) return 0;
    
    let discount = 0;
    if (appliedCoupon.type === 'flat') {
      discount = appliedCoupon.discount;
    } else {
      discount = (subtotal * appliedCoupon.discount) / 100;
      if (appliedCoupon.maxDiscount) {
        discount = Math.min(discount, appliedCoupon.maxDiscount);
      }
    }
    return Math.min(discount, subtotal);
  }

  // ========== Update Delivery Charge ==========
  async function updateDeliveryCharge() {
    const pincodeValue = pincode.value.trim();
    
    if (pincodeValue.length === 6) {
      const result = await checkPincodeServiceability(pincodeValue);
      
      if (result.serviceable) {
        isServiceable = true;
        pincodeStatus.textContent = `✅ Delivery available! ${result.estimatedTime}`;
        pincodeStatus.className = 'pincode-status serviceable';
        
        if (result.deliveryType === 'quick' || result.deliveryType === 'both') {
          quickPrice.textContent = `₹${result.deliveryCharge || BASE_DELIVERY_CHARGE}`;
          scheduledPrice.textContent = `₹${Math.max(0, (result.deliveryCharge || BASE_DELIVERY_CHARGE) - 10)}`;
        }
        
        deliveryCharge = currentDeliveryType === 'quick' ? (result.deliveryCharge || BASE_DELIVERY_CHARGE) : Math.max(0, (result.deliveryCharge || BASE_DELIVERY_CHARGE) - 10);
      } else {
        isServiceable = false;
        pincodeStatus.textContent = '❌ Delivery not available in this area yet. We are expanding soon!';
        pincodeStatus.className = 'pincode-status not-serviceable';
        deliveryCharge = 999; // High charge to prevent order
      }
    } else {
      pincodeStatus.style.display = 'none';
      deliveryCharge = BASE_DELIVERY_CHARGE;
    }
    
    updateOrderSummary();
  }

  // ========== Check Pincode Serviceability ==========
  async function checkPincodeServiceability(pincodeValue) {
    try {
      const doc = await db.collection('pincodes').doc(pincodeValue).get();
      if (doc.exists && doc.data().active !== false) {
        return {
          serviceable: true,
          deliveryType: doc.data().deliveryType || 'quick',
          deliveryCharge: doc.data().deliveryCharge || BASE_DELIVERY_CHARGE,
          freeAbove: doc.data().freeAbove || FREE_DELIVERY_THRESHOLD,
          estimatedTime: doc.data().deliveryType === 'quick' ? '10-15 mins delivery' : 'Scheduled delivery available'
        };
      }
      return { serviceable: false };
    } catch (error) {
      return { serviceable: false };
    }
  }

  // ========== Update Order Summary ==========
  function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const discount = appliedCoupon ? calculateDiscount(subtotal) : 0;
    const afterDiscount = subtotal - discount;
    let delivery = deliveryCharge;
    if (afterDiscount >= FREE_DELIVERY_THRESHOLD) delivery = 0;
    const total = afterDiscount + delivery;
    
    summarySubtotal.textContent = `₹${subtotal}`;
    
    if (discount > 0) {
      summaryDiscountRow.style.display = 'flex';
      summaryDiscount.textContent = `-₹${discount}`;
    } else {
      summaryDiscountRow.style.display = 'none';
    }
    
    summaryDelivery.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
    summaryTotal.textContent = `₹${total}`;
    
    const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - afterDiscount);
    const percent = Math.min(100, (afterDiscount / FREE_DELIVERY_THRESHOLD) * 100);
    progressFill.style.width = `${percent}%`;
    progressLabel.innerHTML = remaining <= 0 ? '🎉 Free delivery unlocked!' : `Add ₹${remaining} more for FREE delivery`;
  }

  // ========== Apply Coupon ==========
  function applyCoupon() {
    const code = couponCode.value.trim().toUpperCase();
    
    if (!code) {
      showCouponMessage('Please enter a coupon code', 'error');
      return;
    }
    
    const coupon = coupons.find(c => c.code === code);
    
    if (!coupon) {
      showCouponMessage('Invalid coupon code', 'error');
      return;
    }
    
    if (coupon.active === false) {
      showCouponMessage('This coupon is no longer active', 'error');
      return;
    }
    
    if (coupon.validTo && new Date(coupon.validTo) < new Date()) {
      showCouponMessage('This coupon has expired', 'error');
      return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    if (subtotal < (coupon.minOrder || 0)) {
      showCouponMessage(`Minimum order of ₹${coupon.minOrder} required`, 'error');
      return;
    }
    
    appliedCoupon = coupon;
    appliedCouponCodeSpan.textContent = appliedCoupon.code;
    appliedCouponBadge.style.display = 'flex';
    couponCode.value = '';
    showCouponMessage(`Coupon applied! ${coupon.type === 'flat' ? `₹${coupon.discount} OFF` : `${coupon.discount}% OFF`}`, 'success');
    updateOrderSummary();
  }

  function removeCoupon() {
    appliedCoupon = null;
    appliedCouponBadge.style.display = 'none';
    localStorage.removeItem('okmart_applied_coupon');
    updateOrderSummary();
    showCouponMessage('Coupon removed', 'success');
  }

  function showCouponMessage(message, type) {
    couponMessage.textContent = message;
    couponMessage.className = `coupon-message ${type}`;
    setTimeout(() => {
      couponMessage.textContent = '';
      couponMessage.className = 'coupon-message';
    }, 3000);
  }

  // ========== Map Functions ==========
  function initMap() {
    if (checkoutMapInstance) {
      checkoutMapInstance.remove();
    }
    
    const defaultLocation = selectedLat && selectedLng ? [selectedLat, selectedLng] : [22.5726, 88.3639];
    
    checkoutMapInstance = L.map(checkoutMap).setView(defaultLocation, 14);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    }).addTo(checkoutMapInstance);
    
    if (selectedLat && selectedLng) {
      mapMarker = L.marker([selectedLat, selectedLng]).addTo(checkoutMapInstance);
      mapMarker.bindPopup('Selected Location').openPopup();
    }
    
    checkoutMapInstance.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      
      if (mapMarker) {
        checkoutMapInstance.removeLayer(mapMarker);
      }
      
      mapMarker = L.marker([lat, lng]).addTo(checkoutMapInstance);
      mapMarker.bindPopup('Selected Location').openPopup();
      
      selectedLat = lat;
      selectedLng = lng;
      
      // Reverse geocoding to get address
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        selectedAddress = data.display_name;
        if (addressLine && !addressLine.value) {
          addressLine.value = selectedAddress;
        }
      } catch(err) {
        console.warn('Reverse geocoding failed');
      }
    });
  }

  function showMap() {
    mapSection.style.display = 'block';
    setTimeout(() => {
      if (checkoutMapInstance) {
        checkoutMapInstance.invalidateSize();
      } else {
        initMap();
      }
    }, 100);
  }

  function hideMap() {
    mapSection.style.display = 'none';
  }

  function confirmLocation() {
    if (selectedLat && selectedLng) {
      const locationData = { lat: selectedLat, lng: selectedLng, address: selectedAddress };
      localStorage.setItem('okmart_selected_location', JSON.stringify(locationData));
      hideMap();
      showToast('Location saved!', 'success');
    } else {
      showToast('Please select a location on the map', 'error');
    }
  }

  // ========== Get Current Location ==========
  function getCurrentLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported', 'error');
      return;
    }
    
    showToast('Detecting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        selectedLat = latitude;
        selectedLng = longitude;
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          selectedAddress = data.display_name;
          
          if (addressLine && !addressLine.value) {
            addressLine.value = selectedAddress;
          }
          
          const locationData = { lat: selectedLat, lng: selectedLng, address: selectedAddress };
          localStorage.setItem('okmart_selected_location', JSON.stringify(locationData));
          showToast('Location detected!', 'success');
        } catch(err) {
          showToast('Location detected but address not found', 'info');
        }
      },
      () => {
        showToast('Unable to detect location', 'error');
      }
    );
  }

  // ========== Address Selection ==========
  function onSavedAddressChange() {
    const index = savedAddressSelect.value;
    if (index !== '') {
      const addresses = JSON.parse(localStorage.getItem('okmart_saved_addresses') || '[]');
      const addr = addresses[parseInt(index)];
      if (addr) {
        fullName.value = addr.name || '';
        phoneNumber.value = addr.phone || '';
        addressLine.value = addr.address || '';
        city.value = addr.city || '';
        pincode.value = addr.pincode || '';
        landmark.value = addr.landmark || '';
      }
    }
  }

  // ========== Delivery Type Change ==========
  function onDeliveryTypeChange() {
    const selected = document.querySelector('input[name="deliveryType"]:checked');
    if (selected) {
      currentDeliveryType = selected.value;
      
      if (currentDeliveryType === 'scheduled') {
        deliverySlotContainer.style.display = 'block';
        deliveryCharge = 29;
      } else {
        deliverySlotContainer.style.display = 'none';
        deliveryCharge = BASE_DELIVERY_CHARGE;
      }
      
      updateOrderSummary();
    }
  }

  // ========== Pincode Change ==========
  async function onPincodeChange() {
    const pincodeValue = pincode.value.trim();
    if (pincodeValue.length === 6) {
      await updateDeliveryCharge();
    } else {
      pincodeStatus.style.display = 'none';
    }
  }

  // ========== Place Order ==========
  async function placeOrder() {
    // Validate form
    if (!fullName.value.trim()) {
      showToast('Please enter your name', 'error');
      fullName.focus();
      return;
    }
    
    const phone = phoneNumber.value.trim();
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      phoneNumber.focus();
      return;
    }
    
    if (!addressLine.value.trim()) {
      showToast('Please enter your address', 'error');
      addressLine.focus();
      return;
    }
    
    if (!city.value.trim()) {
      showToast('Please enter your city', 'error');
      city.focus();
      return;
    }
    
    if (!pincode.value.trim() || pincode.value.length !== 6) {
      showToast('Please enter a valid 6-digit pincode', 'error');
      pincode.focus();
      return;
    }
    
    if (!isServiceable) {
      showToast('Delivery not available in your area', 'error');
      return;
    }
    
    // Save user details
    saveUserDetails();
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const discount = appliedCoupon ? calculateDiscount(subtotal) : 0;
    const afterDiscount = subtotal - discount;
    let delivery = deliveryCharge;
    if (afterDiscount >= FREE_DELIVERY_THRESHOLD) delivery = 0;
    const total = afterDiscount + delivery;
    
    // Prepare order data
    const orderData = {
      name: fullName.value.trim(),
      phone: phone,
      email: email.value.trim() || null,
      address: addressLine.value.trim(),
      city: city.value.trim(),
      pincode: pincode.value.trim(),
      landmark: landmark.value.trim() || null,
      location: (selectedLat && selectedLng) ? { lat: selectedLat, lng: selectedLng } : null,
      deliveryType: currentDeliveryType,
      deliverySlot: currentDeliveryType === 'scheduled' ? deliverySlot.value : null,
      items: cart,
      subtotal: subtotal,
      discount: discount,
      deliveryCharge: delivery,
      total: total,
      status: 'received',
      orderDate: new Date().toISOString(),
      paymentMethod: 'cod'
    };
    
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Placing Order...';
    
    try {
      const docRef = await db.collection('orders').add(orderData);
      
      // Clear cart
      localStorage.removeItem('okmart_cart');
      localStorage.removeItem('okmart_applied_coupon');
      
      // Show success modal
      const orderId = docRef.id;
      trackOrderBtn.onclick = () => {
        window.location.href = `/track-order.html?id=${orderId}`;
      };
      continueShoppingBtn.onclick = () => {
        window.location.href = '/';
      };
      
      successModal.classList.add('active');
      
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('Error placing order. Please try again.', 'error');
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order →';
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

  // ========== Address Type Buttons ==========
  function initAddressTypeButtons() {
    document.querySelectorAll('.address-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.address-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const type = btn.dataset.type;
        if (type === 'home') {
          addressLine.placeholder = 'House/Flat number, Street, Area';
        } else if (type === 'work') {
          addressLine.placeholder = 'Office name, Building, Street';
        } else {
          addressLine.placeholder = 'Complete address';
        }
      });
    });
  }

  // ========== Event Listeners ==========
  function initEventListeners() {
    // Input events
    fullName?.addEventListener('input', saveUserDetails);
    phoneNumber?.addEventListener('input', saveUserDetails);
    email?.addEventListener('input', saveUserDetails);
    addressLine?.addEventListener('input', saveUserDetails);
    city?.addEventListener('input', saveUserDetails);
    pincode?.addEventListener('input', onPincodeChange);
    landmark?.addEventListener('input', saveUserDetails);
    
    // Buttons
    applyCouponBtn?.addEventListener('click', applyCoupon);
    removeCouponBtn?.addEventListener('click', removeCoupon);
    placeOrderBtn?.addEventListener('click', placeOrder);
    useCurrentLocationBtn?.addEventListener('click', getCurrentLocation);
    selectOnMapBtn?.addEventListener('click', showMap);
    closeMapBtn?.addEventListener('click', hideMap);
    confirmLocationBtn?.addEventListener('click', confirmLocation);
    savedAddressSelect?.addEventListener('change', onSavedAddressChange);
    
    // Delivery options
    document.querySelectorAll('input[name="deliveryType"]').forEach(radio => {
      radio.addEventListener('change', onDeliveryTypeChange);
    });
    
    // Close modal on outside click
    successModal?.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.classList.remove('active');
        window.location.href = '/';
      }
    });
  }

  // ========== Initialize ==========
  function init() {
    initEventListeners();
    initAddressTypeButtons();
    loadData();
    console.log('✅ Checkout page initialized');
  }
  
  init();
})();
