// ===== OK MART - SMART SEARCH.JS =====
// Live search with suggestions, results, and Firebase

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  
  // ========== STATE ==========
  let allProducts = [];
  let searchQuery = '';
  let searchTimeout;
  
  // ========== DOM ELEMENTS ==========
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const suggestionsPanel = document.getElementById('suggestionsPanel');
  const suggestionsList = document.getElementById('suggestionsList');
  const loadingState = document.getElementById('loadingState');
  const searchResults = document.getElementById('searchResults');
  const noResults = document.getElementById('noResults');
  const initialState = document.getElementById('initialState');
  
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsCount = document.getElementById('resultsCount');
  const noResultsMessage = document.getElementById('noResultsMessage');
  
  const topMatchesSection = document.getElementById('topMatchesSection');
  const topMatchesSlider = document.getElementById('topMatchesSlider');
  const allResultsGrid = document.getElementById('allResultsGrid');
  const youMayLikeSlider = document.getElementById('youMayLikeSlider');
  const popularGrid = document.getElementById('popularGrid');
  
  const toastMessage = document.getElementById('toastMessage');
  
  // ========== FIREBASE: LOAD ALL PRODUCTS ==========
  async function loadAllProducts() {
    try {
      const snapshot = await db.collection('products').get();
      allProducts = [];
      snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
      console.log(`✅ Loaded ${allProducts.length} products for search`);
      return allProducts;
    } catch (err) {
      console.error('Error loading products:', err);
      return [];
    }
  }
  
  // ========== SEARCH LOGIC ==========
  function searchProducts(query) {
    if (!query || query.length < 2) return [];
    
    const q = query.toLowerCase().trim();
    
    return allProducts
      .map(product => ({
        product,
        score: getMatchScore(product, q)
      }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.product);
  }
  
  function getMatchScore(product, query) {
    const name = product.name.toLowerCase();
    const category = (product.category || '').toLowerCase();
    const tags = (product.tags || []).map(t => t.toLowerCase());
    
    if (name === query) return 100;           // Exact match
    if (name.startsWith(query)) return 90;    // Starts with
    if (name.includes(query)) return 70;      // Contains
    if (category.includes(query)) return 50;  // Category match
    if (tags.some(t => t.includes(query))) return 40; // Tags match
    
    // Word match
    const words = name.split(/\s+/);
    if (words.some(w => w.startsWith(query))) return 60;
    
    return 0;
  }
  
  function getSuggestions(query, limit = 5) {
    return searchProducts(query).slice(0, limit);
  }
  
  function getTopMatches(query, limit = 6) {
    const results = allProducts
      .map(p => ({ product: p, score: getMatchScore(p, query) }))
      .filter(r => r.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.product);
    return results;
  }
  
  // ========== HIGHLIGHT TEXT ==========
  function highlightText(text, query) {
    if (!query || query.length < 2) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }
  
  // ========== RENDER FUNCTIONS ==========
  function renderSuggestions(suggestions, query) {
    if (suggestions.length === 0) {
      suggestionsPanel.style.display = 'none';
      return;
    }
    
    suggestionsList.innerHTML = suggestions.map(p => `
      <div class="suggestion-item" onclick="location.href='/product.html?id=${p.id}'">
        <img src="${p.image}" alt="${p.name}" class="suggestion-image" onerror="this.src='https://via.placeholder.com/40'">
        <div class="suggestion-info">
          <div class="suggestion-name">${highlightText(p.name, query)}</div>
          <div class="suggestion-category">${p.category || 'Grocery'} · ₹${p.price}</div>
        </div>
      </div>
    `).join('');
    
    suggestionsPanel.style.display = 'block';
  }
  
  function createProductCard(product, query = '') {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=OK'">
      ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
      <button class="wishlist-mini">${isInWishlist(product.id) ? '❤️' : '🤍'}</button>
      <button class="share-mini">📤</button>
      <h3 class="product-name">${highlightText(product.name, query)}</h3>
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
    card.querySelector('.wishlist-mini').addEventListener('click', e => { e.stopPropagation(); toggleWishlist(product, e.target); });
    card.querySelector('.share-mini').addEventListener('click', e => { e.stopPropagation(); shareProduct(product); });
    
    return card;
  }
  
  function renderSearchResults(query) {
    const results = searchProducts(query);
    const topMatches = getTopMatches(query);
    const popular = allProducts.filter(p => p.popular).slice(0, 6);
    
    resultsCount.textContent = `${results.length} item${results.length !== 1 ? 's' : ''}`;
    resultsTitle.textContent = `Results for "${query}"`;
    
    // Top Matches Slider
    if (topMatches.length > 0) {
      topMatchesSection.style.display = 'block';
      topMatchesSlider.innerHTML = '';
      topMatches.forEach(p => topMatchesSlider.appendChild(createProductCard(p, query)));
    } else {
      topMatchesSection.style.display = 'none';
    }
    
    // All Results Grid
    allResultsGrid.innerHTML = '';
    results.slice(0, 20).forEach(p => allResultsGrid.appendChild(createProductCard(p, query)));
    
    // You May Also Like
    youMayLikeSlider.innerHTML = '';
    popular.forEach(p => youMayLikeSlider.appendChild(createProductCard(p)));
    
    loadingState.style.display = 'none';
    searchResults.style.display = 'block';
    noResults.style.display = 'none';
    initialState.style.display = 'none';
  }
  
  function renderNoResults(query) {
    const popular = allProducts.filter(p => p.popular).slice(0, 6);
    
    noResultsMessage.textContent = `We couldn't find any products matching "${query}"`;
    popularGrid.innerHTML = '';
    popular.forEach(p => popularGrid.appendChild(createProductCard(p)));
    
    loadingState.style.display = 'none';
    searchResults.style.display = 'none';
    noResults.style.display = 'block';
    initialState.style.display = 'none';
  }
  
  // ========== SEARCH HANDLER ==========
  function handleSearch(query) {
    searchQuery = query;
    searchInput.value = query;
    clearSearchBtn.classList.toggle('visible', query.length > 0);
    
    if (!query || query.length < 2) {
      suggestionsPanel.style.display = 'none';
      loadingState.style.display = 'none';
      searchResults.style.display = 'none';
      noResults.style.display = 'none';
      initialState.style.display = 'block';
      return;
    }
    
    // Show suggestions immediately
    const suggestions = getSuggestions(query);
    renderSuggestions(suggestions, query);
    
    // Debounce search results
    loadingState.style.display = 'flex';
    initialState.style.display = 'none';
    suggestionsPanel.style.display = 'block';
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      suggestionsPanel.style.display = 'none';
      const results = searchProducts(query);
      
      if (results.length === 0) {
        renderNoResults(query);
      } else {
        renderSearchResults(query);
      }
    }, 300);
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
    
    document.getElementById('cartBadge').textContent = total;
    const bar = document.getElementById('floatingCartBar');
    if (total > 0) {
      bar.classList.add('visible');
      document.getElementById('barCartCount').textContent = `${total} item${total !== 1 ? 's' : ''}`;
      document.getElementById('barCartTotal').textContent = `₹${subtotal}`;
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
    const toast = toastMessage;
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.color = 'white';
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }
  
  // ========== EVENT LISTENERS ==========
  searchInput.addEventListener('input', e => handleSearch(e.target.value));
  
  clearSearchBtn.addEventListener('click', () => {
    handleSearch('');
    searchInput.focus();
  });
  
  // Trending tags
  document.querySelectorAll('.trending-tag').forEach(tag => {
    tag.addEventListener('click', () => handleSearch(tag.dataset.query));
  });
  
  // Close suggestions on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-input-wrapper') && !e.target.closest('.suggestions-panel')) {
      suggestionsPanel.style.display = 'none';
    }
  });
  
  // ========== INIT ==========
  async function init() {
    await loadAllProducts();
    
    // Check URL for query parameter
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('query');
    
    if (urlQuery) {
      handleSearch(urlQuery);
    }
    
    updateCartUI();
    console.log('✅ Search page ready');
  }
  
  init();
  
})();
