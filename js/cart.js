// ===== OK MART - CART.JS =====
// Full cart system with coupon, free item, and recommended products

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  const FREE_THRESHOLD = 199;
  const DELIVERY_FEE = 20;
  const FREE_ONION = {
    id: 'free_onion',
    name: 'Onion (FREE)',
    price: 0,
    mrp: 30,
    image: 'https://images.pexels.com/photos/144248/pexels-photo-144248.jpeg?auto=compress&cs=tinysrgb&w=200',
    unit: '1 kg',
    quantity: 1,
    isFree: true
  };
  
  // ========== STATE ==========
  let cart = [];
  let couponDiscount = 0;
  let appliedCouponCode = null;
  
  // ========== DOM ELEMENTS ==========
  const cartItemsList = document.getElementById('cartItemsList');
  const emptyCart = document.getElementById('emptyCart');
  const couponSection = document.getElementById('couponSection');
  const priceSummary = document.getElementById('priceSummary');
  const stickyCheckoutBar = document.getElementById('stickyCheckoutBar');
  const headerCartCount = document.getElementById('headerCartCount');
  const recommendedSlider = document.getElementById('recommendedSlider');
  const toastMessage = document.getElementById('toastMessage');
  
  // ========== CART FUNCTIONS ==========
  function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  
  function loadCart() {
    cart = getCart();
    manageFreeOnion();
    return cart;
  }
  
  function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item || item.isFree) return;
    
    const newQty = item.quantity + change;
    if (newQty <= 0) {
      removeItem(productId);
    } else {
      item.quantity = newQty;
      saveCart(cart);
      manageFreeOnion();
      renderCart();
    }
  }
  
  function removeItem(productId) {
    const item = cart.find(i => i.id === productId);
    if (item && item.isFree) return;
    cart = cart.filter(i => i.id !== productId);
    saveCart(cart);
    manageFreeOnion();
    renderCart();
    showToast('Item removed');
  }
  
  // ========== FREE ONION LOGIC ==========
  function manageFreeOnion() {
    const paidItemsTotal = cart
      .filter(i => !i.isFree)
      .reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    const hasFreeOnion = cart.some(i => i.id === 'free_onion');
    
    if (paidItemsTotal >= FREE_THRESHOLD && !hasFreeOnion) {
      cart.push({ ...FREE_ONION });
      saveCart(cart);
    } else if (paidItemsTotal < FREE_THRESHOLD && hasFreeOnion) {
      cart = cart.filter(i => i.id !== 'free_onion');
      saveCart(cart);
    }
  }
  
  // ========== CALCULATE TOTALS ==========
  function calculateTotals() {
    const subtotal = cart
      .filter(i => !i.isFree)
      .reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    const hasFreeOnion = cart.some(i => i.id === 'free_onion');
    const delivery = subtotal >= FREE_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = Math.max(0, subtotal - couponDiscount + delivery);
    
    return { subtotal, hasFreeOnion, delivery, total, couponDiscount };
  }
  
  // ========== RENDER CART ==========
  function renderCart() {
    const totals = calculateTotals();
    
    // Update header count
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    headerCartCount.textContent = totalItems;
    
    if (cart.length === 0) {
      cartItemsList.innerHTML = '';
      emptyCart.style.display = 'block';
      couponSection.style.display = 'none';
      priceSummary.style.display = 'none';
      stickyCheckoutBar.style.display = 'none';
      return;
    }
    
    emptyCart.style.display = 'none';
    couponSection.style.display = 'block';
    priceSummary.style.display = 'block';
    stickyCheckoutBar.style.display = 'flex';
    
    // Render items
    cartItemsList.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/70'">
        <div class="cart-item-info">
          <div class="cart-item-name">
            ${item.name}
            ${item.isFree ? '<span class="free-tag">🎁 FREE</span>' : ''}
          </div>
          <span class="cart-item-unit">${item.unit || ''}</span>
          <div class="cart-item-price">${item.isFree ? 'FREE' : '₹' + item.price}</div>
          ${!item.isFree ? `
            <div class="cart-item-actions">
              <div class="qty-control">
                <button class="qty-btn" onclick="window.cartUpdateQty('${item.id}', -1)">−</button>
                <span class="qty-number">${item.quantity}</span>
                <button class="qty-btn" onclick="window.cartUpdateQty('${item.id}', 1)">+</button>
              </div>
              <button class="remove-btn" onclick="window.cartRemoveItem('${item.id}')">🗑️</button>
            </div>
          ` : '<p style="font-size:.7rem;color:#10b981;margin-top:4px;">Added automatically on ₹199+</p>'}
        </div>
      </div>
    `).join('');
    
    // Update price summary
    document.getElementById('subtotal').textContent = `₹${totals.subtotal}`;
    
    if (totals.couponDiscount > 0) {
      document.getElementById('couponRow').style.display = 'flex';
      document.getElementById('couponDiscount').textContent = `-₹${totals.couponDiscount}`;
    } else {
      document.getElementById('couponRow').style.display = 'none';
    }
    
    document.getElementById('freeOnionRow').style.display = totals.hasFreeOnion ? 'flex' : 'none';
    document.getElementById('deliveryCharge').textContent = totals.delivery === 0 ? 'FREE' : `₹${totals.delivery}`;
    document.getElementById('totalAmount').textContent = `₹${totals.total}`;
    document.getElementById('barTotal').textContent = `₹${totals.total}`;
    
    // Delivery message
    const msgEl = document.getElementById('deliveryMessage');
    if (totals.delivery === 0) {
      msgEl.textContent = '🎉 Free delivery applied!';
      msgEl.style.color = '#10b981';
    } else {
      msgEl.textContent = `🚚 Add ₹${FREE_THRESHOLD - totals.subtotal} more for FREE delivery`;
      msgEl.style.color = '#f59e0b';
    }
  }
  
  // ========== COUPON SYSTEM ==========
  async function applyCoupon() {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    const msgEl = document.getElementById('couponMessage');
    
    if (!code) {
      msgEl.textContent = 'Please enter a coupon code';
      msgEl.className = 'coupon-message error';
      return;
    }
    
    try {
      const snapshot = await db.collection('offers')
        .where('code', '==', code)
        .where('active', '==', true)
        .get();
      
      if (snapshot.empty) {
        msgEl.textContent = '❌ Invalid or expired coupon';
        msgEl.className = 'coupon-message error';
        return;
      }
      
      const offer = snapshot.docs[0].data();
      const { subtotal } = calculateTotals();
      
      if (subtotal < offer.minOrder) {
        msgEl.textContent = `❌ Minimum order ₹${offer.minOrder} required`;
        msgEl.className = 'coupon-message error';
        return;
      }
      
      // Calculate discount
      if (offer.type === 'flat') {
        couponDiscount = offer.discount;
      } else if (offer.type === 'percent') {
        const calc = Math.round((subtotal * offer.discount) / 100);
        couponDiscount = offer.maxDiscount ? Math.min(calc, offer.maxDiscount) : calc;
      }
      
      appliedCouponCode = code;
      
      // Show applied coupon
      document.getElementById('appliedCoupon').style.display = 'flex';
      document.getElementById('appliedCode').textContent = code;
      document.getElementById('appliedDiscount').textContent = `-₹${couponDiscount}`;
      document.getElementById('couponInput').value = '';
      msgEl.textContent = '';
      
      renderCart();
      showToast(`Coupon ${code} applied!`, 'success');
      
    } catch (err) {
      msgEl.textContent = 'Error applying coupon';
      msgEl.className = 'coupon-message error';
    }
  }
  
  function removeCoupon() {
    couponDiscount = 0;
    appliedCouponCode = null;
    document.getElementById('appliedCoupon').style.display = 'none';
    document.getElementById('couponInput').value = '';
    document.getElementById('couponMessage').textContent = '';
    renderCart();
    showToast('Coupon removed');
  }
  
  // ========== RECOMMENDED PRODUCTS ==========
  async function loadRecommended() {
    try {
      const snapshot = await db.collection('products')
        .where('popular', '==', true)
        .limit(10)
        .get();
      
      recommendedSlider.innerHTML = '';
      
      if (snapshot.empty) {
        recommendedSlider.innerHTML = '<p style="color:var(--muted);padding:20px;">No recommendations</p>';
        return;
      }
      
      snapshot.forEach(doc => {
        const p = { id: doc.id, ...doc.data() };
        const card = document.createElement('div');
        card.className = 'mini-product-card';
        card.innerHTML = `
          <img src="${p.image}" alt="${p.name}" class="mini-product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/140'">
          <div class="mini-product-name">${p.name}</div>
          <div class="mini-product-price">₹${p.price}</div>
          <button class="mini-add-btn">+ Add</button>
        `;
        card.addEventListener('click', e => {
          if (!e.target.closest('button')) location.href = `/product.html?id=${p.id}`;
        });
        card.querySelector('.mini-add-btn').addEventListener('click', e => {
          e.stopPropagation();
          addToCartFromRecommended(p);
        });
        recommendedSlider.appendChild(card);
      });
      
    } catch (err) {
      recommendedSlider.innerHTML = '<p style="color:var(--muted);">Could not load</p>';
    }
  }
  
  function addToCartFromRecommended(product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, mrp: product.mrp, image: product.image, unit: product.unit, quantity: 1 });
    }
    saveCart(cart);
    manageFreeOnion();
    renderCart();
    showToast(`${product.name} added!`, 'success');
  }
  
  // ========== TOAST ==========
  function showToast(msg, type = 'info') {
    const toast = toastMessage;
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.color = 'white';
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }
  
  // ========== GLOBAL FUNCTIONS FOR HTML ==========
  window.cartUpdateQty = (id, change) => updateQuantity(id, change);
  window.cartRemoveItem = (id) => removeItem(id);
  
  // ========== EVENT LISTENERS ==========
  document.getElementById('applyCouponBtn').addEventListener('click', applyCoupon);
  document.getElementById('removeCouponBtn').addEventListener('click', removeCoupon);
  
  document.getElementById('couponInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') applyCoupon();
  });
  
  // ========== INIT ==========
  async function init() {
    loadCart();
    renderCart();
    await loadRecommended();
    console.log('✅ Cart page ready');
  }
  
  init();
  
})();
