// ===== OK MART - HOME.JS =====
// Dynamic home page with search & category filtering

(function() {
  'use strict';
  
  // ---------- STATE ----------
  let allProducts = [];
  let filteredProducts = [];
  let activeCategory = 'all';
  let searchQuery = '';
  
  // DOM Elements
  const productGrid = document.getElementById('productGrid');
  const loadingState = document.getElementById('loadingState');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryContainer = document.getElementById('categoryFilterContainer');
  const resultsCount = document.getElementById('resultsCount');
  const activeFilterBadge = document.getElementById('activeFilterBadge');
  
  // Category mapping for display
  const categoryDisplayNames = {
    'all': 'All',
    'dairy': '🥛 Dairy',
    'snacks': '🍿 Snacks',
    'grocery': '🧺 Grocery'
  };
  
  // ---------- HELPER FUNCTIONS ----------
  
  // Filter products based on category and search
  function filterProducts() {
    let filtered = [...allProducts];
    
    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    
    // Search filter (case insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
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
  
  // Render product grid
  function renderProducts() {
    filteredProducts = filterProducts();
    
    // Hide loading state
    if (loadingState) {
      loadingState.style.display = 'none';
    }
    
    // Update results count
    updateResultsInfo();
    
    // Clear grid
    productGrid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
      renderEmptyState();
      return;
    }
    
    // Render each product card
    filteredProducts.forEach(product => {
      const card = OKMart.renderProductCard(product);
      
      // Add popular badge if applicable
      if (product.popular) {
        const badge = document.createElement('span');
        badge.className = 'product-badge';
        badge.textContent = '🔥 Popular';
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
      }
      
      productGrid.appendChild(card);
    });
  }
  
  // Empty state when no products match
  function renderEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    
    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    icon.textContent = '🔍';
    
    const title = document.createElement('h3');
    title.textContent = 'No products found';
    
    const message = document.createElement('p');
    message.textContent = searchQuery 
      ? `No results for "${searchQuery}"`
      : 'No products in this category';
    
    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-search-btn';
    resetBtn.textContent = 'Clear filters';
    resetBtn.addEventListener('click', resetAllFilters);
    
    emptyDiv.appendChild(icon);
    emptyDiv.appendChild(title);
    emptyDiv.appendChild(message);
    emptyDiv.appendChild(resetBtn);
    
    productGrid.appendChild(emptyDiv);
  }
  
  // Update results count and badge
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
  
  // Render category buttons dynamically
function renderCategoryFilters() {
  if (!categoryContainer) return;

  const categories = ['all', ...new Set(allProducts.map(p => p.category))];

  categoryContainer.innerHTML = '';

  categories.forEach(cat => {
    const link = document.createElement('a');

    // 👉 IMPORTANT: link to category page
    link.href = cat === 'all' ? 'index.html' : `categories/${cat}.html`;

    // same styling class reuse
    link.className = 'category-btn';

    // optional inline styling (premium look)
    link.style.cssText = `
      display: inline-block;
      background: white;
      padding: 10px 20px;
      border-radius: 40px;
      margin: 0 6px 6px 0;
      text-decoration: none;
      color: var(--text-dark);
      font-weight: 500;
      box-shadow: var(--shadow-sm);
      border: 1.5px solid var(--border-light);
      transition: all 0.2s;
    `;

    link.textContent = categoryDisplayNames[cat] || cat;

    categoryContainer.appendChild(link);
  });
}
  
  // Reset all filters
  function resetAllFilters() {
    activeCategory = 'all';
    searchQuery = '';
    
    if (searchInput) {
      searchInput.value = '';
    }
    
    if (clearSearchBtn) {
      clearSearchBtn.classList.remove('visible');
    }
    
    // Update category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === 'all');
    });
    
    renderProducts();
  }
  
  // ---------- EVENT LISTENERS ----------
  
  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      
      // Toggle clear button
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('visible', searchQuery.length > 0);
      }
      
      renderProducts();
    });
  }
  
  // Clear search button
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearSearchBtn.classList.remove('visible');
      renderProducts();
    });
  }
  
  // ---------- INITIALIZATION ----------
  async function init() {
    try {
      // Show loading
      if (loadingState) {
        loadingState.style.display = 'flex';
      }
      
      // Fetch products from JSON
      allProducts = await OKMart.getProducts();
      
      if (!allProducts.length) {
        throw new Error('No products loaded');
      }
      
      // Render category filters
      renderCategoryFilters();
      
      // Initial render
      renderProducts();
      
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
  
  // Expose for debugging (optional)
  window.OKMartHome = {
    resetFilters: resetAllFilters,
    getState: () => ({ activeCategory, searchQuery, productCount: filteredProducts.length })
  };
  
})();

