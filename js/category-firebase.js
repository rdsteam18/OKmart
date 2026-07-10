// ===== OK MART - CATEGORY.JS (FIREBASE VERSION) =====
(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  
  const category = document.body.dataset.category || 'dairy';
  
  let allProducts = [];
  let filteredProducts = [];
  let searchQuery = '';
  let activeFilter = 'all';
  
  const productGrid = document.getElementById('categoryProductGrid');
  const loadingState = document.getElementById('categoryLoadingState');
  const resultsCount = document.getElementById('categoryResultsCount');
  const searchInput = document.getElementById('categorySearchInput');
  const toastMessage = document.getElementById('toastMessage');
  
  // Load products from Firebase filtered by category
  async function loadCategoryProducts() {
    try {
      const snapshot = await db.collection('products')
        .where('category', '==', category)
        .get();
      
      const products = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name || 'Unnamed',
          price: Number(data.price) || 0,
          mrp: Number(data.mrp) || 0,
          image: data.image || 'https://via.placeholder.com/200',
          category: data.category,
          unit: data.unit || '',
          popular: data.popular || false
        });
      });
      
      products.sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return 0;
      });
      
      return products;
    } catch (error) {
      console.error(`Error loading ${category} products:`, error);
      return [];
    }
  }
  
  function renderProductCard(product) {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/200'">
      ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
      <button class="wishlist-heart-btn">${isInWishlist(product.id) ? '❤️' : '🤍'}</button>
      <button class="share-product-btn">📤</button>
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      </div>
      <button class="add-btn">ADD</button>
    `;
    
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        window.location.href = `/product.html?id=${product.id}`;
      }
    });
    
    card.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product);
    });
    
    card.querySelector('.wishlist-heart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(product, e.target);
    });
    
    card.querySelector('.share-product-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      shareProduct(product);
    });
    
    return card;
  }
  
  function renderProducts() {
    filteredProducts = [...allProducts];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(query));
    }
    
    loadingState.style.display = 'none';
    resultsCount.textContent = `${filteredProducts.length} items`;
    
    productGrid.innerHTML = '';
    productGrid.style.display = 'grid';
    
    if (filteredProducts.length === 0) {
      productGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><h3>No products found</h3></div>';
      return;
    }
    
    filteredProducts.forEach(product => {
      productGrid.appendChild(renderProductCard(product));
    });
  }
  
  function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const existing = cart.find(item => item.id === product.id);
    if (existing) { existing.quantity += 1; }
    else { cart.push({ ...product, quantity: 1 }); }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    showToast(`${product.name} added!`, 'success');
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => b.textContent = total);
  }
  
  function getWishlist() { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); }
  function isInWishlist(id) { return getWishlist().some(item => item.id === id); }
  
  function toggleWishlist(product, heartEl) {
    const wishlist = getWishlist();
    const index = wishlist.findIndex(item => item.id === product.id);
    if (index > -1) { wishlist.splice(index, 1); heartEl.textContent = '🤍'; }
    else { wishlist.push({ id: product.id, name: product.name, price: product.price, image: product.image }); heartEl.textContent = '❤️'; }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }
  
  function shareProduct(product) {
    const url = `${window.location.origin}/product.html?id=${product.id}`;
    if (navigator.share) { navigator.share({ title: product.name, url }); }
    else { window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank'); }
  }
  
  function showToast(msg, type = 'info') {
    toastMessage.textContent = msg;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    setTimeout(() => toastMessage.classList.remove('show'), 2500);
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }
  
  // Init
  async function init() {
    allProducts = await loadCategoryProducts();
    renderProducts();
    updateCartBadge();
    console.log(`✅ ${category}: ${allProducts.length} products loaded from Firebase`);
  }
  
  init();
})();

