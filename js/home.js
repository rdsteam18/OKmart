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
    
    // Get unique categories from products
    const categories = ['all', ...new Set(allProducts.map(p => p.category))];
    
    categoryContainer.innerHTML = '';
    
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      if (cat === activeCategory) {
        btn.classList.add('active');
      }
      btn.textContent = categoryDisplayNames[cat] || cat;
      btn.dataset.category = cat;
      
      btn.addEventListener('click', () => {
        // Update active category
        activeCategory = cat;
        
        // Update UI
        document.querySelectorAll('.category-btn').forEach(b => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        
        // Re-render products
        renderProducts();
        
        // Scroll category into view
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      
      categoryContainer.appendChild(btn);
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
