// ===== OK MART - COMMON.JS =====
// Reusable utilities, product data management, cart functions, and fly animation

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const CART_KEY = 'okmart_cart';
  const CACHE_KEY = 'okmart_products_cache';
  const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
  
  // Pages where sticky cart bar should NOT appear
  const HIDE_STICKY_CART_PAGES = ['cart.html', 'checkout.html', 'success.html', 'search.html'];
  
  // Animation settings
  const FLY_ANIMATION_DURATION = 600; // ms
  const FLY_ANIMATION_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  
  // ---------- GLOBAL STATE ----------
  window.OKMart = window.OKMart || {};
  
  let cachedProducts = null;
  let isAnimating = false;
  
  // ---------- HELPER: Check if current page should show sticky cart ----------
  function shouldShowStickyCart() {
    const currentPath = window.location.pathname.toLowerCase();
    return !HIDE_STICKY_CART_PAGES.some(page => currentPath.includes(page));
  }
  
  // ---------- PRODUCT FETCHING (WITH CACHING) ----------
  async function fetchProducts() {
    if (cachedProducts) {
      return cachedProducts;
    }
    
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          console.log('✅ Using cached products');
          cachedProducts = data;
          return cachedProducts;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    
    try {
      console.log('🌐 Fetching products from network');
      const response = await fetch('/data/products.json');
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      cachedProducts = data.products;
      
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data: cachedProducts,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Cache save error:', e);
      }
      
      return cachedProducts;
    } catch (error) {
      console.error('Error loading products:', error);
      
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          console.log('⚠️ Using stale cache');
          return JSON.parse(cached).data;
        }
      } catch (e) {}
      
      return [];
    }
  }
  
  window.OKMart.getProducts = fetchProducts;
  
  window.OKMart.getProductsByCategory = async (categorySlug) => {
    const products = await fetchProducts();
    return products.filter(p => p.category === categorySlug);
  };
  
  window.OKMart.getPopularProducts = async () => {
    const products = await fetchProducts();
    return products.filter(p => p.popular === true);
  };
  
  window.OKMart.calculateDiscount = (price, mrp) => {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };
  
  // ---------- FLY TO CART ANIMATION ----------
  
  /**
   * Get cart icon element position
   */
  function getCartIconPosition() {
    const cartIcon = document.querySelector('.cart-icon-link') || 
                     document.querySelector('#cartIcon') ||
                     document.querySelector('[aria-label="cart"]');
    
    if (!cartIcon) return null;
    
    const rect = cartIcon.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height
    };
  }
  
  /**
   * Create flying clone of product image
   */
  function createFlyingClone(sourceImage, productName) {
    const clone = document.createElement('div');
    clone.className = 'fly-to-cart-clone';
    
    // Get source image src
    let imgSrc = '';
    if (typeof sourceImage === 'string') {
      imgSrc = sourceImage;
    } else if (sourceImage && sourceImage.src) {
      imgSrc = sourceImage.src;
    }
    
    clone.innerHTML = `<img src="${imgSrc}" alt="${productName || 'Product'}">`;
    
    // Apply base styles
    clone.style.cssText = `
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      will-change: transform, opacity;
      transition: all ${FLY_ANIMATION_DURATION}ms ${FLY_ANIMATION_EASING};
      opacity: 1;
    `;
    
    return clone;
  }
  
  /**
   * Position clone at source element
   */
  function positionCloneAtSource(clone, sourceElement) {
    const rect = sourceElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) * 0.8;
    
    clone.style.width = `${size}px`;
    clone.style.height = `${size}px`;
    clone.style.left = `${rect.left + rect.width / 2 - size / 2}px`;
    clone.style.top = `${rect.top + rect.height / 2 - size / 2}px`;
    clone.style.transform = 'scale(1)';
    clone.style.opacity = '0.95';
    clone.style.borderRadius = '12px';
    clone.style.overflow = 'hidden';
    clone.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
    
    const img = clone.querySelector('img');
    if (img) {
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.display = 'block';
    }
  }
  
  /**
   * Animate clone to cart
   */
  function animateCloneToCart(clone, startRect, endPosition) {
    return new Promise((resolve) => {
      // Force reflow
      clone.offsetHeight;
      
      const targetSize = 30; // Final size in px
      const deltaX = endPosition.x - (startRect.left + startRect.width / 2);
      const deltaY = endPosition.y - (startRect.top + startRect.height / 2);
      
      clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.2)`;
      clone.style.opacity = '0.6';
      clone.style.width = `${targetSize}px`;
      clone.style.height = `${targetSize}px`;
      clone.style.borderRadius = '50%';
      
      setTimeout(() => {
        clone.style.opacity = '0';
        setTimeout(() => {
          if (clone.parentNode) {
            clone.parentNode.removeChild(clone);
          }
          resolve();
        }, 100);
      }, FLY_ANIMATION_DURATION - 100);
    });
  }
  
  /**
   * Cart icon bounce animation
   */
  function animateCartBounce() {
    const cartIcon = document.querySelector('.cart-icon-link') || 
                     document.querySelector('[aria-label="cart"]');
    
    if (!cartIcon) return;
    
    cartIcon.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    cartIcon.style.transform = 'scale(1.2)';
    
    setTimeout(() => {
      cartIcon.style.transform = 'scale(1)';
    }, 150);
    
    setTimeout(() => {
      cartIcon.style.transition = '';
    }, 300);
  }
  
  /**
   * Main fly to cart animation function
   */
  async function flyToCart(sourceImageElement, productImageSrc, productName) {
    // Prevent multiple animations
    if (isAnimating) {
      console.log('Animation already in progress');
      return;
    }
    
    isAnimating = true;
    
    try {
      const cartPosition = getCartIconPosition();
      if (!cartPosition) {
        console.warn('Cart icon not found');
        isAnimating = false;
        return;
      }
      
      // Determine source element
      let sourceElement = sourceImageElement;
      if (!sourceElement || !sourceElement.getBoundingClientRect) {
        sourceElement = document.querySelector('.product-card img') || document.body;
      }
      
      const startRect = sourceElement.getBoundingClientRect();
      
      // Create and position clone
      const clone = createFlyingClone(productImageSrc || sourceElement.src, productName);
      document.body.appendChild(clone);
      
      positionCloneAtSource(clone, sourceElement);
      
      // Animate to cart
      await animateCloneToCart(clone, startRect, cartPosition);
      
      // Bounce cart icon
      animateCartBounce();
      
    } catch (error) {
      console.error('Fly animation error:', error);
    } finally {
      isAnimating = false;
    }
  }
  
  /**
   * Find product image from event target
   */
  function findProductImageFromEvent(event) {
    const target = event.target;
    let productCard = target.closest('.product-card');
    
    if (!productCard) {
      productCard = target.closest('.quick-item-card');
    }
    
    if (productCard) {
      const img = productCard.querySelector('img');
      return img;
    }
    
    return null;
  }
  
  // ---------- PRODUCT CARD RENDERING ----------
  window.OKMart.renderProductCard = (product) => {
    const discount = window.OKMart.calculateDiscount(product.price, product.mrp);
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    card.dataset.productImage = product.image;
    card.dataset.productName = product.name;
    
    // Image
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.className = 'product-image';
    img.loading = 'lazy';
    
    // Name
    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name;
    
    // Unit
    const unitSpan = document.createElement('span');
    unitSpan.className = 'product-unit';
    unitSpan.textContent = product.unit || '';
    
    // Price container
    const priceDiv = document.createElement('div');
    priceDiv.className = 'price-container';
    
    const currPrice = document.createElement('span');
    currPrice.className = 'current-price';
    currPrice.textContent = `₹${product.price}`;
    
    const mrpSpan = document.createElement('span');
    mrpSpan.className = 'mrp-price';
    mrpSpan.textContent = product.mrp ? `₹${product.mrp}` : '';
    
    priceDiv.appendChild(currPrice);
    if (product.mrp && product.mrp > product.price) {
      priceDiv.appendChild(mrpSpan);
    }
    
    if (discount > 0) {
      const discountBadge = document.createElement('span');
      discountBadge.className = 'discount-badge';
      discountBadge.textContent = `${discount}% OFF`;
      priceDiv.appendChild(discountBadge);
    }
    
    // Button
    const btn = document.createElement('button');
    btn.className = 'add-to-cart-btn';
    btn.textContent = 'Add to cart';
    btn.setAttribute('aria-label', `Add ${product.name} to cart`);
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Trigger fly animation
      const productImage = card.querySelector('.product-image');
      if (productImage) {
        flyToCart(productImage, product.image, product.name);
      }
      
      // Dispatch add to cart event
      window.dispatchEvent(new CustomEvent('okmart:add-to-cart', { detail: product }));
    });
    
    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(unitSpan);
    card.appendChild(priceDiv);
    card.appendChild(btn);
    
    return card;
  };
  
  // ---------- CART FUNCTIONS ----------
  function getCart() {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    updateStickyCartBar();
    window.dispatchEvent(new CustomEvent('okmart:cart-updated'));
  }
  
  function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('#cartCountPlaceholder, .cart-badge');
    badges.forEach(badge => {
      if (badge) badge.textContent = totalItems;
    });
  }
  
  window.OKMart.addToCart = (product, quantity = 1) => {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        unit: product.unit,
        quantity
      });
    }
    
    saveCart(cart);
    showAddToCartFeedback(product.name);
  };
  
  window.OKMart.getCartItems = getCart;
  
  window.OKMart.getCartCount = () => {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };
  
  window.OKMart.getCartSubtotal = () => {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  window.OKMart.clearCart = () => {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
    updateStickyCartBar();
    window.dispatchEvent(new CustomEvent('okmart:cart-updated'));
  };
  
  // ---------- ADD TO CART FEEDBACK ----------
  function showAddToCartFeedback(productName) {
    const feedback = document.createElement('div');
    feedback.className = 'cart-feedback-toast';
    feedback.innerHTML = `
      <span>🛒</span>
      <span>${productName} added to cart!</span>
    `;
    feedback.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e2a2e;
      color: white;
      padding: 12px 24px;
      border-radius: 40px;
      font-weight: 500;
      font-size: 0.9rem;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
      animation: slideUpFade 0.3s ease-out;
      white-space: nowrap;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.style.animation = 'slideDownFade 0.3s ease-in';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }
  
  // ---------- STICKY CART BAR ----------
  let stickyCartBar = null;
  
  function createStickyCartBar() {
    if (document.getElementById('stickyCartBar')) return;
    if (!shouldShowStickyCart()) return;
    
    const bar = document.createElement('div');
    bar.className = 'sticky-cart-bar';
    bar.id = 'stickyCartBar';
    bar.innerHTML = `
      <div class="cart-bar-inner">
        <div class="sticky-cart-info">
          <span class="cart-item-count-small" id="stickyCartCount">0</span>
          <span class="cart-total-small" id="stickyCartTotal">₹0</span>
        </div>
        <a href="/cart.html" class="view-cart-btn">View Cart →</a>
      </div>
    `;
    
    document.body.appendChild(bar);
    return bar;
  }
  
  function updateStickyCartBar() {
    if (!shouldShowStickyCart()) {
      if (stickyCartBar) {
        stickyCartBar.classList.remove('visible');
      }
      return;
    }
    
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (totalItems > 0) {
      if (!stickyCartBar) {
        stickyCartBar = createStickyCartBar();
      }
      
      const countEl = document.getElementById('stickyCartCount');
      const totalEl = document.getElementById('stickyCartTotal');
      
      if (countEl) countEl.textContent = totalItems;
      if (totalEl) totalEl.textContent = `₹${subtotal}`;
      
      setTimeout(() => stickyCartBar.classList.add('visible'), 10);
      
      const originalBottomBar = document.querySelector('.sticky-bottom-bar');
      if (originalBottomBar) {
        originalBottomBar.style.display = 'none';
      }
    } else {
      if (stickyCartBar) {
        stickyCartBar.classList.remove('visible');
      }
      const originalBottomBar = document.querySelector('.sticky-bottom-bar');
      if (originalBottomBar) {
        originalBottomBar.style.display = 'block';
      }
    }
  }
  
  window.OKMart.updateStickyCartBar = updateStickyCartBar;
  
  // Expose fly animation for manual use
  window.OKMart.flyToCart = flyToCart;
  
  // ---------- EVENT LISTENERS ----------
  window.addEventListener('okmart:add-to-cart', (e) => {
    window.OKMart.addToCart(e.detail);
  });
  
  // ---------- ADD ANIMATION STYLES ----------
  function addGlobalStyles() {
    if (document.getElementById('okmartGlobalStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'okmartGlobalStyles';
    style.textContent = `
      @keyframes slideUpFade {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      
      @keyframes slideDownFade {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
      }
      
      /* Fly to cart clone styles */
      .fly-to-cart-clone {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        will-change: transform, opacity, width, height;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        opacity: 1;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      }
      
      .fly-to-cart-clone img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      
      /* Cart icon ready for animation */
      .cart-icon-link {
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        will-change: transform;
      }
      
      .sticky-cart-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        padding: 12px 16px;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
        z-index: 200;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-top: 2px solid #2ecc71;
      }
      
      .sticky-cart-bar.visible {
        transform: translateY(0);
      }
      
      .sticky-cart-bar .cart-bar-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .sticky-cart-info {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
      
      .cart-item-count-small {
        background: #2ecc71;
        color: white;
        padding: 2px 8px;
        border-radius: 40px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      
      .cart-total-small {
        font-weight: 700;
        font-size: 1.1rem;
      }
      
      .view-cart-btn {
        background: #2ecc71;
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 40px;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
      }
      
      .view-cart-btn:active {
        transform: scale(0.95);
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
      }
      
      .call-icon {
        font-size: 28px;
      }
      
      @keyframes pulse-call {
        0%, 100% { box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3); }
        50% { box-shadow: 0 8px 30px rgba(37, 211, 102, 0.5); }
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
  document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    
    if (shouldShowStickyCart()) {
      updateStickyCartBar();
    } else {
      const existingBar = document.getElementById('stickyCartBar');
      if (existingBar) {
        existingBar.style.display = 'none';
      }
    }

    // Add to common.js - Manual PWA install trigger
window.OKMart.installApp = function() {
  if (window.installPWA) {
    window.installPWA();
  } else {
    alert('To install the app, use the "Add to Home Screen" option in your browser menu.');
  }
};
    addGlobalStyles();
  });
  
})();


