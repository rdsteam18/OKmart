// ===== OK MART - FRUITS CATEGORY.JS =====
// Complete fruits category page with all features

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  const CATEGORY_SLUG = 'fruits';
  
  // State
  let allFruitsProducts = [];
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
  const popularFruitsGrid = document.getElementById('popularFruitsGrid');
  const combosSection = document.getElementById('combosSection');
  const combosGrid = document.getElementById('combosGrid');
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
    'apple': ['apple', 'royal gala', 'fuji'],
    'banana': ['banana', 'yelakki'],
    'mango': ['mango', 'alphonso'],
    'grape': ['grape', 'green grape', 'black grape'],
    'orange': ['orange', 'nagpur', 'citrus'],
    'pomegranate': ['pomegranate', 'anar'],
    'exotic': ['kiwi', 'avocado', 'dragon', 'berry', 'strawberry', 'blueberry']
  };
  
  // Sort labels
  const sortLabels = {
    'popular': '🔥 Popular',
    'price-low': '💰 Low to High',
    'price-high': '💎 High to Low',
    'discount': '🏷️ Best Discount',
    'seasonal': '🌟 Seasonal'
  };
  
  // Fruit combos
  const fruitCombos = [
    { name: 'Breakfast Combo', fruits: 'Apple + Banana', price: 140, originalPrice: 190, icon: '🍎🍌' },
    { name: 'Immunity Booster', fruits: 'Orange + Kiwi', price: 160, originalPrice: 220, icon: '🍊🥝' },
    { name: 'Tropical Mix', fruits: 'Mango + Banana', price: 270, originalPrice: 350, icon: '🥭🍌' },
    { name: 'Berry Delight', fruits: 'Strawberry + Blueberry', price: 299, originalPrice: 399, icon: '🍓🫐' }
  ];
  
  // ---------- DATA LOADING ----------
  
  async function loadFruitsProducts() {
    try {
      const response = await fetch('/data/fruits.json');
      if (!response.ok) throw new Error('Failed to load fruits products');
      const data = await response.json();
      allFruitsProducts = data.products || [];
      return allFruitsProducts;
    } catch (error) {
      console.error('Error loading fruits products:', error);
      
      // Fallback to loading from all products
      try {
        const allResponse = await fetch('/data/products.json');
        if (allResponse.ok) {
          const allData = await allResponse.json();
          allFruitsProducts = allData.products.filter(p => p.category === 'fruits');
        }
      } catch (e) {}
      
      return allFruitsProducts;
    }
  }
  
  // ---------- FILTERING ----------
  
  function applyFilters() {
    let filtered = [...allFruitsProducts];
    
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
      
      case 'seasonal':
        // Put seasonal/featured items first
        return sorted.sort((a, b) => {
          const aSeasonal = a.seasonal || a.featured || false;
          const bSeasonal = b.seasonal || b.featured || false;
          if (aSeasonal && !bSeasonal) return -1;
          if (!aSeasonal && bSeasonal) return 1;
          return 0;
        });
      
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
      ${product.seasonal ? '<span class="seasonal-badge">🌟 Seasonal</span>' : ''}
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
    
    // Add seasonal badge style if needed
    if (product.seasonal) {
      const seasonalBadge = card.querySelector('.seasonal-badge');
      if (seasonalBadge) {
        seasonalBadge.style.cssText = `
          position: absolute;
          top: 8px;
          left: 8px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 4px 10px;
          border-radius: 40px;
          font-size: 0.6rem;
          font-weight: 600;
          z-index: 2;
        `;
      }
    }
    
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
    productCount.textContent = allFruitsProducts.length;
    
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
    const popular = allFruitsProducts.filter(p => p.popular).slice(0, 4);
    
    if (popular.length > 0) {
      popularSection.style.display = 'block';
      popularFruitsGrid.innerHTML = '';
      
      popular.forEach(product => {
        const card = renderProductCard(product);
        popularFruitsGrid.appendChild(card);
      });
    }
  }
  
  function renderCombos() {
    if (combosGrid) {
      combosSection.style.display = 'block';
      combosGrid.innerHTML = '';
      
      fruitCombos.forEach(combo => {
        const card = document.createElement('div');
        card.className = 'combo-card';
        card.innerHTML = `
          <div class="combo-icon">${combo.icon}</div>
          <div class="combo-title">${combo.name}</div>
          <div class="combo-fruits">${combo.fruits}</div>
          <div class="combo-price">
            <span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.8rem;">₹${combo.originalPrice}</span>
            <span style="font-weight: 700; color: var(--primary-dark); margin-left: 6px;">₹${combo.price}</span>
          </div>
          <button class="combo-btn" data-combo="${combo.name}">Add Combo</button>
        `;
        
        card.querySelector('.combo-btn').addEventListener('click', () => {
          showToast(`${combo.name} coming soon!`, 'info');
        });
        
        combosGrid.appendChild(card);
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
    await loadFruitsProducts();
    
    renderProducts();
    renderPopularProducts();
    renderCombos();
    updateCartBadge();
    updateWishlistBadge();
    
    console.log(`✅ Fruits category loaded | ${allFruitsProducts.length} products`);
  }
  
  init();
  
})();
