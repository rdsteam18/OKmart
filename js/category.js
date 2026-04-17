// ===== OK MART - UNIFIED CATEGORY.JS =====
// Single JS file for ALL category pages

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  
  // Category configuration
  const categoryConfig = {
    dairy: {
      displayName: 'Dairy & Eggs',
      description: 'Fresh milk, butter, paneer, cheese & eggs',
      icon: '🥛',
      filters: ['all', 'milk', 'butter', 'cheese', 'paneer', 'yogurt', 'eggs'],
      filterMapping: {
        milk: ['milk', 'taaza'],
        butter: ['butter', 'ghee'],
        cheese: ['cheese'],
        paneer: ['paneer', 'tofu'],
        yogurt: ['yogurt', 'curd', 'dahi'],
        eggs: ['egg']
      },
      loaderIcons: ['🥛', '🥛', '🥛']
    },
    fruits: {
      displayName: 'Fresh Fruits',
      description: 'Handpicked fresh fruits delivered daily',
      icon: '🍎',
      filters: ['all', 'apple', 'banana', 'mango', 'grape', 'orange', 'pomegranate', 'exotic'],
      filterMapping: {
        apple: ['apple', 'royal gala'],
        banana: ['banana', 'yelakki'],
        mango: ['mango', 'alphonso'],
        grape: ['grape'],
        orange: ['orange', 'nagpur'],
        pomegranate: ['pomegranate', 'anar'],
        exotic: ['kiwi', 'avocado', 'dragon', 'berry']
      },
      loaderIcons: ['🍎', '🍌', '🍊', '🍇']
    },
    vegetables: {
      displayName: 'Fresh Vegetables',
      description: 'Farm fresh vegetables delivered daily',
      icon: '🥕',
      filters: ['all', 'potato', 'tomato', 'onion', 'leafy', 'root'],
      filterMapping: {
        potato: ['potato', 'aloo'],
        tomato: ['tomato', 'tamatar'],
        onion: ['onion', 'pyaz'],
        leafy: ['spinach', 'palak', 'coriander', 'methi'],
        root: ['carrot', 'beetroot', 'radish']
      },
      loaderIcons: ['🥕', '🥔', '🍅', '🧅']
    },
    snacks: {
      displayName: 'Snacks & Munchies',
      description: 'Chips, biscuits, namkeen & more',
      icon: '🍿',
      filters: ['all', 'chips', 'biscuits', 'namkeen', 'chocolate', 'noodles'],
      filterMapping: {
        chips: ['chips', 'crisps', 'lays', 'kurkure'],
        biscuits: ['biscuit', 'cookie', 'parle'],
        namkeen: ['namkeen', 'bhujia'],
        chocolate: ['chocolate', 'candy'],
        noodles: ['noodle', 'maggie', 'pasta']
      },
      loaderIcons: ['🍿', '🍪', '🍫', '🍜']
    },
    beverages: {
      displayName: 'Beverages',
      description: 'Soft drinks, juices, tea & coffee',
      icon: '🥤',
      filters: ['all', 'soft-drinks', 'juices', 'tea', 'coffee', 'energy'],
      filterMapping: {
        'soft-drinks': ['cola', 'sprite', 'pepsi', 'coca'],
        juices: ['juice', 'real', 'tropicana'],
        tea: ['tea', 'chai', 'tata tea'],
        coffee: ['coffee', 'nescafe', 'bru'],
        energy: ['red bull', 'energy', 'sting']
      },
      loaderIcons: ['🥤', '🧃', '☕', '🧋']
    },
    grocery: {
      displayName: 'Grocery Staples',
      description: 'Atta, rice, dal, oils & daily essentials',
      icon: '🧺',
      filters: ['all', 'atta', 'rice', 'dal', 'oil', 'spices', 'salt-sugar'],
      filterMapping: {
        atta: ['atta', 'flour', 'wheat'],
        rice: ['rice', 'basmati'],
        dal: ['dal', 'pulse', 'toor', 'chana'],
        oil: ['oil', 'ghee', 'sunflower'],
        spices: ['spice', 'masala', 'turmeric'],
        'salt-sugar': ['salt', 'sugar']
      },
      loaderIcons: ['🌾', '🍚', '🫘', '🫒']
    },
    electronics: {
      displayName: 'Electronics',
      description: 'Mobile accessories, chargers & gadgets',
      icon: '📱',
      filters: ['all', 'chargers', 'cables', 'earphones', 'power-banks'],
      filterMapping: {
        chargers: ['charger', 'adapter'],
        cables: ['cable', 'type-c', 'lightning'],
        earphones: ['earphone', 'headphone', 'bluetooth'],
        'power-banks': ['power bank', 'powerbank']
      },
      loaderIcons: ['📱', '🔌', '🎧', '🔋']
    },
    bakery: {
      displayName: 'Bakery',
      description: 'Fresh bread, cakes & pastries',
      icon: '🥐',
      filters: ['all', 'bread', 'cakes', 'pastries', 'buns'],
      filterMapping: {
        bread: ['bread', 'brown bread'],
        cakes: ['cake', 'pastry'],
        pastries: ['pastry', 'puff'],
        buns: ['bun', 'pav']
      },
      loaderIcons: ['🥐', '🍞', '🎂', '🥖']
    },
    personal: {
      displayName: 'Personal Care',
      description: 'Bath, body & oral care products',
      icon: '🧴',
      filters: ['all', 'bath', 'oral', 'hair', 'skin'],
      filterMapping: {
        bath: ['soap', 'body wash', 'shampoo'],
        oral: ['toothpaste', 'toothbrush', 'mouthwash'],
        hair: ['shampoo', 'conditioner', 'hair oil'],
        skin: ['cream', 'lotion', 'face wash']
      },
      loaderIcons: ['🧴', '🧼', '🪥', '💄']
    },
    household: {
      displayName: 'Household',
      description: 'Cleaning & kitchen essentials',
      icon: '🧹',
      filters: ['all', 'cleaning', 'kitchen', 'laundry', 'pooja'],
      filterMapping: {
        cleaning: ['cleaner', 'detergent', 'wipe'],
        kitchen: ['utensil', 'container', 'foil'],
        laundry: ['detergent', 'fabric', 'softener'],
        pooja: ['pooja', 'agarbatti', 'diya']
      },
      loaderIcons: ['🧹', '🧼', '🧽', '🕯️']
    }
  };
  
  // Sort labels
  const sortLabels = {
    'popular': '🔥 Popular',
    'price-low': '💰 Low to High',
    'price-high': '💎 High to Low',
    'discount': '🏷️ Best Discount'
  };
  
  // ---------- STATE ----------
  const category = document.body.dataset.category || 'dairy';
  const config = categoryConfig[category] || categoryConfig.dairy;
  
  let allProducts = [];
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
  const popularGrid = document.getElementById('popularGrid');
  const resultsCount = document.getElementById('categoryResultsCount');
  const productCount = document.getElementById('productCount');
  
  const searchInput = document.getElementById('categorySearchInput');
  const clearSearchBtn = document.getElementById('clearCategorySearch');
  const sortToggleBtn = document.getElementById('sortToggleBtn');
  const sortLabel = document.getElementById('sortLabel');
  const sortDropdown = document.getElementById('sortDropdown');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const toastMessage = document.getElementById('toastMessage');
  
  // Update UI with config
  function updateUIWithConfig() {
    document.querySelector('.category-icon').textContent = config.icon;
    document.querySelector('.category-title').textContent = config.displayName;
    document.querySelector('.category-description').textContent = config.description;
    document.title = `${config.displayName} | OK Mart`;
    
    // Update loader icons
    const loader = document.querySelector('.category-loader');
    if (loader) {
      loader.innerHTML = config.loaderIcons.map(icon => `<span>${icon}</span>`).join('');
    }
  }
  
  // ---------- DATA LOADING ----------
  async function loadProducts() {
    try {
      const response = await fetch(`/data/${category}.json`);
      if (!response.ok) throw new Error(`Failed to load ${category} products`);
      const data = await response.json();
      allProducts = data.products || [];
      return allProducts;
    } catch (error) {
      console.error(`Error loading ${category} products:`, error);
      
      // Fallback to all products
      try {
        const allResponse = await fetch('/data/products.json');
        if (allResponse.ok) {
          const allData = await allResponse.json();
          allProducts = allData.products.filter(p => p.category === category);
        }
      } catch (e) {}
      
      return allProducts;
    }
  }
  
  // ---------- FILTERING ----------
  function applyFilters() {
    let filtered = [...allProducts];
    
    if (activeFilter !== 'all' && config.filterMapping[activeFilter]) {
      const keywords = config.filterMapping[activeFilter];
      filtered = filtered.filter(p => {
        const nameLower = p.name.toLowerCase();
        return keywords.some(kw => nameLower.includes(kw));
      });
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.unit && p.unit.toLowerCase().includes(query))
      );
    }
    
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
    
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      ${product.popular ? '<span class="product-badge">🔥 Popular</span>' : ''}
      <button class="wishlist-heart-btn" data-id="${product.id}" aria-label="Wishlist">
        ${isInWishlist(product.id) ? '❤️' : '🤍'}
      </button>
      <button class="share-product-btn" data-id="${product.id}" aria-label="Share">📤</button>
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
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
    
    card.querySelector('.wishlist-heart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(product, e.target);
    });
    
    card.querySelector('.share-product-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      showShareOptions(product, e.target);
    });
    
    return card;
  }
  
  function renderProducts() {
    filteredProducts = applyFilters();
    
    loadingState.style.display = 'none';
    
    resultsCount.textContent = `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''} found`;
    if (productCount) productCount.textContent = allProducts.length;
    
    if (filteredProducts.length === 0) {
      productGrid.style.display = 'none';
      emptyState.style.display = 'block';
      if (emptyStateMessage) {
        emptyStateMessage.textContent = searchQuery 
          ? `No results for "${searchQuery}"` 
          : `No products in this filter`;
      }
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
    const popular = allProducts.filter(p => p.popular).slice(0, 4);
    
    if (popular.length > 0 && popularSection) {
      popularSection.style.display = 'block';
      popularGrid.innerHTML = '';
      
      popular.forEach(product => {
        popularGrid.appendChild(renderProductCard(product));
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
    document.querySelectorAll('.cart-badge').forEach(b => {
      if (b) b.textContent = total;
    });
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
  
  // ---------- SHARE FUNCTIONS ----------
  function showShareOptions(product, triggerElement) {
    const rect = triggerElement.getBoundingClientRect();
    
    const overlay = document.createElement('div');
    overlay.className = 'share-popup-overlay';
    overlay.addEventListener('click', () => {
      popup.remove();
      overlay.remove();
    });
    
    const popup = document.createElement('div');
    popup.className = 'share-popup';
    popup.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
    `;
    
    popup.innerHTML = `
      <button class="share-popup-btn" data-action="whatsapp">
        <span>💬</span>
        <span>WhatsApp</span>
      </button>
      <button class="share-popup-btn" data-action="copy">
        <span>📋</span>
        <span>Copy Link</span>
      </button>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    
    const shareUrl = `${window.location.origin}/product.html?id=${product.id}`;
    
    popup.querySelector('[data-action="whatsapp"]').addEventListener('click', () => {
      const message = `🛒 *${product.name}*\n💰 ₹${product.price}\n\n${shareUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      popup.remove();
      overlay.remove();
    });
    
    popup.querySelector('[data-action="copy"]').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied!', 'success');
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Link copied!', 'success');
      }
      popup.remove();
      overlay.remove();
    });
  }
  
  // ---------- TOAST ----------
  function showToast(message, type = 'info') {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => toastMessage.classList.remove('show'), 2500);
  }
  
  // ---------- EVENT LISTENERS ----------
  function setupEventListeners() {
    // Search
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
        searchInput.value = '';
        clearSearchBtn.classList.remove('visible');
        renderProducts();
      });
    }
    
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
    if (sortToggleBtn) {
      sortToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isSortOpen = !isSortOpen;
        sortDropdown.style.display = isSortOpen ? 'block' : 'none';
      });
    }
    
    document.querySelectorAll('.sort-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        currentSort = option.dataset.sort;
        if (sortLabel) sortLabel.textContent = sortLabels[currentSort] || 'Popular';
        sortDropdown.style.display = 'none';
        isSortOpen = false;
        renderProducts();
      });
    });
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.sort-container')) {
        if (sortDropdown) sortDropdown.style.display = 'none';
        isSortOpen = false;
      }
    });
    
    // Reset filters
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        activeFilter = 'all';
        if (clearSearchBtn) clearSearchBtn.classList.remove('visible');
        
        document.querySelectorAll('.filter-chip').forEach(c => {
          c.classList.toggle('active', c.dataset.filter === 'all');
        });
        
        renderProducts();
      });
    }
  }
  
  // ---------- INITIALIZATION ----------
  async function init() {
    updateUIWithConfig();
    await loadProducts();
    
    renderProducts();
    renderPopularProducts();
    updateCartBadge();
    updateWishlistBadge();
    setupEventListeners();
    
    console.log(`✅ ${config.displayName} loaded | ${allProducts.length} products`);
  }
  
  init();
  
})();
