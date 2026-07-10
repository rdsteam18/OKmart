// ===== OK Mart - Ice Cream Special Page (FIXED) =====
(function() {
  'use strict';
  
  var CART_KEY = 'okmart_cart';
  var WISHLIST_KEY = 'okmart_wishlist';
  var allIceCreams = [];
  
  // ========== LOAD PRODUCTS FROM FIREBASE ==========
  function loadIceCreams() {
    // First try: Query dairy category and filter by name client-side
    db.collection('products')
      .where('category', '==', 'dairy')
      .where('active', '!=', false)
      .get()
      .then(function(snapshot) {
        allIceCreams = [];
        
        snapshot.forEach(function(doc) {
          var product = doc.data();
          product.id = doc.id;
          
          // STRICT FILTER: Only products with "ice cream" in name
          var name = (product.name || '').toLowerCase();
          if (name.indexOf('ice cream') !== -1 || 
              name.indexOf('icecream') !== -1 || 
              name.indexOf('ice-cream') !== -1) {
            allIceCreams.push(product);
          }
        });
        
        console.log('🍦 Ice creams found in dairy:', allIceCreams.length);
        
        // If no ice creams found, try searching ALL products
        if (allIceCreams.length === 0) {
          return searchAllProducts();
        } else {
          renderAll();
        }
      })
      .catch(function(error) {
        console.error('Firebase error:', error);
        searchAllProducts();
      });
  }
  
  // ========== FALLBACK: Search all products ==========
  function searchAllProducts() {
    db.collection('products')
      .where('active', '!=', false)
      .get()
      .then(function(snapshot) {
        allIceCreams = [];
        
        snapshot.forEach(function(doc) {
          var product = doc.data();
          product.id = doc.id;
          
          var name = (product.name || '').toLowerCase();
          if (name.indexOf('ice cream') !== -1 || 
              name.indexOf('icecream') !== -1 || 
              name.indexOf('ice-cream') !== -1) {
            allIceCreams.push(product);
          }
        });
        
        console.log('🍦 Ice creams found in all products:', allIceCreams.length);
        
        // If STILL no ice creams, show empty state with demo
        if (allIceCreams.length === 0) {
          showEmptyState();
        } else {
          renderAll();
        }
      })
      .catch(function(error) {
        console.error('Search error:', error);
        showEmptyState();
      });
  }
  
  // ========== SHOW EMPTY STATE ==========
  function showEmptyState() {
    document.getElementById('loadingGrid').style.display = 'none';
    document.getElementById('productGrid').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('trendingSection').style.display = 'none';
    document.getElementById('productCount').textContent = '0 items';
    console.log('🍦 No ice cream products found in database');
  }
  
  // ========== RENDER ALL SECTIONS ==========
  function renderAll() {
    renderTrending();
    renderAllProducts();
    updateCartUI();
    
    // Hide loading
    document.getElementById('loadingGrid').style.display = 'none';
  }
  
  // ========== RENDER TRENDING (Popular Ice Creams) ==========
  function renderTrending() {
    var trending = allIceCreams.filter(function(p) { return p.popular === true; });
    
    // If no popular marked, use first 4
    if (trending.length === 0) {
      trending = allIceCreams.slice(0, 4);
    }
    
    var section = document.getElementById('trendingSection');
    var slider = document.getElementById('trendingSlider');
    
    if (trending.length > 0) {
      section.style.display = 'block';
      slider.innerHTML = '';
      trending.forEach(function(p) {
        slider.appendChild(createProductCard(p, true));
      });
    } else {
      section.style.display = 'none';
    }
  }
  
  // ========== RENDER ALL PRODUCTS GRID ==========
  function renderAllProducts() {
    var grid = document.getElementById('productGrid');
    var empty = document.getElementById('emptyState');
    
    document.getElementById('productCount').textContent = 
      allIceCreams.length + ' item' + (allIceCreams.length !== 1 ? 's' : '');
    
    if (allIceCreams.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    grid.style.display = 'grid';
    empty.style.display = 'none';
    grid.innerHTML = '';
    
    // Sort: popular first
    var sorted = allIceCreams.slice();
    sorted.sort(function(a, b) {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return 0;
    });
    
    sorted.forEach(function(p) {
      grid.appendChild(createProductCard(p, false));
    });
  }
  
  // ========== CREATE PRODUCT CARD ==========
  function createProductCard(product, isSlider) {
    var discount = product.mrp && product.mrp > product.price 
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
      : 0;
    
    var card = document.createElement('div');
    card.className = 'product-card';
    if (isSlider) {
      card.style.flex = '0 0 160px';
      card.style.scrollSnapAlign = 'start';
    }
    
    // Determine badge
    var badgeHTML = '';
    if (product.popular) {
      badgeHTML = '<span class="product-badge">🔥 Best Seller</span>';
    } else {
      badgeHTML = '<span class="cool-badge">❄️ Cool</span>';
    }
    
    // Build HTML
    var html = '';
    html += '<img src="' + product.image + '" alt="' + product.name + '" class="product-image" loading="lazy" onerror="this.src=\'https://placehold.co/200/fce4ec/f472b6?text=🍦\'">';
    html += badgeHTML;
    html += '<button class="wishlist-heart wishlist-btn">' + (isInWishlist(product.id) ? '❤️' : '🤍') + '</button>';
    html += '<h3 class="product-name">' + product.name + '</h3>';
    html += '<span class="product-unit">' + (product.unit || '') + '</span>';
    html += '<div class="price-row">';
    html += '<span class="current-price">₹' + product.price + '</span>';
    if (product.mrp && product.mrp > product.price) {
      html += '<span class="mrp-price">₹' + product.mrp + '</span>';
    }
    if (discount > 0) {
      html += '<span class="discount-badge">' + discount + '% OFF</span>';
    }
    html += '</div>';
    html += '<button class="add-btn add-cart-btn">ADD</button>';
    
    card.innerHTML = html;
    
    // Click to product detail page
    card.addEventListener('click', function(e) {
      if (!e.target.closest('button')) {
        window.location.href = '/product.html?id=' + product.id;
      }
    });
    
    // Add to cart button
    var addBtn = card.querySelector('.add-cart-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        addToCart(product);
        this.textContent = '✓ ADDED';
        this.classList.add('added');
        var self = this;
        setTimeout(function() {
          self.textContent = 'ADD';
          self.classList.remove('added');
        }, 1500);
      });
    }
    
    // Wishlist button
    var wishBtn = card.querySelector('.wishlist-btn');
    if (wishBtn) {
      wishBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleWishlist(product, this);
      });
    }
    
    return card;
  }
  
  // ========== CART SYSTEM ==========
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch(e) {
      return [];
    }
  }
  
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
  }
  
  function addToCart(product) {
    var cart = getCart();
    var existing = cart.find(function(i) { return i.id === product.id; });
    
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
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
    showToast('🍦 ' + product.name + ' added!', 'success');
  }
  
  function updateCartUI() {
    var cart = getCart();
    var totalItems = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0);
    var subtotal = cart.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)); }, 0);
    
    var badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = totalItems;
    
    var bar = document.getElementById('floatingCartBar');
    if (bar) {
      if (totalItems > 0) {
        bar.classList.add('visible');
        var countEl = document.getElementById('barCartCount');
        var totalEl = document.getElementById('barCartTotal');
        if (countEl) countEl.textContent = totalItems + ' item' + (totalItems !== 1 ? 's' : '');
        if (totalEl) totalEl.textContent = '₹' + subtotal;
      } else {
        bar.classList.remove('visible');
      }
    }
  }
  
  // ========== WISHLIST SYSTEM ==========
  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    } catch(e) {
      return [];
    }
  }
  
  function isInWishlist(id) {
    return getWishlist().some(function(i) { return i.id === id; });
  }
  
  function toggleWishlist(product, heartEl) {
    var wishlist = getWishlist();
    var index = wishlist.findIndex(function(i) { return i.id === product.id; });
    
    if (index > -1) {
      wishlist.splice(index, 1);
      if (heartEl) heartEl.textContent = '🤍';
    } else {
      wishlist.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      });
      if (heartEl) heartEl.textContent = '❤️';
    }
    
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }
  
  // ========== TOAST NOTIFICATION ==========
  function showToast(msg, type) {
    var toast = document.getElementById('toastMessage');
    if (!toast) return;
    
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.color = 'white';
    toast.classList.add('show');
    
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(function() {
      toast.classList.remove('show');
    }, 2500);
  }
  
  // ========== INIT ==========
  function init() {
    loadIceCreams();
    updateCartUI();
    console.log('🍦 Ice Cream Zone initialized');
  }
  
  init();
  
})();

