// ===== OK MART - HOME PAGE LOGIC =====

(function() {
  'use strict';

  // ========== DOM ELEMENTS ==========
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
  
  // ========== STATE ==========
  let allProducts = [];
  let banners = [];
  let currentLocation = null;
  let recentlyViewed = [];
  const FREE_DELIVERY_THRESHOLD = 199;
  
  // ========== INITIALIZATION ==========
  async function init() {
    showSkeletons();
    
    await Promise.all([
      loadProducts(),
      loadBanners(),
      loadRecentlyViewed(),
      updateCartUI(),
      updateWishlistUI(),
      loadSavedLocation()
    ]);
    
    initCarousel();
    initBackToTop();
    initSearch();
    initLocationModal();
    initNearbyLocations();
    setupCartListener();
    
    hideSkeletons();
  }
  
  // ========== LOAD PRODUCTS ==========
  async function loadProducts() {
    try {
      allProducts = await fetchProducts();
      renderFlashSale();
      renderNewArrivals();
      renderTrending();
      renderCategorySections();
      renderRecentlyViewed();
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }
  
  // ========== LOAD BANNERS ==========
  async function loadBanners() {
    try {
      banners = await fetchBanners();
      renderBanners();
    } catch (error) {
      console.error('Error loading banners:', error);
    }
  }
  
  // ========== RENDER BANNERS CAROUSEL ==========
  function renderBanners() {
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!banners.length) {
      track.innerHTML = '<div class="carousel-slide"><div class="skeleton-banner"></div></div>';
      return;
    }
    
    track.innerHTML = banners.map(banner => `
      <div class="carousel-slide">
        <img src="${banner.image}" alt="${banner.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x160?text=OK+Mart'">
      </div>
    `).join('');
    
    dotsContainer.innerHTML = banners.map((_, i) => `
      <div class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
    `).join('');
  }
  
  // ========== CAROUSEL ==========
  let currentSlide = 0;
  let autoSlideInterval;
  
  function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const slides = document.querySelectorAll('.carousel-slide');
    
    if (!slides.length) return;
    
    function updateCarousel() {
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
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
    
    prevBtn?.addEventListener('click', () => {
      prevSlide();
      resetAutoSlide();
    });
    
    nextBtn?.addEventListener('click', () => {
      nextSlide();
      resetAutoSlide();
    });
    
    document.querySelectorAll('.carousel-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        currentSlide = parseInt(e.target.dataset.index);
        updateCarousel();
        resetAutoSlide();
      });
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
  
  // ========== RENDER FLASH SALE ==========
  function renderFlashSale() {
    const flashSaleProducts = allProducts.filter(p => p.flashSale === true && p.active !== false);
    const section = document.getElementById('flashSaleSection');
    const grid = document.getElementById('flashSaleGrid');
    
    if (!flashSaleProducts.length) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    grid.innerHTML = flashSaleProducts.slice(0, 4).map(product => createProductCard(product)).join('');
    
    // Start countdown timer
    startFlashSaleCountdown();
  }
  
  function startFlashSaleCountdown() {
    // Set end time to end of day
    const endTime = new Date();
    endTime.setHours(23, 59, 59, 999);
    
    function updateTimer() {
      const now = new Date();
      const diff = endTime - now;
      
      if (diff <= 0) {
        document.getElementById('flashSaleSection').style.display = 'none';
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      document.getElementById('hours').textContent = String(hours).padStart(2, '0');
      document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
      document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
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
    
    if (!newProducts.length) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    grid.innerHTML = newProducts.map(product => createProductCard(product)).join('');
  }
  
  // ========== RENDER TRENDING / HOT TODAY ==========
  function renderTrending() {
    const trendingProducts = [...allProducts]
      .filter(p => p.active !== false && (p.popular === true || (p.salesCount || 0) > 10))
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 4);
    
    const section = document.getElementById('trendingSection');
    const grid = document.getElementById('trendingGrid');
    
    if (!trendingProducts.length) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    grid.innerHTML = trendingProducts.map(product => createProductCard(product)).join('');
  }
  
  // ========== RENDER CATEGORY SECTIONS ==========
  const categories = [
    { id: 'dairy', name: '🥛 Dairy', emoji: '🥛' },
    { id: 'fruits', name: '🍎 Fruits', emoji: '🍎' },
    { id: 'vegetables', name: '🥬 Vegetables', emoji: '🥬' },
    { id: 'snacks', name: '🍿 Snacks', emoji: '🍿' },
    { id: 'beverages', name: '🥤 Beverages', emoji: '🥤' },
    { id: 'icecream', name: 'Icecream', emoji: '🍦' },
    { id: 'grocery', name: '🛒 Grocery', emoji: '🛒' },
    { id: 'personal', name: '🧴 Personal Care', emoji: '🧴' },
    { id: 'household', name: '🧹 Household', emoji: '🧹' },
    { id: 'bakery', name: '🥖 Bakery', emoji: '🥖' },
    { id: 'electronics', name: '📱 Electronics', emoji: '📱' }
  ];
  
  function renderCategorySections() {
    const container = document.getElementById('categorySectionsContainer');
    container.innerHTML = '';
    
    // Render category grid first
    renderCategoryGrid();
    
    // Render product sections for each category
    for (const category of categories) {
      const categoryProducts = allProducts.filter(p => p.category === category.id && p.active !== false).slice(0, 8);
      
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
  
  function renderCategoryGrid() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = categories.map(cat => `
      <a href="/categories/${cat.id}.html" class="category-item">
        <span class="category-icon">${cat.emoji}</span>
        <span class="category-name">${cat.name}</span>
      </a>
    `).join('');
  }
  
  // ========== CREATE PRODUCT CARD ==========
  function createProductCard(product) {
    const discount = calculateDiscount(product.price, product.mrp);
    const isOutOfStock = (product.stock || 0) === 0;
    
    return `
      <div class="product-card" data-product-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=OK'">
        ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
        ${discount > 0 ? `<span class="offer-badge">${discount}% OFF</span>` : ''}
        <button class="wishlist-btn" onclick="event.stopPropagation(); toggleWishlist('${product.id}')">❤️</button>
        <h3 class="product-name">${product.name}</h3>
        <span class="product-unit">${product.unit || ''}</span>
        <div class="price-row">
          <span class="current-price">₹${product.price}</span>
          ${product.mrp ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        </div>
        <button class="add-btn" onclick="event.stopPropagation(); addToCartHandler('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
          ${isOutOfStock ? 'Out of Stock' : 'ADD'}
        </button>
      </div>
    `;
  }
  
  function createScrollProductCard(product) {
    const discount = calculateDiscount(product.price, product.mrp);
    const isOutOfStock = (product.stock || 0) === 0;
    
    return `
      <div class="product-card scroll-product-card" data-product-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/140?text=OK'">
        ${discount > 0 ? `<span class="offer-badge">${discount}% OFF</span>` : ''}
        <h3 class="product-name">${product.name}</h3>
        <span class="product-unit">${product.unit || ''}</span>
        <div class="price-row">
          <span class="current-price">₹${product.price}</span>
          ${product.mrp ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        </div>
        <button class="add-btn" onclick="event.stopPropagation(); addToCartHandler('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
          ${isOutOfStock ? 'Out of Stock' : 'ADD'}
        </button>
      </div>
    `;
  }
  
  // ========== RECENTLY VIEWED ==========
  function loadRecentlyViewed() {
    try {
      recentlyViewed = JSON.parse(localStorage.getItem('okmart_recently_viewed') || '[]');
    } catch(e) { recentlyViewed = []; }
  }
  
  function saveRecentlyViewed() {
    localStorage.setItem('okmart_recently_viewed', JSON.stringify(recentlyViewed.slice(0, 10)));
  }
  
  function addToRecentlyViewed(productId) {
    recentlyViewed = recentlyViewed.filter(id => id !== productId);
    recentlyViewed.unshift(productId);
    saveRecentlyViewed();
    renderRecentlyViewed();
  }
  
  function clearRecentlyViewed() {
    recentlyViewed = [];
    saveRecentlyViewed();
    renderRecentlyViewed();
    showToast('Recently viewed cleared', 'success');
  }
  
  function renderRecentlyViewed() {
    const section = document.getElementById('recentlyViewedSection');
    const grid = document.getElementById('recentlyViewedGrid');
    
    if (!recentlyViewed.length) {
      section.style.display = 'none';
      return;
    }
    
    const recentProducts = recentlyViewed
      .map(id => allProducts.find(p => p.id === id))
      .filter(p => p && p.active !== false)
      .slice(0, 4);
    
    if (!recentProducts.length) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    grid.innerHTML = recentProducts.map(product => createProductCard(product)).join('');
  }
  
  // ========== CART FUNCTIONS ==========
  function getCart() {
    return JSON.parse(localStorage.getItem('okmart_cart') || '[]');
  }
  
  function saveCart(cart) {
    localStorage.setItem('okmart_cart', JSON.stringify(cart));
    updateCartUI();
    updateFreeDeliveryProgress();
    showMiniPopup();
  }
  
  function addToCartHandler(productId) {
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
    animateAddToCart();
    showToast(`${product.name} added to cart!`, 'success');
  }
  
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
    const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
    const percent = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
    
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressLabel) {
      if (remaining <= 0) {
        progressLabel.innerHTML = '🎉 Free delivery unlocked! 🎉';
      } else {
        progressLabel.innerHTML = `Add ₹${remaining} more to get FREE delivery 🎁`;
      }
    }
  }
  
  function animateAddToCart() {
    const popup = document.getElementById('miniOrderPopup');
    if (popup) {
      popup.classList.add('show');
      setTimeout(() => popup.classList.remove('show'), 2000);
    }
  }
  
  function setupCartListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'okmart_cart') updateCartUI();
    });
    updateCartUI();
  }
  
  // ========== WISHLIST FUNCTIONS ==========
  function getWishlist() {
    return JSON.parse(localStorage.getItem('okmart_wishlist') || '[]');
  }
  
  function saveWishlist(wishlist) {
    localStorage.setItem('okmart_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
  }
  
  function toggleWishlist(productId) {
    let wishlist = getWishlist();
    const index = wishlist.indexOf(productId);
    
    if (index > -1) {
      wishlist.splice(index, 1);
      showToast('Removed from wishlist', 'info');
    } else {
      wishlist.push(productId);
      showToast('Added to wishlist', 'success');
    }
    
    saveWishlist(wishlist);
    renderWishlistButtons();
  }
  
  function updateWishlistUI() {
    const wishlist = getWishlist();
    if (wishlistCountSpan) wishlistCountSpan.textContent = wishlist.length;
    renderWishlistButtons();
  }
  
  function renderWishlistButtons() {
    const wishlist = getWishlist();
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      const productId = btn.closest('.product-card')?.dataset.productId;
      if (productId) {
        btn.textContent = wishlist.includes(productId) ? '❤️' : '🤍';
      }
    });
  }
  
  // ========== SEARCH FUNCTIONALITY ==========
  function initSearch() {
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('visible', query.length > 0);
      }
      
      if (query.length > 1) {
        // Redirect to search page or show suggestions
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
      }
    });
    
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.remove('visible');
        searchInput.focus();
      });
    }
  }
  
  // ========== LOCATION MODAL ==========
  function initLocationModal() {
    locationBtn?.addEventListener('click', () => {
      locationModal.classList.add('active');
    });
    
    document.getElementById('closeLocationModal')?.addEventListener('click', () => {
      locationModal.classList.remove('active');
    });
    
    document.getElementById('useCurrentLocationBtn')?.addEventListener('click', detectLocation);
    document.getElementById('checkPincodeBtn')?.addEventListener('click', checkPincode);
    
    locationModal?.addEventListener('click', (e) => {
      if (e.target === locationModal) locationModal.classList.remove('active');
    });
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
  
  async function checkPincode() {
    const pincode = document.getElementById('pincodeInput').value.trim();
    const messageDiv = document.getElementById('pincodeMessage');
    
    if (!pincode || pincode.length !== 6) {
      messageDiv.innerHTML = 'Please enter a valid 6-digit pincode';
      messageDiv.className = 'pincode-message error';
      return;
    }
    
    showToast('Checking pincode...', 'info');
    
    const result = await checkPincodeServiceability(pincode);
    
    if (result.serviceable) {
      messageDiv.innerHTML = `✅ Delivery available! ${result.deliveryType === 'quick' ? '10-15 min delivery' : 'Scheduled delivery'} available. Delivery charge: ₹${result.deliveryCharge || 39}`;
      messageDiv.className = 'pincode-message success';
      setLocationByPincode(pincode);
    } else {
      messageDiv.innerHTML = '❌ Delivery not available in this pincode yet. We are expanding soon!';
      messageDiv.className = 'pincode-message error';
    }
  }
  
  function setLocation(area, city, pincode) {
    const locationString = `${area}, ${city}`;
    localStorage.setItem('okmart_location', locationString);
    if (pincode) localStorage.setItem('okmart_pincode', pincode);
    locationText.textContent = locationString.substring(0, 20);
    locationModal.classList.remove('active');
    showToast(`📍 Location set to ${locationString}`, 'success');
  }
  
  function setLocationByPincode(pincode) {
    localStorage.setItem('okmart_pincode', pincode);
    locationText.textContent = `📍 Pincode: ${pincode}`;
    locationModal.classList.remove('active');
    showToast(`📍 Pincode set to ${pincode}`, 'success');
  }
  
  function loadSavedLocation() {
    const savedLocation = localStorage.getItem('okmart_location');
    const savedPincode = localStorage.getItem('okmart_pincode');
    if (savedLocation) {
      locationText.textContent = savedLocation.substring(0, 20);
    } else if (savedPincode) {
      locationText.textContent = `📍 Pincode: ${savedPincode}`;
    }
  }
  
  // ========== BACK TO TOP ==========
  function initBackToTop() {
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
  
  // ========== SKELETON LOADING ==========
  function showSkeletons() {
    const container = document.getElementById('categorySectionsContainer');
    if (container) {
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
  }
  
  function hideSkeletons() {
    // Skeletons will be replaced by actual content
  }
  
  // ========== SHOW TOAST ==========
  function showToast(message, type) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  function showMiniPopup() {
    const popup = document.getElementById('miniOrderPopup');
    if (popup) {
      popup.classList.add('show');
      setTimeout(() => popup.classList.remove('show'), 2000);
    }
  }
  
  function animateAddToCart() {
    // Visual feedback
    const btn = document.querySelector('.add-btn:active');
    if (btn) {
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => { btn.style.transform = ''; }, 200);
    }
  }
  
  // ========== EXPOSE GLOBALLY ==========
  window.addToCartHandler = addToCartHandler;
  window.toggleWishlist = toggleWishlist;
  window.clearRecentlyViewed = clearRecentlyViewed;
  window.showToast = showToast;
  
  // Start the app
  init();
  
  console.log('✅ Home page fully loaded');
})();
