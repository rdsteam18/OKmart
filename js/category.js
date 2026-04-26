// ===== OK Mart - UNIFIED CATEGORY.JS =====
// Single JS file for ALL 10+ category pages
// Detects category from <body data-category="...">

(function() {
  'use strict';

  // ============================================
  // 1. CONSTANTS & CONFIGURATION
  // ============================================
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';

  // Detect category from HTML body attribute
  const category = document.body.dataset.category || 'dairy';

  // Category display configuration
  const categoryConfig = {
    dairy:       { title: 'Dairy & Eggs',       icon: '🥛', desc: 'Fresh milk, butter, paneer & more' },
    fruits:      { title: 'Fresh Fruits',       icon: '🍎', desc: 'Handpicked fresh fruits delivered daily' },
    vegetables:  { title: 'Fresh Vegetables',   icon: '🥬', desc: 'Farm fresh vegetables delivered daily' },
    snacks:      { title: 'Snacks & Munchies',  icon: '🍿', desc: 'Chips, biscuits, namkeen & more' },
    beverages:   { title: 'Beverages & Drinks', icon: '🥤', desc: 'Soft drinks, juices, tea & coffee' },
    electronics: { title: 'Electronics',        icon: '📱', desc: 'Mobile accessories, chargers & gadgets' },
    grocery:     { title: 'Grocery Staples',    icon: '🧺', desc: 'Atta, rice, dal, oils & essentials' },
    bakery:      { title: 'Bakery & Fresh',     icon: '🥐', desc: 'Fresh bread, cakes, eggs & biscuits' },
    personal:    { title: 'Personal Care',      icon: '🧴', desc: 'Bath, body, oral care & grooming' },
    household:   { title: 'Household',          icon: '🧹', desc: 'Cleaning, kitchen & home essentials' },
    offers:      { title: 'Special Offers',     icon: '🏷️', desc: 'Best deals and discounts' }
  };

  // Quick filter mappings for each category
  const filterMaps = {
    dairy: {
      milk:   ['milk', 'taaza'],
      butter: ['butter', 'ghee'],
      cheese: ['cheese'],
      paneer: ['paneer', 'tofu'],
      yogurt: ['yogurt', 'curd', 'dahi'],
      eggs:   ['egg']
    },
    fruits: {
      apple: ['apple', 'royal gala'],
      banana: ['banana', 'yelakki'],
      mango: ['mango', 'alphonso'],
      grape: ['grape'],
      orange: ['orange', 'nagpur'],
      exotic: ['kiwi', 'avocado', 'dragon', 'berry']
    },
    vegetables: {
      leafy:  ['spinach', 'palak', 'coriander', 'methi', 'lettuce'],
      root:   ['carrot', 'beetroot', 'radish', 'potato', 'turnip'],
      gourd:  ['gourd', 'lauki', 'cucumber', 'bitter gourd'],
      onion:  ['onion', 'garlic', 'shallot'],
      tomato: ['tomato', 'cherry tomato']
    },
    snacks: {
      chips:     ['chips', 'crisps', 'lays', 'kurkure', 'bingo'],
      biscuits:  ['biscuit', 'cookie', 'parle', 'britannia', 'oreo'],
      namkeen:   ['namkeen', 'bhujia', 'sev', 'haldiram'],
      chocolate: ['chocolate', 'candy', 'dairy milk', 'kitkat'],
      noodles:   ['noodle', 'maggie', 'pasta', 'yippee'],
      ready:     ['ready', 'instant', 'meal', 'upma', 'poha']
    },
    beverages: {
      'soft-drinks': ['cola', 'pepsi', 'coca', 'sprite', 'fanta'],
      juices:        ['juice', 'real', 'tropicana', 'minute maid'],
      tea:           ['tea', 'chai', 'tata tea', 'green tea'],
      coffee:        ['coffee', 'nescafe', 'bru'],
      energy:        ['red bull', 'sting', 'monster', 'energy'],
      water:         ['water', 'bisleri', 'kinley', 'aquafina']
    },
    electronics: {
      chargers:    ['charger', 'adapter', 'fast charger'],
      cables:      ['cable', 'type-c', 'lightning', 'usb'],
      earphones:   ['earphone', 'headphone', 'bluetooth'],
      powerbanks:  ['power bank', 'powerbank'],
      holders:     ['holder', 'car holder', 'stand'],
      screen:      ['screen protector', 'tempered glass']
    },
    grocery: {
      atta:   ['atta', 'flour', 'wheat', 'maida'],
      rice:   ['rice', 'basmati', 'sona masoori'],
      dal:    ['dal', 'pulse', 'toor', 'chana', 'moong'],
      oil:    ['oil', 'ghee', 'sunflower', 'mustard'],
      spices: ['spice', 'masala', 'turmeric', 'chilli', 'cumin'],
      sugar:  ['salt', 'sugar']
    },
    bakery: {
      bread:    ['bread', 'brown bread', 'white bread'],
      cakes:    ['cake', 'pastry', 'cupcake', 'muffin'],
      eggs:     ['egg', 'farm egg'],
      biscuits: ['biscuit', 'cookie', 'rusk'],
      rusks:    ['rusk', 'toast', 'crisp']
    },
    personal: {
      soap:       ['soap', 'body wash', 'dove', 'pears', 'lux'],
      shampoo:    ['shampoo', 'conditioner', 'sunsilk'],
      toothpaste: ['toothpaste', 'toothbrush', 'colgate'],
      facewash:   ['face wash', 'cleanser', 'himalaya'],
      lotion:     ['lotion', 'cream', 'moisturizer', 'nivea'],
      deo:        ['deodorant', 'deo', 'perfume', 'axe']
    },
    household: {
      detergent: ['detergent', 'surf', 'ariel', 'tide'],
      floor:     ['floor cleaner', 'lizol', 'phenyl'],
      dishwash:  ['dishwash', 'vim', 'scrub', 'sponge'],
      tissue:    ['tissue', 'paper towel', 'napkin'],
      bags:      ['garbage bag', 'trash bag', 'dustbin'],
      pooja:     ['pooja', 'agarbatti', 'incense', 'diya']
    }
  };

  // Emoji mapping for filter chips
  const emojiMap = {
    milk:'🥛',butter:'🧈',cheese:'🧀',paneer:'🧊',yogurt:'🍶',eggs:'🥚',
    apple:'🍎',banana:'🍌',mango:'🥭',grape:'🍇',orange:'🍊',exotic:'🥝',
    leafy:'🥗',root:'🥕',gourd:'🥒',onion:'🧅',tomato:'🍅',
    chips:'🍟',biscuits:'🍪',namkeen:'🥨',chocolate:'🍫',noodles:'🍜',ready:'🍲',
    'soft-drinks':'🥤',juices:'🧃',tea:'☕',coffee:'☕',energy:'⚡',water:'💧',
    chargers:'🔌',cables:'🔗',earphones:'🎧',powerbanks:'🔋',holders:'📎',screen:'🛡️',
    atta:'🌾',rice:'🍚',dal:'🫘',oil:'🫒',spices:'🌶️',sugar:'🧂',
    bread:'🍞',cakes:'🎂',rusks:'🥖',
    soap:'🧼',shampoo:'💆',toothpaste:'🪥',facewash:'🧴',lotion:'🧴',deo:'🌸',
    detergent:'🧺',floor:'🧼',dishwash:'🍽️',tissue:'🧻',bags:'🗑️',pooja:'🕯️'
  };

  // ============================================
  // 2. STATE VARIABLES
  // ============================================
  let allProducts = [];
  let filteredProducts = [];
  let currentSort = 'popular';
  let currentFilter = 'all';
  let currentWeight = 'all';
  let sortOpen = false;

  // ============================================
  // 3. GET CONFIG FOR CURRENT CATEGORY
  // ============================================
  const config = categoryConfig[category] || { title: category, icon: '🛒', desc: 'Quality products' };
  const filterMap = filterMaps[category] || {};

  // ============================================
  // 4. UPDATE PAGE UI
  // ============================================
  function updatePageUI() {
    // Set page title
    document.title = `${config.title} | OK Mart`;

    // Update header title
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = config.title;

    // Update hero section
    const heroIcon = document.querySelector('.hero-icon');
    const heroTitle = document.querySelector('.hero-content h2');
    const heroDesc = document.querySelector('.hero-content p');
    if (heroIcon) heroIcon.textContent = config.icon;
    if (heroTitle) heroTitle.textContent = config.title;
    if (heroDesc) heroDesc.textContent = config.desc;
  }

  // ============================================
  // 5. BUILD FILTER CHIPS
  // ============================================
  function buildFilterChips() {
    if (Object.keys(filterMap).length === 0) return;

    const scrollContainer = document.getElementById('typeFilterScroll');
    if (!scrollContainer) return;

    let chipsHTML = `<button class="filter-chip active" data-filter="all">${config.icon} All</button>`;

    Object.keys(filterMap).forEach(key => {
      const emoji = emojiMap[key] || '📦';
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      chipsHTML += `<button class="filter-chip" data-filter="${key}">${emoji} ${label}</button>`;
    });

    scrollContainer.innerHTML = chipsHTML;

    // Add click listeners to filter chips
    scrollContainer.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', function() {
        scrollContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        applyFiltersAndRender();
      });
    });
  }

  // ============================================
  // 6. BUILD WEIGHT FILTERS (IF APPLICABLE)
  // ============================================
  function buildWeightFilters() {
    const weightContainer = document.getElementById('weightFilterScroll');
    if (!weightContainer) return;

    weightContainer.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', function() {
        weightContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        currentWeight = this.dataset.weight;
        applyFiltersAndRender();
      });
    });
  }

  // ============================================
  // 7. BUILD SORT DROPDOWN
  // ============================================
  function buildSortDropdown() {
    const sortOptions = document.querySelectorAll('.sort-option');
    sortOptions.forEach(opt => {
      opt.addEventListener('click', function() {
        sortOptions.forEach(o => o.classList.remove('active'));
        this.classList.add('active');
        currentSort = this.dataset.sort;
        document.getElementById('sortLabel').textContent = this.textContent.trim();
        document.getElementById('sortDropdown').classList.remove('show');
        sortOpen = false;
        applyFiltersAndRender();
      });
    });

    // Toggle sort dropdown
    window.toggleSort = function() {
      sortOpen = !sortOpen;
      document.getElementById('sortDropdown').classList.toggle('show', sortOpen);
    };

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.sort-wrapper')) {
        document.getElementById('sortDropdown').classList.remove('show');
        sortOpen = false;
      }
    });
  }

  // ============================================
  // 8. FETCH PRODUCTS FROM FIREBASE
  // ============================================
  function fetchProducts() {
    db.collection('products')
      .where('category', '==', category)
      .where('active', '!=', false)
      .onSnapshot(snapshot => {
        allProducts = [];
        snapshot.forEach(doc => {
          allProducts.push({ id: doc.id, ...doc.data() });
        });
        applyFiltersAndRender();
      });
  }

  // ============================================
  // 9. FILTER LOGIC
  // ============================================
  function getFilteredProducts() {
    let filtered = [...allProducts];

    // Apply quick filter (type)
    if (currentFilter !== 'all' && filterMap[currentFilter]) {
      const keywords = filterMap[currentFilter];
      filtered = filtered.filter(product => {
        const name = product.name.toLowerCase();
        return keywords.some(keyword => name.includes(keyword));
      });
    }

    // Apply weight filter (for grocery)
    if (currentWeight !== 'all') {
      const weightNum = parseInt(currentWeight);
      if (!isNaN(weightNum)) {
        filtered = filtered.filter(product => {
          const unit = (product.unit || '').toLowerCase();
          return unit.includes(`${weightNum}kg`) || unit.includes(`${weightNum} kg`);
        });
      } else if (currentWeight === 'bulk') {
        filtered = filtered.filter(product => {
          const unit = (product.unit || '').toLowerCase();
          return unit.includes('5kg') || unit.includes('10kg') || unit.includes('bulk');
        });
      }
    }

    return filtered;
  }

  // ============================================
  // 10. SORT LOGIC
  // ============================================
  function sortProducts(products) {
    let sorted = [...products];

    switch (currentSort) {
      case 'popular':
      case 'fresh':
        sorted.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
        break;

      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;

      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;

      case 'discount':
        sorted.sort((a, b) => {
          const discountA = a.mrp ? ((a.mrp - a.price) / a.mrp) : 0;
          const discountB = b.mrp ? ((b.mrp - b.price) / b.mrp) : 0;
          return discountB - discountA;
        });
        break;

      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case 'value':
        sorted.sort((a, b) => {
          const weightA = extractWeight(a.unit);
          const weightB = extractWeight(b.unit);
          if (weightA && weightB) return (a.price / weightA) - (b.price / weightB);
          return 0;
        });
        break;

      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }

    return sorted;
  }

  function extractWeight(unit) {
    if (!unit) return null;
    const match = unit.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  // ============================================
  // 11. APPLY FILTERS & SORT, THEN RENDER
  // ============================================
  function applyFiltersAndRender() {
    filteredProducts = sortProducts(getFilteredProducts());
    renderProducts(filteredProducts);
  }

  // ============================================
  // 12. RENDER PRODUCTS
  // ============================================
  function renderProducts(products) {
    // Hide loading skeleton
    const loadingGrid = document.getElementById('loadingGrid');
    if (loadingGrid) loadingGrid.style.display = 'none';

    // Update product count
    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;

    // Get grid and empty state elements
    const grid = document.getElementById('productGrid');
    const empty = document.getElementById('emptyState');

    if (!products.length) {
      if (grid) grid.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (grid) grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    // Clear and populate grid
    if (grid) {
      grid.innerHTML = '';
      products.forEach(product => {
        grid.appendChild(createProductCard(product));
      });
    }
  }

  // ============================================
  // 13. CREATE PRODUCT CARD
  // ============================================
  function createProductCard(product) {
    const discount = product.mrp
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

    const outOfStock = (product.stock !== undefined && product.stock <= 0);

    const card = document.createElement('div');
    card.className = 'product-card';

    // Determine badge
    let badgeHTML = '';
    if (product.hot) badgeHTML = '<span class="hot-badge">🔥 Hot Deal</span>';
    else if (product.fresh) badgeHTML = '<span class="fresh-badge">🌅 Fresh</span>';
    else if (product.new || product.isNew) badgeHTML = '<span class="new-badge">🆕 New</span>';
    else if (product.trending) badgeHTML = '<span class="trending-badge">📈 Trending</span>';
    else if (product.value) badgeHTML = '<span class="value-badge">💰 Best Value</span>';
    else if (product.combo) badgeHTML = '<span class="combo-badge">🎁 Combo</span>';
    else if (product.family) badgeHTML = '<span class="family-badge">👨‍👩‍👧‍👦 Family</span>';
    else if (product.chilled) badgeHTML = '<span class="chilled-badge">❄️ Chilled</span>';
    else if (product.dermat) badgeHTML = '<span class="dermat-badge">✓ Tested</span>';
    else if (product.popular) badgeHTML = '<span class="product-badge">Best Seller</span>';
    else if (product.limited || (product.stock && product.stock <= 5)) badgeHTML = '<span class="limited-badge">⚡ Limited</span>';
    else if (product.seasonal) badgeHTML = '<span class="seasonal-badge">🌟 Seasonal</span>';

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://placehold.co/200/eee/999?text=📦'">
      ${badgeHTML}
      <button class="wishlist-heart">${isInWishlist(product.id) ? '❤️' : '🤍'}</button>
      <button class="share-mini">📤</button>
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''} ${product.stock !== undefined ? '· Stock: ' + product.stock : ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      </div>
      ${product.mrp && product.mrp > product.price && product.unit ? `<div class="price-per-unit">₹${(product.price / extractWeight(product.unit)).toFixed(2)}/unit</div>` : ''}
      <button class="add-btn" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Out of Stock' : 'ADD'}</button>
      ${outOfStock ? '<div class="out-of-stock-overlay"><span class="out-of-stock-text">📦 Out of Stock</span></div>' : ''}
    `;

    // Click to product detail
    card.addEventListener('click', e => {
      if (!e.target.closest('button') && !outOfStock) {
        window.location.href = `/product.html?id=${product.id}`;
      }
    });

    // Add to cart
    if (!outOfStock) {
      card.querySelector('.add-btn').addEventListener('click', e => {
        e.stopPropagation();
        addToCart(product);
      });
    }

    // Wishlist toggle
    card.querySelector('.wishlist-heart').addEventListener('click', e => {
      e.stopPropagation();
      toggleWishlist(product, e.target);
    });

    // Share
    card.querySelector('.share-mini').addEventListener('click', e => {
      e.stopPropagation();
      shareProduct(product);
    });

    return card;
  }

  // ============================================
  // 14. CART SYSTEM
  // ============================================
  function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
  }

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      existing.quantity++;
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

    saveCart(cart);
    showToast(`${product.name} added!`, 'success');
  }

  function updateCartUI() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update cart badge
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = totalItems;

    // Update floating cart bar
    const bar = document.getElementById('floatingCartBar');
    if (totalItems > 0) {
      if (bar) bar.classList.add('visible');
      const countEl = document.getElementById('barCartCount');
      const totalEl = document.getElementById('barCartTotal');
      if (countEl) countEl.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
      if (totalEl) totalEl.textContent = '₹' + subtotal;
    } else {
      if (bar) bar.classList.remove('visible');
    }
  }

  // ============================================
  // 15. WISHLIST SYSTEM
  // ============================================
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
      if (heartElement) heartElement.textContent = '🤍';
    } else {
      wishlist.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      });
      if (heartElement) heartElement.textContent = '❤️';
    }

    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }

  // ============================================
  // 16. SHARE PRODUCT
  // ============================================
  function shareProduct(product) {
    const url = `${window.location.origin}/product.html?id=${product.id}`;

    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: url
      }).catch(() => {});
    } else {
      const message = `🛒 ${product.name}\n💰 ₹${product.price}\n\n${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  }

  // ============================================
  // 17. TOAST NOTIFICATION
  // ============================================
  function showToast(message, type = 'info') {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;

    toast.textContent = message;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.color = 'white';
    toast.classList.add('show');

    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // ============================================
  // 18. INITIALIZATION
  // ============================================
  function init() {
    updatePageUI();
    buildFilterChips();
    buildWeightFilters();
    buildSortDropdown();
    fetchProducts();
    updateCartUI();

    console.log(`✅ Category "${category}" page ready | Config: ${config.title}`);
  }

  // Start the app
  init();

})();
