// ===== OK MART - COMMON.JS =====
// reusable utilities & product data management

(function() {
  // ---------- GLOBAL STATE ----------
  window.OKMart = window.OKMart || {};
  
  // cached products
  let cachedProducts = null;
  
  // cart (simple localStorage)
  const CART_KEY = 'okmart_cart';
  
  // ---------- FETCH PRODUCTS (cached) ----------
  async function fetchProducts() {
    if (cachedProducts) {
      return cachedProducts;
    }
    try {
      const response = await fetch('/data/products.json');
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      cachedProducts = data.products;
      return cachedProducts;
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }
  
  window.OKMart.getProducts = fetchProducts;
  
  // ---------- GET PRODUCTS BY CATEGORY ----------
  window.OKMart.getProductsByCategory = async (categorySlug) => {
    const products = await fetchProducts();
    return products.filter(p => p.category === categorySlug);
  };
  
  // ---------- GET POPULAR PRODUCTS ----------
  window.OKMart.getPopularProducts = async () => {
    const products = await fetchProducts();
    return products.filter(p => p.popular === true);
  };
  
  // ---------- CALCULATE DISCOUNT ----------
  window.OKMart.calculateDiscount = (price, mrp) => {
    if (mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };
  
  // ---------- RENDER PRODUCT CARD (reusable) ----------
  window.OKMart.renderProductCard = (product) => {
    const discount = window.OKMart.calculateDiscount(product.price, product.mrp);
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    
    // image
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.className = 'product-image';
    img.loading = 'lazy';
    
    // name
    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name;
    
    // unit
    const unitSpan = document.createElement('span');
    unitSpan.className = 'product-unit';
    unitSpan.textContent = product.unit || '';
    
    // price container
    const priceDiv = document.createElement('div');
    priceDiv.className = 'price-container';
    
    const currPrice = document.createElement('span');
    currPrice.className = 'current-price';
    currPrice.textContent = `₹${product.price}`;
    
    const mrpSpan = document.createElement('span');
    mrpSpan.className = 'mrp-price';
    mrpSpan.textContent = `₹${product.mrp}`;
    
    priceDiv.appendChild(currPrice);
    priceDiv.appendChild(mrpSpan);
    
    if (discount > 0) {
      const discountBadge = document.createElement('span');
      discountBadge.className = 'discount-badge';
      discountBadge.textContent = `${discount}% OFF`;
      priceDiv.appendChild(discountBadge);
    }
    
    // button
    const btn = document.createElement('button');
    btn.className = 'add-to-cart-btn';
    btn.textContent = 'Add to cart';
    btn.setAttribute('aria-label', `Add ${product.name} to cart`);
    
    // (cart logic will be added by cart.js, but we attach product id)
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // dispatch custom event for cart addition
      window.dispatchEvent(new CustomEvent('okmart:add-to-cart', { detail: product }));
    });
    
    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(unitSpan);
    card.appendChild(priceDiv);
    card.appendChild(btn);
    
    return card;
  };
  
  // ---------- CART UTILS (simple) ----------
  function getCart() {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
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
        image: product.image,
        unit: product.unit,
        quantity
      });
    }
    saveCart(cart);
  };
  
  window.OKMart.getCartItems = getCart;
  window.OKMart.clearCart = () => {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
  };
  
  // Listen to add-to-cart event
  window.addEventListener('okmart:add-to-cart', (e) => {
    window.OKMart.addToCart(e.detail);
  });
  
  // initial badge update
  document.addEventListener('DOMContentLoaded', updateCartBadge);
})();

// Add to common.js (append to existing cart section)

// Get cart item count
window.OKMart.getCartCount = () => {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
};

// Check if product is in cart
window.OKMart.isInCart = (productId) => {
  const cart = getCart();
  return cart.some(item => item.id === productId);
};

// Get cart subtotal
window.OKMart.getCartSubtotal = () => {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// Update cart badge immediately
document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badges = document.querySelectorAll('#cartCountPlaceholder, .cart-badge');
  badges.forEach(badge => {
    if (badge) badge.textContent = totalItems;
  });
});


// Add to common.js - Enhanced Add to Cart with visual feedback

// Show floating notification when item added to cart
window.OKMart.showAddToCartFeedback = (productName) => {
  // Create floating element
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
    background: var(--text-dark);
    color: white;
    padding: 12px 24px;
    border-radius: 40px;
    font-weight: 500;
    font-size: 0.9rem;
    z-index: 1000;
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
};

// Add animation styles dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUpFade {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes slideDownFade {
    from { opacity: 1; transform: translateX(-50%) translateY(0); }
    to { opacity: 0; transform: translateX(-50%) translateY(20px); }
  }
`;
document.head.appendChild(style);

// Override addToCart to include feedback
const originalAddToCart = window.OKMart.addToCart;
window.OKMart.addToCart = (product, quantity = 1) => {
  originalAddToCart(product, quantity);
  window.OKMart.showAddToCartFeedback(product.name);
};

// Listen to add-to-cart event for feedback
window.addEventListener('okmart:add-to-cart', (e) => {
  window.OKMart.showAddToCartFeedback(e.detail.name);
});


// ===== STICKY CART BAR =====

// Create sticky cart bar element
function createStickyCartBar() {
  if (document.querySelector('.sticky-cart-bar')) return;
  
  const bar = document.createElement('div');
  bar.className = 'sticky-cart-bar';
  bar.id = 'stickyCartBar';
  bar.innerHTML = `
    <div class="cart-bar-inner">
      <div class="sticky-cart-info">
        <span class="cart-item-count-small" id="stickyCartCount">0</span>
        <span class="cart-total-small" id="stickyCartTotal">₹0</span>
      </div>
      <a href="cart.html" class="view-cart-btn">View Cart →</a>
    </div>
  `;
  
  document.body.appendChild(bar);
  return bar;
}

// Update sticky cart bar visibility and content
function updateStickyCartBar() {
  const cart = OKMart.getCartItems();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let bar = document.getElementById('stickyCartBar');
  
  if (totalItems > 0) {
    if (!bar) {
      bar = createStickyCartBar();
    }
    
    // Update content
    const countEl = document.getElementById('stickyCartCount');
    const totalEl = document.getElementById('stickyCartTotal');
    
    if (countEl) countEl.textContent = totalItems;
    if (totalEl) totalEl.textContent = `₹${subtotal}`;
    
    // Show bar with animation
    setTimeout(() => bar.classList.add('visible'), 10);
  } else {
    if (bar) {
      bar.classList.remove('visible');
    }
  }
}

// Listen to cart updates
window.addEventListener('okmart:cart-updated', updateStickyCartBar);
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(updateStickyCartBar, 100);
});

// Export function
window.OKMart.updateStickyCartBar = updateStickyCartBar;
