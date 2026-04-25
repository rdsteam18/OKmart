// ===== OK Mart - Premium Home.js =====
// Firebase-powered dynamic home page

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  
  const CATEGORIES = [
    { id: 'dairy', name: 'Dairy & Eggs', icon: '🥛', slug: 'dairy' },
    { id: 'fruits', name: 'Fresh Fruits', icon: '🍎', slug: 'fruits' },
    { id: 'vegetables', name: 'Vegetables', icon: '🥕', slug: 'vegetables' },
    { id: 'snacks', name: 'Snacks', icon: '🍿', slug: 'snacks' },
    { id: 'beverages', name: 'Beverages', icon: '🥤', slug: 'beverages' },
    { id: 'electronics', name: 'Electronics', icon: '📱', slug: 'electronics' },
    { id: 'grocery', name: 'Grocery', icon: '🧺', slug: 'grocery' },
    { id: 'personal', name: 'Personal Care', icon: '🧴', slug: 'personal-care' },
    { id: 'household', name: 'Household', icon: '🧹', slug: 'household' },
    { id: 'bakery', name: 'Bakery', icon: '🥐', slug: 'bakery' }
  ];
  
  let allProducts = [];
  let bannerIndex = 0;
  let bannerInterval;
  
  // ========== LOAD ALL DATA ==========
  function loadAllData() {
    db.collection('products').where('active', '!=', false).onSnapshot(snap => {
      allProducts = []; snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
      renderCategoryGrid();
      renderAllSections();
      renderBestSellers();
    });
    
    db.collection('banners').where('active', '==', true).where('page', '==', 'home').onSnapshot(snap => {
      const banners = []; snap.forEach(d => banners.push({ id: d.id, ...d.data() }));
      renderBanners(banners.length ? banners : [
        { image: 'https://images.pexels.com/photos/5650026/pexels-photo-5650026.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' },
        { image: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' },
        { image: 'https://images.pexels.com/photos/1639556/pexels-photo-1639556.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' }
      ]);
    });
  }
  
  // ========== BANNERS ==========
  function renderBanners(banners) {
    const track = document.getElementById('bannerTrack');
    track.innerHTML = banners.map((b, i) => `
      <div class="banner-slide"><a href="${b.link||'/offers.html'}"><img src="${b.image}" alt="${b.title||'Offer'}" loading="${i===0?'eager':'lazy'}" onerror="this.src='https://placehold.co/600x150/2ecc71/white?text=Special+Offer'"></a></div>
    `).join('');
    document.getElementById('bannerDots').innerHTML = banners.map((_, i) => `<span class="banner-dot ${i===0?'active':''}" onclick="window.goBanner(${i})"></span>`).join('');
    if (banners.length > 1) startAutoSlide(banners.length);
  }
  
  function startAutoSlide(total) {
    clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
      bannerIndex = (bannerIndex + 1) % total;
      document.getElementById('bannerTrack').style.transform = `translateX(-${bannerIndex*100}%)`;
      document.querySelectorAll('.banner-dot').forEach((d,i) => d.classList.toggle('active', i===bannerIndex));
    }, 3500);
  }
  window.goBanner = (i) => { bannerIndex = i; document.getElementById('bannerTrack').style.transform = `translateX(-${i*100}%)`; document.querySelectorAll('.banner-dot').forEach((d,j) => d.classList.toggle('active', j===i)); };
  
  // ========== CATEGORY GRID ==========
  function renderCategoryGrid() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = CATEGORIES.map(c => `
      <a href="/categories/${c.slug}.html" class="category-card">
        <span class="category-icon">${c.icon}</span>
        <span class="category-name">${c.name}</span>
      </a>
    `).join('');
  }
  
  // ========== PRODUCT SECTIONS ==========
  function renderAllSections() {
    const container = document.getElementById('categorySections');
    container.innerHTML = '';
    
    CATEGORIES.forEach(cat => {
      const products = allProducts.filter(p => p.category === cat.id).slice(0, 10);
      if (!products.length) return;
      
      const section = document.createElement('section');
      section.className = 'product-section';
      section.innerHTML = `
        <div class="section-header-row">
          <h2 class="section-heading">${cat.icon} ${cat.name}</h2>
          <a href="/categories/${cat.slug}.html" class="view-all-btn">View All →</a>
        </div>
        <div class="product-slider" id="slider-${cat.id}"></div>
      `;
      container.appendChild(section);
      
      const slider = section.querySelector('.product-slider');
      products.forEach(p => slider.appendChild(createProductCard(p)));
    });
  }
  
  // ========== BEST SELLERS ==========
  function renderBestSellers() {
    const section = document.getElementById('bestsellerSection');
    const grid = document.getElementById('bestsellerGrid');
    const popular = allProducts.filter(p => p.popular).slice(0, 6);
    if (!popular.length) return;
    section.style.display = 'block';
    grid.innerHTML = '';
    popular.forEach(p => grid.appendChild(createProductCard(p, true)));
  }
  
  // ========== PRODUCT CARD ==========
  function createProductCard(product, isGrid = false) {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'product-card';
    if (isGrid) card.style.flex = 'unset';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://placehold.co/150/eee/999?text=🛒'">
      ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
      <button class="wishlist-heart">${isInWishlist(product.id)?'❤️':'🤍'}</button>
      <button class="share-mini">📤</button>
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit||''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp&&product.mrp>product.price?`<span class="mrp-price">₹${product.mrp}</span>`:''}
        ${discount>0?`<span class="discount-badge">${discount}% OFF</span>`:''}
      </div>
      <button class="add-btn">ADD</button>
    `;
    
    card.addEventListener('click', e => { if (!e.target.closest('button')) location.href = `/product.html?id=${product.id}`; });
    card.querySelector('.add-btn').addEventListener('click', e => { e.stopPropagation(); addToCart(product); });
    card.querySelector('.wishlist-heart').addEventListener('click', e => { e.stopPropagation(); toggleWishlist(product, e.target); });
    card.querySelector('.share-mini').addEventListener('click', e => { e.stopPropagation(); shareProduct(product); });
    return card;
  }
  
  // ========== CART ==========
  function getCart() { return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }
  function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartUI(); }
  function addToCart(p) {
    const c = getCart(); const ex = c.find(i => i.id === p.id);
    if (ex) ex.quantity++; else c.push({ id:p.id, name:p.name, price:p.price, mrp:p.mrp, image:p.image, unit:p.unit, quantity:1 });
    saveCart(c); showToast(`${p.name} added!`,'success');
  }
  function updateCartUI() {
    const c = getCart(); const t = c.reduce((s,i) => s+i.quantity, 0), st = c.reduce((s,i) => s+(i.price*i.quantity), 0);
    const badge = document.getElementById('cartBadge'); if (badge) badge.textContent = t;
    const bar = document.getElementById('floatingCartBar');
    if (t > 0) { bar.classList.add('visible'); document.getElementById('barCartCount').textContent = `${t} item${t!==1?'s':''}`; document.getElementById('barCartTotal').textContent = '₹'+st; }
    else bar.classList.remove('visible');
  }
  
  // ========== WISHLIST ==========
  function getWishlist() { return JSON.parse(localStorage.getItem(WISHLIST_KEY)||'[]'); }
  function isInWishlist(id) { return getWishlist().some(i => i.id === id); }
  function toggleWishlist(p, el) {
    const w = getWishlist(); const idx = w.findIndex(i => i.id === p.id);
    if (idx > -1) { w.splice(idx, 1); el.textContent = '🤍'; } else { w.push({ id:p.id, name:p.name, price:p.price, image:p.image }); el.textContent = '❤️'; }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(w));
  }
  
  // ========== SHARE ==========
  function shareProduct(p) {
    const url = `${location.origin}/product.html?id=${p.id}`;
    if (navigator.share) navigator.share({ title: p.name, url }).catch(()=>{});
    else window.open(`https://wa.me/?text=${encodeURIComponent(`🛒 ${p.name}\n💰 ₹${p.price}\n${url}`)}`, '_blank');
  }
  
  // ========== TOAST ==========
  function showToast(msg, type) {
    const t = document.getElementById('toastMessage');
    t.textContent = msg; t.style.background = type === 'success' ? '#10b981' : '#1a1e2b'; t.style.color = 'white';
    t.classList.add('show'); clearTimeout(window._tt); window._tt = setTimeout(() => t.classList.remove('show'), 2500);
  }
  
  // ========== BACK TO TOP ==========
  window.addEventListener('scroll', () => {
    document.getElementById('backToTop').classList.toggle('visible', window.scrollY > 500);
  });
  document.getElementById('backToTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  
  // ========== INIT ==========
  loadAllData();
  updateCartUI();
  console.log('🚀 OK Mart Premium Home ready');
})();
