// ===== OK MART - DAIRY CATEGORY.JS =====
// Complete dairy category page with all features

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  const CATEGORY_SLUG = 'dairy';
  
  // State
  let allDairyProducts = [];
  let filteredProducts = [];
  let searchQuery = '';
  let activeFilter = 'all';
  let currentSort = 'popular';
  let isSortOpen = false;
  
  // DOM Elements
  const productGrid = document.getElementById('categoryProductGrid');
  const loadingState = document.getElementById('categoryLoadingState');
  const emptyState = document.getElementById('emptyState');
  const emptyStateMessage = document.getElementById('emptyStateMessage');
  const popularSection = document.getElementById('popularSection');
  const popularDairyGrid = document.getElementById('popularDairyGrid');
  const resultsCount = document.getElementById('categoryResultsCount');
  const productCount = document.getElementById('productCount');
  
  const searchInput = document.getElementById('categorySearchInput');
  const clearSearchBtn = document.getElementById('clearCategorySearch');
  const sortToggleBtn = document.getElementById('sortToggleBtn');
  const sortLabel = document.getElementById('sortLabel');
  const sortDropdown = document.getElementById('sortDropdown');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const toastMessage = document.getElementById('toastMessage');
  
  // Filter mapping
  const filterMapping = {
    'milk': ['milk', 'taaza', 'dairy'],
    'butter': ['butter', 'ghee'],
    'cheese': ['cheese'],
    'paneer': ['paneer', 'tofu'],
    'yogurt': ['yogurt', 'curd', 'dahi', 'epigamia'],
    'eggs': ['egg']
  };
  
  // Sort labels
  const sortLabels = {
    'popular': '🔥 Popular',
    'price-low': '💰 Low to High',
    'price-high': '💎 High to Low',
    'discount': '🏷️ Best Discount',
    'newest': '🆕 Newest'
  };
  
  // ---------- DATA LOADING ----------
  
  async function loadDairyProducts() {
    try {
      const response = await fetch('/data/dairy.json');
      if (!response.ok) throw new Error('Failed to load dairy products');
      const data = await response.json();
      allDairyProducts = data.products || [];
      return allDairyProducts;
    } catch (error) {
      console.error('Error loading dairy products:', error);
      
      // Fallback to loading from all products
      try {
        const allResponse = await fetch('/data/products.json');
        if (allResponse.ok) {
          const allData = await allResponse.json();
          allDairyProducts = allData.products.filter(p => p.category === 'dairy');
        }
      } catch (e) {}
      
      return allDairyProducts;
    }
  }
  
  // ---------- FILTERING ----------
  
  function applyFilters() {
    let filtered = [...allDairyProducts];
    
    // Quick filter
    if (activeFilter !== 'all' && filterMapping[activeFilter]) {
      const keywords = filterMapping[activeFilter];
      filtered = filtered.filter(p => {
        const nameLower = p.name.toLowerCase();
        return keywords.some(kw => nameLower.includes(kw));
      });
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.unit && p.unit.toLowerCase().includes(query))
      );
    }
    
    // Sorting
    filtered = sortProducts(filtered);
    
    return filtered;
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
          const discA = a.mrp ? ((a.mrp - a.price) / a.mrp) : 0;
          const discB = b.mrp ? ((b.mrp - b.price) / b.mrp) : 0;
          return discB - discA;
        });
      
      case 'newest':
        return sorted.reverse();
      
      default:
        return sorted;
    }
  }
  
  // ---------- RENDERING ----------
  
  function renderProductCard(product) {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        window.location.href = `/product.html?id=${product.id}`;
      }
    });
    
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      ${product.popular ? '<span class="product-badge">🔥 Popular</span>' : ''}
      <button class="wishlist-heart-btn" data-id="${product.id}" aria-label="Wishlist">
        ${isInWishlist(product.id) ? '❤️' : '🤍'}
      </button>
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      </div>
      <button class="add-btn">ADD</button>
    `;
    
    // Add to cart
    card.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product);
    });
    
    // Wishlist toggle
    card.querySelector('.wishlist-heart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(product, e.target);
    });
    
    return card;
  }
  
  function renderProducts() {
    filteredProducts = applyFilters();
    
    loadingState.style.display = 'none';
    
    // Update counts
    resultsCount.textContent = `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''} found`;
    productCount.textContent = allDairyProducts.length;
    
    if (filteredProducts.length === 0) {
      productGrid.style.display = 'none';
      emptyState.style.display = 'block';
      emptyStateMessage.textContent = searchQuery 
        ? `No results for "${searchQuery}"` 
        : `No products in this filter`;
      return;
    }
    
    productGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    productGrid.innerHTML = '';
    filteredProducts.slice(0, 30).forEach(product => {
      productGrid.appendChild(renderProductCard(product));
    });
  }
  
  function renderPopularProducts() {
    const popular = allDairyProducts.filter(p => p.popular).slice(0, 4);
    
    if (popular.length > 0) {
      popularSection.style.display = 'block';
      popularDairyGrid.innerHTML = '';
      
      popular.forEach(product => {
        const card = renderProductCard(product);
        popularDairyGrid.appendChild(card);
      });
    }
  }
  
  // ---------- CART FUNCTIONS ----------
  
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
    showToast(`${product.name} added to cart!`, 'success');
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCountPlaceholder');
    if (badge) badge.textContent = total;
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
      showToast(`Removed from wishlist`, 'info');
    } else {
      wishlist.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit
      });
      heartElement.textContent = '❤️';
      showToast(`Added to wishlist!`, 'success');
    }
    
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    updateWishlistBadge();
  }
  
  function updateWishlistBadge() {
    const wishlist = getWishlist();
    const badge = document.getElementById('wishlistCountBadge');
    if (badge) {
      badge.textContent = wishlist.length;
      badge.style.display = wishlist.length > 0 ? 'flex' : 'none';
    }
  }
  
  // ---------- TOAST ----------
  
  function showToast(message, type = 'info') {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 2500);
  }
  
  // ---------- EVENT LISTENERS ----------
  
  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.classList.toggle('visible', searchQuery.length > 0);
    renderProducts();
  });
  
  clearSearchBtn.addEventListener('click', () => {
    searchQuery = '';
    searchInput.value = '';
    clearSearchBtn.classList.remove('visible');
    renderProducts();
  });
  
  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderProducts();
    });
  });
  
  // Sort
  sortToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isSortOpen = !isSortOpen;
    sortDropdown.style.display = isSortOpen ? 'block' : 'none';
  });
  
  document.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      currentSort = option.dataset.sort;
      sortLabel.textContent = sortLabels[currentSort] || 'Popular';
      sortDropdown.style.display = 'none';
      isSortOpen = false;
      renderProducts();
    });
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sort-container')) {
      sortDropdown.style.display = 'none';
      isSortOpen = false;
    }
  });
  
  // Reset filters
  resetFiltersBtn.addEventListener('click', () => {
    searchQuery = '';
    searchInput.value = '';
    activeFilter = 'all';
    clearSearchBtn.classList.remove('visible');
    
    document.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === 'all');
    });
    
    renderProducts();
  });
  
  // ---------- INITIALIZATION ----------
  
  async function init() {
    await loadDairyProducts();
    
    renderProducts();
    renderPopularProducts();
    updateCartBadge();
    updateWishlistBadge();
    
    console.log(`✅ Dairy category loaded | ${allDairyProducts.length} products`);
  }
  
  init();
  
})();

