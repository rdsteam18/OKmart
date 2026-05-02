// ===== OK Mart - Premium Home.js =====
// Firebase-powered dynamic home page with category sections, banners, cart & wishlist

(function() {
  'use strict';
  
  // ============================================
  // 1. CONSTANTS & CONFIGURATION
  // ============================================
  var CART_KEY = 'okmart_cart';
  var WISHLIST_KEY = 'okmart_wishlist';
  var RECENT_KEY = 'okmart_recent';
  
  // Category configuration with display names, icons, and slugs
  var CATEGORIES = [
    { id: 'dairy',       name: 'Dairy & Eggs',       icon: '🥛', slug: 'dairy' },
    { id: 'fruits',      name: 'Fresh Fruits',       icon: '🍎', slug: 'fruits' },
    { id: 'vegetables',  name: 'Vegetables',          icon: '🥬', slug: 'vegetables' },
    { id: 'snacks',      name: 'Snacks & Munchies',   icon: '🍿', slug: 'snacks' },
    { id: 'beverages',   name: 'Beverages',           icon: '🥤', slug: 'beverages' },
    { id: 'electronics', name: 'Electronics',         icon: '📱', slug: 'electronics' },
    { id: 'grocery',     name: 'Grocery Staples',     icon: '🧺', slug: 'grocery' },
    { id: 'bakery',      name: 'Bakery & Fresh',      icon: '🥐', slug: 'bakery' },
    { id: 'personal',    name: 'Personal Care',       icon: '🧴', slug: 'personal-care' },
    { id: 'household',   name: 'Household',           icon: '🧹', slug: 'household' }
  ];
  
  // ============================================
  // 2. STATE VARIABLES
  // ============================================
  var allProducts = [];
  var bannerIndex = 0;
  var bannerInterval;
  
  // ============================================
  // 3. DOM ELEMENT REFERENCES
  // ============================================
  var categoryGrid = document.getElementById('categoryGrid');
  var categorySections = document.getElementById('categorySections');
  var bannerTrack = document.getElementById('bannerTrack');
  var bannerDots = document.getElementById('bannerDots');
  var bestsellerSection = document.getElementById('bestsellerSection');
  var bestsellerGrid = document.getElementById('bestsellerGrid');
  var cartBadge = document.getElementById('cartBadge');
  var floatingCartBar = document.getElementById('floatingCartBar');
  var barCartCount = document.getElementById('barCartCount');
  var barCartTotal = document.getElementById('barCartTotal');
  var toastMessage = document.getElementById('toastMessage');
  
  // ============================================
  // 4. LOAD ALL DATA FROM FIREBASE
  // ============================================
  function loadAllData() {
    // Load products (only active ones)
    db.collection('products')
      .where('active', '!=', false)
      .onSnapshot(function(snapshot) {
        allProducts = [];
        snapshot.forEach(function(doc) {
          allProducts.push({ id: doc.id, data: doc.data() });
        });
        
        console.log('📦 Products loaded:', allProducts.length);
        
        // Render all sections
        renderCategoryGrid();
        renderAllCategorySections();
        renderBestSellers();
      }, function(error) {
        console.error('Products error:', error);
      });
    
    // Load banners for home page
    db.collection('banners')
      .where('active', '==', true)
      .where('page', '==', 'home')
      .onSnapshot(function(snapshot) {
        var banners = [];
        snapshot.forEach(function(doc) {
          banners.push({ id: doc.id, data: doc.data() });
        });
        
        if (banners.length === 0) {
          // Default banners if none in database
          banners = [
            { data: { image: 'https://images.pexels.com/photos/5650026/pexels-photo-5650026.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' } },
            { data: { image: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' } },
            { data: { image: 'https://images.pexels.com/photos/1639556/pexels-photo-1639556.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' } }
          ];
        }
        
        renderBanners(banners);
      });
  }
  
  // ============================================
  // 5. RENDER BANNER CAROUSEL
  // ============================================
  function renderBanners(banners) {
    if (!bannerTrack) return;
    
    // Build banner slides
    bannerTrack.innerHTML = '';
    banners.forEach(function(b, i) {
      var slide = document.createElement('div');
      slide.className = 'banner-slide';
      slide.innerHTML = '<a href="' + (b.data.link || '/offers.html') + '">' +
        '<img src="' + b.data.image + '" alt="' + (b.data.title || 'Offer') + '" ' +
        'loading="' + (i === 0 ? 'eager' : 'lazy') + '" ' +
        'onerror="this.src=\'https://placehold.co/600x150/2ecc71/white?text=Special+Offer\'">' +
        '</a>';
      bannerTrack.appendChild(slide);
    });
    
    // Build dots
    if (bannerDots) {
      bannerDots.innerHTML = '';
      banners.forEach(function(_, i) {
        var dot = document.createElement('span');
        dot.className = 'banner-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', function() {
          goToBanner(i);
        });
        bannerDots.appendChild(dot);
      });
    }
    
    // Start auto-slide if more than 1 banner
    if (banners.length > 1) {
      startAutoSlide(banners.length);
    }
    
    // Touch swipe support
    setupBannerSwipe(banners.length);
  }
  
  function startAutoSlide(total) {
    clearInterval(bannerInterval);
    bannerInterval = setInterval(function() {
      bannerIndex = (bannerIndex + 1) % total;
      updateBannerPosition(total);
    }, 3500);
  }
  
  function goToBanner(index) {
    bannerIndex = index;
    var total = document.querySelectorAll('.banner-slide').length;
    updateBannerPosition(total);
  }
  
  function updateBannerPosition(total) {
    if (bannerTrack) {
      bannerTrack.style.transform = 'translateX(-' + (bannerIndex * 100) + '%)';
    }
    // Update dots
    var dots = document.querySelectorAll('.banner-dot');
    dots.forEach(function(d, i) {
      d.classList.toggle('active', i === bannerIndex);
    });
  }
  
  function setupBannerSwipe(total) {
    var startX = 0;
    if (bannerTrack) {
      bannerTrack.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
      }, { passive: true });
      
      bannerTrack.addEventListener('touchend', function(e) {
        var diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            bannerIndex = (bannerIndex + 1) % total;
          } else {
            bannerIndex = (bannerIndex - 1 + total) % total;
          }
          updateBannerPosition(total);
        }
      });
    }
  }
  
  // Expose for HTML onclick
  window.goBanner = goToBanner;
  
  // ============================================
  // 6. RENDER CATEGORY GRID
  // ============================================
  function renderCategoryGrid() {
    if (!categoryGrid) return;
    
    categoryGrid.innerHTML = '';
    
    CATEGORIES.forEach(function(cat) {
      var card = document.createElement('a');
      card.className = 'category-card';
      card.href = '/categories/' + cat.slug + '.html';
      card.innerHTML = '<span class="category-icon">' + cat.icon + '</span>' +
                       '<span class="category-name">' + cat.name + '</span>';
      categoryGrid.appendChild(card);
    });
    
    // Add Offers card
    var offersCard = document.createElement('a');
    offersCard.className = 'category-card highlight';
    offersCard.href = '/offers.html';
    offersCard.innerHTML = '<span class="category-icon">🏷️</span>' +
                           '<span class="category-name">Offers</span>';
    categoryGrid.appendChild(offersCard);
  }
  
  // ============================================
  // 7. RENDER CATEGORY-WISE PRODUCT SECTIONS
  // ============================================
  function renderAllCategorySections() {
    if (!categorySections) return;
    
    categorySections.innerHTML = '';
    
    CATEGORIES.forEach(function(cat) {
      // Get products for this category (max 10)
      var products = allProducts
        .filter(function(p) { return p.data.category === cat.id; })
        .slice(0, 10);
      
      // Skip empty categories
      if (products.length === 0) return;
      
      // Create section
      var section = document.createElement('section');
      section.className = 'product-section';
      section.id = 'cat-' + cat.id;
      
      // Section header
      var header = document.createElement('div');
      header.className = 'section-header-row';
      header.innerHTML = '<h2 class="section-heading">' + cat.icon + ' ' + cat.name + '</h2>' +
                         '<a href="/categories/' + cat.slug + '.html" class="view-all-btn">View All →</a>';
      section.appendChild(header);
      
      // Product slider
      var slider = document.createElement('div');
      slider.className = 'product-slider';
      
      products.forEach(function(p) {
        slider.appendChild(createProductCard(p.data, p.id));
      });
      
      section.appendChild(slider);
      categorySections.appendChild(section);
    });
  }
  
  // ============================================
  // 8. RENDER BEST SELLERS
  // ============================================
  function renderBestSellers() {
    if (!bestsellerSection || !bestsellerGrid) return;
    
    var popular = allProducts
      .filter(function(p) { return p.data.popular === true; })
      .slice(0, 6);
    
    if (popular.length === 0) {
      bestsellerSection.style.display = 'none';
      return;
    }
    
    bestsellerSection.style.display = 'block';
    bestsellerGrid.innerHTML = '';
    
    popular.forEach(function(p) {
      var card = createProductCard(p.data, p.id, true);
      card.style.flex = 'unset';
      bestsellerGrid.appendChild(card);
    });
  }
  
  // ============================================
  // 9. CREATE PRODUCT CARD
  // ============================================
  function createProductCard(product, productId, isGrid) {
    var discount = product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
    
    var card = document.createElement('div');
    card.className = 'product-card';
    if (isGrid) card.style.flex = 'unset';
    
    // Build HTML
    var html = '';
    
    // Image
    html += '<img src="' + product.image + '" alt="' + product.name + '" class="product-image" loading="lazy" onerror="this.src=\'https://placehold.co/200/eee/999?text=🛒\'">';
    
    // Badge
    if (product.fresh) {
      html += '<span class="product-badge" style="background:linear-gradient(135deg,#f59e0b,#d97706);">🌱 Fresh</span>';
    } else if (product.popular) {
      html += '<span class="product-badge">🔥</span>';
    }
    
    // Wishlist & Share buttons
    html += '<button class="wishlist-heart wishlist-btn">' + (isInWishlist(productId) ? '❤️' : '🤍') + '</button>';
    html += '<button class="share-mini share-btn">📤</button>';
    
    // Name
    html += '<h3 class="product-name">' + product.name + '</h3>';
    
    // Unit
    html += '<span class="product-unit">' + (product.unit || '') + '</span>';
    
    // Price row
    html += '<div class="price-row">';
    html += '<span class="current-price">₹' + product.price + '</span>';
    if (product.mrp && product.mrp > product.price) {
      html += '<span class="mrp-price">₹' + product.mrp + '</span>';
    }
    if (discount > 0) {
      html += '<span class="discount-badge">' + discount + '% OFF</span>';
    }
    html += '</div>';
    
    // Add button
    html += '<button class="add-btn add-cart-btn">ADD</button>';
    
    card.innerHTML = html;
    
    // ========== EVENT LISTENERS ==========
    
    // Click card → product detail
    card.addEventListener('click', function(e) {
      if (!e.target.closest('button')) {
        window.location.href = '/product.html?id=' + productId;
      }
    });
    
    // Add to cart
    var addBtn = card.querySelector('.add-cart-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        addToCart(product, productId);
      });
    }
    
    // Wishlist toggle
    var wishBtn = card.querySelector('.wishlist-btn');
    if (wishBtn) {
      wishBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleWishlist(product, productId, wishBtn);
      });
    }
    
    // Share
    var shareBtn = card.querySelector('.share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        shareProduct(product, productId);
      });
    }
    
    return card;
  }
  
  // ============================================
  // 10. CART SYSTEM
  // ============================================
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
  
  function addToCart(product, productId) {
    var cart = getCart();
    var existing = cart.find(function(i) { return i.id === productId; });
    
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: productId,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        unit: product.unit,
        quantity: 1
      });
    }
    
    saveCart(cart);
    showToast('🛒 ' + product.name + ' added!', 'success');
  }
  
  function updateCartUI() {
    var cart = getCart();
    var totalItems = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0);
    var subtotal = cart.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)); }, 0);
    
    // Update badge
    if (cartBadge) {
      cartBadge.textContent = totalItems;
    }
    
    // Update floating cart bar
    if (floatingCartBar) {
      if (totalItems > 0) {
        floatingCartBar.classList.add('visible');
        if (barCartCount) barCartCount.textContent = totalItems + ' item' + (totalItems !== 1 ? 's' : '');
        if (barCartTotal) barCartTotal.textContent = '₹' + subtotal;
      } else {
        floatingCartBar.classList.remove('visible');
      }
    }
  }
  
  // ============================================
  // 11. WISHLIST SYSTEM
  // ============================================
  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    } catch(e) {
      return [];
    }
  }
  
  function isInWishlist(productId) {
    return getWishlist().some(function(i) { return i.id === productId; });
  }
  
  function toggleWishlist(product, productId, heartEl) {
    var wishlist = getWishlist();
    var index = wishlist.findIndex(function(i) { return i.id === productId; });
    
    if (index > -1) {
      wishlist.splice(index, 1);
      if (heartEl) heartEl.textContent = '🤍';
    } else {
      wishlist.push({
        id: productId,
        name: product.name,
        price: product.price,
        image: product.image
      });
      if (heartEl) heartEl.textContent = '❤️';
    }
    
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }
  
  // ============================================
  // 12. SHARE PRODUCT
  // ============================================
  function shareProduct(product, productId) {
    var url = window.location.origin + '/product.html?id=' + productId;
    
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: url
      }).catch(function() {});
    } else {
      var message = '🛒 ' + product.name + '\n💰 ₹' + product.price + '\n\n' + url;
      window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank');
    }
  }
  
  // ============================================
  // 13. TOAST NOTIFICATION
  // ============================================
  function showToast(message, type) {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toastMessage.style.color = 'white';
    toastMessage.classList.add('show');
    
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(function() {
      toastMessage.classList.remove('show');
    }, 2500);
  }
  
  // ============================================
  // 14. BACK TO TOP BUTTON
  // ============================================
  var backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 500) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });
    
    backToTopBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  // ============================================
  // 15. SEARCH BAR
  // ============================================
  var searchBar = document.querySelector('.search-bar');
  if (searchBar) {
    searchBar.addEventListener('click', function() {
      window.location.href = '/search.html';
    });
  }
  
  // ============================================
  // 16. INITIALIZATION
  // ============================================
  function init() {
    loadAllData();
    updateCartUI();
    console.log('🚀 OK Mart Premium Home ready');
  }
  
  // Start the app
  init();
  
})();

async function initNotifications() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notification permission granted");

      const token = await getToken(messaging, {
        vapidKey: "BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE"
      });

      console.log("FCM Token:", token);

    } else {
      console.log("Permission denied");
    }

  } catch (err) {
    console.error("Notification error:", err);
  }
}

initNotifications();
