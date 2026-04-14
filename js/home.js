// ===== OK MART - HOME.JS =====
// Dynamic home page with search, categories, quick order, popular sections, and category navigation grid

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const DAILY_ESSENTIALS_KEYWORDS = ['milk', 'bread', 'eggs', 'butter'];
  
  // Category display names
  const categoryDisplayNames = {
    'all': 'All',
    'dairy': '🥛 Dairy',
    'snacks': '🍿 Snacks',
    'grocery': '🧺 Grocery',
    'fruits': '🍎 Fruits',
    'vegetables': '🥕 Vegetables',
    'bakery': '🥐 Bakery',
    'beverages': '🥤 Beverages',
    'frozen': '❄️ Frozen'
  };
  
  // ---------- STATE ----------
  let allProducts = [];
  let filteredProducts = [];
  let activeCategory = 'all';
  let searchQuery = '';
  let searchTimeout;
  let suggestionsContainer;
  
  // DOM Elements
  const productGrid = document.getElementById('productGrid');
  const loadingState = document.getElementById('loadingState');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryContainer = document.getElementById('categoryFilterContainer');
  const resultsCount = document.getElementById('resultsCount');
  const activeFilterBadge = document.getElementById('activeFilterBadge');
  
  // ---------- CATEGORY NAVIGATION CONFIGURATION ----------
  const categoryConfig = {
    // Fruits & Vegetables Group
    fruitsVeg: [
      { id: 'fresh-fruits', name: 'Fresh Fruits', icon: '🍎', link: 'categories/fruits.html', count: 0 },
      { id: 'fresh-vegetables', name: 'Fresh Vegetables', icon: '🥕', link: 'categories/vegetables.html', count: 0 },
      { id: 'exotic-fruits', name: 'Exotic Fruits', icon: '🥝', link: 'categories/fruits.html', count: 0 },
      { id: 'cut-veggies', name: 'Cut Veggies', icon: '🥗', link: 'categories/vegetables.html', count: 0 }
    ],
    
    // Dairy & Bakery Group
    dairyBakery: [
      { id: 'milk', name: 'Milk', icon: '🥛', link: 'categories/dairy.html', count: 0 },
      { id: 'bread', name: 'Bread', icon: '🍞', link: 'categories/bakery.html', count: 0 },
      { id: 'eggs', name: 'Eggs', icon: '🥚', link: 'categories/dairy.html', count: 0 },
      { id: 'butter-cheese', name: 'Butter & Cheese', icon: '🧀', link: 'categories/dairy.html', count: 0 },
      { id: 'paneer-tofu', name: 'Paneer & Tofu', icon: '🧈', link: 'categories/dairy.html', count: 0 },
      { id: 'yogurt', name: 'Yogurt', icon: '🍶', link: 'categories/dairy.html', count: 0 },
      { id: 'bakery', name: 'Bakery', icon: '🥐', link: 'categories/bakery.html', count: 0 },
      { id: 'cakes', name: 'Cakes', icon: '🎂', link: 'categories/bakery.html', count: 0 }
    ],
    
    // Snacks & Packaged Foods
    snacksPackaged: [
      { id: 'chips', name: 'Chips & Crisps', icon: '🍟', link: 'categories/snacks.html', count: 0 },
      { id: 'biscuits', name: 'Biscuits', icon: '🍪', link: 'categories/snacks.html', count: 0 },
      { id: 'namkeen', name: 'Namkeen', icon: '🥨', link: 'categories/snacks.html', count: 0 },
      { id: 'chocolates', name: 'Chocolates', icon: '🍫', link: 'categories/snacks.html', count: 0 },
      { id: 'instant-noodles', name: 'Noodles', icon: '🍜', link: 'categories/snacks.html', count: 0 },
      { id: 'ready-to-eat', name: 'Ready to Eat', icon: '🍲', link: 'categories/snacks.html', count: 0 },
      { id: 'frozen-food', name: 'Frozen Food', icon: '❄️', link: 'categories/frozen.html', count: 0 },
      { id: 'ice-cream', name: 'Ice Cream', icon: '🍦', link: 'categories/frozen.html', count: 0 }
    ],
    
    // Grocery Staples
    groceryStaples: [
      { id: 'atta-flours', name: 'Atta & Flours', icon: '🌾', link: 'categories/grocery.html', count: 0 },
      { id: 'rice', name: 'Rice', icon: '🍚', link: 'categories/grocery.html', count: 0 },
      { id: 'dals-pulses', name: 'Dals & Pulses', icon: '🫘', link: 'categories/grocery.html', count: 0 },
      { id: 'oils-ghee', name: 'Oils & Ghee', icon: '🫒', link: 'categories/grocery.html', count: 0 },
      { id: 'spices', name: 'Spices', icon: '🌶️', link: 'categories/grocery.html', count: 0 },
      { id: 'salt-sugar', name: 'Salt & Sugar', icon: '🧂', link: 'categories/grocery.html', count: 0 },
      { id: 'dry-fruits', name: 'Dry Fruits', icon: '🥜', link: 'categories/dryfruits.html', count: 0 },
      { id: 'tea-coffee', name: 'Tea & Coffee', icon: '☕', link: 'categories/beverages.html', count: 0 }
    ]
  };
  
  // Keyword mapping for counting products
  const keywordMap = {
    'fresh-fruits': ['fruit', 'apple', 'banana', 'mango', 'grape', 'orange'],
    'fresh-vegetables': ['vegetable', 'potato', 'tomato', 'onion', 'carrot'],
    'exotic-fruits': ['kiwi', 'avocado', 'dragon', 'berry'],
    'cut-veggies': ['cut', 'chopped', 'peeled'],
    'milk': ['milk', 'dairy'],
    'bread': ['bread', 'bun', 'pav'],
    'eggs': ['egg'],
    'butter-cheese': ['butter', 'cheese'],
    'paneer-tofu': ['paneer', 'tofu'],
    'yogurt': ['yogurt', 'curd', 'dahi'],
    'bakery': ['cake', 'pastry', 'cookie', 'biscuit'],
    'cakes': ['cake', 'pastry'],
    'chips': ['chips', 'crisps', 'lays', 'kurkure'],
    'biscuits': ['biscuit', 'cookie', 'parle', 'britannia'],
    'namkeen': ['namkeen', 'bhujia', 'sev'],
    'chocolates': ['chocolate', 'candy', 'sweet'],
    'instant-noodles': ['noodle', 'maggie', 'pasta'],
    'ready-to-eat': ['ready', 'instant', 'meal'],
    'frozen-food': ['frozen', 'freeze'],
    'ice-cream': ['ice cream', 'icecream', 'kulfi'],
    'atta-flours': ['atta', 'flour', 'maida', 'wheat'],
    'rice': ['rice', 'basmati'],
    'dals-pulses': ['dal', 'pulse', 'lentil'],
    'oils-ghee': ['oil', 'ghee', 'sunflower'],
    'spices': ['spice', 'masala', 'turmeric', 'chilli'],
    'salt-sugar': ['salt', 'sugar'],
    'dry-fruits': ['dry fruit', 'almond', 'cashew', 'raisin'],
    'tea-coffee': ['tea', 'coffee', 'chai']
  };
  
  // ---------- HELPER FUNCTIONS ----------
  
  function filterProducts() {
    let filtered = [...allProducts];
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    
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
  
  function renderProducts() {
    filteredProducts = filterProducts();
    
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
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
      }
      
      productGrid.appendChild(card);
    });
  }
  
  function renderEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.innerHTML = `
      <div class="empty-state-icon">🔍</div>
      <h3>No products found</h3>
      <p>${searchQuery ? `No results for "${searchQuery}"` : 'No products in this category'}</p>
      <button class="reset-search-btn">Clear filters</button>
    `;
    
    emptyDiv.querySelector('.reset-search-btn').addEventListener('click', resetAllFilters);
    productGrid.appendChild(emptyDiv);
  }
  
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
  
  function renderCategoryFilters() {
    if (!categoryContainer) return;
    
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
        activeCategory = cat;
        
        document.querySelectorAll('.category-btn').forEach(b => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        
        renderProducts();
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      
      categoryContainer.appendChild(btn);
    });
  }
  
  function resetAllFilters() {
    activeCategory = 'all';
    searchQuery = '';
    
    if (searchInput) {
      searchInput.value = '';
    }
    
    if (clearSearchBtn) {
      clearSearchBtn.classList.remove('visible');
    }
    
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === 'all');
    });
    
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
    
    renderProducts();
  }
  
  // ---------- CATEGORY NAVIGATION FUNCTIONS ----------
  
  function updateCategoryCounts() {
    if (!allProducts || allProducts.length === 0) return;
    
    const countProducts = (keywords) => {
      return allProducts.filter(p => {
        const nameLower = p.name.toLowerCase();
        const catLower = p.category.toLowerCase();
        return keywords.some(kw => nameLower.includes(kw) || catLower.includes(kw));
      }).length;
    };
    
    // Update all category groups
    Object.keys(categoryConfig).forEach(groupKey => {
      categoryConfig[groupKey].forEach(cat => {
        const keywords = keywordMap[cat.id] || [cat.name.toLowerCase()];
        cat.count = countProducts(keywords);
      });
    });
  }
  
  function renderCategoryCard(category) {
    const card = document.createElement('a');
    card.href = category.link;
    card.className = 'category-card';
    card.setAttribute('data-category-id', category.id);
    
    card.innerHTML = `
      <div class="category-icon">
        <span>${category.icon}</span>
      </div>
      <div class="category-name">${category.name}</div>
      <div class="category-count">${category.count > 0 ? category.count + ' items' : 'Coming soon'}</div>
    `;
    
    return card;
  }
  
  function renderCategoryNavigation() {
    updateCategoryCounts();
    
    // Render Fruits & Vegetables
    const fruitsVegGrid = document.getElementById('fruitsVegGrid');
    if (fruitsVegGrid) {
      fruitsVegGrid.innerHTML = '';
      categoryConfig.fruitsVeg.forEach(cat => {
        fruitsVegGrid.appendChild(renderCategoryCard(cat));
      });
    }
    
    // Render Dairy & Bakery
    const dairyBakeryGrid = document.getElementById('dairyBakeryGrid');
    if (dairyBakeryGrid) {
      dairyBakeryGrid.innerHTML = '';
      categoryConfig.dairyBakery.slice(0, 8).forEach(cat => {
        dairyBakeryGrid.appendChild(renderCategoryCard(cat));
      });
    }
    
    // Render Snacks & Packaged
    const snacksPackagedGrid = document.getElementById('snacksPackagedGrid');
    if (snacksPackagedGrid) {
      snacksPackagedGrid.innerHTML = '';
      categoryConfig.snacksPackaged.slice(0, 8).forEach(cat => {
        snacksPackagedGrid.appendChild(renderCategoryCard(cat));
      });
    }
    
    // Render Grocery Staples
    const groceryStaplesGrid = document.getElementById('groceryStaplesGrid');
    if (groceryStaplesGrid) {
      groceryStaplesGrid.innerHTML = '';
      categoryConfig.groceryStaples.slice(0, 8).forEach(cat => {
        groceryStaplesGrid.appendChild(renderCategoryCard(cat));
      });
    }
  }
  
  // ---------- QUICK ORDER SECTION (DAILY ESSENTIALS) ----------
  
  function getDailyEssentials() {
    const essentials = [];
    const foundNames = new Set();
    
    allProducts.forEach(product => {
      const nameLower = product.name.toLowerCase();
      if (DAILY_ESSENTIALS_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
        if (!foundNames.has(product.name)) {
          essentials.push(product);
          foundNames.add(product.name);
        }
      }
    });
    
    if (essentials.length < 3) {
      allProducts
        .filter(p => p.popular && !foundNames.has(p.name))
        .slice(0, 3 - essentials.length)
        .forEach(p => {
          essentials.push(p);
          foundNames.add(p.name);
        });
    }
    
    return essentials.slice(0, 3);
  }
  
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
        
        addBtn.textContent = '✓ Added';
        addBtn.style.background = '#2ecc71';
        addBtn.style.color = 'white';
        
        setTimeout(() => {
          addBtn.textContent = '+ Add';
          addBtn.style.background = 'white';
          addBtn.style.color = '#27ae60';
        }, 1000);
      });
      
      quickGrid.appendChild(card);
    });
  }
  
  // ---------- POPULAR PRODUCTS SECTION ----------
  
  function renderPopularSection() {
    const popularProducts = allProducts.filter(p => p.popular === true);
    
    if (popularProducts.length === 0) return;
    
    let popularSection = document.getElementById('popularSection');
    
    if (!popularSection) {
      const mainContainer = document.querySelector('.home-main');
      const quickSection = document.querySelector('.quick-order-section');
      
      popularSection = document.createElement('section');
      popularSection.id = 'popularSection';
      popularSection.className = 'popular-section';
      popularSection.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">🔥 Trending Now</h2>
          <span class="popular-badge">Bestsellers</span>
        </div>
        <div class="popular-grid" id="popularGrid"></div>
      `;
      
      if (quickSection) {
        quickSection.insertAdjacentElement('afterend', popularSection);
      } else {
        const categorySection = document.querySelector('.category-filter-section');
        if (categorySection) {
          categorySection.insertAdjacentElement('beforebegin', popularSection);
        }
      }
    }
    
    const popularGrid = document.getElementById('popularGrid');
    if (popularGrid) {
      popularGrid.innerHTML = '';
      
      popularProducts.slice(0, 6).forEach(product => {
        const card = OKMart.renderProductCard(product);
        
        const badge = document.createElement('span');
        badge.className = 'popular-tag';
        badge.textContent = '🔥 Popular';
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
        
        popularGrid.appendChild(card);
      });
    }
  }
  
  // ---------- SMART SEARCH WITH SUGGESTIONS ----------
  
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
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      margin-top: 8px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 100;
      display: none;
      border: 1px solid #e2e8f0;
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
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background 0.15s;
      `;
      item.addEventListener('mouseenter', () => item.style.background = '#f7fdf9');
      item.addEventListener('mouseleave', () => item.style.background = 'white');
      
      if (suggestion.type === 'product') {
        item.innerHTML = `
          <span style="font-size:1.2rem">🛒</span>
          <div style="flex:1">
            <div style="font-weight:500">${suggestion.name}</div>
            <div style="font-size:0.75rem;color:#64748b">in ${suggestion.category}</div>
          </div>
        `;
        item.addEventListener('click', () => {
          searchInput.value = suggestion.name;
          searchQuery = suggestion.name;
          clearSearchBtn?.classList.add('visible');
          renderProducts();
          container.style.display = 'none';
        });
      } else {
        item.innerHTML = `
          <span style="font-size:1.2rem">📁</span>
          <div style="flex:1">
            <div style="font-weight:500">${suggestion.displayName}</div>
            <div style="font-size:0.75rem;color:#64748b">Category</div>
          </div>
        `;
        item.addEventListener('click', () => {
          activeCategory = suggestion.name;
          searchQuery = '';
          searchInput.value = '';
          clearSearchBtn?.classList.remove('visible');
          
          document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === suggestion.name);
          });
          
          renderProducts();
          container.style.display = 'none';
        });
      }
      
      container.appendChild(item);
    });
    
    container.style.display = 'block';
  }
  
  // ---------- EVENT LISTENERS ----------
  
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
    
    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        const container = document.getElementById('searchSuggestions');
        if (container) container.style.display = 'none';
      }, 200);
    });
    
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.length >= 2) {
        const suggestions = getSearchSuggestions(searchInput.value);
        renderSuggestions(suggestions);
      }
    });
    
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const container = document.getElementById('searchSuggestions');
        if (container) container.style.display = 'none';
      }
    });
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearSearchBtn.classList.remove('visible');
      
      const container = document.getElementById('searchSuggestions');
      if (container) container.style.display = 'none';
      
      renderProducts();
    });
  }
  
  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      const container = document.getElementById('searchSuggestions');
      if (container) container.style.display = 'none';
    }
  });
  
  // ---------- ADD STYLES ----------
  
  function addHomeStyles() {
    // Check if styles already exist
    if (document.getElementById('homeDynamicStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'homeDynamicStyles';
    style.textContent = `
      /* Category Navigation Grid */
      .category-nav-section {
        padding: 8px 0;
        background: #f7fdf9;
      }
      
      .category-group {
        background: white;
        margin-bottom: 12px;
        padding: 16px 0 8px;
        border-radius: 20px 20px 0 0;
      }
      
      .group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px 12px;
      }
      
      .group-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1e2a2e;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .view-all-link {
        color: #2ecc71;
        font-size: 0.85rem;
        font-weight: 600;
        text-decoration: none;
        padding: 6px 12px;
        background: rgba(46, 204, 113, 0.1);
        border-radius: 40px;
        transition: all 0.2s;
      }
      
      .view-all-link:hover {
        background: rgba(46, 204, 113, 0.2);
      }
      
      .view-all-link:active {
        transform: scale(0.95);
      }
      
      .category-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        padding: 0 12px;
      }
      
      .category-card {
        background: #f7fdf9;
        border-radius: 12px;
        padding: 12px 6px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid #e2e8f0;
        text-decoration: none;
        display: block;
        -webkit-tap-highlight-color: transparent;
      }
      
      .category-card:hover {
        background: white;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
        border-color: #2ecc71;
      }
      
      .category-card:active {
        transform: scale(0.95);
        background: #e8f5e9;
      }
      
      .category-icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 8px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        transition: all 0.2s;
      }
      
      .category-card:hover .category-icon {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        background: #2ecc71;
      }
      
      .category-card:hover .category-icon span {
        filter: brightness(0) invert(1);
      }
      
      .category-icon span {
        font-size: 28px;
        transition: filter 0.2s;
      }
      
      .category-name {
        font-size: 0.75rem;
        font-weight: 600;
        color: #1e2a2e;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-bottom: 2px;
      }
      
      .category-count {
        font-size: 0.65rem;
        color: #64748b;
        font-weight: 400;
      }
      
      /* Quick Order Section */
      .quick-order-section {
        padding: 8px 16px 16px;
        background: white;
        margin: 8px 0;
        border-radius: 20px 20px 0 0;
      }
      
      .quick-order-section .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      
      .quick-badge {
        background: #2ecc71;
        color: white;
        padding: 4px 12px;
        border-radius: 40px;
        font-size: 0.7rem;
        font-weight: 600;
      }
      
      .quick-order-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      
      .quick-item-card {
        background: #f7fdf9;
        border-radius: 16px;
        padding: 12px 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid #e2e8f0;
      }
      
      .quick-item-card:active {
        transform: scale(0.95);
        background: #e8f5e9;
      }
      
      .quick-item-image {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 12px;
        margin-bottom: 8px;
        background: white;
      }
      
      .quick-item-name {
        font-weight: 600;
        font-size: 0.85rem;
        margin-bottom: 4px;
      }
      
      .quick-item-price {
        font-weight: 700;
        font-size: 0.9rem;
        color: #27ae60;
        margin-bottom: 8px;
      }
      
      .quick-add-btn {
        background: white;
        border: 1.5px solid #2ecc71;
        color: #27ae60;
        padding: 6px 12px;
        border-radius: 40px;
        font-weight: 600;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
      }
      
      /* Popular Section */
      .popular-section {
        padding: 16px 0;
        background: white;
        margin: 8px 0;
        border-radius: 20px 20px 0 0;
      }
      
      .popular-section .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px 12px;
      }
      
      .popular-badge {
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        color: white;
        padding: 4px 12px;
        border-radius: 40px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      
      .popular-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        padding: 8px 16px;
      }
      
      .popular-tag {
        position: absolute;
        top: 8px;
        left: 8px;
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        color: white;
        padding: 4px 10px;
        border-radius: 40px;
        font-size: 0.65rem;
        font-weight: 600;
        z-index: 2;
      }
      
      /* Hide horizontal category filter */
      .category-filter-section {
        display: none;
      }
      
      /* Floating Call Button */
      .floating-call-btn {
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 56px;
        height: 56px;
        background: #25D366;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3);
        z-index: 150;
        transition: all 0.3s;
        text-decoration: none;
        animation: pulse-call 2s infinite;
      }
      
      .floating-call-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 28px rgba(37, 211, 102, 0.4);
      }
      
      .floating-call-btn:active {
        transform: scale(0.95);
      }
      
      .call-icon {
        font-size: 28px;
      }
      
      @keyframes pulse-call {
        0%, 100% {
          box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3);
        }
        50% {
          box-shadow: 0 8px 30px rgba(37, 211, 102, 0.5);
        }
      }
      
      /* Responsive */
      @media (min-width: 600px) {
        .category-grid {
          grid-template-columns: repeat(5, 1fr);
          max-width: 800px;
          margin: 0 auto;
        }
        
        .category-icon {
          width: 64px;
          height: 64px;
          font-size: 32px;
        }
        
        .category-name {
          font-size: 0.8rem;
        }
        
        .quick-order-grid {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .popular-grid {
          grid-template-columns: repeat(3, 1fr);
          max-width: 1200px;
          margin: 0 auto;
        }
      }
      
      @media (min-width: 900px) {
        .category-grid {
          grid-template-columns: repeat(6, 1fr);
          max-width: 1000px;
        }
        
        .category-group {
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }
      }
      
      @media (min-width: 1024px) {
        .popular-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
      
      @media (max-width: 640px) {
        .sticky-cart-bar.visible ~ .floating-call-btn {
          bottom: 100px;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // ---------- INITIALIZATION ----------
  
  async function init() {
    try {
      if (loadingState) {
        loadingState.style.display = 'flex';
      }
      
      // Fetch products
      allProducts = await OKMart.getProducts();
      
      if (!allProducts.length) {
        throw new Error('No products loaded');
      }
      
      // Add styles
      addHomeStyles();
      
      // Render all sections in correct order
      renderCategoryNavigation();  // Category navigation grid (NEW)
      renderCategoryFilters();     // Original horizontal filter (hidden by CSS)
      renderQuickOrder();          // Daily essentials
      renderPopularSection();      // Popular products
      renderProducts();            // Main product grid
      
      // Preload images for better performance
      allProducts.slice(0, 12).forEach(p => {
        const img = new Image();
        img.src = p.image;
      });
      
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
  
  // Expose for debugging
  window.OKMartHome = {
    resetFilters: resetAllFilters,
    getState: () => ({ 
      activeCategory, 
      searchQuery, 
      productCount: filteredProducts.length,
      allProductsCount: allProducts.length
    }),
    refresh: init
  };
  
})();

// Add to home.js - Search input Enter key handler
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `search.html?query=${encodeURIComponent(query)}`;
      }
    }
  });
}
