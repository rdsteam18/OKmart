// ===== OK MART - ADVANCED SEARCH PAGE =====

(function() {
  'use strict';

  // ========== DOM Elements ==========
  const searchInput = document.getElementById('searchInput');
  const clearInputBtn = document.getElementById('clearInputBtn');
  const suggestionsSection = document.getElementById('suggestionsSection');
  const suggestionsList = document.getElementById('suggestionsList');
  const recentSection = document.getElementById('recentSection');
  const recentList = document.getElementById('recentList');
  const filtersBar = document.getElementById('filtersBar');
  const resultsCount = document.getElementById('resultsCount');
  const resultCountText = document.getElementById('resultCountText');
  const loadingState = document.getElementById('loadingState');
  const resultsGrid = document.getElementById('resultsGrid');
  const noResults = document.getElementById('noResults');
  const suggestedProductsDiv = document.getElementById('suggestedProducts');
  const recentlyViewedSection = document.getElementById('recentlyViewedSection');
  const recentlyViewedGrid = document.getElementById('recentlyViewedGrid');
  const clearRecentBtn = document.getElementById('clearRecentBtn');
  const categoryFilterBtn = document.getElementById('categoryFilterBtn');
  const categoryDropdown = document.getElementById('categoryDropdown');

  // ========== State ==========
  let allProducts = [];
  let currentQuery = '';
  let currentSort = 'default';
  let currentCategory = '';
  let recentSearches = [];
  let recentlyViewed = [];
  let searchTimeout;
  let suggestions = [];

  // Categories list
  const categories = [
    { id: '', name: 'All Categories' },
    { id: 'dairy', name: '🥛 Dairy' },
    { id: 'fruits', name: '🍎 Fruits' },
    { id: 'vegetables', name: '🥬 Vegetables' },
    { id: 'snacks', name: '🍿 Snacks' },
    { id: 'beverages', name: '🥤 Beverages' },
    { id: 'icecream', name: '🍦 Ice Cream' },
    { id: 'grocery', name: '🛒 Grocery' },
    { id: 'personal', name: '🧴 Personal Care' },
    { id: 'household', name: '🧹 Household' },
    { id: 'bakery', name: '🥖 Bakery' },
    { id: 'electronics', name: '📱 Electronics' }
  ];

  // ========== Load Data ==========
  async function loadProducts() {
    try {
      allProducts = await fetchProducts();
      loadRecentSearches();
      loadRecentlyViewed();
      renderRecentSearches();
      renderRecentlyViewed();
      loadingState.style.display = 'none';
      filtersBar.style.display = 'flex';
    } catch (error) {
      console.error('Error loading products:', error);
      loadingState.innerHTML = '<div class="spinner"></div><p>Error loading products. Please refresh.</p>';
    }
  }

  // ========== Recent Searches ==========
  function loadRecentSearches() {
    try {
      recentSearches = JSON.parse(localStorage.getItem('okmart_recent_searches') || '[]');
    } catch(e) { recentSearches = []; }
  }

  function saveRecentSearches() {
    localStorage.setItem('okmart_recent_searches', JSON.stringify(recentSearches.slice(0, 10)));
  }

  function addToRecentSearches(query) {
    if (!query.trim()) return;
    recentSearches = recentSearches.filter(q => q !== query);
    recentSearches.unshift(query);
    saveRecentSearches();
    renderRecentSearches();
  }

  function clearRecentSearches() {
    recentSearches = [];
    saveRecentSearches();
    renderRecentSearches();
    showToast('Recent searches cleared', 'success');
  }

  function renderRecentSearches() {
    if (!recentList) return;
    
    if (recentSearches.length === 0) {
      recentSection.style.display = 'none';
      return;
    }
    
    recentSection.style.display = 'block';
    recentList.innerHTML = recentSearches.map(search => `
      <div class="recent-item" onclick="performSearch('${escapeHtml(search)}')">
        <span>🕐</span>
        <span>${escapeHtml(search)}</span>
      </div>
    `).join('');
  }

  // ========== Recently Viewed ==========
  function loadRecentlyViewed() {
    try {
      recentlyViewed = JSON.parse(localStorage.getItem('okmart_recently_viewed') || '[]');
    } catch(e) { recentlyViewed = []; }
  }

  function addToRecentlyViewed(productId) {
    recentlyViewed = recentlyViewed.filter(id => id !== productId);
    recentlyViewed.unshift(productId);
    recentlyViewed = recentlyViewed.slice(0, 10);
    localStorage.setItem('okmart_recently_viewed', JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
  }

  function renderRecentlyViewed() {
    if (!recentlyViewedGrid) return;
    
    const recentProducts = recentlyViewed
      .map(id => allProducts.find(p => p.id === id))
      .filter(p => p && p.active !== false)
      .slice(0, 4);
    
    if (recentProducts.length === 0) {
      recentlyViewedSection.style.display = 'none';
      return;
    }
    
    recentlyViewedSection.style.display = 'block';
    recentlyViewedGrid.innerHTML = recentProducts.map(product => createProductCard(product)).join('');
  }

  // ========== Search Logic ==========
  function performSearch(query, isNewSearch = true) {
    currentQuery = query;
    
    if (isNewSearch && query.trim()) {
      addToRecentSearches(query);
    }
    
    // Hide suggestions
    suggestionsSection.style.display = 'none';
    
    // Filter products
    let filtered = allProducts.filter(product => {
      if (product.active === false) return false;
      if (currentCategory && product.category !== currentCategory) return false;
      
      if (!query.trim()) return true;
      
      const searchTerm = query.toLowerCase();
      const productName = (product.name || '').toLowerCase();
      const productBrand = (product.brand || '').toLowerCase();
      const productCategory = (product.category || '').toLowerCase();
      
      return productName.includes(searchTerm) || 
             productBrand.includes(searchTerm) || 
             productCategory.includes(searchTerm);
    });
    
    // Apply sort
    filtered = sortProducts(filtered, currentSort);
    
    // Update UI
    updateResultsUI(filtered, query);
  }

  function sortProducts(products, sortType) {
    const sorted = [...products];
    
    switch(sortType) {
      case 'price_asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'popular':
        return sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      default:
        return sorted;
    }
  }

  function updateResultsUI(filtered, query) {
    // Update results count
    const count = filtered.length;
    resultCountText.textContent = count;
    resultsCount.style.display = count > 0 ? 'block' : 'none';
    
    if (count === 0) {
      resultsGrid.innerHTML = '';
      noResults.style.display = 'block';
      showSuggestedProducts(query);
      return;
    }
    
    noResults.style.display = 'none';
    resultsGrid.innerHTML = filtered.map(product => createProductCard(product, query)).join('');
  }

  function showSuggestedProducts(query) {
    // Show trending products instead
    const trendingProducts = allProducts
      .filter(p => p.active !== false && (p.popular === true || (p.salesCount || 0) > 5))
      .slice(0, 6);
    
    suggestedProductsDiv.innerHTML = trendingProducts.map(product => `
      <div class="suggested-product-item" onclick="performSearch('${escapeHtml(product.name)}', true)">
        ${escapeHtml(product.name)}
      </div>
    `).join('');
  }

  // ========== Search Suggestions ==========
  function updateSuggestions(query) {
    if (!query.trim()) {
      suggestionsSection.style.display = 'none';
      return;
    }
    
    const searchTerm = query.toLowerCase();
    
    // Get matching product names
    const productSuggestions = allProducts
      .filter(p => p.name && p.name.toLowerCase().includes(searchTerm))
      .slice(0, 5)
      .map(p => p.name);
    
    // Get matching categories
    const categorySuggestions = categories
      .filter(c => c.name.toLowerCase().includes(searchTerm) && c.id)
      .slice(0, 3)
      .map(c => c.name);
    
    suggestions = [...new Set([...productSuggestions, ...categorySuggestions])];
    
    if (suggestions.length === 0) {
      suggestionsSection.style.display = 'none';
      return;
    }
    
    suggestionsSection.style.display = 'block';
    suggestionsList.innerHTML = suggestions.map(suggestion => `
      <div class="suggestion-item" onclick="performSearch('${escapeHtml(suggestion)}', true)">
        <span>🔍</span>
        <span>${highlightText(suggestion, query)}</span>
      </div>
    `).join('');
  }

  // ========== Filter Handlers ==========
  function setActiveFilter(sortType) {
    currentSort = sortType;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.sort === sortType) {
        btn.classList.add('active');
      }
    });
    performSearch(currentQuery, false);
  }

  function setCategory(categoryId, categoryName) {
    currentCategory = categoryId;
    categoryFilterBtn.textContent = `${categoryName || 'Category'} ▼`;
    categoryDropdown.style.display = 'none';
    performSearch(currentQuery, false);
  }

  // ========== Product Card Creator ==========
  function createProductCard(product, highlightQuery = '') {
    const discount = calculateDiscount(product.price, product.mrp);
    const isOutOfStock = (product.stock || 0) === 0;
    const displayName = highlightQuery ? highlightText(product.name, highlightQuery) : escapeHtml(product.name);
    
    return `
      <div class="product-card" data-product-id="${product.id}" onclick="viewProduct('${product.id}')">
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=OK'">
        ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
        ${discount > 0 ? `<span class="offer-badge">${discount}% OFF</span>` : ''}
        <h3 class="product-name">${displayName}</h3>
        <span class="product-unit">${product.unit || ''}</span>
        <div class="price-row">
          <span class="current-price">₹${product.price}</span>
          ${product.mrp ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        </div>
        <button class="add-btn" onclick="event.stopPropagation(); addToCartHandler('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
          ${isOutOfStock ? 'Out of Stock' : 'ADD'}
        </button>
      </div>
    `;
  }

  // ========== Helper Functions ==========
  function highlightText(text, query) {
    if (!query || !text) return escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark class="highlight">$1</mark>');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  function calculateDiscount(price, mrp) {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  }

  // ========== Cart Functions ==========
  function addToCartHandler(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
    const existing = cart.find(item => item.id === productId);
    
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
    showToast(`${product.name} added to cart!`, 'success');
    
    // Update floating cart bar if exists
    const event = new CustomEvent('cartUpdated');
    window.dispatchEvent(event);
  }

  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count, .cart-badge').forEach(el => {
      if (el) el.textContent = total;
    });
  }

  function viewProduct(productId) {
    addToRecentlyViewed(productId);
    window.location.href = `/product.html?id=${productId}`;
  }

  function showToast(message, type) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // ========== Event Listeners ==========
  function initEventListeners() {
    // Search input with debounce
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      clearInputBtn.classList.toggle('visible', query.length > 0);
      
      clearTimeout(searchTimeout);
      
      if (query.length > 0) {
        updateSuggestions(query);
        searchTimeout = setTimeout(() => {
          performSearch(query, true);
        }, 300);
      } else {
        suggestionsSection.style.display = 'none';
        if (allProducts.length > 0) {
          performSearch('', false);
        }
      }
    });
    
    // Clear input
    clearInputBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearInputBtn.classList.remove('visible');
      performSearch('', false);
      searchInput.focus();
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => setActiveFilter(btn.dataset.sort));
    });
    
    // Category filter
    categoryFilterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = categoryDropdown.style.display === 'block';
      categoryDropdown.style.display = isVisible ? 'none' : 'block';
    });
    
    // Category options
    document.querySelectorAll('.category-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const catId = opt.dataset.cat;
        const catName = opt.textContent;
        setCategory(catId, catName);
      });
    });
    
    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!categoryFilterBtn.contains(e.target) && !categoryDropdown.contains(e.target)) {
        categoryDropdown.style.display = 'none';
      }
    });
    
    // Clear recent searches
    clearRecentBtn?.addEventListener('click', clearRecentSearches);
  }

  // ========== Expose Global Functions ==========
  window.performSearch = performSearch;
  window.addToCartHandler = addToCartHandler;
  window.viewProduct = viewProduct;
  window.highlightText = highlightText;

  // ========== Initialize ==========
  async function init() {
    loadingState.style.display = 'block';
    await loadProducts();
    initEventListeners();
    
    // Check URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
      searchInput.value = q;
      performSearch(q, true);
    }
    
    console.log('✅ Search page initialized');
  }
  
  init();
})();

