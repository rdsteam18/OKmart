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
