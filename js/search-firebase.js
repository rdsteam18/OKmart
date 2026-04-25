// ===== OK MART - SEARCH.JS (FIREBASE VERSION) =====
(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  
  let allProducts = [];
  let searchTimeout;
  let currentQuery = '';
  
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const suggestionsContainer = document.getElementById('suggestionsContainer');
  const suggestionsList = document.getElementById('suggestionsList');
  const loadingState = document.getElementById('loadingState');
  const searchContent = document.getElementById('searchContent');
  const emptyState = document.getElementById('emptyState');
  const initialState = document.getElementById('initialState');
  const allResultsGrid = document.getElementById('allResultsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const toastMessage = document.getElementById('toastMessage');
  
  // Load all products from Firebase
  async function loadProductsFromFirebase() {
    try {
      const snapshot = await db.collection('products').get();
      
      if (snapshot.empty) return [];
      
      const products = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name || 'Unnamed',
          price: Number(data.price) || 0,
          mrp: Number(data.mrp) || 0,
          image: data.image || 'https://via.placeholder.com/200',
          category: data.category || 'uncategorized',
          unit: data.unit || '',
          popular: data.popular || false
        });
      });
      
      return products;
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }
  
  function searchProducts(query) {
    if (!query || query.length < 2) return [];
    
    const q = query.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q)
    );
  }
  
  function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }
  
  function renderProductCard(product, query = '') {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/200'">
      <h3 class="product-name">${highlightText(product.name, query)}</h3>
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
    
    return card;
  }
  
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
  
  function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    setTimeout(() => toastMessage.classList.remove('show'), 2500);
  }
  
  function performSearch(query) {
    currentQuery = query;
    searchInput.value = query;
    clearSearchBtn.classList.toggle('visible', query.length > 0);
    
    if (!query || query.length < 2) {
      initialState.style.display = 'block';
      searchContent.style.display = 'none';
      emptyState.style.display = 'none';
      return;
    }
    
    const results = searchProducts(query);
    resultsCount.textContent = `${results.length} item${results.length !== 1 ? 's' : ''}`;
    
    if (results.length === 0) {
      searchContent.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      searchContent.style.display = 'block';
      emptyState.style.display = 'none';
      allResultsGrid.innerHTML = '';
      results.slice(0, 20).forEach(product => {
        allResultsGrid.appendChild(renderProductCard(product, query));
      });
    }
    
    initialState.style.display = 'none';
    loadingState.style.display = 'none';
  }
  
  // Event Listeners
  searchInput.addEventListener('input', (e) => performSearch(e.target.value));
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentQuery = '';
    clearSearchBtn.classList.remove('visible');
    initialState.style.display = 'block';
    searchContent.style.display = 'none';
    emptyState.style.display = 'none';
  });
  
  // Init
  async function init() {
    allProducts = await loadProductsFromFirebase();
    
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('query');
    
    if (urlQuery) {
      performSearch(urlQuery);
    } else {
      initialState.style.display = 'block';
    }
    
    updateCartBadge();
    console.log(`✅ Search loaded: ${allProducts.length} products`);
  }
  
  init();
})();
