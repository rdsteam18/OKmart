// ===== OK MART - CATEGORY.JS =====
// Dynamic category page with filtering and sorting
// UPDATED: Exact category matching with debug logging

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const config = window.__OKMART_CATEGORY_CONFIG || {
    slug: 'dairy',
    displayName: 'Dairy & Eggs',
    description: 'Fresh products',
    icon: '🥛'
  };
  
  // ---------- STATE ----------
  let allCategoryProducts = [];
  let filteredProducts = [];
  let searchQuery = '';
  let currentSort = 'popular';
  let isSortDropdownOpen = false;
  
  // DOM Elements
  const productGrid = document.getElementById('categoryProductGrid');
  const loadingState = document.getElementById('categoryLoadingState');
  const searchInput = document.getElementById('categorySearchInput');
  const clearSearchBtn = document.getElementById('clearCategorySearch');
  const resultsCount = document.getElementById('categoryResultsCount');
  const categoryTitle = document.getElementById('categoryTitle');
  const categoryDescription = document.getElementById('categoryDescription');
  const categoryIcon = document.querySelector('.category-icon');
  const sortToggleBtn = document.getElementById('sortToggleBtn');
  const sortDropdown = document.getElementById('sortDropdown');
  
  // ---------- HELPER FUNCTIONS ----------
  
  function updateCategoryHeader() {
    if (categoryTitle) {
      categoryTitle.textContent = config.displayName;
    }
    if (categoryDescription) {
      categoryDescription.textContent = config.description;
    }
    if (categoryIcon) {
      categoryIcon.textContent = config.icon;
    }
    document.title = `${config.displayName} · OK Mart`;
  }
  
  function filterBySearch(products) {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase().trim();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.unit && p.unit.toLowerCase().includes(query))
    );
  }
  
  function sortProducts(products) {
    const sorted = [...products];
    
    switch (currentSort) {
      case 'popular':
        return sorted.sort((a, b) => {
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return 0;
        });
      
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      
      case 'discount':
        return sorted.sort((a, b) => {
          const discountA = ((a.mrp - a.price) / a.mrp) * 100;
          const discountB = ((b.mrp - b.price) / b.mrp) * 100;
          return discountB - discountA;
        });
      
      default:
        return sorted;
    }
  }
  
  function processProducts() {
    let processed = filterBySearch(allCategoryProducts);
    processed = sortProducts(processed);
    return processed;
  }
  
  function renderProducts() {
    filteredProducts = processProducts();
    
    // DEBUG LOG - Check if products are filtered correctly
    console.log(`[Category: ${config.slug}] Total products: ${allCategoryProducts.length}, Filtered: ${filteredProducts.length}`);
    
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
    
    filteredProducts.forEach(product => {
      const card = OKMart.renderProductCard(product);
      
      if (product.popular) {
        const badge = document.createElement('span');
        badge.className = 'product-badge';
        badge.textContent = '🔥 Popular';
        badge.style.cssText = `
          position: absolute;
          top: 8px;
          left: 8px;
          background: #27ae60;
          color: white;
          padding: 4px 10px;
          border-radius: 40px;
          font-size: 0.65rem;
          font-weight: 600;
          z-index: 2;
        `;
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
      }
      
      productGrid.appendChild(card);
    });
  }
  
  function renderEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-category-state';
    emptyDiv.innerHTML = `
      <div class="empty-category-icon">${config.icon}</div>
      <h3>${searchQuery ? `No "${searchQuery}" found` : `No products available`}</h3>
      <p>${searchQuery ? 'Try a different search term' : `Check back soon for ${config.displayName.toLowerCase()}`}</p>
      <a href="/index.html" class="browse-other-btn">Browse all products</a>
    `;
    productGrid.appendChild(emptyDiv);
  }
  
  function updateResultsInfo() {
    if (resultsCount) {
      const count = filteredProducts.length;
      resultsCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }
  }
  
  function updateSortUI() {
    document.querySelectorAll('.sort-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.sort === currentSort);
    });
    
    if (sortToggleBtn) {
      const sortLabels = {
        'popular': '🔥 Popular',
        'price-low': '💰 Low to High',
        'price-high': '💎 High to Low',
        'discount': '🏷️ Best Discount'
      };
      const span = sortToggleBtn.querySelector('span');
      if (span) {
        span.textContent = sortLabels[currentSort] || '📊 Sort';
      }
    }
  }
  
  function toggleSortDropdown() {
    isSortDropdownOpen = !isSortDropdownOpen;
    if (sortDropdown) {
      sortDropdown.style.display = isSortDropdownOpen ? 'block' : 'none';
    }
    sortToggleBtn?.classList.toggle('active', isSortDropdownOpen);
  }
  
  function handleClickOutside(event) {
    if (isSortDropdownOpen && 
        !sortDropdown?.contains(event.target) && 
        !sortToggleBtn?.contains(event.target)) {
      isSortDropdownOpen = false;
      sortDropdown.style.display = 'none';
      sortToggleBtn?.classList.remove('active');
    }
  }
  
  // ---------- EVENT LISTENERS ----------
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearSearchBtn?.classList.toggle('visible', searchQuery.length > 0);
      renderProducts();
    });
    
    searchInput.placeholder = `Search in ${config.displayName.toLowerCase()}...`;
  }
  
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
  
  if (sortToggleBtn) {
    sortToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSortDropdown();
    });
  }
  
  document.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', (e) => {
      const sortType = option.dataset.sort;
      if (sortType) {
        currentSort = sortType;
        updateSortUI();
        renderProducts();
        toggleSortDropdown();
      }
    });
  });
  
  document.addEventListener('click', handleClickOutside);
  
  // ---------- INITIALIZATION ----------
  async function init() {
    try {
      updateCategoryHeader();
      
      if (loadingState) {
        loadingState.style.display = 'flex';
      }
      
      // Fetch products for this category with EXACT MATCH
      console.log(`[Category] Loading products for category: "${config.slug}"`);
      allCategoryProducts = await OKMart.getProductsByCategory(config.slug);
      
      // DEBUG LOG
      console.log(`[Category] Found ${allCategoryProducts.length} products for category "${config.slug}"`);
      
      if (allCategoryProducts.length === 0) {
        console.warn(`[Category] No products found for category "${config.slug}". Check if category name matches exactly.`);
        console.log('[Category] Available categories in products:', 
          [...new Set((await OKMart.getProducts()).map(p => p.category))]);
      }
      
      renderProducts();
      updateSortUI();
      
    } catch (error) {
      console.error(`Failed to load ${config.slug} products:`, error);
      if (productGrid) {
        productGrid.innerHTML = `
          <div class="empty-category-state">
            <div class="empty-category-icon">⚠️</div>
            <h3>Failed to load products</h3>
            <p>Please check your connection and refresh</p>
            <a href="/index.html" class="browse-other-btn">Go Home</a>
          </div>
        `;
      }
      if (loadingState) {
        loadingState.style.display = 'none';
      }
    }
  }
  
  init();
  
  window.OKMartCategory = {
    getState: () => ({ 
      category: config.slug, 
      productCount: filteredProducts.length,
      sort: currentSort,
      search: searchQuery
    }),
    refresh: init
  };
  
})();
