// ===== OK MART - HOME.JS =====
// Products loaded from Firebase Firestore

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  const DAILY_ESSENTIALS_KEYWORDS = ['milk', 'bread', 'eggs', 'butter'];
  
  // ---------- STATE ----------
  let allProducts = [];
  let filteredProducts = [];
  let activeCategory = 'all';
  let searchQuery = '';
  
  // DOM Elements
  const productGrid = document.getElementById('products');
  const loadingState = document.getElementById('loadingState');
  const offersGrid = document.getElementById('offersGrid');
  const quickOrderGrid = document.getElementById('quickOrderGrid');
  const categoryFilterContainer = document.getElementById('categoryFilterContainer');
  const resultsCount = document.getElementById('resultsCount');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const toastMessage = document.getElementById('toastMessage');
  
  // ---------- FIREBASE: LOAD PRODUCTS ----------
  
  async function loadProductsFromFirestore() {
    try {
      console.log('🔥 Fetching products from Firestore...');
      
      const snapshot = await db.collection('products').get();
      
      if (snapshot.empty) {
        console.warn('⚠️ No products found in Firestore "products" collection');
        showLoadError('No products available. Please add products in the admin panel.');
        return [];
      }
      
      const products = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name || 'Unnamed Product',
          price: Number(data.price) || 0,
          mrp: Number(data.mrp) || 0,
          image: data.image || 'https://via.placeholder.com/200?text=OK+Mart',
          category: data.category || 'uncategorized',
          unit: data.unit || '',
          popular: data.popular === true,
          offerTag: data.offerTag || null,
          offer: data.offer || null,
          featured: data.featured === true,
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      
      // Sort: popular first, then by creation date
      products.sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      console.log(`✅ Loaded ${products.length} products from Firestore`);
      return products;
      
    } catch (error) {
      console.error('❌ Firebase error:', error);
      
      // Show user-friendly error
      showLoadError('Failed to load products. Please refresh the page.');
      return [];
    }
  }
  
  function showLoadError(message) {
    if (loadingState) {
      loadingState.innerHTML = `
        <div style="text-align:center;padding:40px;">
          <span style="font-size:3rem;">⚠️</span>
          <h3 style="margin-top:12px;">${message}</h3>
          <button onclick="location.reload()" style="margin-top:16px;background:#2ecc71;color:white;border:none;padding:12px 24px;border-radius:40px;font-weight:600;cursor:pointer;">
            🔄 Refresh Page
          </button>
        </div>
      `;
    }
  }
  
  // ---------- FILTERING ----------
  
  function filterProducts() {
    let filtered = [...allProducts];
    
    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }
  
  // ---------- RENDERING ----------
  
  function renderProductCard(product) {
    const discount = product.mrp && product.mrp > product.price 
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
      : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    card.setAttribute('onclick', `window.location.href='/product.html?id=${product.id}'`);
    
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" 
           onerror="this.src='https://via.placeholder.com/200?text=OK'">
      ${product.popular ? '<span class="product-badge">🔥 Popular</span>' : ''}
      ${product.offerTag ? `<span class="offer-badge">${product.offerTag}</span>` : ''}
      <button class="wishlist-heart-btn" data-id="${product.id}" aria-label="Wishlist">
        ${isInWishlist(product.id) ? '❤️' : '🤍'}
      </button>
      <button class="share-product-btn" data-id="${product.id}" aria-label="Share">📤</button>
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      </div>
      <button class="add-btn">ADD</button>
    `;
    
    // Add to cart
    card.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product);
    });
    
    // Wishlist toggle
    card.querySelector('.wishlist-heart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(product, e.target);
    });
    
    // Share product
    card.querySelector('.share-product-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      shareProduct(product);
    });
    
    return card;
  }
  
  function renderProducts() {
    filteredProducts = filterProducts();
    
    // Hide loading
    if (loadingState) loadingState.style.display = 'none';
    
    // Update results count
    if (resultsCount) {
      resultsCount.textContent = `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''}`;
    }
    
    // Clear and render product grid
    if (productGrid) {
      productGrid.innerHTML = '';
      
      if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:40px;">
            <span style="font-size:3rem;opacity:0.5;">📦</span>
            <h3>No products found</h3>
            <p>${searchQuery ? `No results for "${searchQuery}"` : 'No products in this category'}</p>
            <button class="reset-btn" style="background:var(--primary);color:white;border:none;padding:12px 24px;border-radius:40px;cursor:pointer;margin-top:12px;">
              Reset Filters
            </button>
          </div>
        `;
        
        // Add reset listener
        const resetBtn = productGrid.querySelector('.reset-btn');
        if (resetBtn) {
          resetBtn.addEventListener('click', resetAllFilters);
        }
        return;
      }
      
      // Render product cards
      filteredProducts.slice(0, 30).forEach(product => {
        productGrid.appendChild(renderProductCard(product));
      });
    }
  }
  
  function renderOffers() {
    const offers = allProducts.filter(p => p.offerTag || p.offer);
    
    if (offersGrid) {
      if (offers.length === 0) return;
      
      offersGrid.innerHTML = '';
      offers.slice(0, 6).forEach(product => {
        const card = renderProductCard(product);
        offersGrid.appendChild(card);
      });
    }
  }
  
  function renderQuickOrder() {
    const essentials = allProducts.filter(p => {
      const name = p.name.toLowerCase();
      return DAILY_ESSENTIALS_KEYWORDS.some(kw => name.includes(kw));
    }).slice(0, 3);
    
    if (quickOrderGrid) {
      if (essentials.length === 0) return;
      
      quickOrderGrid.innerHTML = '';
      essentials.forEach(product => {
        const card = document.createElement('div');
        card.className = 'quick-item-card';
        card.innerHTML = `
          <img src="${product.image}" alt="${product.name}" class="quick-item-image" loading="lazy" onerror="this.src='https://via.placeholder.com/60'">
          <div class="quick-item-name">${product.name.split(' ').slice(0, 2).join(' ')}</div>
          <div class="quick-item-price">₹${product.price}</div>
          <button class="quick-add-btn">+ Add</button>
        `;
        
        card.querySelector('.quick-add-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          addToCart(product);
        });
        
        quickOrderGrid.appendChild(card);
      });
    }
  }
  
  function renderCategoryFilters() {
    if (!categoryFilterContainer) return;
    
    // Get unique categories from products
    const categories = ['all', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
    
    categoryFilterContainer.innerHTML = '';
    
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-filter-btn';
      if (cat === activeCategory) btn.classList.add('active');
      
      const displayName = cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1);
      btn.textContent = displayName;
      btn.dataset.category = cat;
      
      btn.addEventListener('click', () => {
        activeCategory = cat;
        
        document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        renderProducts();
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      
      categoryFilterContainer.appendChild(btn);
    });
  }
  
  function resetAllFilters() {
    activeCategory = 'all';
    searchQuery = '';
    
    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.classList.remove('visible');
    
    document.querySelectorAll('.category-filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.category === 'all');
    });
    
    renderProducts();
  }
  
  // ---------- CART FUNCTIONS ----------
  
  function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        unit: product.unit,
        quantity: 1
      });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    showToast(`${product.name} added to cart!`, 'success');
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(badge => {
      if (badge) badge.textContent = totalItems;
    });
  }
  
  // ---------- WISHLIST FUNCTIONS ----------
  
  function getWishlist() {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  }
  
  function isInWishlist(productId) {
    return getWishlist().some(item => item.id === productId);
  }
  
  function toggleWishlist(product, heartElement) {
    const wishlist = getWishlist();
    const index = wishlist.findIndex(item => item.id === product.id);
    
    if (index > -1) {
      wishlist.splice(index, 1);
      heartElement.textContent = '🤍';
      showToast('Removed from wishlist', 'info');
    } else {
      wishlist.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit
      });
      heartElement.textContent = '❤️';
      showToast('Added to wishlist!', 'success');
    }
    
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }
  
  // ---------- SHARE ----------
  
  function shareProduct(product) {
    const url = `${window.location.origin}/product.html?id=${product.id}`;
    const message = `🛒 ${product.name}\n💰 ₹${product.price}\n\nOrder now: ${url}`;
    
    if (navigator.share) {
      navigator.share({ title: product.name, text: message, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  }
  
  // ---------- TOAST ----------
  
  function showToast(message, type = 'info') {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 2500);
  }
  
  // ---------- SEARCH ----------
  
  function setupSearch() {
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        clearSearchBtn?.classList.toggle('visible', searchQuery.length > 0);
        renderProducts();
      });
      
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = searchInput.value.trim();
          if (query) {
            window.location.href = `/search.html?query=${encodeURIComponent(query)}`;
          }
        }
      });
    }
    
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchQuery = '';
        searchInput.value = '';
        clearSearchBtn.classList.remove('visible');
        searchInput.focus();
        renderProducts();
      });
    }
  }
  
  // ---------- INITIALIZATION ----------
  
  async function init() {
    try {
      // Show loading state
      if (loadingState) loadingState.style.display = 'flex';
      
      // Load products from Firebase
      allProducts = await loadProductsFromFirestore();
      
      if (allProducts.length === 0) {
        if (loadingState) loadingState.style.display = 'block';
        return;
      }
      
      // Render all sections
      renderCategoryFilters();
      renderOffers();
      renderQuickOrder();
      renderProducts();
      
      // Setup search
      setupSearch();
      
      // Update cart badge
      updateCartBadge();
      
      console.log('✅ Home page initialized with Firebase | Products:', allProducts.length);
      
    } catch (error) {
      console.error('Failed to initialize:', error);
      showLoadError('Something went wrong. Please try again.');
    }
  }
  
  // Start the app
  init();
  
  // Expose for debugging/admin
  window.OKMartHome = {
    resetFilters: resetAllFilters,
    getState: () => ({ 
      activeCategory, 
      searchQuery, 
      productCount: filteredProducts.length,
      allProductsCount: allProducts.length 
    }),
    refresh: init,
    getProducts: () => allProducts
  };
  
})();
