// ===== OK MART - HOME PAGE WITH LOCATION & PRODUCT NAVIGATION =====

(function() {
  'use strict';

  // ========== DOM Elements ==========
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const locationBtn = document.getElementById('locationBtn');
  const locationText = document.getElementById('locationText');
  const locationModal = document.getElementById('locationModal');
  const cartCountSpan = document.getElementById('cartCount');
  const wishlistCountSpan = document.getElementById('wishlistCount');
  const floatingCartBar = document.getElementById('floatingCartBar');
  const floatingCartCount = document.getElementById('floatingCartCount');
  const floatingCartTotal = document.getElementById('floatingCartTotal');
  const backToTopBtn = document.getElementById('backToTopBtn');
  const clearRecentBtn = document.getElementById('clearRecentBtn');
  const freeDeliveryProgress = document.getElementById('freeDeliveryProgress');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  
  // ========== State ==========
  let allProducts = [];
  let banners = [];
  let currentLocation = null;
  let recentlyViewed = [];
  let isLocationServiceable = true;
  // ✅ common.js ka centralized threshold use karo
  const FREE_DELIVERY_THRESHOLD = window.FREE_DELIVERY_THRESHOLD || 199;
  
  // ========== LOAD PRODUCTS FROM FIREBASE ==========
  async function loadProducts() {
    try {
      const snapshot = await db.collection('products')
        .where('active', '==', true)
        .get();
      
      allProducts = [];
      snapshot.forEach(doc => {
        allProducts.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`✅ Loaded ${allProducts.length} products from Firebase`);
      return allProducts;
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }
  
  // ========== LOAD BANNERS FROM FIREBASE ==========
  async function loadBanners() {
    try {
      const snapshot = await db.collection('banners')
        .where('active', '==', true)
        .get();
      
      banners = [];
      snapshot.forEach(doc => {
        banners.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`✅ Loaded ${banners.length} banners from Firebase`);
      renderBanners();
    } catch (error) {
      console.error('Error loading banners:', error);
    }
  }
  
  // ========== RENDER BANNERS ==========
  function renderBanners() {
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!banners.length) {
      track.innerHTML = '<div class="carousel-slide"><div class="skeleton-banner"></div></div>';
      return;
    }
    
    track.innerHTML = banners.map(banner => `
      <div class="carousel-slide" onclick="window.location.href='${banner.link || '#'}'">
        <img src="${banner.image}" alt="${banner.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x160?text=OK+Mart'">
      </div>
    `).join('');
    
    dotsContainer.innerHTML = banners.map((_, i) => `
      <div class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
    `).join('');
    
    initCarousel();
  }
  
  // ========== CAROUSEL ==========
  let currentSlide = 0;
  let autoSlideInterval;
  
  function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (!slides.length) return;
    
    function updateCarousel() {
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
      });
    }
    
    function nextSlide() {
      currentSlide = (currentSlide + 1) % slides.length;
      updateCarousel();
    }
    
    function prevSlide() {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      updateCarousel();
    }
    
    if (prevBtn) prevBtn.onclick = () => { prevSlide(); resetAutoSlide(); };
    if (nextBtn) nextBtn.onclick = () => { nextSlide(); resetAutoSlide(); };
    
    dots.forEach((dot, i) => {
      dot.onclick = () => {
        currentSlide = i;
        updateCarousel();
        resetAutoSlide();
      };
    });
    
    startAutoSlide();
    
    function startAutoSlide() {
      autoSlideInterval = setInterval(nextSlide, 5000);
    }
    
    function resetAutoSlide() {
      clearInterval(autoSlideInterval);
      startAutoSlide();
    }
  }
  
  // ========== RENDER CATEGORY GRID ==========
  const categories = [
    { id: 'dairy',         name: 'Dairy',         emoji: '🥛' },
    { id: 'fruits',        name: 'Fruits',        emoji: '🍎' },
    { id: 'vegetables',    name: 'Vegetables',    emoji: '🥬' },
    { id: 'snacks',        name: 'Snacks',        emoji: '🍿' },
    { id: 'beverages',     name: 'Beverages',     emoji: '🥤' },
    { id: 'icecream',      name: 'Ice Cream',     emoji: '🍦' },
    { id: 'grocery',       name: 'Grocery',       emoji: '🛒' },
    { id: 'personal-care', name: 'Personal Care', emoji: '🧴' },
    { id: 'household',     name: 'Household',     emoji: '🧹' },
    { id: 'bakery',        name: 'Bakery',        emoji: '🥖' },
    { id: 'electronics',   name: 'Electronics',   emoji: '📱' }
  ];
  
  function renderCategoryGrid() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    
    grid.innerHTML = categories.map(cat => `
      <a href="/categories/${cat.id}.html" class="category-item">
        <span class="category-icon">${cat.emoji}</span>
        <span class="category-name">${cat.name}</span>
      </a>
    `).join('');
  }
  
  // ========== RENDER NEW ARRIVALS ==========
  function renderNewArrivals() {
    const newProducts = [...allProducts]
      .filter(p => p.active !== false)
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 4);
    
    const section = document.getElementById('newArrivalsSection');
    const grid = document.getElementById('newArrivalsGrid');
    
    if (!newProducts.length || !section) return;
    
    section.style.display = 'block';
    grid.innerHTML = newProducts.map(product => createProductCard(product)).join('');
  }
  
  // ========== RENDER TRENDING ==========
  function renderTrending() {
    const trendingProducts = [...allProducts]
      .filter(p => p.active !== false && (p.popular === true || (p.salesCount || 0) > 10))
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 4);
    
    const section = document.getElementById('trendingSection');
    const grid = document.getElementById('trendingGrid');
    
    if (!trendingProducts.length || !section) return;
    
    section.style.display = 'block';
    grid.innerHTML = trendingProducts.map(product => createProductCard(product)).join('');
  }
  
  // ========== RENDER CATEGORY SECTIONS ==========
  function renderCategorySections() {
    const container = document.getElementById('categorySectionsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Show top 6 categories with products
    const categoriesWithProducts = categories.filter(cat => {
      return allProducts.some(p => p.category === cat.id && p.active !== false);
    }).slice(0, 6);
    
    for (const category of categoriesWithProducts) {
      const categoryProducts = allProducts
        .filter(p => p.category === category.id && p.active !== false)
        .slice(0, 8);
      
      if (categoryProducts.length === 0) continue;
      
      const sectionHtml = `
        <section class="category-products-section">
          <div class="category-products-header">
            <h3 class="category-products-title">${category.emoji} ${category.name}</h3>
            <a href="/categories/${category.id}.html" class="view-all-link">View All →</a>
          </div>
          <div class="category-products-scroll" id="scroll-${category.id}">
            ${categoryProducts.map(product => createScrollProductCard(product)).join('')}
          </div>
        </section>
      `;
      
      container.insertAdjacentHTML('beforeend', sectionHtml);
    }
  }
  
  // ========== CREATE PRODUCT CARD ==========
  function createProductCard(product) {
    const discount = calculateDiscount(product.price, product.mrp);
    const isOutOfStock = (product.stock || 0) === 0;
    
    return `
      <div class="product-card" data-product-id="${product.id}" data-id="${product.id}" onclick="viewProduct('${product.id}')">
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=OK'">
        ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
        ${discount > 0 ? `<span class="offer-badge">${discount}% OFF</span>` : ''}
        <button class="wishlist-btn" onclick="event.stopPropagation(); toggleWishlist('${product.id}', this)">🤍</button>
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <span class="product-unit">${product.unit || ''}</span>
        <div class="price-row">
          <span class="current-price">₹${product.price}</span>
          ${product.mrp ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        </div>
        <button class="add-btn" onclick="event.stopPropagation(); addToCart('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
          ${isOutOfStock ? 'Out of Stock' : 'ADD'}
        </button>
      </div>
    `;
  }
  
  function createScrollProductCard(product) {
    const discount = calculateDiscount(product.price, product.mrp);
    const isOutOfStock = (product.stock || 0) === 0;
    
    return `
      <div class="product-card scroll-product-card" data-product-id="${product.id}" onclick="viewProduct('${product.id}')">
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/140?text=OK'">
        ${discount > 0 ? `<span class="offer-badge">${discount}% OFF</span>` : ''}
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <span class="product-unit">${product.unit || ''}</span>
        <div class="price-row">
          <span class="current-price">₹${product.price}</span>
          ${product.mrp ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        </div>
        <button class="add-btn" onclick="event.stopPropagation(); addToCart('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
          ${isOutOfStock ? 'Out of Stock' : 'ADD'}
        </button>
      </div>
    `;
  }
  
  // ========== PRODUCT VIEW FUNCTION (FIXED) ==========
  window.viewProduct = function(productId) {
    if (!productId) return;
    addToRecentlyViewed(productId);
    window.location.href = `/product.html?id=${productId}`;
  };
  
  // ========== RECENTLY VIEWED ==========
  function loadRecentlyViewed() {
    try {
      recentlyViewed = JSON.parse(localStorage.getItem('okmart_recently_viewed') || '[]');
    } catch(e) { recentlyViewed = []; }
    renderRecentlyViewed();
  }
  
  function addToRecentlyViewed(productId) {
    recentlyViewed = recentlyViewed.filter(id => id !== productId);
    recentlyViewed.unshift(productId);
    recentlyViewed = recentlyViewed.slice(0, 10);
    localStorage.setItem('okmart_recently_viewed', JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
  }
  
  function renderRecentlyViewed() {
    const section = document.getElementById('recentlyViewedSection');
    const grid = document.getElementById('recentlyViewedGrid');
    
    if (!section || !grid) return;
    
    if (recentlyViewed.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    const recentProducts = recentlyViewed
      .map(id => allProducts.find(p => p.id === id))
      .filter(p => p && p.active !== false)
      .slice(0, 4);
    
    if (recentProducts.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    grid.innerHTML = recentProducts.map(product => createProductCard(product)).join('');
  }
  
  function clearRecentlyViewed() {
    recentlyViewed = [];
    localStorage.setItem('okmart_recently_viewed', JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
    showToast('Recently viewed cleared', 'success');
  }
  
  // ========== CART FUNCTIONS ==========
  function getCart() {
    return JSON.parse(localStorage.getItem('okmart_cart') || '[]');
  }
  
  function saveCart(cart) {
    localStorage.setItem('okmart_cart', JSON.stringify(cart));
    updateCartUI();
    updateFreeDeliveryProgress();
  }
  
  window.addToCart = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const cart = getCart();
    const existing = cart.find(item => item.id === productId);
    
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
    
    saveCart(cart);
    showToast(`${product.name} added to cart!`, 'success');
    
    // Animate button
    const btn = document.querySelector(`.product-card[data-product-id="${productId}"] .add-btn`);
    if (btn) {
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => { btn.style.transform = ''; }, 200);
    }
  };
  
  function updateCartUI() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (cartCountSpan) cartCountSpan.textContent = totalItems;
    if (floatingCartCount) floatingCartCount.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    if (floatingCartTotal) floatingCartTotal.textContent = `₹${subtotal}`;
    
    if (floatingCartBar) {
      if (totalItems > 0) {
        floatingCartBar.classList.add('visible');
        floatingCartBar.style.display = 'block';
      } else {
        floatingCartBar.classList.remove('visible');
        setTimeout(() => {
          if (!floatingCartBar.classList.contains('visible')) {
            floatingCartBar.style.display = 'none';
          }
        }, 300);
      }
    }
  }
  
  function updateFreeDeliveryProgress() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCalc = typeof window.calculateDelivery === 'function'
      ? window.calculateDelivery(subtotal)
      : { threshold: window.FREE_DELIVERY_THRESHOLD || 199, remainingForFree: Math.max(0, (window.FREE_DELIVERY_THRESHOLD || 199) - subtotal), percentForFree: Math.min(100, (subtotal / (window.FREE_DELIVERY_THRESHOLD || 199)) * 100) };
      
    if (progressFill) progressFill.style.width = `${deliveryCalc.percentForFree}%`;
    if (progressLabel) {
      if (deliveryCalc.remainingForFree <= 0) {
        progressLabel.innerHTML = '🎉 Free delivery unlocked! 🎉';
      } else {
        progressLabel.innerHTML = `Add ₹${deliveryCalc.remainingForFree} more to get FREE delivery 🎁`;
      }
    }
  }
  
  // ========== WISHLIST FUNCTIONS ==========
  function getWishlist() {
    return JSON.parse(localStorage.getItem('okmart_wishlist') || '[]');
  }
  
  function saveWishlist(wishlist) {
    localStorage.setItem('okmart_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
  }
  
  window.toggleWishlist = function(productId, btnElement) {
    let wishlist = getWishlist();
    const index = wishlist.indexOf(productId);
    
    if (index > -1) {
      wishlist.splice(index, 1);
      showToast('Removed from wishlist', 'info');
      if (btnElement) btnElement.textContent = '🤍';
    } else {
      wishlist.push(productId);
      showToast('Added to wishlist', 'success');
      if (btnElement) btnElement.textContent = '❤️';
    }
    
    saveWishlist(wishlist);
  };
  
  function updateWishlistUI() {
    const wishlist = getWishlist();
    if (wishlistCountSpan) wishlistCountSpan.textContent = wishlist.length;
    
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      const productCard = btn.closest('.product-card');
      if (productCard) {
        const productId = productCard.dataset.productId;
        if (productId && wishlist.includes(productId)) {
          btn.textContent = '❤️';
        } else {
          btn.textContent = '🤍';
        }
      }
    });
  }
  
  // ========== LOCATION SYSTEM ==========
  function initLocationModal() {
    const locationBtn = document.getElementById('locationBtn');
    const locationModal = document.getElementById('locationModal');
    const closeModal = document.getElementById('closeLocationModal');
    const useCurrentLocationBtn = document.getElementById('useCurrentLocationBtn');
    const checkPincodeBtn = document.getElementById('checkPincodeBtn');
    const pincodeInput = document.getElementById('pincodeInput');
    
    if (!locationBtn) return;
    
    locationBtn.addEventListener('click', () => {
      if (locationModal) locationModal.classList.add('active');
    });
    
    if (closeModal) {
      closeModal.addEventListener('click', () => {
        locationModal.classList.remove('active');
      });
    }
    
    if (useCurrentLocationBtn) {
      useCurrentLocationBtn.addEventListener('click', detectLocation);
    }
    
    if (checkPincodeBtn && pincodeInput) {
      checkPincodeBtn.addEventListener('click', () => {
        checkPincode(pincodeInput.value.trim());
      });
    }
    
    // Close on outside click
    if (locationModal) {
      locationModal.addEventListener('click', (e) => {
        if (e.target === locationModal) {
          locationModal.classList.remove('active');
        }
      });
    }
    
    // Load saved location
    loadSavedLocation();
  }
  
  function detectLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported', 'error');
      return;
    }
    
    showToast('Detecting location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const area = data.address?.suburb || data.address?.neighbourhood || 'Your Area';
          const city = data.address?.city || data.address?.town || 'Your City';
          setLocation(area, city, '');
        } catch (err) {
          setLocation('Your Location', '', '');
        }
      },
      () => {
        showToast('Unable to detect location', 'error');
      }
    );
  }
  
  async function checkPincode(pincode) {
    const messageDiv = document.getElementById('pincodeMessage');
    
    if (!pincode || pincode.length !== 6) {
      if (messageDiv) {
        messageDiv.innerHTML = 'Please enter a valid 6-digit pincode';
        messageDiv.className = 'pincode-message error';
      }
      return;
    }
    
    showToast('Checking pincode...', 'info');
    
    try {
      const doc = await db.collection('pincodes').doc(pincode).get();
      
      if (doc.exists && doc.data().active !== false) {
        isLocationServiceable = true;
        if (messageDiv) {
          messageDiv.innerHTML = `✅ Delivery available! ${doc.data().deliveryType === 'quick' ? '10-15 min delivery' : 'Scheduled delivery'}`;
          messageDiv.className = 'pincode-message success';
        }
        setLocationByPincode(pincode);
      } else {
        isLocationServiceable = false;
        if (messageDiv) {
          messageDiv.innerHTML = '❌ Delivery not available in this pincode yet. We are expanding soon!';
          messageDiv.className = 'pincode-message error';
        }
      }
    } catch (error) {
      console.error('Error checking pincode:', error);
      if (messageDiv) {
        messageDiv.innerHTML = 'Error checking pincode. Please try again.';
        messageDiv.className = 'pincode-message error';
      }
    }
  }
  
  function setLocation(area, city, pincode) {
    const locationString = `${area}, ${city}`;
    localStorage.setItem('okmart_location', locationString);
    if (pincode) localStorage.setItem('okmart_pincode', pincode);
    
    const locationText = document.getElementById('locationText');
    if (locationText) locationText.textContent = locationString.substring(0, 20);
    
    const locationModal = document.getElementById('locationModal');
    if (locationModal) locationModal.classList.remove('active');
    
    showToast(`📍 Location set to ${locationString}`, 'success');
    
    // Check delivery availability
    if (pincode) checkPincode(pincode);
  }
  
  function setLocationByPincode(pincode) {
    localStorage.setItem('okmart_pincode', pincode);
    const locationText = document.getElementById('locationText');
    if (locationText) locationText.textContent = `📍 Pincode: ${pincode}`;
    
    const locationModal = document.getElementById('locationModal');
    if (locationModal) locationModal.classList.remove('active');
    
    showToast(`📍 Pincode set to ${pincode}`, 'success');
  }
  
  function loadSavedLocation() {
    const savedLocation = localStorage.getItem('okmart_location');
    const savedPincode = localStorage.getItem('okmart_pincode');
    const locationText = document.getElementById('locationText');
    
    if (savedLocation && locationText) {
      locationText.textContent = savedLocation.substring(0, 20);
    } else if (savedPincode && locationText) {
      locationText.textContent = `📍 Pincode: ${savedPincode}`;
      checkPincode(savedPincode);
    }
  }
  
  function initNearbyLocations() {
    document.querySelectorAll('.nearby-item').forEach(item => {
      item.addEventListener('click', () => {
        const area = item.dataset.area;
        const city = item.dataset.city;
        const pincode = item.dataset.pincode;
        setLocation(area, city, pincode);
      });
    });
  }
  
  // ========== SEARCH FUNCTIONALITY ==========
  let searchDebounceTimer = null;

  function initSearch() {
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('visible', query.length > 0);
      }
      
      // ✅ Debounce fix: 600ms रुकें और minimum 3 chars चाहिए
      clearTimeout(searchDebounceTimer);
      if (query.length >= 3) {
        searchDebounceTimer = setTimeout(() => {
          window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
        }, 600);
      }
    });
    
    // Enter key पर immediate redirect
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query.length > 0) {
          clearTimeout(searchDebounceTimer);
          window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
        }
      }
    });
    
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.remove('visible');
        clearTimeout(searchDebounceTimer);
        searchInput.focus();
      });
    }
  }
  
  // ========== BACK TO TOP ==========
  function initBackToTop() {
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });
    
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  // ========== HELPER FUNCTIONS ==========
  function calculateDiscount(price, mrp) {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  
  function showToast(message, type) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
  
  // ========== SHOW SKELETON ==========
  function showSkeleton() {
    const container = document.getElementById('categorySectionsContainer');
    if (!container) return;
    
    container.innerHTML = `
      <div class="section-skeleton">
        <div class="skeleton-header"></div>
        <div class="skeleton-scroll">
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
      </div>
    `;
  }
  
  // ========== EXPOSE GLOBALLY ==========
  window.viewProduct = viewProduct;
  window.addToCart = addToCart;
  window.toggleWishlist = toggleWishlist;
  window.clearRecentlyViewed = clearRecentlyViewed;
  
  // ========== INITIALIZE ==========
  async function init() {
    showSkeleton();
    initBackToTop();
    initSearch();
    initLocationModal();
    initNearbyLocations();
    
    // Load data from Firebase
    await loadProducts();
    await loadBanners();
    
    renderCategoryGrid();
    renderNewArrivals();
    renderTrending();
    renderCategorySections();
    loadRecentlyViewed();
    updateCartUI();
    updateWishlistUI();
    
    // Listen for settings change
    if (typeof window.onStoreSettingsChange === 'function') {
      window.onStoreSettingsChange(() => {
        updateFreeDeliveryProgress();
      });
    }
    
    console.log('✅ Home page fully loaded with dynamic settings');
  }
  
  init();
})();