// Add to home.js - Quick Order Section

// Daily essentials keywords to match
const DAILY_ESSENTIALS_KEYWORDS = ['milk', 'bread', 'eggs', 'butter'];

// Find daily essentials from products
function getDailyEssentials() {
  const essentials = [];
  const foundNames = new Set();
  
  // First try to match by keywords in name
  allProducts.forEach(product => {
    const nameLower = product.name.toLowerCase();
    if (DAILY_ESSENTIALS_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
      if (!foundNames.has(product.name)) {
        essentials.push(product);
        foundNames.add(product.name);
      }
    }
  });
  
  // If less than 3 items, add popular items
  if (essentials.length < 3) {
    allProducts
      .filter(p => p.popular && !foundNames.has(p.name))
      .slice(0, 3 - essentials.length)
      .forEach(p => {
        essentials.push(p);
        foundNames.add(p.name);
      });
  }
  
  // Limit to 3 items
  return essentials.slice(0, 3);
}

// Render quick order section
function renderQuickOrder() {
  const quickGrid = document.getElementById('quickOrderGrid');
  if (!quickGrid) return;
  
  const essentials = getDailyEssentials();
  
  quickGrid.innerHTML = '';
  
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
      OKMart.addToCart(product);
      
      // Visual feedback
      addBtn.textContent = '✓ Added';
      addBtn.style.background = 'var(--primary)';
      addBtn.style.color = 'white';
      
      setTimeout(() => {
        addBtn.textContent = '+ Add';
        addBtn.style.background = 'white';
        addBtn.style.color = 'var(--primary-dark)';
      }, 1000);
    });
    
    quickGrid.appendChild(card);
  });
}

// Call in init() after loading products
// Add: renderQuickOrder();
// ===== SMART SEARCH WITH SUGGESTIONS =====

let searchTimeout;
let suggestionsContainer;

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
    box-shadow: var(--shadow-md);
    margin-top: 8px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 100;
    display: none;
    border: 1px solid var(--border-light);
  `;
  
  const searchWrapper = document.querySelector('.search-wrapper');
  if (searchWrapper) {
    searchWrapper.style.position = 'relative';
    searchWrapper.appendChild(container);
  }
  
  suggestionsContainer = container;
  return container;
}

function getSearchSuggestions(query) {
  if (!query || query.length < 2) return [];
  
  const queryLower = query.toLowerCase();
  const suggestions = [];
  const seen = new Set();
  
  // Search in product names
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
  
  // Also suggest categories
  const categories = [...new Set(allProducts.map(p => p.category))];
  categories.forEach(category => {
    if (category.toLowerCase().includes(queryLower) && !seen.has(category)) {
      suggestions.push({
        type: 'category',
        name: category,
        displayName: categoryDisplayNames[category] || category
      });
      seen.add(category);
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
    item.style.cssText = `
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      gap: 12px;
      transition: background 0.15s;
    `;
    item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-light)');
    item.addEventListener('mouseleave', () => item.style.background = 'white');
    
    if (suggestion.type === 'product') {
      item.innerHTML = `
        <span style="font-size:1.2rem">🛒</span>
        <div style="flex:1">
          <div style="font-weight:500">${suggestion.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">in ${suggestion.category}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        searchInput.value = suggestion.name;
        searchQuery = suggestion.name;
        renderProducts();
        container.style.display = 'none';
      });
    } else {
      item.innerHTML = `
        <span style="font-size:1.2rem">📁</span>
        <div style="flex:1">
          <div style="font-weight:500">${suggestion.displayName}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">Category</div>
        </div>
      `;
      item.addEventListener('click', () => {
        activeCategory = suggestion.name;
        searchQuery = '';
        searchInput.value = '';
        updateCategoryUI();
        renderProducts();
        container.style.display = 'none';
      });
    }
    
    container.appendChild(item);
  });
  
  container.style.display = 'block';
}

// Enhanced search input handler
if (searchInput) {
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
  
  // Hide suggestions on blur
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      const container = document.getElementById('searchSuggestions');
      if (container) container.style.display = 'none';
    }, 200);
  });
  
  // Show suggestions on focus
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.length >= 2) {
      const suggestions = getSearchSuggestions(searchInput.value);
      renderSuggestions(suggestions);
    }
  });
}
