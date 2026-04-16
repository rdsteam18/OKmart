// ===== OK MART - HOME.JS =====
// Dynamic home page with search, categories, quick order, popular sections, offers, and banner

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const DAILY_ESSENTIALS_KEYWORDS = ['milk', 'bread', 'eggs', 'butter'];
  
  // Category display names
  const categoryDisplayNames = {
    'all': 'All',
    'dairy': '🥛 Dairy',
    'snacks': '🍿 Snacks',
    'grocery': '🧺 Grocery',
    'fruits': '🍎 Fruits',
    'vegetables': '🥕 Vegetables',
    'bakery': '🥐 Bakery',
    'beverages': '🥤 Beverages',
    'frozen': '❄️ Frozen',
    'electronics': '📱 Electronics',
    'offers': '🏷️ Offers'
  };
  
  // ---------- STATE ----------
  let allProducts = [];
  let filteredProducts = [];
  let activeCategory = 'all';
  let searchQuery = '';
  let searchTimeout;
  let suggestionsContainer;
  
  // DOM Elements
  const productGrid = document.getElementById('productGrid');
  const loadingState = document.getElementById('loadingState');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  const categoryContainer = document.getElementById('categoryFilterContainer');
  const resultsCount = document.getElementById('resultsCount');
  const activeFilterBadge = document.getElementById('activeFilterBadge');
  const offersGrid = document.getElementById('offersGrid');
  const quickOrderGrid = document.getElementById('quickOrderGrid');
  
  // ---------- DATA LOADING ----------
  
  async function loadAllProducts() {
    const categories = ['fruits', 'dairy', 'snacks', 'beverages', 'electronics', 'grocery', 'offers'];
    const products = [];
    
    for (const cat of categories) {
      try {
        const response = await fetch(`/data/${cat}.json`);
        if (response.ok) {
          const data = await response.json();
          if (data.products) {
            products.push(...data.products);
          }
        }
      } catch (e) {
        console.warn(`Could not load ${cat}.json`);
      }
    }
    
    console.log(`✅ Loaded ${products.length} products`);
    return products;
  }
  
  async function loadOffers() {
    try {
      const response = await fetch('/data/offers.json');
      const data = await response.json();
      return data.products || [];
    } catch (e) {
      console.warn('Could not load offers.json');
      return [];
    }
  }
  
  // ---------- HELPER FUNCTIONS ----------
  
  function filterProducts() {
    let filtered = [...allProducts];
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }
    
    // Sort: popular first
    filtered.sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return 0;
    });
    
    return filtered;
  }
  
  function renderProducts() {
    filteredProducts = filterProducts();
    
    if (loadingState) {
      loadingState.style.display = 'none';
    }
    
    updateResultsInfo();
    
    if (productGrid) {
      productGrid.innerHTML = '';
    }
    
    if (filteredProducts.length === 0) {
      renderEmptyState();
      return;
    }
    
    filteredProducts.slice(0, 20).forEach(product => {
      const card = renderProductCard(product);
      productGrid.appendChild(card);
    });
  }
  
  function renderProductCard(product) {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-container">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      </div>
      <button class="add-to-cart-btn">Add to cart</button>
    `;
    
    if (product.popular) {
      const badge = document.createElement('span');
      badge.className = 'product-badge';
      badge.textContent = '🔥 Popular';
      badge.style.cssText = 'position:absolute;top:8px;left:8px;background:#27ae60;color:white;padding:4px 10px;border-radius:40px;font-size:0.65rem;font-weight:600;z-index:2;';
      card.style.position = 'relative';
      card.insertBefore(badge, card.firstChild);
    }
    
    if (product.offerTag) {
      const offerBadge = document.createElement('span');
      offerBadge.className = 'offer-badge';
      offerBadge.textContent = product.offerTag;
      offerBadge.style.cssText = 'position:absolute;top:8px;right:8px;background:#ef4444;color:white;padding:4px 10px;border-radius:40px;font-size:0.65rem;font-weight:600;z-index:2;';
      card.style.position = 'relative';
      card.appendChild(offerBadge);
    }
    
    const btn = card.querySelector('.add-to-cart-btn');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Trigger fly animation if available
      const productImage = card.querySelector('.product-image');
      if (productImage && window.OKMart && window.OKMart.flyToCart) {
        window.OKMart.flyToCart(productImage, product.image, product.name);
      }
      
      // Add to cart
      if (window.OKMart && window.OKMart.addToCart) {
        window.OKMart.addToCart(product);
      } else {
        addToCartFallback(product);
      }
    });
    
    return card;
  }
  
  function addToCartFallback(product) {
    const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
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
    
    localStorage.setItem('okmart_cart', JSON.stringify(cart));
    updateCartBadge();
    showAddToCartFeedback(product.name);
  }
  
  function showAddToCartFeedback(name) {
    const feedback = document.createElement('div');
    feedback.innerHTML = `<span>🛒</span><span>${name} added!</span>`;
    feedback.style.cssText = `
      position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
      background:#1e2a2e;color:white;padding:12px 24px;border-radius:40px;
      font-weight:500;z-index:1000;display:flex;gap:8px;white-space:nowrap;
      animation:slideUp 0.3s ease-out;
    `;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge, #cartCountPlaceholder');
    badges.forEach(badge => {
      if (badge) badge.textContent = totalItems;
    });
  }
  
  function renderEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.innerHTML = `
      <div class="empty-state-icon">🔍</div>
      <h3>No products found</h3>
      <p>${searchQuery ? `No results for "${searchQuery}"` : 'No products in this category'}</p>
      <button class="reset-search-btn">Clear filters</button>
    `;
    
    emptyDiv.querySelector('.reset-search-btn').addEventListener('click', resetAllFilters);
    productGrid.appendChild(emptyDiv);
  }
  
  function updateResultsInfo() {
    if (resultsCount) {
      const count = filteredProducts.length;
      resultsCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }
    
    if (activeFilterBadge) {
      if (activeCategory !== 'all') {
        activeFilterBadge.textContent = categoryDisplayNames[activeCategory] || activeCategory;
        activeFilterBadge.classList.add('visible');
      } else {
        activeFilterBadge.classList.remove('visible');
      }
    }
  }
  
  function renderCategoryFilters() {
    if (!categoryContainer) return;
    
    const categories = ['all', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
    
    categoryContainer.innerHTML = '';
    
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-filter-btn';
      if (cat === activeCategory) {
        btn.classList.add('active');
      }
      btn.textContent = categoryDisplayNames[cat] || cat;
      btn.dataset.category = cat;
      
      btn.addEventListener('click', () => {
        activeCategory = cat;
        
        document.querySelectorAll('.category-filter-btn').forEach(b => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        
        renderProducts();
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      
      categoryContainer.appendChild(btn);
    });
  }
  
  function resetAllFilters() {
    activeCategory = 'all';
    searchQuery = '';
    
    if (searchInput) {
      searchInput.value = '';
    }
    
    if (clearSearchBtn) {
      clearSearchBtn.classList.remove('visible');
    }
    
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === 'all');
    });
    
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
    
    renderProducts();
  }
  
  // ---------- OFFERS SECTION ----------
  
  async function renderOffers() {
    if (!offersGrid) return;
    
    const offers = await loadOffers();
    
    offersGrid.innerHTML = '';
    
    if (offers.length === 0) {
      offersGrid.innerHTML = '<div class="loading-placeholder">No offers available</div>';
      return;
    }
    
    offers.slice(0, 6).forEach(product => {
      const card = renderProductCard(product);
      offersGrid.appendChild(card);
    });
  }
  
  // ---------- QUICK ORDER SECTION (DAILY ESSENTIALS) ----------
  
  function getDailyEssentials() {
    const essentials = [];
    const foundNames = new Set();
    
    allProducts.forEach(product => {
      const nameLower = product.name.toLowerCase();
      if (DAILY_ESSENTIALS_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
        if (!foundNames.has(product.name)) {
          essentials.push(product);
          foundNames.add(product.name);
        }
      }
    });
    
    if (essentials.length < 3) {
      allProducts
        .filter(p => p.popular && !foundNames.has(p.name))
        .slice(0, 3 - essentials.length)
        .forEach(p => {
          essentials.push(p);
          foundNames.add(p.name);
        });
    }
    
    return essentials.slice(0, 3);
  }
  
  function renderQuickOrder() {
    if (!quickOrderGrid) return;
    
    const essentials = getDailyEssentials();
    
    quickOrderGrid.innerHTML = '';
    
    if (essentials.length === 0) {
      quickOrderGrid.innerHTML = '<div class="loading-placeholder">Loading essentials...</div>';
      return;
    }
    
    essentials.forEach(product => {
      const card = document.createElement('div');
      card.className = 'quick-item-card';
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="quick-item-image" loading="lazy">
        <div class="quick-item-name">${product.name.split(' ').slice(0, 2).join(' ')}</div>
        <div class="quick-item-price">₹${product.price}</div>
        <button class="quick-add-btn" data-id="${product.id}">+ Add</button>
      `;
      
      const addBtn = card.querySelector('.quick-add-btn');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const productImage = card.querySelector('.quick-item-image');
        if (productImage && window.OKMart && window.OKMart.flyToCart) {
          window.OKMart.flyToCart(productImage, product.image, product.name);
        }
        
        if (window.OKMart && window.OKMart.addToCart) {
          window.OKMart.addToCart(product);
        } else {
          addToCartFallback(product);
        }
        
        addBtn.textContent = '✓ Added';
        addBtn.style.background = '#2ecc71';
        addBtn.style.color = 'white';
        
        setTimeout(() => {
          addBtn.textContent = '+ Add';
          addBtn.style.background = 'white';
          addBtn.style.color = '#27ae60';
        }, 1000);
      });
      
      quickOrderGrid.appendChild(card);
    });
  }
  
  // ---------- POPULAR PRODUCTS SECTION ----------
  
  function renderPopularSection() {
    const popularProducts = allProducts.filter(p => p.popular === true);
    
    if (popularProducts.length === 0) return;
    
    let popularSection = document.getElementById('popularSection');
    
    if (!popularSection) {
      const mainContainer = document.querySelector('.home-main');
      const quickSection = document.querySelector('.quick-order-section');
      
      popularSection = document.createElement('section');
      popularSection.id = 'popularSection';
      popularSection.className = 'popular-section';
      popularSection.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">🔥 Trending Now</h2>
          <span class="popular-badge">Bestsellers</span>
        </div>
        <div class="popular-grid" id="popularGrid"></div>
      `;
      
      if (quickSection) {
        quickSection.insertAdjacentElement('afterend', popularSection);
      }
    }
    
    const popularGrid = document.getElementById('popularGrid');
    if (popularGrid) {
      popularGrid.innerHTML = '';
      
      popularProducts.slice(0, 6).forEach(product => {
        const card = renderProductCard(product);
        popularGrid.appendChild(card);
      });
    }
  }
  
  // ---------- SMART SEARCH WITH SUGGESTIONS ----------
  
  function createSuggestionsContainer() {
    if (suggestionsContainer) return suggestionsContainer;
    
    const container = document.createElement('div');
    container.className = 'search-suggestions';
    container.id = 'searchSuggestions';
    container.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      margin-top: 8px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 100;
      display: none;
      border: 1px solid #e2e8f0;
    `;
    
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
      searchContainer.style.position = 'relative';
      searchContainer.appendChild(container);
    }
    
    suggestionsContainer = container;
    return container;
  }
  
  function getSearchSuggestions(query) {
    if (!query || query.length < 2) return [];
    
    const queryLower = query.toLowerCase();
    const suggestions = [];
    const seen = new Set();
    
    allProducts.forEach(product => {
      const nameLower = product.name.toLowerCase();
      if (nameLower.includes(queryLower) && !seen.has(product.name)) {
        suggestions.push({
          type: 'product',
          name: product.name,
          category: product.category,
          product: product
        });
        seen.add(product.name);
      }
    });
    
    return suggestions.slice(0, 8);
  }
  
  function renderSuggestions(suggestions) {
    const container = createSuggestionsContainer();
    
    if (suggestions.length === 0) {
      container.style.display = 'none';
      return;
    }
    
    container.innerHTML = '';
    
    suggestions.forEach(suggestion => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = `
        <span style="font-size:1.2rem">🛒</span>
        <div style="flex:1">
          <div style="font-weight:500">${suggestion.name}</div>
          <div style="font-size:0.75rem;color:#64748b">in ${suggestion.category}</div>
        </div>
      `;
      
      item.addEventListener('click', () => {
        searchInput.value = suggestion.name;
        searchQuery = suggestion.name;
        clearSearchBtn?.classList.add('visible');
        renderProducts();
        container.style.display = 'none';
      });
      
      container.appendChild(item);
    });
    
    container.style.display = 'block';
  }
  
  // ---------- SEARCH HANDLERS ----------
  
  function setupSearch() {
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      
      clearTimeout(searchTimeout);
      
      if (query.length >= 2) {
        searchTimeout = setTimeout(() => {
          const suggestions = getSearchSuggestions(query);
          renderSuggestions(suggestions);
        }, 200);
      } else {
        const container = document.getElementById('searchSuggestions');
        if (container) container.style.display = 'none';
      }
      
      searchQuery = query;
      clearSearchBtn?.classList.toggle('visible', query.length > 0);
      renderProducts();
    });
    
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `/search.html?query=${encodeURIComponent(query)}`;
        }
      }
      
      if (e.key === 'Escape') {
        const container = document.getElementById('searchSuggestions');
        if (container) container.style.display = 'none';
      }
    });
    
    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        const container = document.getElementById('searchSuggestions');
        if (container) container.style.display = 'none';
      }, 200);
    });
    
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.length >= 2) {
        const suggestions = getSearchSuggestions(searchInput.value);
        renderSuggestions(suggestions);
      }
    });
  }
  
  function setupSearchSubmit() {
    if (searchSubmitBtn) {
      searchSubmitBtn.addEventListener('click', () => {
        const query = searchInput?.value.trim();
        if (query) {
          window.location.href = `/search.html?query=${encodeURIComponent(query)}`;
        }
      });
    }
  }
  
  function setupClearSearch() {
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchQuery = '';
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        clearSearchBtn.classList.remove('visible');
        
        const container = document.getElementById('searchSuggestions');
        if (container) container.style.display = 'none';
        
        renderProducts();
      });
    }
  }
  
  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      const container = document.getElementById('searchSuggestions');
      if (container) container.style.display = 'none';
    }
  });
  
  // ---------- ADD STYLES ----------
  
  function addHomeStyles() {
    if (document.getElementById('homeDynamicStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'homeDynamicStyles';
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      
      .suggestion-item {
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid #e2e8f0;
        transition: background 0.15s;
      }
      
      .suggestion-item:hover {
        background: #f7fdf9;
      }
      
      .suggestion-item:last-child {
        border-bottom: none;
      }
    `;
    document.head.appendChild(style);
  }
  
  // ---------- INITIALIZATION ----------
  
  async function init() {
    try {
      if (loadingState) {
        loadingState.style.display = 'flex';
      }
      
      // Add styles
      addHomeStyles();
      
      // Load all products
      allProducts = await loadAllProducts();
      
      if (!allProducts.length) {
        throw new Error('No products loaded');
      }
      
      // Render sections
      renderCategoryFilters();
      await renderOffers();
      renderQuickOrder();
      renderPopularSection();
      renderProducts();
      
      // Setup search
      setupSearch();
      setupSearchSubmit();
      setupClearSearch();
      
      // Update cart badge
      updateCartBadge();
      
      // Preload images
      allProducts.slice(0, 12).forEach(p => {
        const img = new Image();
        img.src = p.image;
      });
      
      console.log('✅ Home page initialized | Products:', allProducts.length);
      
    } catch (error) {
      console.error('Failed to load products:', error);
      if (productGrid) {
        productGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>Failed to load products</h3>
            <p>Please check your connection and refresh</p>
            <button class="reset-search-btn" onclick="location.reload()">Retry</button>
          </div>
        `;
      }
      if (loadingState) {
        loadingState.style.display = 'none';
      }
    }
  }
  
  // Start the app
  init();
  
  // Expose for debugging
  window.OKMartHome = {
    resetFilters: resetAllFilters,
    getState: () => ({ 
      activeCategory, 
      searchQuery, 
      productCount: filteredProducts.length,
      allProductsCount: allProducts.length
    }),
    refresh: init
  };
  
})();
