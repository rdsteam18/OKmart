// ===== OK MART - WISHLIST.JS =====
// Complete wishlist page functionality

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  const JSON_FILES = ['fruits', 'dairy', 'snacks', 'beverages', 'electronics', 'grocery', 'offers'];
  
  let wishlist = [];
  let allProducts = [];
  
  // DOM Elements
  const loadingState = document.getElementById('loadingState');
  const wishlistContent = document.getElementById('wishlistContent');
  const emptyWishlistState = document.getElementById('emptyWishlistState');
  const wishlistGrid = document.getElementById('wishlistGrid');
  const suggestedGrid = document.getElementById('suggestedGrid');
  const wishlistItemCount = document.getElementById('wishlistItemCount');
  const headerWishlistCount = document.getElementById('headerWishlistCount');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const toastMessage = document.getElementById('toastMessage');
  
  // ---------- DATA LOADING ----------
  
  function loadWishlist() {
    const stored = localStorage.getItem(WISHLIST_KEY);
    wishlist = stored ? JSON.parse(stored) : [];
    return wishlist;
  }
  
  function saveWishlist(items) {
    wishlist = items;
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    updateWishlistCount();
  }
  
  async function loadPopularProducts() {
    const products = [];
    
    for (const cat of JSON_FILES.slice(0, 3)) {
      try {
        const response = await fetch(`/data/${cat}.json`);
        if (response.ok) {
          const data = await response.json();
          if (data.products) {
            const popular = data.products.filter(p => p.popular).slice(0, 2);
            products.push(...popular);
          }
        }
      } catch (e) {
        console.warn(`Could not load ${cat}.json`);
      }
    }
    
    return products.slice(0, 4);
  }
  
  // ---------- RENDERING ----------
  
  function renderWishlistCard(product) {
    const card = document.createElement('div');
    card.className = 'wishlist-product-card';
    card.dataset.productId = product.id;
    
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="wishlist-card-image" loading="lazy">
      <h3 class="wishlist-card-name">${product.name}</h3>
      <span class="wishlist-card-unit">${product.unit || ''}</span>
      <div class="wishlist-card-price">₹${product.price}</div>
      <div class="wishlist-card-actions">
        <button class="wishlist-add-cart-btn">Add to Cart</button>
        <button class="wishlist-remove-btn" aria-label="Remove from wishlist">🗑️</button>
      </div>
    `;
    
    // Add to cart
    card.querySelector('.wishlist-add-cart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product);
    });
    
    // Remove from wishlist
    card.querySelector('.wishlist-remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromWishlist(product.id);
    });
    
    // Click card to view product
    card.addEventListener('click', () => {
      window.location.href = `/product.html?id=${product.id}`;
    });
    
    return card;
  }
  
  function renderSuggestedCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.addEventListener('click', () => {
      window.location.href = `/product.html?id=${product.id}`;
    });
    
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      </div>
      <button class="add-btn">ADD</button>
    `;
    
    card.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product);
    });
    
    return card;
  }
  
  function renderWishlist() {
    wishlistGrid.innerHTML = '';
    
    if (wishlist.length === 0) {
      wishlistContent.style.display = 'none';
      emptyWishlistState.style.display = 'block';
      loadingState.style.display = 'none';
      return;
    }
    
    wishlistContent.style.display = 'block';
    emptyWishlistState.style.display = 'none';
    
    wishlist.forEach(product => {
      wishlistGrid.appendChild(renderWishlistCard(product));
    });
    
    updateWishlistCount();
    loadingState.style.display = 'none';
  }
  
  async function renderSuggestedProducts() {
    const popular = await loadPopularProducts();
    
    suggestedGrid.innerHTML = '';
    popular.forEach(product => {
      suggestedGrid.appendChild(renderSuggestedCard(product));
    });
  }
  
  function updateWishlistCount() {
    const count = wishlist.length;
    
    if (wishlistItemCount) {
      wishlistItemCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }
    
    if (headerWishlistCount) {
      headerWishlistCount.textContent = count;
      headerWishlistCount.style.display = count > 0 ? 'flex' : 'none';
    }
    
    // Also update any other wishlist badges
    document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    });
  }
  
  // ---------- CART FUNCTIONS ----------
  
  function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const existing = cart.find(item => item.id === product.id);
    
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
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    showToast(`${product.name} added to cart!`, 'success');
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => {
      if (b) b.textContent = total;
    });
  }
  
  // ---------- WISHLIST ACTIONS ----------
  
  function removeFromWishlist(productId) {
    const index = wishlist.findIndex(item => item.id === productId);
    
    if (index > -1) {
      const removedProduct = wishlist[index];
      wishlist.splice(index, 1);
      saveWishlist(wishlist);
      renderWishlist();
      showToast(`${removedProduct.name} removed from wishlist`, 'info');
    }
  }
  
  function clearAllWishlist() {
    if (wishlist.length === 0) return;
    
    if (confirm('Are you sure you want to clear your wishlist?')) {
      saveWishlist([]);
      renderWishlist();
      showToast('Wishlist cleared', 'info');
    }
  }
  
  // ---------- TOAST ----------
  
  function showToast(message, type = 'info') {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 2500);
  }
  
  // ---------- EVENT LISTENERS ----------
  
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllWishlist);
  }
  
  // ---------- INITIALIZATION ----------
  
  async function init() {
    loadWishlist();
    renderWishlist();
    await renderSuggestedProducts();
    updateCartBadge();
    
    console.log('✅ Wishlist page initialized |', wishlist.length, 'items');
  }
  
  init();
  
  // Expose for debugging
  window.OKMartWishlist = {
    getWishlist: () => wishlist,
    refresh: init
  };
  
})();
