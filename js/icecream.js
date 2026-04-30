// ===== OK Mart - Ice Cream Special Page =====
(function() {
  'use strict';
  
  var CART_KEY = 'okmart_cart';
  var WISHLIST_KEY = 'okmart_wishlist';
  var allIceCreams = [];
  
  // ========== LOAD PRODUCTS FROM FIREBASE ==========
  function loadIceCreams() {
    db.collection('products')
      .where('category', '==', 'dairy')
      .where('active', '!=', false)
      .get()
      .then(function(snapshot) {
        allIceCreams = [];
        
        snapshot.forEach(function(doc) {
          var product = doc.data();
          product.id = doc.id;
          
          // Filter: Only products with "ice cream" in name
          var name = (product.name || '').toLowerCase();
          if (name.includes('ice cream') || name.includes('icecream') || name.includes('ice-cream')) {
            allIceCreams.push(product);
          }
        });
        
        console.log('🍦 Ice creams found:', allIceCreams.length);
        
        if (allIceCreams.length === 0) {
          // If no real ice cream products, create demo ones for visual appeal
          createDemoIceCreams();
        }
        
        renderAll();
        
      })
      .catch(function(error) {
        console.error('Firebase error:', error);
        // Create demo ice creams on error
        createDemoIceCreams();
        renderAll();
      });
  }
  
  // ========== CREATE DEMO ICE CREAMS (IF NONE IN DATABASE) ==========
  function createDemoIceCreams() {
    allIceCreams = [
      {
        id: 'ice-demo-1',
        name: 'Vanilla Ice Cream',
        price: 60,
        mrp: 80,
        image: 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg?auto=compress&cs=tinysrgb&w=200',
        unit: '100 ml',
        popular: true,
        cool: true
      },
      {
        id: 'ice-demo-2',
        name: 'Chocolate Ice Cream',
        price: 70,
        mrp: 90,
        image: 'https://images.pexels.com/photos/3026804/pexels-photo-3026804.jpeg?auto=compress&cs=tinysrgb&w=200',
        unit: '100 ml',
        popular: true,
        cool: true
      },
      {
        id: 'ice-demo-3',
        name: 'Strawberry Ice Cream',
        price: 65,
        mrp: 85,
        image: 'https://images.pexels.com/photos/26162/pexels-photo-26162.jpg?auto=compress&cs=tinysrgb&w=200',
        unit: '100 ml',
        popular: false,
        cool: true
      },
      {
        id: 'ice-demo-4',
        name: 'Mango Ice Cream',
        price: 55,
        mrp: 75,
        image: 'https://images.pexels.com/photos/2161645/pexels-photo-2161645.jpeg?auto=compress&cs=tinysrgb&w=200',
        unit: '100 ml',
        popular: true,
        cool: true
      },
      {
        id: 'ice-demo-5',
        name: 'Butterscotch Ice Cream',
        price: 75,
        mrp: 95,
        image: 'https://images.pexels.com/photos/5947107/pexels-photo-5947107.jpeg?auto=compress&cs=tinysrgb&w=200',
        unit: '100 ml',
        popular: false,
        cool: false
      },
      {
        id: 'ice-demo-6',
        name: 'Kulfi Ice Cream',
        price: 40,
        mrp: 55,
        image: 'https://images.pexels.com/photos/5560663/pexels-photo-5560663.jpeg?auto=compress&cs=tinysrgb&w=200',
        unit: '80 ml',
        popular: true,
        cool: false
      }
    ];
  }
  
  // ========== RENDER ALL SECTIONS ==========
  function renderAll() {
    renderTrending();
    renderAllProducts();
    updateCartUI();
    
    // Hide loading
    document.getElementById('loadingGrid').style.display = 'none';
  }
  
  // ========== RENDER TRENDING ==========
  function renderTrending() {
    var trending = allIceCreams.filter(function(p) { return p.popular; }).slice(0, 4);
    var section = document.getElementById('trendingSection');
    var slider = document.getElementById('trendingSlider');
    
    if (trending.length > 0) {
      section.style.display = 'block';
      slider.innerHTML = '';
      trending.forEach(function(p) {
        slider.appendChild(createProductCard(p, true));
      });
    }
  }
  
  // ========== RENDER ALL PRODUCTS ==========
  function renderAllProducts() {
    var grid = document.getElementById('productGrid');
    var empty = document.getElementById('emptyState');
    
    document.getElementById('productCount').textContent = allIceCreams.length + ' item' + (allIceCreams.length !== 1 ? 's' : '');
    
    if (allIceCreams.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    grid.style.display = 'grid';
    empty.style.display = 'none';
    grid.innerHTML = '';
    
    allIceCreams.forEach(function(p) {
      grid.appendChild(createProductCard(p, false));
    });
  }
  
  // ========== CREATE PRODUCT CARD ==========
  function createProductCard(product, isSlider) {
    var discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    var card = document.createElement('div');
    card.className = 'product-card';
    if (isSlider) card.style.flex = '0 0 160px';
    
    // Determine badge
    var badgeHTML = '';
    if (product.cool) badgeHTML = '<span class="cool-badge">❄️ Cool</span>';
    else if (product.popular) badgeHTML = '<span class="product-badge">🔥 Best Seller</span>';
    
    card.innerHTML = 
      '<img src="' + product.image + '" alt="' + product.name + '" class="product-image" loading="lazy" onerror="this.src=\'https://placehold.co/200/fce4ec/f472b6?text=🍦\'">' +
      badgeHTML +
      '<button class="wishlist-heart">' + (isInWishlist(product.id) ? '❤️' : '🤍') + '</button>' +
      '<h3 class="product-name">' + product.name + '</h3>' +
      '<span class="product-unit">' + (product.unit || '') + '</span>' +
      '<div class="price-row">' +
        '<span class="current-price">₹' + product.price + '</span>' +
        (product.mrp && product.mrp > product.price ? '<span class="mrp-price">₹' + product.mrp + '</span>' : '') +
        (discount > 0 ? '<span class="discount-badge">' + discount + '% OFF</span>' : '') +
      '</div>' +
      '<button class="add-btn">ADD</button>';
    
    // Click to product detail
    card.addEventListener('click', function(e) {
      if (!e.target.closest('button')) {
        window.location.href = '/product.html?id=' + product.id;
      }
    });
    
    // Add to cart
    card.querySelector('.add-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      addToCart(product);
      this.textContent = '✓ ADDED';
      this.classList.add('added');
      setTimeout(function() {
        this.textContent = 'ADD';
        this.classList.remove('added');
      }.bind(this), 1500);
    });
    
    // Wishlist
    card.querySelector('.wishlist-heart').addEventListener('click', function(e) {
      e.stopPropagation();
      toggleWishlist(product, this);
    });
    
    return card;
  }
  
  // ========== CART SYSTEM ==========
  function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartUI(); }
  
  function addToCart(product) {
    var cart = getCart();
    var existing = cart.find(function(i) { return i.id === product.id; });
    if (existing) existing.quantity++;
    else cart.push({ id: product.id, name: product.name, price: product.price, mrp: product.mrp, image: product.image, unit: product.unit, quantity: 1 });
    saveCart(cart);
    showToast('🍦 ' + product.name + ' added!', 'success');
  }
  
  function updateCartUI() {
    var cart = getCart();
    var total = cart.reduce(function(s, i) { return s + i.quantity; }, 0);
    var subtotal = cart.reduce(function(s, i) { return s + (i.price * i.quantity); }, 0);
    
    var badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = total;
    
    var bar = document.getElementById('floatingCartBar');
    if (total > 0) {
      bar.classList.add('visible');
      document.getElementById('barCartCount').textContent = total + ' item' + (total !== 1 ? 's' : '');
      document.getElementById('barCartTotal').textContent = '₹' + subtotal;
    } else {
      bar.classList.remove('visible');
    }
  }
  
  // ========== WISHLIST ==========
  function getWishlist() { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); }
  function isInWishlist(id) { return getWishlist().some(function(i) { return i.id === id; }); }
  
  function toggleWishlist(product, heartEl) {
    var wishlist = getWishlist();
    var index = wishlist.findIndex(function(i) { return i.id === product.id; });
    if (index > -1) { wishlist.splice(index, 1); heartEl.textContent = '🤍'; }
    else { wishlist.push({ id: product.id, name: product.name, price: product.price, image: product.image }); heartEl.textContent = '❤️'; }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }
  
  // ========== TOAST ==========
  function showToast(msg, type) {
    var toast = document.getElementById('toastMessage');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.color = 'white';
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2500);
  }
  
  // ========== INIT ==========
  loadIceCreams();
  updateCartUI();
  console.log('🍦 Ice Cream Zone ready!');
})();
