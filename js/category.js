// ===== OK MART - CATEGORY.JS =====
// Dynamic category page with filtering and sorting

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
  let currentSort = 'popular'; // popular, price-low, price-high, discount
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
  
  // Update category header
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
    // Update page title
    document.title = `${config.displayName} · OK Mart`;
  }
  
  // Filter products by search
  function filterBySearch(products) {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase().trim();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.unit?.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }
  
  // Sort products
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
  
  // Main filter and sort function
  function processProducts() {
    let processed = filterBySearch(allCategoryProducts);
    processed = sortProducts(processed);
    return processed;
  }
  
  // Render product grid
  function renderProducts() {
    filteredProducts = processProducts();
    
    // Hide loading
    if (loadingState) {
      loadingState.style.display = 'none';
    }
    
    // Update results count
    updateResultsInfo();
    
    // Clear grid
    if (productGrid) {
      productGrid.innerHTML = '';
    }
    
    if (filteredProducts.length === 0) {
      renderEmptyState();
      return;
    }
    
    // Render each product
    filteredProducts.forEach((product, index) => {
      const card = OKMart.renderProductCard(product);
      
      // Add popular badge
      if (product.popular) {
        const badge = document.createElement('span');
        badge.className = 'product-badge';
        badge.textContent = '🔥 Popular';
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
      }
      
      // Add stock badge (optional)
      const stockBadge = document.createElement('span');
      stockBadge.className = 'stock-badge';
      stockBadge.textContent = 'In Stock';
      card.style.position = 'relative';
      card.appendChild(stockBadge);
      
      productGrid.appendChild(card);
    });
  }
  
  // Empty state
  function renderEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-category-state';
    
    const icon = document.createElement('div');
    icon.className = 'empty-category-icon';
    icon.textContent = config.icon;
    
    const title = document.createElement('h3');
    title.textContent = searchQuery 
      ? `No "${searchQuery}" found` 
      : `No products available`;
    
    const message = document.createElement('p');
    message.textContent = searchQuery 
      ? 'Try a different search term' 
      : `Check back soon for ${config.displayName.toLowerCase()}`;
    
    const browseBtn = document.createElement('a');
    browseBtn.className = 'browse-other-btn';
    browseBtn.href = '../index.html';
    browseBtn.textContent = 'Browse all products';
    
    emptyDiv.appendChild(icon);
    emptyDiv.appendChild(title);
    emptyDiv.appendChild(message);
    emptyDiv.appendChild(browseBtn);
    
    productGrid.appendChild(emptyDiv);
  }
  
  // Update results count
  function updateResultsInfo() {
    if (resultsCount) {
      const count = filteredProducts.length;
      resultsCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }
  }
  
  // Update sort UI
  function updateSortUI() {
    // Update dropdown active state
    document.querySelectorAll('.sort-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.sort === currentSort);
    });
    
    // Update button text
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
  
  // Toggle sort dropdown
  function toggleSortDropdown() {
    isSortDropdownOpen = !isSortDropdownOpen;
    if (sortDropdown) {
      sortDropdown.style.display = isSortDropdownOpen ? 'block' : 'none';
    }
    sortToggleBtn?.classList.toggle('active', isSortDropdownOpen);
  }
  
  // Close dropdown when clicking outside
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
  
  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearSearchBtn?.classList.toggle('visible', searchQuery.length > 0);
      renderProducts();
    });
    
    // Set placeholder
    searchInput.placeholder = `Search in ${config.displayName.toLowerCase()}...`;
  }
  
  // Clear search
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
  
  // Sort toggle
  if (sortToggleBtn) {
    sortToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSortDropdown();
    });
  }
  
  // Sort options
  document.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', (e) => {
      const sortType = option.dataset.sort;
      if (sortType) {
        currentSort = sortType;
        updateSortUI();
        renderProducts();
        toggleSortDropdown(); // Close dropdown
      }
    });
  });
  
  // Click outside to close dropdown
  document.addEventListener('click', handleClickOutside);
  
  // ---------- INITIALIZATION ----------
  async function init() {
    try {
      // Update header
      updateCategoryHeader();
      
      // Show loading
      if (loadingState) {
        loadingState.style.display = 'flex';
      }
      
      // Fetch products for this category
      allCategoryProducts = await OKMart.getProductsByCategory(config.slug);
      
      // Initial render
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
            <button class="browse-other-btn" onclick="location.reload()">Retry</button>
          </div>
        `;
      }
      if (loadingState) {
        loadingState.style.display = 'none';
      }
    }
  }
  
  // Start
  init();
  
  // Expose for debugging
  window.OKMartCategory = {
    getState: () => ({ 
      category: config.slug, 
      productCount: filteredProducts.length,
      sort: currentSort,
      search: searchQuery
    }),
    refresh: init
  };
  
})();s
