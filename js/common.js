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
