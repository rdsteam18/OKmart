// ===== OK MART - HOME.JS =====
// Dynamic home page with Firebase products & banners

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  
  // Category config with icons and display names
  const CATEGORY_CONFIG = {
    dairy: { name: 'Dairy & Eggs', icon: '🥛' },
    fruits: { name: 'Fresh Fruits', icon: '🍎' },
    vegetables: { name: 'Fresh Vegetables', icon: '🥕' },
    snacks: { name: 'Snacks & Munchies', icon: '🍿' },
    beverages: { name: 'Beverages', icon: '🥤' },
    grocery: { name: 'Grocery Staples', icon: '🧺' },
    electronics: { name: 'Electronics', icon: '📱' },
    bakery: { name: 'Bakery', icon: '🥐' },
    personal: { name: 'Personal Care', icon: '🧴' },
    household: { name: 'Household', icon: '🧹' }
  };
  
  let allProducts = [];
  let bannerIndex = 0;
  
  // ========== LOAD PRODUCTS & RENDER SECTIONS ==========
  db.collection('products').where('active', '!=', false).onSnapshot(snapshot => {
    allProducts = [];
    snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
    renderAllCategorySections();
  });
  
  // ========== LOAD BANNERS ==========
  db.collection('banners').where('active', '==', true).where('page', '==', 'home').onSnapshot(snapshot => {
    const banners = [];
    snapshot.forEach(doc => banners.push({ id: doc.id, ...doc.data() }));
    renderBannerCarousel(banners);
  });
  
  // ========== BANNER CAROUSEL ==========
  function renderBannerCarousel(banners) {
    const track = document.getElementById('bannerTrack');
    const dots = document.getElementById('bannerDots');
    
    if (banners.length === 0) {
      banners = [
        { image: 'https://images.pexels.com/photos/5650026/pexels-photo-5650026.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' },
        { image: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' },
        { image: 'https://images.pexels.com/photos/1639556/pexels-photo-1639556.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' }
      ];
    }
    
    track.innerHTML = banners.map((b, i) => `
      <div class="banner-slide">
        <a href="${b.link || '/offers.html'}">
          <img src="${b.image}" alt="Offer" loading="${i === 0 ? 'eager' : 'lazy'}" onerror="this.src='https://via.placeholder.com/600x150?text=OK+Mart+Offer'">
        </a>
      </div>
    `).join('');
    
    dots.innerHTML = banners.map((_, i) => `
      <span class="banner-dot ${i === 0 ? 'active' : ''}" onclick="window.goToBanner(${i})"></span>
    `).join('');
    
    if (banners.length > 1) startAutoSlide(banners.length);
  }
  
  function startAutoSlide(total) {
    setInterval(() => {
      bannerIndex = (bannerIndex + 1) % total;
      document.getElementById('bannerTrack').style.transform = `translateX(-${bannerIndex * 100}%)`;
      document.querySelectorAll('.banner-dot').forEach((d, i) => d.classList.toggle('active', i === bannerIndex));
    }, 3000);
  }
  
  window.goToBanner = (i) => {
    bannerIndex = i;
    document.getElementById('bannerTrack').style.transform = `translateX(-${bannerIndex * 100}%)`;
    document.querySelectorAll('.banner-dot').forEach((d, j) => d.classList.toggle('active', j === i));
  };
  
  // ========== RENDER CATEGORY SECTIONS ==========
  function renderAllCategorySections() {
    const container = document.getElementById('categorySections');
    container.innerHTML = '';
    
    Object.entries(CATEGORY_CONFIG).forEach(([category, config]) => {
      const products = allProducts.filter(p => p.category === category).slice(0, 10);
      if (products.length === 0) return;
      
      const section = document.createElement('section');
      section.className = 'category-section';
      section.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">${config.icon} ${config.name}</h2>
          <a href="/categories/${category}.html" class="view-all">View All →</a>
        </div>
        <div class="product-slider" id="slider-${category}"></div>
      `;
      
      container.appendChild(section);
      
      const slider = section.querySelector('.product-slider');
      products.forEach(product => {
        slider.appendChild(createProductCard(product));
      });
    });
  }
  
  // ========== CREATE PRODUCT CARD ==========
  function createProductCard(product) {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=OK'">
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
    
    card.addEventListener('click', e => { if (!e.target.closest('button')) location.href = `/product.html?id=${product.id}`; });
    card.querySelector('.add-btn').addEventListener('click', e => { e.stopPropagation(); addToCart(product); });
    card.querySelector('.wishlist-btn').addEventListener('click', e => { e.stopPropagation(); toggleWishlist(product, e.target); });
    card.querySelector('.share-btn').addEventListener('click', e => { e.stopPropagation(); shareProduct(product); });
    
    return card;
  }
  
  // ========== CART ==========
  function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartUI(); }
  
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
    
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = total;
    
    const bar = document.getElementById('floatingCartBar');
    if (total > 0) {
      bar.classList.add('visible');
      document.getElementById('barCartCount').textContent = `${total} item${total !== 1 ? 's' : ''}`;
      document.getElementById('barCartTotal').textContent = '₹' + subtotal;
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
  function showToast(msg, type) {
    const toast = document.getElementById('toastMessage');
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.color = 'white';
    toast.classList.add('show');
    clearTimeout(window._t);
    window._t = setTimeout(() => toast.classList.remove('show'), 2500);
  }
  
  // Init
  updateCartUI();
  console.log('✅ Home page ready');
})();
