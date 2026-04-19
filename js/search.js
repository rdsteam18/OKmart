// ===== OK MART - SMART SEARCH.JS =====
// Live search with suggestions, sliding sections, and smart filtering

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  const JSON_FILES = ['fruits', 'dairy', 'snacks', 'beverages', 'electronics', 'grocery', 'offers', 'vegetables', 'bakery', 'personal', 'household'];
  
  let allProducts = [];
  let searchTimeout;
  let currentQuery = '';
  
  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const suggestionsContainer = document.getElementById('suggestionsContainer');
  const suggestionsList = document.getElementById('suggestionsList');
  const loadingState = document.getElementById('loadingState');
  const searchContent = document.getElementById('searchContent');
  const emptyState = document.getElementById('emptyState');
  const initialState = document.getElementById('initialState');
  
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsCount = document.getElementById('resultsCount');
  const emptyMessage = document.getElementById('emptyMessage');
  
  const topMatchesSection = document.getElementById('topMatchesSection');
  const topMatchesSlider = document.getElementById('topMatchesSlider');
  const relatedSection = document.getElementById('relatedSection');
  const relatedSlider = document.getElementById('relatedSlider');
  const allResultsGrid = document.getElementById('allResultsGrid');
  const youMayLikeSlider = document.getElementById('youMayLikeSlider');
  const popularGrid = document.getElementById('popularGrid');
  
  const toastMessage = document.getElementById('toastMessage');
  
  // ---------- DATA LOADING ----------
  
  async function loadAllProducts() {
    const products = [];
    
    for (const cat of JSON_FILES) {
      try {
        const response = await fetch(`/data/${cat}.json`);
        if (response.ok) {
          const data = await response.json();
          if (data.products) {
            products.push(...data.products);
          }
        }
      } catch (e) {}
    }
    
    // Remove duplicates by ID
    const uniqueProducts = Array.from(new Map(products.map(p => [p.id, p])).values());
    return uniqueProducts;
  }
  
  // ---------- SMART MATCHING (with typo tolerance) ----------
  
  function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
  
  function getMatchScore(product, query) {
    const nameLower = product.name.toLowerCase();
    const queryLower = query.toLowerCase();
    const words = nameLower.split(/\s+/);
    
    // Exact match
    if (nameLower === queryLower) return 100;
    
    // Starts with
    if (nameLower.startsWith(queryLower)) return 90;
    
    // Word starts with
    if (words.some(w => w.startsWith(queryLower))) return 80;
    
    // Contains
    if (nameLower.includes(queryLower)) return 70;
    
    // Category match
    if (product.category && product.category.toLowerCase().includes(queryLower)) return 50;
    
    // Typo tolerance (for short queries)
    if (queryLower.length >= 3) {
      const distance = levenshteinDistance(nameLower.substring(0, 10), queryLower);
      if (distance <= 2) return 40 - distance * 5;
    }
    
    return 0;
  }
  
  function searchProducts(query) {
    if (!query || query.length < 2) return [];
    
    const results = allProducts.map(product => ({
      product,
      score: getMatchScore(product, query)
    })).filter(r => r.score > 0);
    
    return results.sort((a, b) => b.score - a.score);
  }
  
  function getSuggestions(query, limit = 5) {
    const results = searchProducts(query);
    return results.slice(0, limit).map(r => r.product);
  }
  
  function getTopMatches(query, limit = 6) {
    const results = searchProducts(query);
    return results.filter(r => r.score >= 60).slice(0, limit).map(r => r.product);
  }
  
  function getRelatedProducts(topMatches, limit = 6) {
    const categories = [...new Set(topMatches.map(p => p.category))];
    return allProducts
      .filter(p => categories.includes(p.category) && !topMatches.some(m => m.id === p.id))
      .slice(0, limit);
  }
  
  // ---------- HIGHLIGHT TEXT ----------
  
  function highlightText(text, query) {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }
  
  // ---------- RENDERING ----------
  
  function renderProductCard(product, query = '') {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
      <button class="wishlist-heart-btn" data-id="${product.id}">${isInWishlist(product.id) ? '❤️' : '🤍'}</button>
      <button class="share-product-btn" data-id="${product.id}">📤</button>
      <h3 class="product-name">${highlightText(product.name, query)}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
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
  
  function renderSuggestionItem(product, query) {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="suggestion-image">
      <div class="suggestion-info">
        <div class="suggestion-name">${highlightText(product.name, query)}</div>
        <div class="suggestion-category">${product.category || 'Grocery'}</div>
      </div>
    `;
    
    item.addEventListener('click', () => {
      window.location.href = `/product.html?id=${product.id}`;
    });
    
    return item;
  }
  
  function renderSuggestions(suggestions, query) {
    suggestionsList.innerHTML = '';
    
    if (suggestions.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    suggestions.forEach(product => {
      suggestionsList.appendChild(renderSuggestionItem(product, query));
    });
    
    suggestionsContainer.style.display = 'block';
  }
  
  function renderSearchResults(query) {
    const results = searchProducts(query);
    const matchedProducts = results.map(r => r.product);
    const topMatches = getTopMatches(query);
    const related = getRelatedProducts(topMatches);
    const popular = allProducts.filter(p => p.popular).slice(0, 6);
    
    // Update counts
    resultsCount.textContent = `${matchedProducts.length} item${matchedProducts.length !== 1 ? 's' : ''}`;
    resultsTitle.textContent = `Results for "${query}"`;
    
    // Top Matches
    if (topMatches.length > 0) {
      topMatchesSection.style.display = 'block';
      topMatchesSlider.innerHTML = '';
      topMatches.forEach(product => {
        topMatchesSlider.appendChild(renderProductCard(product, query));
      });
    } else {
      topMatchesSection.style.display = 'none';
    }
    
    // Related Products
    if (related.length > 0) {
      relatedSection.style.display = 'block';
      relatedSlider.innerHTML = '';
      related.forEach(product => {
        relatedSlider.appendChild(renderProductCard(product, query));
      });
    } else {
      relatedSection.style.display = 'none';
    }
    
    // All Results Grid
    allResultsGrid.innerHTML = '';
    if (matchedProducts.length > 0) {
      matchedProducts.slice(0, 20).forEach(product => {
        allResultsGrid.appendChild(renderProductCard(product, query));
      });
    }
    
    // You May Also Like
    youMayLikeSlider.innerHTML = '';
    popular.forEach(product => {
      youMayLikeSlider.appendChild(renderProductCard(product));
    });
    
    loadingState.style.display = 'none';
    searchContent.style.display = 'block';
    emptyState.style.display = 'none';
    initialState.style.display = 'none';
  }
  
  function renderEmptyState(query) {
    const popular = allProducts.filter(p => p.popular).slice(0, 6);
    
    emptyMessage.textContent = `We couldn't find any products matching "${query}"`;
    popularGrid.innerHTML = '';
    popular.forEach(product => {
      popularGrid.appendChild(renderProductCard(product));
    });
    
    loadingState.style.display = 'none';
    searchContent.style.display = 'none';
    emptyState.style.display = 'block';
    initialState.style.display = 'none';
  }
  
  function renderPopularProducts() {
    const popular = allProducts.filter(p => p.popular).slice(0, 6);
    popularGrid.innerHTML = '';
    popular.forEach(product => {
      popularGrid.appendChild(renderProductCard(product));
    });
  }
  
  // ---------- CART FUNCTIONS ----------
  
  function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    showToast(`${product.name} added!`, 'success');
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => b.textContent = total);
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
      wishlist.push({ id: product.id, name: product.name, price: product.price, image: product.image });
      heartElement.textContent = '❤️';
      showToast('Added to wishlist!', 'success');
    }
    
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }
  
  // ---------- SHARE ----------
  
  function shareProduct(product) {
    const url = `${window.location.origin}/product.html?id=${product.id}`;
    const message = `🛒 ${product.name}\n💰 ₹${product.price}\n\n${url}`;
    
    if (navigator.share) {
      navigator.share({ title: product.name, text: `Check out ${product.name}`, url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  }
  
  // ---------- TOAST ----------
  
  function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    setTimeout(() => toastMessage.classList.remove('show'), 2500);
  }
  
  // ---------- SEARCH HANDLER ----------
  
  function handleSearch(query) {
    currentQuery = query;
    searchInput.value = query;
    clearSearchBtn.classList.toggle('visible', query.length > 0);
    
    if (!query || query.length < 2) {
      suggestionsContainer.style.display = 'none';
      loadingState.style.display = 'none';
      searchContent.style.display = 'none';
      emptyState.style.display = 'none';
      initialState.style.display = 'block';
      return;
    }
    
    // Show suggestions
    const suggestions = getSuggestions(query);
    renderSuggestions(suggestions, query);
    
    // Show loading then results
    loadingState.style.display = 'flex';
    initialState.style.display = 'none';
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const results = searchProducts(query);
      
      if (results.length === 0) {
        renderEmptyState(query);
      } else {
        renderSearchResults(query);
      }
      suggestionsContainer.style.display = 'none';
    }, 300);
  }
  
  // ---------- EVENT LISTENERS ----------
  
  searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });
  
  searchInput.addEventListener('focus', () => {
    if (currentQuery.length >= 2) {
      const suggestions = getSuggestions(currentQuery);
      renderSuggestions(suggestions, currentQuery);
    }
  });
  
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentQuery = '';
    clearSearchBtn.classList.remove('visible');
    suggestionsContainer.style.display = 'none';
    searchContent.style.display = 'none';
    emptyState.style.display = 'none';
    initialState.style.display = 'block';
    searchInput.focus();
  });
  
  // Trending searches
  document.querySelectorAll('.trending-item').forEach(item => {
    item.addEventListener('click', () => {
      const query = item.dataset.query;
      handleSearch(query);
    });
  });
  
  // Close suggestions on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper-header') && !e.target.closest('.suggestions-container')) {
      suggestionsContainer.style.display = 'none';
    }
  });
  
  // ---------- INITIALIZATION ----------
  
  async function init() {
    allProducts = await loadAllProducts();
    
    // Check URL for query
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('query');
    
    if (urlQuery) {
      handleSearch(urlQuery);
    } else {
      initialState.style.display = 'block';
    }
    
    renderPopularProducts();
    updateCartBadge();
    
    console.log(`✅ Search initialized | ${allProducts.length} products loaded`);
  }
  
  init();
  
})();
