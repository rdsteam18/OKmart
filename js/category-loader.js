// ===== OK MART - CATEGORY LOADER =====
// Universal category page loader - works for any category JSON

(function() {
  'use strict';
  
  const categorySlug = window.__OKMART_CATEGORY || 'fruits';
  const jsonFile = window.__OKMART_JSON_FILE || `/data/${categorySlug}.json`;
  
  let allProducts = [];
  let filteredProducts = [];
  let searchQuery = '';
  let currentSort = 'popular';
  let isSortDropdownOpen = false;
  
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
  
  // Category display names
  const categoryDisplayNames = {
    'fruits': 'Fresh Fruits',
    'dairy': 'Dairy & Bakery',
    'snacks': 'Snacks & Munchies',
    'beverages': 'Beverages',
    'electronics': 'Electronics & Accessories',
    'offers': 'Today\'s Deals',
    'grocery': 'Grocery Staples'
  };
  
  const categoryIcons = {
    'fruits': '🍎',
    'dairy': '🥛',
    'snacks': '🍿',
    'beverages': '🥤',
    'electronics': '📱',
    'offers': '🏷️',
    'grocery': '🧺'
  };
  
  const categoryDescriptions = {
    'fruits': 'Fresh and juicy fruits delivered to your doorstep',
    'dairy': 'Fresh milk, butter, paneer, bread & eggs',
    'snacks': 'Chips, biscuits, namkeen & munchies',
    'beverages': 'Soft drinks, juices, tea & coffee',
    'electronics': 'Mobile accessories, chargers & gadgets',
    'offers': 'Best deals and discounts on your favorites',
    'grocery': 'Atta, rice, dal, oils & daily essentials'
  };
  
  async function loadCategoryData() {
    try {
      const response = await fetch(jsonFile);
      if (!response.ok) throw new Error('Failed to load category data');
      const data = await response.json();
      allProducts = data.products || [];
      
      if (categoryTitle) {
        categoryTitle.textContent = data.displayName || categoryDisplayNames[categorySlug] || categorySlug;
      }
      if (categoryDescription) {
        categoryDescription.textContent = categoryDescriptions[categorySlug] || 'Fresh products delivered fast';
      }
      if (categoryIcon) {
        categoryIcon.textContent = data.icon || categoryIcons[categorySlug] || '🛒';
      }
      
      document.title = `${data.displayName || categorySlug} · OK Mart`;
      
      return allProducts;
    } catch (error) {
      console.error('Error loading category:', error);
      return [];
    }
  }
  
  function filterBySearch(products) {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase().trim();
    return products.filter(p => p.name.toLowerCase().includes(query));
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
    let processed = filterBySearch(allProducts);
    processed = sortProducts(processed);
    return processed;
  }
  
  function renderProducts() {
    filteredProducts = processProducts();
    
    if (loadingState) loadingState.style.display = 'none';
    if (resultsCount) {
      resultsCount.textContent = `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''}`;
    }
    
    if (productGrid) productGrid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
      renderEmptyState();
      return;
    }
    
    filteredProducts.forEach(product => {
      const card = window.OKMart.renderProductCard(product);
      
      if (product.popular) {
        const badge = document.createElement('span');
        badge.className = 'product-badge';
        badge.textContent = '🔥 Popular';
        badge.style.cssText = 'position:absolute;top:8px;left:8px;background:#5f930e;color:white;padding:4px 10px;border-radius:40px;font-size:0.65rem;font-weight:600;z-index:2;';
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
      }
      
      if (product.offerTag) {
        const offerBadge = document.createElement('span');
        offerBadge.className = 'offer-badge';
        offerBadge.textContent = product.offerTag;
        offerBadge.style.cssText = 'position:absolute;top:8px;right:8px;background:#ef4444;color:white;padding:4px 10px;border-radius:40px;font-size:0.65rem;font-weight:600;z-index:2;';
        card.style.position = 'relative';
        card.appendChild(offerBadge);
      }
      
      productGrid.appendChild(card);
    });
  }
  
  function renderEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-category-state';
    emptyDiv.innerHTML = `
      <div class="empty-category-icon">${categoryIcons[categorySlug] || '🛒'}</div>
      <h3>${searchQuery ? `No "${searchQuery}" found` : 'No products available'}</h3>
      <p>${searchQuery ? 'Try a different search term' : 'Check back soon for new products'}</p>
      <a href="/index.html" class="browse-other-btn">Browse all categories</a>
    `;
    productGrid.appendChild(emptyDiv);
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
      if (span) span.textContent = sortLabels[currentSort] || '📊 Sort';
    }
  }
  
  function toggleSortDropdown() {
    isSortDropdownOpen = !isSortDropdownOpen;
    if (sortDropdown) {
      sortDropdown.style.display = isSortDropdownOpen ? 'block' : 'none';
    }
    sortToggleBtn?.classList.toggle('active', isSortDropdownOpen);
  }
  
  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearSearchBtn?.classList.toggle('visible', searchQuery.length > 0);
      renderProducts();
    });
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      if (searchInput) searchInput.value = '';
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
  
  document.addEventListener('click', (e) => {
    if (isSortDropdownOpen && !sortDropdown?.contains(e.target) && !sortToggleBtn?.contains(e.target)) {
      isSortDropdownOpen = false;
      sortDropdown.style.display = 'none';
      sortToggleBtn?.classList.remove('active');
    }
  });
  
  async function init() {
    await loadCategoryData();
    renderProducts();
    updateSortUI();
    
    if (window.OKMart) {
      const cart = window.OKMart.getCartItems();
      const badges = document.querySelectorAll('.cart-badge');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      badges.forEach(badge => { if (badge) badge.textContent = totalItems; });
    }
  }
  
  init();
})();

