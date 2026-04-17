(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const JSON_FILES = ['fruits', 'dairy', 'snacks', 'beverages', 'electronics', 'grocery', 'offers'];
  
  let allProducts = [];
  let searchResults = [];
  let searchQuery = '';
  
  const loadingState = document.getElementById('loadingState');
  const searchResultsGrid = document.getElementById('searchResultsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchTitle = document.getElementById('searchTitle');
  const resultCount = document.getElementById('resultCount');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const clearHeaderSearch = document.getElementById('clearHeaderSearch');
  
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
      } catch (e) {
        console.warn(`Could not load ${cat}.json`);
      }
    }
    
    return products;
  }
  
  function renderProductCard(product) {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    card.addEventListener('click', () => {
      window.location.href = `/product.html?id=${product.id}`;
    });
    
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      </div>
      <button class="add-btn">ADD</button>
    `;
    
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
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => b.textContent = total);
  }
  
  function performSearch(query) {
    searchQuery = query;
    headerSearchInput.value = query;
    clearHeaderSearch.classList.toggle('visible', query.length > 0);
    
    const q = query.toLowerCase().trim();
    searchResults = allProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.category && p.category.toLowerCase().includes(q))
    );
    
    renderResults();
  }
  
  function renderResults() {
    loadingState.style.display = 'none';
    
    if (searchResults.length === 0) {
      searchResultsGrid.innerHTML = '';
      emptyState.style.display = 'block';
      searchTitle.textContent = `No results for "${searchQuery}"`;
      resultCount.textContent = '0 items';
      return;
    }
    
    emptyState.style.display = 'none';
    searchTitle.textContent = `Results for "${searchQuery}"`;
    resultCount.textContent = `${searchResults.length} item${searchResults.length !== 1 ? 's' : ''}`;
    
    searchResultsGrid.innerHTML = '';
    searchResults.slice(0, 20).forEach(product => {
      searchResultsGrid.appendChild(renderProductCard(product));
    });
  }
  
  // Event Listeners
  headerSearchInput.addEventListener('input', (e) => {
    clearHeaderSearch.classList.toggle('visible', e.target.value.length > 0);
  });
  
  headerSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch(e.target.value);
    }
  });
  
  clearHeaderSearch.addEventListener('click', () => {
    headerSearchInput.value = '';
    clearHeaderSearch.classList.remove('visible');
    headerSearchInput.focus();
  });
  
  // Init
  async function init() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query') || '';
    
    allProducts = await loadAllProducts();
    
    if (query) {
      performSearch(query);
    } else {
      loadingState.style.display = 'none';
      emptyState.style.display = 'block';
      searchTitle.textContent = 'Search for products';
    }
    
    updateCartBadge();
  }
  
  init();
})();
