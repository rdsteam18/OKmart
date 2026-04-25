// ===== OK MART - CATEGORY.JS =====
// Dynamic category page - works for ANY category (dairy, fruits, snacks, etc.)

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  
  // ========== CATEGORY DETECTION ==========
  const category = document.body.dataset.category || 'dairy';
  
  // Category display config
  const categoryConfig = {
    dairy: { title: 'Dairy & Eggs', icon: '🥛', description: 'Fresh milk, butter, paneer, cheese & eggs delivered daily' },
    fruits: { title: 'Fresh Fruits', icon: '🍎', description: 'Handpicked fresh fruits delivered to your doorstep' },
    vegetables: { title: 'Fresh Vegetables', icon: '🥕', description: 'Farm fresh vegetables delivered daily' },
    snacks: { title: 'Snacks & Munchies', icon: '🍿', description: 'Chips, biscuits, namkeen & more' },
    beverages: { title: 'Beverages', icon: '🥤', description: 'Soft drinks, juices, tea & coffee' },
    grocery: { title: 'Grocery Staples', icon: '🧺', description: 'Atta, rice, dal, oils & daily essentials' },
    electronics: { title: 'Electronics', icon: '📱', description: 'Mobile accessories, chargers & gadgets' },
    bakery: { title: 'Bakery', icon: '🥐', description: 'Fresh bread, cakes & pastries' },
    personal: { title: 'Personal Care', icon: '🧴', description: 'Bath, body & oral care products' },
    household: { title: 'Household', icon: '🧹', description: 'Cleaning & kitchen essentials' }
  };
  
  const config = categoryConfig[category] || { title: category, icon: '🛒', description: 'Quality products' };
  
  // ========== STATE ==========
  let categoryProducts = [];
  let currentSort = 'popular';
  let sortOpen = false;
  
  // ========== UPDATE UI WITH CONFIG ==========
  function updateCategoryUI() {
    document.title = `${config.title} | OK Mart`;
    const titleEl = document.getElementById('categoryTitle');
    const heroIcon = document.querySelector('.hero-icon');
    const heroTitle = document.querySelector('.hero-text h2');
    const heroDesc = document.querySelector('.hero-text p');
    
    if (titleEl) titleEl.textContent = config.title;
    if (heroIcon) heroIcon.textContent = config.icon;
    if (heroTitle) heroTitle.textContent = config.title;
    if (heroDesc) heroDesc.textContent = config.description;
  }
  
  // ========== FIREBASE: LOAD CATEGORY PRODUCTS ==========
  async function loadCategoryProducts() {
    try {
      console.log(`🔥 Loading ${category} products...`);
      
      // Query Firestore for products with matching category
      const snapshot = await db.collection('products')
        .where('category', '==', category)
        .get();
      
      categoryProducts = [];
      snapshot.forEach(doc => {
        categoryProducts.push({ id: doc.id, ...doc.data() });
      });
      
      // Apply default sort
      sortProducts();
      
      if (categoryProducts.length > 0) {
        renderProducts();
      } else {
        showEmptyState();
      }
      
      document.getElementById('loadingGrid').style.display = 'none';
      document.getElementById('productCount').textContent = `${categoryProducts.length} product${categoryProducts.length !== 1 ? 's' : ''}`;
      
      console.log(`✅ Loaded ${categoryProducts.length} ${category} products`);
      
    } catch (err) {
      console.error(`Error loading ${category}:`, err);
      document.getElementById('loadingGrid').innerHTML = '<p style="text-align:center;color:#ef4444;padding:40px;">Failed to load products</p>';
    }
  }
  
  // ========== SORT ==========
  function sortProducts() {
    switch (currentSort) {
      case 'popular':
        categoryProducts.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
        break;
      case 'price-low':
        categoryProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        categoryProducts.sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        categoryProducts.sort((a, b) => {
          const dA = a.mrp ? ((a.mrp - a.price) / a.mrp) : 0;
          const dB = b.mrp ? ((b.mrp - b.price) / b.mrp) : 0;
          return dB - dA;
        });
        break;
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
    
    // Wishlist
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
  
  function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    grid.style.display = 'grid';
    document.getElementById('emptyState').style.display = 'none';
    
    categoryProducts.forEach(product => {
      grid.appendChild(createProductCard(product));
    });
  }
  
  function showEmptyState() {
    document.getElementById('productGrid').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
  }
  
  // ========== CART ==========
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
    
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = total;
    
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
  
  // ========== SORT TOGGLE ==========
  window.toggleSort = function() {
    const dropdown = document.getElementById('sortDropdown');
    sortOpen = !sortOpen;
    dropdown.classList.toggle('show', sortOpen);
  };
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sort-btn') && !e.target.closest('.sort-dropdown')) {
      document.getElementById('sortDropdown').classList.remove('show');
      sortOpen = false;
    }
  });
  
  document.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', () => {
      currentSort = option.dataset.sort;
      document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      document.getElementById('sortLabel').textContent = option.textContent.trim();
      sortProducts();
      renderProducts();
      document.getElementById('sortDropdown').classList.remove('show');
      sortOpen = false;
    });
  });
  
  // ========== INIT ==========
  async function init() {
    updateCategoryUI();
    await loadCategoryProducts();
    updateCartUI();
    console.log(`✅ ${category} page ready`);
  }
  
  init();
  
})();
