// ===== OK MART - PRODUCT DETAIL PAGE =====

(function() {
  'use strict';

  // ========== DOM Elements ==========
  const loadingState = document.getElementById('loadingState');
  const productContent = document.getElementById('productContent');
  const galleryWrapper = document.getElementById('galleryWrapper');
  const galleryThumbs = document.getElementById('galleryThumbs');
  const productName = document.getElementById('productName');
  const productBrand = document.getElementById('productBrand');
  const productCategory = document.getElementById('productCategory');
  const productPrice = document.getElementById('productPrice');
  const productMrp = document.getElementById('productMrp');
  const productDiscount = document.getElementById('productDiscount');
  const productUnit = document.getElementById('productUnit');
  const productDescription = document.getElementById('productDescription');
  const productFeatures = document.getElementById('productFeatures');
  const qtyValue = document.getElementById('qtyValue');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const buyNowBtn = document.getElementById('buyNowBtn');
  const wishlistHeaderBtn = document.getElementById('wishlistHeaderBtn');
  const shareBtn = document.getElementById('shareBtn');
  const stockStatus = document.getElementById('stockStatus');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const relatedProductsGrid = document.getElementById('relatedProductsGrid');
  const recentlyViewedGrid = document.getElementById('recentlyViewedGrid');
  const clearRecentBtn = document.getElementById('clearRecentBtn');
  const priceBadge = document.getElementById('priceBadge');

  // ========== State ==========
  let currentProduct = null;
  let allProducts = [];
  let currentQuantity = 1;
  let swiperMain = null;
  let swiperThumbs = null;
  let recentlyViewed = [];

  // FREE DELIVERY THRESHOLD
  const FREE_DELIVERY_THRESHOLD = 199;

  // ========== Get Product ID from URL ==========
  function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  // ========== Load Product ==========
  async function loadProduct() {
    const productId = getProductId();
    if (!productId) {
      window.location.href = '/';
      return;
    }

    try {
      // Load all products first (cached)
      allProducts = await fetchProducts();
      currentProduct = allProducts.find(p => p.id === productId);
      
      if (!currentProduct) {
        showToast('Product not found', 'error');
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }

      // Add to recently viewed
      addToRecentlyViewed(productId);
      
      // Render product
      renderProduct();
      renderGallery();
      renderRelatedProducts();
      renderRecentlyViewed();
      updateFreeDeliveryProgress();
      updateWishlistUI();
      updateCartBadge();
      
      loadingState.style.display = 'none';
      productContent.style.display = 'block';
      
    } catch (error) {
      console.error('Error loading product:', error);
      loadingState.innerHTML = '<div class="spinner"></div><p>Error loading product. Please refresh.</p>';
    }
  }

  // ========== Render Product Details ==========
  function renderProduct() {
    // Basic info
    productName.textContent = currentProduct.name || 'Product Name';
    productBrand.textContent = currentProduct.brand || 'OK Mart';
    productCategory.textContent = currentProduct.category || 'Grocery';
    productUnit.textContent = currentProduct.unit || '1 Unit';
    
    // Price
    const price = currentProduct.price || 0;
    const mrp = currentProduct.mrp || price;
    const discount = calculateDiscount(price, mrp);
    
    productPrice.textContent = `₹${price}`;
    productMrp.textContent = `₹${mrp}`;
    productDiscount.textContent = `${discount}% OFF`;
    
    // Stock status
    const stock = currentProduct.stock || 0;
    if (stock <= 0) {
      stockStatus.innerHTML = '<span class="out-of-stock">❌ Out of Stock</span>';
      addToCartBtn.disabled = true;
      buyNowBtn.disabled = true;
    } else {
      stockStatus.innerHTML = '<span class="in-stock">✅ In Stock</span>';
      addToCartBtn.disabled = false;
      buyNowBtn.disabled = false;
    }
    
    // Price badge for high discount
    if (discount >= 20) {
      priceBadge.style.display = 'inline-block';
      priceBadge.innerHTML = discount >= 40 ? '🔥 Super Deal' : '🔥 Best Deal';
    } else {
      priceBadge.style.display = 'none';
    }
    
    // Description
    if (currentProduct.description) {
      productDescription.textContent = currentProduct.description;
    } else {
      productDescription.innerHTML = `Fresh ${currentProduct.name} delivered to your doorstep. Premium quality product at best price.`;
    }
    
    // Features
    const features = [
      '✓ 100% Fresh & Quality Guaranteed',
      '✓ Fast delivery within 10-15 minutes',
      `✓ ${discount}% savings on MRP`,
      '✓ Secure payment & Cash on Delivery'
    ];
    
    if (currentProduct.unit) features.unshift(`✓ Unit: ${currentProduct.unit}`);
    if (currentProduct.brand) features.unshift(`✓ Brand: ${currentProduct.brand}`);
    
    productFeatures.innerHTML = features.map(f => `<div class="feature-item">${f}</div>`).join('');
  }

  // ========== Render Image Gallery ==========
  function renderGallery() {
    const images = currentProduct.images && currentProduct.images.length 
      ? currentProduct.images 
      : [currentProduct.image];
    
    // Main gallery
    galleryWrapper.innerHTML = images.map(img => `
      <div class="swiper-slide">
        <img src="${img}" alt="${currentProduct.name}" data-src="${img}" class="gallery-image">
      </div>
    `).join('');
    
    // Thumbnails
    galleryThumbs.innerHTML = images.map((img, idx) => `
      <img src="${img}" class="gallery-thumb ${idx === 0 ? 'active' : ''}" data-index="${idx}">
    `).join('');
    
    // Initialize Swiper
    if (swiperMain) swiperMain.destroy();
    if (swiperThumbs) swiperThumbs.destroy();
    
    swiperMain = new Swiper('.gallery-main', {
      loop: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      on: {
        slideChange: function() {
          const activeIndex = this.realIndex;
          document.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === activeIndex);
          });
        }
      }
    });
    
    // Thumbnail click
    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const index = parseInt(thumb.dataset.index);
        swiperMain.slideToLoop(index);
      });
    });
    
    // Zoom on image click
    document.querySelectorAll('.gallery-image').forEach(img => {
      img.addEventListener('click', () => {
        const zoomModal = document.getElementById('zoomModal');
        const zoomImage = document.getElementById('zoomImage');
        zoomImage.src = img.src;
        zoomModal.classList.add('active');
      });
    });
    
    // Close zoom modal
    document.getElementById('zoomClose')?.addEventListener('click', () => {
      document.getElementById('zoomModal').classList.remove('active');
    });
    document.getElementById('zoomModal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('zoomModal')) {
        document.getElementById('zoomModal').classList.remove('active');
      }
    });
  }

  // ========== Quantity Functions ==========
  function updateQuantity(delta) {
    let newQty = currentQuantity + delta;
    if (newQty < 1) newQty = 1;
    const stock = currentProduct.stock || 0;
    if (stock > 0 && newQty > stock) newQty = stock;
    currentQuantity = newQty;
    qtyValue.textContent = currentQuantity;
  }

  // ========== Add to Cart ==========
  function addToCart() {
    if (!currentProduct) return;
    if ((currentProduct.stock || 0) <= 0) {
      showToast('Product out of stock!', 'error');
      return;
    }
    
    const cart = getCart();
    const existing = cart.find(item => item.id === currentProduct.id);
    
    if (existing) {
      existing.quantity += currentQuantity;
    } else {
      cart.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        mrp: currentProduct.mrp,
        image: currentProduct.image,
        unit: currentProduct.unit,
        quantity: currentQuantity
      });
    }
    
    saveCart(cart);
    updateCartBadge();
    updateFreeDeliveryProgress();
    showMiniPopup();
    showToast(`${currentProduct.name} added to cart!`, 'success');
    
    // Animate button
    addToCartBtn.style.transform = 'scale(0.96)';
    setTimeout(() => { addToCartBtn.style.transform = ''; }, 200);
  }

  // ========== Buy Now ==========
  function buyNow() {
    addToCart();
    window.location.href = '/checkout.html';
  }

  // ========== Cart Helper Functions ==========
  function getCart() {
    return JSON.parse(localStorage.getItem('okmart_cart') || '[]');
  }
  
  function saveCart(cart) {
    localStorage.setItem('okmart_cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }
  
  function updateCartBadge() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count, .cart-badge').forEach(el => {
      if (el) el.textContent = total;
    });
  }
  
  function updateFreeDeliveryProgress() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
    const percent = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
    
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressLabel) {
      if (remaining <= 0) {
        progressLabel.innerHTML = '🎉 Free delivery unlocked! Add more items 🎉';
      } else {
        progressLabel.innerHTML = `Add ₹${remaining} more for FREE delivery 🎁`;
      }
    }
  }

  // ========== Wishlist Functions ==========
  function getWishlist() {
    return JSON.parse(localStorage.getItem('okmart_wishlist') || '[]');
  }
  
  function saveWishlist(wishlist) {
    localStorage.setItem('okmart_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
  }
  
  function toggleWishlist() {
    if (!currentProduct) return;
    let wishlist = getWishlist();
    const index = wishlist.indexOf(currentProduct.id);
    
    if (index > -1) {
      wishlist.splice(index, 1);
      showToast('Removed from wishlist', 'info');
    } else {
      wishlist.push(currentProduct.id);
      showToast('Added to wishlist', 'success');
      animateWishlist();
    }
    
    saveWishlist(wishlist);
  }
  
  function updateWishlistUI() {
    const wishlist = getWishlist();
    const isInWishlist = wishlist.includes(currentProduct?.id);
    if (wishlistHeaderBtn) {
      wishlistHeaderBtn.textContent = isInWishlist ? '❤️' : '🤍';
    }
  }
  
  function animateWishlist() {
    if (wishlistHeaderBtn) {
      wishlistHeaderBtn.style.transform = 'scale(1.2)';
      setTimeout(() => {
        if (wishlistHeaderBtn) wishlistHeaderBtn.style.transform = '';
      }, 200);
    }
  }

  // ========== Recently Viewed ==========
  function loadRecentlyViewed() {
    try {
      recentlyViewed = JSON.parse(localStorage.getItem('okmart_recently_viewed') || '[]');
    } catch(e) { recentlyViewed = []; }
  }
  
  function addToRecentlyViewed(productId) {
    loadRecentlyViewed();
    recentlyViewed = recentlyViewed.filter(id => id !== productId);
    recentlyViewed.unshift(productId);
    recentlyViewed = recentlyViewed.slice(0, 10);
    localStorage.setItem('okmart_recently_viewed', JSON.stringify(recentlyViewed));
  }
  
  function renderRecentlyViewed() {
    if (!recentlyViewedGrid) return;
    
    const recentProducts = recentlyViewed
      .map(id => allProducts.find(p => p.id === id))
      .filter(p => p && p.id !== currentProduct?.id && p.active !== false)
      .slice(0, 10);
    
    if (recentProducts.length === 0) {
      document.getElementById('recentlyViewedSection').style.display = 'none';
      return;
    }
    
    document.getElementById('recentlyViewedSection').style.display = 'block';
    recentlyViewedGrid.innerHTML = recentProducts.map(product => `
      <div class="related-product-card" onclick="window.location.href='/product.html?id=${product.id}'">
        <img src="${product.image}" class="related-product-image" onerror="this.src='https://via.placeholder.com/140'">
        <div class="related-product-name">${product.name}</div>
        <div class="related-product-price">₹${product.price}</div>
      </div>
    `).join('');
  }
  
  function clearRecentlyViewed() {
    recentlyViewed = [];
    localStorage.setItem('okmart_recently_viewed', JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
    showToast('Recently viewed cleared', 'success');
  }

  // ========== Related Products ==========
  function renderRelatedProducts() {
    if (!relatedProductsGrid) return;
    
    const related = allProducts
      .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id && p.active !== false)
      .slice(0, 10);
    
    if (related.length === 0) {
      document.getElementById('relatedSection').style.display = 'none';
      return;
    }
    
    document.getElementById('relatedSection').style.display = 'block';
    relatedProductsGrid.innerHTML = related.map(product => `
      <div class="related-product-card" onclick="window.location.href='/product.html?id=${product.id}'">
        <img src="${product.image}" class="related-product-image" onerror="this.src='https://via.placeholder.com/140'">
        <div class="related-product-name">${product.name}</div>
        <div class="related-product-price">₹${product.price}</div>
      </div>
    `).join('');
  }

  // ========== Share Product ==========
  function shareProduct() {
    if (!currentProduct) return;
    const url = `${window.location.origin}/product.html?id=${currentProduct.id}`;
    const text = `Check out ${currentProduct.name} on OK Mart for only ₹${currentProduct.price}!`;
    
    if (navigator.share) {
      navigator.share({ title: currentProduct.name, text: text, url: url });
    } else {
      navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    }
  }

  // ========== Helper Functions ==========
  function calculateDiscount(price, mrp) {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  }
  
  function showMiniPopup() {
    const popup = document.getElementById('miniOrderPopup');
    if (popup) {
      popup.classList.add('show');
      setTimeout(() => popup.classList.remove('show'), 2500);
    }
  }
  
  function showToast(message, type) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast-message ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ========== Event Listeners ==========
  function initEventListeners() {
    qtyMinus?.addEventListener('click', () => updateQuantity(-1));
    qtyPlus?.addEventListener('click', () => updateQuantity(1));
    addToCartBtn?.addEventListener('click', addToCart);
    buyNowBtn?.addEventListener('click', buyNow);
    wishlistHeaderBtn?.addEventListener('click', toggleWishlist);
    shareBtn?.addEventListener('click', shareProduct);
    clearRecentBtn?.addEventListener('click', clearRecentlyViewed);
    
    // Listen for cart updates from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'okmart_cart') {
        updateCartBadge();
        updateFreeDeliveryProgress();
      }
      if (e.key === 'okmart_wishlist') {
        updateWishlistUI();
      }
    });
  }

  // ========== Initialize ==========
  async function init() {
    initEventListeners();
    await loadProduct();
    console.log('✅ Product page initialized');
  }
  
  init();
})();