// Add this to common.js - Product Share Functionality

// Generate share link for a product
window.OKMart.generateShareLink = (product) => {
  const baseUrl = window.location.origin;
  const productName = encodeURIComponent(product.name.toLowerCase());
  return `${baseUrl}/search.html?query=${productName}&add=true&id=${product.id}`;
};

// Share product via WhatsApp
window.OKMart.shareProduct = (product) => {
  const shareLink = window.OKMart.generateShareLink(product);
  const message = `🛒 *Check this product on OK Mart!*\n\n${product.name}\n💰 ₹${product.price} ${product.mrp > product.price ? `(MRP ₹${product.mrp})` : ''}\n\nOrder now 👇\n${shareLink}`;
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};

// Copy share link to clipboard
window.OKMart.copyShareLink = async (product) => {
  const shareLink = window.OKMart.generateShareLink(product);
  
  try {
    await navigator.clipboard.writeText(shareLink);
    window.OKMart.showToast?.('Link copied! Share with friends', 'success');
  } catch (err) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = shareLink;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    window.OKMart.showToast?.('Link copied!', 'success');
  }
};

// Add share button to product card
const originalRenderProductCard = window.OKMart.renderProductCard;
window.OKMart.renderProductCard = (product) => {
  const card = originalRenderProductCard(product);
  
  // Add share button
  const shareBtn = document.createElement('button');
  shareBtn.className = 'share-product-btn';
  shareBtn.innerHTML = '📤';
  shareBtn.setAttribute('aria-label', 'Share product');
  shareBtn.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: white;
    border: 1px solid var(--border-light);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1rem;
    z-index: 3;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s;
  `;
  
  shareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Show share options
    showShareOptions(product, shareBtn);
  });
  
  card.style.position = 'relative';
  card.appendChild(shareBtn);
  
  return card;
};

// Show share options popup
function showShareOptions(product, triggerElement) {
  const rect = triggerElement.getBoundingClientRect();
  
  const popup = document.createElement('div');
  popup.className = 'share-options-popup';
  popup.style.cssText = `
    position: fixed;
    top: ${rect.bottom + 8}px;
    right: ${window.innerWidth - rect.right}px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    padding: 8px;
    z-index: 1000;
    display: flex;
    gap: 8px;
    border: 1px solid var(--border-light);
  `;
  
  popup.innerHTML = `
    <button class="share-option" data-action="whatsapp" style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #25D366;
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    ">
      <span>💬</span> WhatsApp
    </button>
    <button class="share-option" data-action="copy" style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--bg-light);
      color: var(--text-dark);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    ">
      <span>📋</span> Copy Link
    </button>
  `;
  
  document.body.appendChild(popup);
  
  // Handle option clicks
  popup.querySelector('[data-action="whatsapp"]').addEventListener('click', () => {
    window.OKMart.shareProduct(product);
    popup.remove();
  });
  
  popup.querySelector('[data-action="copy"]').addEventListener('click', () => {
    window.OKMart.copyShareLink(product);
    popup.remove();
  });
  
  // Close on outside click
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!popup.contains(e.target) && e.target !== triggerElement) {
        popup.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 10);
}

// Toast notification helper
window.OKMart.showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = 'share-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#10b981' : '#1e2a2e'};
    color: white;
    padding: 12px 24px;
    border-radius: 40px;
    font-weight: 500;
    z-index: 1001;
    animation: slideUp 0.3s ease-out;
    white-space: nowrap;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};


// Add this function to common.js for share functionality

// Generate share link
window.OKMart.generateShareLink = (productId) => {
  return `${window.location.origin}/product.html?id=${productId}`;
};

// Share via WhatsApp
window.OKMart.shareViaWhatsApp = (product) => {
  const link = window.OKMart.generateShareLink(product.id);
  const message = `🛒 *Check this product on OK Mart!*\n\n*${product.name}*\n💰 ₹${product.price}${product.mrp ? ` (MRP ₹${product.mrp})` : ''}\n\nOrder now 👇\n${link}`;
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

// Copy link to clipboard
window.OKMart.copyShareLink = async (productId) => {
  const link = window.OKMart.generateShareLink(productId);
  try {
    await navigator.clipboard.writeText(link);
    window.OKMart.showToast('Link copied to clipboard!', 'success');
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = link;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    window.OKMart.showToast('Link copied!', 'success');
  }
};

// Show share options popup
window.OKMart.showShareOptions = (product, event) => {
  event.stopPropagation();
  
  const existingPopup = document.querySelector('.share-popup');
  if (existingPopup) existingPopup.remove();
  
  const popup = document.createElement('div');
  popup.className = 'share-popup';
  
  const rect = event.target.getBoundingClientRect();
  popup.style.cssText = `
    position: fixed;
    top: ${rect.bottom + 8}px;
    left: ${rect.left}px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    padding: 8px;
    z-index: 1000;
    display: flex;
    gap: 8px;
    border: 1px solid #e5e7eb;
  `;
  
  popup.innerHTML = `
    <button class="share-option-btn" data-action="whatsapp" style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #25D366;
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    ">
      <span>💬</span> WhatsApp
    </button>
    <button class="share-option-btn" data-action="copy" style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #f8fafc;
      color: #1a1e2b;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    ">
      <span>📋</span> Copy Link
    </button>
  `;
  
  document.body.appendChild(popup);
  
  popup.querySelector('[data-action="whatsapp"]').addEventListener('click', () => {
    window.OKMart.shareViaWhatsApp(product);
    popup.remove();
  });
  
  popup.querySelector('[data-action="copy"]').addEventListener('click', () => {
    window.OKMart.copyShareLink(product.id);
    popup.remove();
  });
  
  // Close on outside click
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 10);
};

// Toast notification
window.OKMart.showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = 'share-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#10b981' : '#1a1e2b'};
    color: white;
    padding: 12px 24px;
    border-radius: 40px;
    font-weight: 500;
    z-index: 1001;
    animation: slideUp 0.3s ease-out;
    white-space: nowrap;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

// Add animation style
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  .share-product-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1rem;
    z-index: 3;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    transition: all 0.15s;
  }
  .share-product-btn:active {
    background: #e8f8ef;
    transform: scale(0.9);
  }
`;
document.head.appendChild(style);

// Enhanced renderProductCard with share button
const originalRenderCard = window.OKMart.renderProductCard;
window.OKMart.renderProductCard = (product) => {
  const card = originalRenderCard(product);
  
  const shareBtn = document.createElement('button');
  shareBtn.className = 'share-product-btn';
  shareBtn.innerHTML = '📤';
  shareBtn.setAttribute('aria-label', 'Share product');
  
  shareBtn.addEventListener('click', (e) => {
    window.OKMart.showShareOptions(product, e);
  });
  
  card.style.position = 'relative';
  card.appendChild(shareBtn);
  
  // Make card clickable to product page
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.share-product-btn') && !e.target.closest('.add-to-cart-btn')) {
      window.location.href = `/product.html?id=${product.id}`;
    }
  });
  
  return card;
};
