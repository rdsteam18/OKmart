// ===== OK Mart - UNIFIED CATEGORY.JS =====
// Works for ALL categories: fruits, dairy, snacks, etc.

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  
  // Category config - auto-detected from body data attribute
  const category = document.body.dataset.category || 'fruits';
  
  const categoryConfig = {
    fruits: { title: 'Fresh Fruits', icon: '🍎', desc: 'Handpicked fresh fruits delivered daily' },
    dairy: { title: 'Dairy & Eggs', icon: '🥛', desc: 'Fresh milk, butter, paneer & more' },
    vegetables: { title: 'Fresh Vegetables', icon: '🥕', desc: 'Farm fresh vegetables delivered daily' },
    snacks: { title: 'Snacks & Munchies', icon: '🍿', desc: 'Chips, biscuits, namkeen & more' },
    beverages: { title: 'Beverages', icon: '🥤', desc: 'Soft drinks, juices, tea & coffee' },
    grocery: { title: 'Grocery Staples', icon: '🧺', desc: 'Atta, rice, dal, oils & essentials' },
    electronics: { title: 'Electronics', icon: '📱', desc: 'Mobile accessories, chargers & gadgets' },
    bakery: { title: 'Bakery', icon: '🥐', desc: 'Fresh bread, cakes & pastries' },
    personal: { title: 'Personal Care', icon: '🧴', desc: 'Bath, body & oral care products' },
    household: { title: 'Household', icon: '🧹', desc: 'Cleaning & kitchen essentials' }
  };
  
  const config = categoryConfig[category] || { title: category, icon: '🛒', desc: 'Quality products' };
  
  let allProducts = [];
  let currentSort = 'popular';
  let sortOpen = false;
  
  // ========== UPDATE UI ==========
  document.title = `${config.title} | OK Mart`;
  const titleEl = document.getElementById('pageTitle');
  const heroIcon = document.querySelector('.hero-icon');
  const heroTitle = document.querySelector('.hero-content h2');
  const heroDesc = document.querySelector('.hero-content p');
  if (titleEl) titleEl.textContent = config.title;
  if (heroIcon) heroIcon.textContent = config.icon;
  if (heroTitle) heroTitle.textContent = config.title;
  if (heroDesc) heroDesc.textContent = config.desc;
  
  // ========== LOAD PRODUCTS ==========
  db.collection('products').where('category', '==', category).where('active', '!=', false).onSnapshot(snap => {
    allProducts = []; snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
    sortAndRender();
  });
  
  // ========== SORT ==========
  function sortAndRender() {
    let sorted = [...allProducts];
    switch(currentSort) {
      case 'popular': sorted.sort((a,b) => (b.popular?1:0) - (a.popular?1:0)); break;
      case 'price-low': sorted.sort((a,b) => a.price - b.price); break;
      case 'price-high': sorted.sort((a,b) => b.price - a.price); break;
      case 'discount': sorted.sort((a,b) => { const da=a.mrp?((a.mrp-a.price)/a.mrp):0, db2=b.mrp?((b.mrp-b.price)/b.mrp):0; return db2-da; }); break;
      case 'name': sorted.sort((a,b) => a.name.localeCompare(b.name)); break;
    }
    renderProducts(sorted);
  }
  
  function renderProducts(products) {
    document.getElementById('loadingGrid').style.display = 'none';
    document.getElementById('productCount').textContent = `${products.length} product${products.length!==1?'s':''}`;
    
    const grid = document.getElementById('productGrid');
    const empty = document.getElementById('emptyState');
    
    if (!products.length) { grid.style.display = 'none'; empty.style.display = 'block'; return; }
    
    grid.style.display = 'grid'; empty.style.display = 'none';
    grid.innerHTML = '';
    products.forEach(p => grid.appendChild(createProductCard(p)));
  }
  
  // ========== PRODUCT CARD ==========
  function createProductCard(product) {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'product-card';
    if (product.seasonal) card.innerHTML += '<span class="seasonal-badge">🌟 Seasonal</span>';
    card.innerHTML += `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://placehold.co/200/eee/999?text=🛒'">
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
    document.getElementById('cartBadge').textContent = t;
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
  
  // ========== SORT TOGGLE ==========
  window.toggleSort = () => {
    sortOpen = !sortOpen;
    document.getElementById('sortDropdown').classList.toggle('show', sortOpen);
  };
  
  document.querySelectorAll('.sort-option').forEach(opt => {
    opt.addEventListener('click', function() {
      currentSort = this.dataset.sort;
      document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('sortLabel').textContent = this.textContent.trim();
      document.getElementById('sortDropdown').classList.remove('show');
      sortOpen = false;
      sortAndRender();
    });
  });
  
  document.addEventListener('click', e => { if (!e.target.closest('.sort-wrapper')) { document.getElementById('sortDropdown').classList.remove('show'); sortOpen = false; } });
  
  // ========== TOAST ==========
  function showToast(msg, type) {
    const t = document.getElementById('toastMessage');
    t.textContent = msg; t.style.background = type === 'success' ? '#10b981' : '#1a1e2b'; t.style.color = 'white';
    t.classList.add('show'); clearTimeout(window._tt); window._tt = setTimeout(() => t.classList.remove('show'), 2500);
  }
  
  // ========== INIT ==========
  updateCartUI();
  console.log(`✅ ${config.title} category ready`);
})();
