// ===== OK MART - HOME.JS =====
// Firebase product loading, cart, wishlist, share, banner carousel

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  
  // ========== STATE ==========
  let allProducts = [];
  let bannerIndex = 0;
  let bannerInterval;
  
  // ========== FIREBASE: LOAD PRODUCTS ==========
  async function loadProducts() {
    try {
      const snapshot = await db.collection('products').get();
      allProducts = [];
      snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
      
      // Sort: popular first
      allProducts.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
      
      renderRecommended();
      renderBestsellers();
      renderPopular();
      
      console.log(`✅ Loaded ${allProducts.length} products`);
    } catch (err) {
      console.error('Firebase error:', err);
      document.querySelectorAll('.loading-skeleton').forEach(el => {
        el.innerHTML = '<p style="padding:20px;color:#6b7280;">Failed to load products</p>';
      });
    }
  }
  
  // ========== RENDER PRODUCT CARD ==========
  function createProductCard(product) {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=OK'">
      ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
      <button class="wishlist-btn">${isInWishlist(product.id) ? '❤️' : '🤍'}</button>
      <button class="share-btn">📤</button>
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      </div>
      <button class="add-btn">ADD</button>
    `;
    
    // Click → product detail
    card.addEventListener('click', e => {
      if (!e.target.closest('button')) location.href = `/product.html?id=${product.id}`;
    });
    
    // Add to cart
    card.querySelector('.add-btn').addEventListener('click', e => {
      e.stopPropagation();
      addToCart(product);
    });
    
    // Wishlist toggle
    card.querySelector('.wishlist-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleWishlist(product, e.target);
    });
    
    // Share
    card.querySelector('.share-btn').addEventListener('click', e => {
      e.stopPropagation();
      shareProduct(product);
    });
    
    return card;
  }
  
  // ========== RENDER SECTIONS ==========
  function renderRecommended() {
    const slider = document.getElementById('recommendedSlider');
    if (!slider) return;
    slider.innerHTML = '';
    allProducts.slice(0, 8).forEach(p => slider.appendChild(createProductCard(p)));
  }
  
  function renderBestsellers() {
    const grid = document.getElementById('bestsellerGrid');
    if (!grid) return;
    grid.innerHTML = '';
    allProducts.filter(p => p.popular).slice(0, 6).forEach(p => grid.appendChild(createProductCard(p)));
  }
  
  function renderPopular() {
    const slider = document.getElementById('popularSlider');
    if (!slider) return;
    slider.innerHTML = '';
    allProducts.slice(4, 12).forEach(p => slider.appendChild(createProductCard(p)));
  }
  
  // ========== CART FUNCTIONS ==========
  function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartUI(); }
  
  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.quantity++;
    else cart.push({ id: product.id, name: product.name, price: product.price, mrp: product.mrp, image: product.image, unit: product.unit, quantity: 1 });
    saveCart(cart);
    showToast(`${product.name} added!`, 'success');
  }
  
  function updateCartUI() {
    const cart = getCart();
    const total = cart.reduce((s, i) => s + i.quantity, 0);
    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    
    // Badge
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = total;
    
    // Floating bar
    const bar = document.getElementById('floatingCartBar');
    const barCount = document.getElementById('barCartCount');
    const barTotal = document.getElementById('barCartTotal');
    
    if (total > 0) {
      bar.classList.add('visible');
      if (barCount) barCount.textContent = `${total} item${total !== 1 ? 's' : ''}`;
      if (barTotal) barTotal.textContent = `₹${subtotal}`;
    } else {
      bar.classList.remove('visible');
    }
  }
  
  // ========== WISHLIST ==========
  function getWishlist() { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); }
  function isInWishlist(id) { return getWishlist().some(i => i.id === id); }
  
  function toggleWishlist(product, heartEl) {
    const w = getWishlist();
    const idx = w.findIndex(i => i.id === product.id);
    if (idx > -1) { w.splice(idx, 1); heartEl.textContent = '🤍'; }
    else { w.push({ id: product.id, name: product.name, price: product.price, image: product.image }); heartEl.textContent = '❤️'; }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(w));
  }
  
  // ========== SHARE ==========
  function shareProduct(product) {
    const url = `${location.origin}/product.html?id=${product.id}`;
    if (navigator.share) navigator.share({ title: product.name, url }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(`🛒 ${product.name}\n💰 ₹${product.price}\n${url}`)}`, '_blank');
  }
  
  // ========== TOAST ==========
  function showToast(msg, type = 'info') {
    const toast = document.getElementById('toastMessage');
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.color = 'white';
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }
  
  // ========== BANNER CAROUSEL ==========
  function startBannerCarousel() {
    const track = document.getElementById('bannerTrack');
    const dots = document.querySelectorAll('#bannerDots .dot');
    const slides = document.querySelectorAll('.banner-slide');
    if (!track || slides.length === 0) return;
    
    function goToSlide(index) {
      bannerIndex = index;
      track.style.transform = `translateX(-${bannerIndex * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === bannerIndex));
    }
    
    function nextSlide() {
      bannerIndex = (bannerIndex + 1) % slides.length;
      goToSlide(bannerIndex);
    }
    
    dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));
    
    // Auto slide
    bannerInterval = setInterval(nextSlide, 3000);
    
    // Touch swipe
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
    track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) bannerIndex = (bannerIndex + 1) % slides.length;
        else bannerIndex = (bannerIndex - 1 + slides.length) % slides.length;
        goToSlide(bannerIndex);
      }
    });
  }
  
  // ========== INIT ==========
  async function init() {
    await loadProducts();
    updateCartUI();
    startBannerCarousel();
    console.log('✅ Home page ready');
  }
  
  init();
})();
