// ===== OK Mart - Product Detail Page (Enhanced) =====
(function() {
  'use strict';
  
  var CART_KEY = 'okmart_cart';
  var WISHLIST_KEY = 'okmart_wishlist';
  
  var product = null;
  var quantity = 1;
  var allProducts = [];
  
  // Get product ID from URL
  var params = new URLSearchParams(window.location.search);
  var productId = params.get('id');
  
  if (!productId) {
    showError();
  }
  
  // ========== DOM ELEMENTS ==========
  var loadingState = document.getElementById('loadingState');
  var productContent = document.getElementById('productContent');
  var errorState = document.getElementById('errorState');
  
  // ========== LOAD PRODUCT ==========
  async function loadProduct() {
    try {
      var doc = await db.collection('products').doc(productId).get();
      
      if (!doc.exists) {
        showError();
        return;
      }
      
      product = doc.data();
      product.id = doc.id;
      
      renderProduct();
      loadRelatedProducts();
      
      loadingState.style.display = 'none';
      productContent.style.display = 'block';
      document.getElementById('stickyBar').style.display = 'flex';
      
      // Update meta tags
      updateMetaTags();
      
      // Log view
      addToRecentlyViewed(product.id);
      
    } catch (err) {
      console.error('Error loading product:', err);
      showError();
    }
  }
  
  // ========== UPDATE META TAGS ==========
  function updateMetaTags() {
    document.title = product.name + ' | OK Mart';
    
    var shareUrl = window.location.href;
    document.getElementById('ogUrl').setAttribute('content', shareUrl);
    document.getElementById('ogTitle').setAttribute('content', product.name);
    document.getElementById('ogDescription').setAttribute('content', 'Buy ' + product.name + ' at OK Mart. Fast delivery in 12 minutes.');
    document.getElementById('ogImage').setAttribute('content', product.image);
  }
  
  // ========== RENDER PRODUCT ==========
  function renderProduct() {
    var discount = product.mrp && product.mrp > product.price 
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
      : 0;
    
    // Image
    document.getElementById('productImage').src = product.image;
    document.getElementById('productImage').alt = product.name;
    
    // Stock badge
    var stockBadge = document.getElementById('stockBadge');
    if (product.stock !== undefined && product.stock <= 0) {
      stockBadge.textContent = '📦 Out of Stock';
      stockBadge.style.background = '#ef4444';
    }
    
    // Name
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productUnit').textContent = product.unit || '';
    
    // Price
    document.getElementById('productPrice').textContent = '₹' + product.price;
    
    if (product.mrp && product.mrp > product.price) {
      document.getElementById('productMrp').textContent = '₹' + product.mrp;
      document.getElementById('discountBadge').textContent = discount + '% OFF';
      document.getElementById('discountBadge').style.display = 'inline-block';
      document.getElementById('savingsText').textContent = '🎉 You save ₹' + (product.mrp - product.price) + ' on this item';
      document.getElementById('savingsText').style.display = 'block';
    }
    
    // Description
    document.getElementById('productDescription').textContent = 
      product.description || 
      'Fresh and high-quality ' + product.name.toLowerCase() + ' sourced directly from trusted suppliers. Perfect for your daily needs.';
    
    // Highlights
    var highlights = [];
    if (product.unit) highlights.push(product.unit);
    if (product.category) highlights.push(product.category);
    if (product.popular) highlights.push('🔥 Popular');
    if (product.fresh) highlights.push('🌱 Fresh');
    if (product.stock && product.stock > 0) highlights.push('📦 In Stock');
    highlights.push('✓ Quality Assured');
    
    var highlightContainer = document.getElementById('descriptionHighlights');
    highlightContainer.innerHTML = highlights.map(function(h) {
      return '<span class="highlight-tag">' + h + '</span>';
    }).join('');
    
    // Sticky bar
    document.getElementById('stickyPrice').textContent = '₹' + product.price;
    if (product.mrp && product.mrp > product.price) {
      document.getElementById('stickyMrp').textContent = '₹' + product.mrp;
    }
    
    // Wishlist icon
    updateWishlistIcons();
    
    // Update total
    updateTotal();
  }
  
  // ========== LOAD RELATED PRODUCTS ==========
  async function loadRelatedProducts() {
    var slider = document.getElementById('relatedSlider');
    
    try {
      // Same category products
      var snapshot = await db.collection('products')
        .where('category', '==', product.category || 'dairy')
        .where('active', '!=', false)
        .limit(10)
        .get();
      
      slider.innerHTML = '';
      var count = 0;
      
      snapshot.forEach(function(doc) {
        if (doc.id !== product.id && count < 6) {
          var p = doc.data();
          p.id = doc.id;
          slider.appendChild(createMiniCard(p));
          count++;
        }
      });
      
      // If not enough related, add popular products
      if (count < 4) {
        var popularSnap = await db.collection('products')
          .where('popular', '==', true)
          .limit(6)
          .get();
        
        popularSnap.forEach(function(doc) {
          if (doc.id !== product.id && count < 6) {
            var exists = slider.querySelector('[data-id="' + doc.id + '"]');
            if (!exists) {
              var p = doc.data();
              p.id = doc.id;
              slider.appendChild(createMiniCard(p));
              count++;
            }
          }
        });
      }
    } catch (err) {
      slider.innerHTML = '<p style="color:var(--muted);padding:20px;">No related products</p>';
    }
  }
  
  // ========== CREATE MINI CARD ==========
  function createMiniCard(p) {
    var card = document.createElement('div');
    card.className = 'mini-card';
    card.setAttribute('data-id', p.id);
    card.innerHTML = 
      '<img src="' + p.image + '" alt="' + p.name + '" class="mini-card-image" loading="lazy" onerror="this.src=\'https://placehold.co/150/eee/999?text=🛒\'">' +
      '<div class="mini-card-name">' + p.name + '</div>' +
      '<div class="mini-card-price">₹' + p.price + '</div>' +
      '<button class="mini-add-btn">+ Add</button>';
    
    card.addEventListener('click', function(e) {
      if (!e.target.closest('button')) {
        window.location.href = '/product.html?id=' + p.id;
      }
    });
    
    card.querySelector('.mini-add-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      addToCartDirect(p);
    });
    
    return card;
  }
  
  // ========== UPDATE TOTAL ==========
  function updateTotal() {
    if (!product) return;
    var total = product.price * quantity;
    document.getElementById('btnTotal').textContent = '₹' + total;
    document.getElementById('stickyAddBtn').textContent = 'Add to Cart · ₹' + total;
  }
  
  // ========== UPDATE WISHLIST ICONS ==========
  function updateWishlistIcons() {
    var isInWishlist = checkWishlist(product.id);
    document.getElementById('headerWishlistIcon').textContent = isInWishlist ? '❤️' : '🤍';
    document.getElementById('wishlistIconLarge').textContent = isInWishlist ? '❤️' : '🤍';
  }
  
  // ========== CART SYSTEM ==========
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch(e) { return []; }
  }
  
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }
  
  function addToCart() {
    if (!product) return;
    var cart = getCart();
    var existing = cart.find(function(i) { return i.id === product.id; });
    
    if (existing) {
      existing.quantity = (existing.quantity || 1) + quantity;
    } else {
      cart.push({
        id: product.id, name: product.name, price: product.price,
        mrp: product.mrp, image: product.image, unit: product.unit,
        quantity: quantity
      });
    }
    
    saveCart(cart);
    showToast('🛒 ' + product.name + ' added to cart!', 'success');
    
    // Reset quantity
    quantity = 1;
    document.getElementById('qtyNumber').textContent = '1';
    updateTotal();
  }
  
  function addToCartDirect(p) {
    var cart = getCart();
    var existing = cart.find(function(i) { return i.id === p.id; });
    if (existing) existing.quantity = (existing.quantity || 1) + 1;
    else cart.push({ id: p.id, name: p.name, price: p.price, mrp: p.mrp, image: p.image, unit: p.unit, quantity: 1 });
    saveCart(cart);
    showToast('🛒 ' + p.name + ' added!', 'success');
  }
  
  function updateCartBadge() {
    var cart = getCart();
    var total = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0);
    document.getElementById('cartBadge').textContent = total;
  }
  
  // ========== WISHLIST ==========
  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch(e) { return []; }
  }
  
  function checkWishlist(id) {
    return getWishlist().some(function(i) { return i.id === id; });
  }
  
  function toggleWishlist() {
    if (!product) return;
    var wishlist = getWishlist();
    var index = wishlist.findIndex(function(i) { return i.id === product.id; });
    
    if (index > -1) {
      wishlist.splice(index, 1);
      showToast('Removed from wishlist');
    } else {
      wishlist.push({ id: product.id, name: product.name, price: product.price, image: product.image });
      showToast('❤️ Added to wishlist!', 'success');
    }
    
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    updateWishlistIcons();
  }
  
  // ========== RECENTLY VIEWED ==========
  function addToRecentlyViewed(id) {
    try {
      var recent = JSON.parse(localStorage.getItem('okmart_recent') || '[]');
      recent = recent.filter(function(i) { return i !== id; });
      recent.unshift(id);
      if (recent.length > 20) recent = recent.slice(0, 20);
      localStorage.setItem('okmart_recent', JSON.stringify(recent));
    } catch(e) {}
  }
  
  // ========== SHARE ==========
  function shareProduct() {
    if (!product) return;
    var url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, text: 'Check out ' + product.name + ' on OK Mart!', url: url }).catch(function() {});
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent('🛒 ' + product.name + '\n💰 ₹' + product.price + '\n\n' + url), '_blank');
    }
  }
  
  // ========== SHOW ERROR ==========
  function showError() {
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
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
  
  // ========== EVENT LISTENERS ==========
  document.getElementById('qtyMinus').addEventListener('click', function() {
    if (quantity > 1) { quantity--; document.getElementById('qtyNumber').textContent = quantity; updateTotal(); }
  });
  
  document.getElementById('qtyPlus').addEventListener('click', function() {
    quantity++; document.getElementById('qtyNumber').textContent = quantity; updateTotal();
  });
  
  document.getElementById('addToCartBtn').addEventListener('click', addToCart);
  document.getElementById('stickyAddBtn').addEventListener('click', addToCart);
  document.getElementById('buyNowBtn').addEventListener('click', function() {
    addToCart();
    setTimeout(function() { window.location.href = '/checkout.html'; }, 500);
  });
  
  document.getElementById('headerWishlistBtn').addEventListener('click', toggleWishlist);
  document.getElementById('wishlistBtnLarge').addEventListener('click', toggleWishlist);
  document.getElementById('headerShareBtn').addEventListener('click', shareProduct);
  
  // ========== INIT ==========
  loadProduct();
  updateCartBadge();
  console.log('✅ Product page ready');
})();
