// ===== OK MART - CART.JS =====
// Full cart system with coupon, free item, recommended products

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  const FREE_THRESHOLD = 199;
  const DELIVERY_FEE = 20;
  const FREE_ONION = {
    id: 'free_onion',
    name: 'Onion (FREE)',
    price: 0, mrp: 30,
    image: 'https://images.pexels.com/photos/144248/pexels-photo-144248.jpeg?auto=compress&cs=tinysrgb&w=200',
    unit: '1 kg', quantity: 1, isFree: true
  };
  
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
  const popularGrid = document.getElementById('popularGrid');
  const toastMessage = document.getElementById('toastMessage');
  
  // ========== CART FUNCTIONS ==========
  function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); }
  
  function loadCart() { cart = getCart(); manageFreeOnion(); return cart; }
  
  function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item || item.isFree) return;
    const newQty = item.quantity + change;
    if (newQty <= 0) removeItem(productId);
    else { item.quantity = newQty; saveCart(cart); manageFreeOnion(); renderCart(); }
  }
  
  function removeItem(productId) {
    if (cart.find(i => i.id === productId)?.isFree) return;
    cart = cart.filter(i => i.id !== productId);
    saveCart(cart); manageFreeOnion(); renderCart(); showToast('Item removed');
  }
  
  // ========== FREE ONION LOGIC ==========
  function manageFreeOnion() {
    const paidTotal = cart.filter(i => !i.isFree).reduce((s, i) => s + (i.price * i.quantity), 0);
    const hasOnion = cart.some(i => i.id === 'free_onion');
    if (paidTotal >= FREE_THRESHOLD && !hasOnion) { cart.push({ ...FREE_ONION }); saveCart(cart); }
    else if (paidTotal < FREE_THRESHOLD && hasOnion) { cart = cart.filter(i => i.id !== 'free_onion'); saveCart(cart); }
  }
  
  // ========== CALCULATE TOTALS ==========
  function calculateTotals() {
    const mrpTotal = cart.filter(i => !i.isFree).reduce((s, i) => s + ((i.mrp || i.price) * i.quantity), 0);
    const subtotal = cart.filter(i => !i.isFree).reduce((s, i) => s + (i.price * i.quantity), 0);
    const itemDiscount = mrpTotal - subtotal;
    const hasOnion = cart.some(i => i.id === 'free_onion');
    const delivery = subtotal >= FREE_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = Math.max(0, subtotal - couponDiscount + delivery);
    return { mrpTotal, subtotal, itemDiscount, couponDiscount, hasOnion, delivery, total };
  }
  
  // ========== RENDER CART ==========
  function renderCart() {
    const totals = calculateTotals();
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
    stickyCheckoutBar.style.display = 'block';
    
    // Render items
    cartItemsList.innerHTML = cart.map(item => {
      const itemTotal = item.price * item.quantity;
      return `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/70'">
          <div class="cart-item-info">
            <div class="cart-item-name">
              ${item.name}
              ${item.isFree ? '<span class="free-badge">🎁 FREE</span>' : ''}
            </div>
            <span class="cart-item-unit">${item.unit || ''}</span>
            <div class="cart-item-price">${item.isFree ? 'FREE' : '₹' + item.price}</div>
            ${!item.isFree ? `
              <div class="cart-item-actions">
                <div class="qty-control">
                  <button class="qty-btn" onclick="window.cartQty('${item.id}', -1)">−</button>
                  <span class="qty-num">${item.quantity}</span>
                  <button class="qty-btn" onclick="window.cartQty('${item.id}', 1)">+</button>
                </div>
                <button class="remove-btn" onclick="window.cartRemove('${item.id}')">🗑️</button>
              </div>
            ` : '<div class="free-item-note">Added automatically on ₹199+</div>'}
          </div>
          <div class="item-total-price">${item.isFree ? 'FREE' : '₹' + itemTotal}</div>
        </div>
      `;
    }).join('');
    
    // Update summary
    document.getElementById('mrpTotal').textContent = '₹' + totals.mrpTotal;
    document.getElementById('itemDiscount').textContent = '-₹' + totals.itemDiscount;
    
    if (totals.couponDiscount > 0) {
      document.getElementById('couponDiscountRow').style.display = 'flex';
      document.getElementById('couponDiscount').textContent = '-₹' + totals.couponDiscount;
    } else {
      document.getElementById('couponDiscountRow').style.display = 'none';
    }
    
    document.getElementById('freeOnionRow').style.display = totals.hasOnion ? 'flex' : 'none';
    document.getElementById('deliveryCharge').textContent = totals.delivery === 0 ? 'FREE' : '₹' + totals.delivery;
    document.getElementById('totalAmount').textContent = '₹' + totals.total;
    
    document.getElementById('barTotal').textContent = '₹' + totals.total;
    document.getElementById('barItems').textContent = totalItems + ' item' + (totalItems !== 1 ? 's' : '');
    
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
    
    if (!code) { msgEl.textContent = 'Enter a coupon code'; msgEl.className = 'coupon-message error'; return; }
    
    try {
      const snap = await db.collection('offers').where('code', '==', code).where('active', '==', true).get();
      if (snap.empty) { msgEl.textContent = '❌ Invalid or expired coupon'; msgEl.className = 'coupon-message error'; return; }
      
      const offer = snap.docs[0].data();
      const { subtotal } = calculateTotals();
      if (subtotal < offer.minOrder) { msgEl.textContent = `❌ Min order ₹${offer.minOrder} required`; msgEl.className = 'coupon-message error'; return; }
      
      if (offer.type === 'flat') couponDiscount = offer.discount;
      else if (offer.type === 'percent') { const d = Math.round((subtotal * offer.discount) / 100); couponDiscount = offer.maxDiscount ? Math.min(d, offer.maxDiscount) : d; }
      appliedCouponCode = code;
      
      document.getElementById('appliedCouponDisplay').style.display = 'flex';
      document.getElementById('appliedCode').textContent = code;
      document.getElementById('appliedDiscount').textContent = '-₹' + couponDiscount;
      document.getElementById('couponInput').value = '';
      msgEl.textContent = '✅ Coupon applied!';
      msgEl.className = 'coupon-message success';
      
      // Save to session for checkout
      sessionStorage.setItem('checkout_coupon', JSON.stringify({ code, discount: couponDiscount }));
      renderCart();
      showToast(`Coupon ${code} applied! -₹${couponDiscount}`, 'success');
    } catch (err) { msgEl.textContent = 'Error applying coupon'; msgEl.className = 'coupon-message error'; }
  }
  
  function removeCoupon() {
    couponDiscount = 0; appliedCouponCode = null;
    document.getElementById('appliedCouponDisplay').style.display = 'none';
    document.getElementById('couponInput').value = '';
    document.getElementById('couponMessage').textContent = '';
    document.getElementById('couponMessage').className = 'coupon-message';
    sessionStorage.removeItem('checkout_coupon');
    renderCart(); showToast('Coupon removed');
  }
  
  // ========== RECOMMENDED PRODUCTS ==========
  async function loadRecommended() {
    try {
      const snap = await db.collection('products').where('popular', '==', true).limit(8).get();
      recommendedSlider.innerHTML = '';
      snap.forEach(doc => {
        const p = { id: doc.id, ...doc.data() };
        if (cart.some(i => i.id === p.id)) return;
        const card = document.createElement('div');
        card.className = 'mini-product-card';
        card.innerHTML = `
          <img src="${p.image}" class="mini-product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/140'">
          <div class="mini-product-name">${p.name}</div>
          <div class="mini-product-price">₹${p.price}</div>
          <button class="mini-add-btn">+ Add</button>
        `;
        card.querySelector('.mini-add-btn').addEventListener('click', e => { e.stopPropagation(); addRecommended(p); });
        recommendedSlider.appendChild(card);
      });
    } catch (err) {}
  }
  
  async function loadPopularForEmpty() {
    try {
      const snap = await db.collection('products').where('popular', '==', true).limit(4).get();
      popularGrid.innerHTML = '';
      snap.forEach(doc => {
        const p = { id: doc.id, ...doc.data() };
        const card = document.createElement('div');
        card.className = 'mini-product-card';
        card.style.flex = 'unset';
        card.innerHTML = `
          <img src="${p.image}" class="mini-product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/140'">
          <div class="mini-product-name">${p.name}</div>
          <div class="mini-product-price">₹${p.price}</div>
          <button class="mini-add-btn">+ Add</button>
        `;
        card.querySelector('.mini-add-btn').addEventListener('click', e => { e.stopPropagation(); addRecommended(p); });
        popularGrid.appendChild(card);
      });
    } catch (err) {}
  }
  
  function addRecommended(product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.quantity++;
    else cart.push({ id: product.id, name: product.name, price: product.price, mrp: product.mrp, image: product.image, unit: product.unit, quantity: 1 });
    saveCart(cart); manageFreeOnion(); renderCart();
    showToast(`${product.name} added!`, 'success');
  }
  
  // ========== TOAST ==========
  function showToast(msg, type) {
    const t = toastMessage;
    t.textContent = msg;
    t.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    t.style.color = 'white'; t.classList.add('show');
    clearTimeout(window._t); window._t = setTimeout(() => t.classList.remove('show'), 2500);
  }
  
  // ========== GLOBAL FUNCTIONS ==========
  window.cartQty = (id, d) => updateQuantity(id, d);
  window.cartRemove = (id) => removeItem(id);
  
  // ========== EVENT LISTENERS ==========
  document.getElementById('applyCouponBtn').addEventListener('click', applyCoupon);
  document.getElementById('removeCouponBtn').addEventListener('click', removeCoupon);
  document.getElementById('couponInput').addEventListener('keypress', e => { if (e.key === 'Enter') applyCoupon(); });
  
  // ========== INIT ==========
  async function init() {
    loadCart(); renderCart();
    await Promise.all([loadRecommended(), loadPopularForEmpty()]);
    // Check for saved coupon from checkout session
    const saved = sessionStorage.getItem('checkout_coupon');
    if (saved) { const d = JSON.parse(saved); couponDiscount = d.discount; appliedCouponCode = d.code; document.getElementById('appliedCouponDisplay').style.display = 'flex'; document.getElementById('appliedCode').textContent = d.code; document.getElementById('appliedDiscount').textContent = '-₹' + d.discount; renderCart(); }
    console.log('✅ Cart ready');
  }
  init();
})();
