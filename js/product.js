// ===== OK MART - PRODUCT.JS =====
// Complete product page with clear add to cart

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const JSON_FILES = ['fruits', 'dairy', 'snacks', 'beverages', 'electronics', 'grocery', 'offers'];
  
  let allProducts = [];
  let currentProduct = null;
  let quantity = 1;
  
  // DOM Elements
  const loadingState = document.getElementById('loadingState');
  const productContent = document.getElementById('productContent');
  const errorState = document.getElementById('errorState');
  
  const productImage = document.getElementById('productImage');
  const productName = document.getElementById('productName');
  const productUnit = document.getElementById('productUnit');
  const productPrice = document.getElementById('productPrice');
  const productMrp = document.getElementById('productMrp');
  const discountBadge = document.getElementById('discountBadge');
  const savingsAmount = document.getElementById('savingsAmount');
  const productDescription = document.getElementById('productDescription');
  const relatedGrid = document.getElementById('relatedGrid');
  
  // Quantity and Add to Cart
  const quantityInline = document.getElementById('quantityInline');
  const qtyMinusInline = document.getElementById('qtyMinusInline');
  const qtyPlusInline = document.getElementById('qtyPlusInline');
  const addToCartPrimaryBtn = document.getElementById('addToCartPrimaryBtn');
  const itemTotalPrimary = document.getElementById('itemTotalPrimary');
  
  // Sticky bar
  const stickyAddBar = document.getElementById('stickyAddBar');
  const stickyProductName = document.getElementById('stickyProductName');
  const stickyProductPrice = document.getElementById('stickyProductPrice');
  const stickyAddBtn = document.getElementById('stickyAddBtn');
  const stickyItemTotal = document.getElementById('stickyItemTotal');
  
  // Header
  const headerWishlistBtn = document.getElementById('headerWishlistBtn');
  const headerWishlistIcon = document.getElementById('headerWishlistIcon');
  const headerShareBtn = document.getElementById('headerShareBtn');
  
  const toastMessage = document.getElementById('toastMessage');
  const pageTitle = document.getElementById('pageTitle');
  
  // Meta tags
  const ogUrl = document.getElementById('ogUrl');
  const ogTitle = document.getElementById('ogTitle');
  const ogDescription = document.getElementById('ogDescription');
  const ogImage = document.getElementById('ogImage');
  
  // ---------- DATA LOADING ----------
  
  async function loadAllProducts() {
    const products = [];
    
    for (const cat of JSON_FILES) {
      try {
        const response = await fetch(`/data/${cat}.json`);
        if (response.ok) {
          const data = await response.json();
          if (data.products) {
            products.push(...data.products);
          }
        }
      } catch (e) {
        console.warn(`Could not load ${cat}.json`);
      }
    }
    
    return products;
  }
  
  function getProductById(id) {
    return allProducts.find(p => p.id === id);
  }
  
  function getRelatedProducts(category, excludeId) {
    if (!category) return [];
    
    return allProducts
      .filter(p => p.category === category && p.id !== excludeId)
      .slice(0, 6);
  }
  
  // ---------- RENDERING ----------
  
  function renderProduct() {
    if (!currentProduct) {
      loadingState.style.display = 'none';
      errorState.style.display = 'block';
      return;
    }
    
    // Update page title
    document.title = `${currentProduct.name} | OK Mart`;
    if (pageTitle) pageTitle.textContent = currentProduct.name;
    
    // Update meta tags
    const shareUrl = window.location.href;
    if (ogUrl) ogUrl.content = shareUrl;
    if (ogTitle) ogTitle.content = currentProduct.name;
    if (ogDescription) ogDescription.content = `Buy ${currentProduct.name} at OK Mart. Fast delivery.`;
    if (ogImage) ogImage.content = currentProduct.image;
    
    // Product details
    productImage.src = currentProduct.image;
    productImage.alt = currentProduct.name;
    productName.textContent = currentProduct.name;
    productUnit.textContent = currentProduct.unit || 'Fresh Product';
    productPrice.textContent = `₹${currentProduct.price}`;
    
    const discount = currentProduct.mrp ? Math.round(((currentProduct.mrp - currentProduct.price) / currentProduct.mrp) * 100) : 0;
    
    if (currentProduct.mrp && currentProduct.mrp > currentProduct.price) {
      productMrp.textContent = `₹${currentProduct.mrp}`;
      discountBadge.textContent = `${discount}% OFF`;
      discountBadge.style.display = 'inline-block';
      savingsAmount.textContent = `₹${currentProduct.mrp - currentProduct.price}`;
      document.getElementById('savingsInfo').style.display = 'block';
    } else {
      productMrp.textContent = '';
      discountBadge.style.display = 'none';
      document.getElementById('savingsInfo').style.display = 'none';
    }
    
    // Description
    productDescription.textContent = `Fresh and high-quality ${currentProduct.name.toLowerCase()} sourced directly from trusted suppliers.`;
    
    // Sticky bar info
    stickyProductName.textContent = currentProduct.name;
    stickyProductPrice.textContent = `₹${currentProduct.price}`;
    
    // Update wishlist heart
    updateHeaderWishlistIcon();
    
    // Update total
    updateTotal();
    
    // Render related products
    const related = getRelatedProducts(currentProduct.category, currentProduct.id);
    renderRelatedProducts(related);
    
    // Show content
    loadingState.style.display = 'none';
    productContent.style.display = 'block';
  }
  
  function renderProductCard(product) {
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
      addToCartFromCard(product);
    });
    
    return card;
  }
  
  function renderRelatedProducts(products) {
    relatedGrid.innerHTML = '';
    
    if (products.length === 0) {
      relatedGrid.innerHTML = '<p style="grid-column:1/-1;color:var(--text-muted);text-align:center;">No related products</p>';
      return;
    }
    
    products.forEach(product => {
      relatedGrid.appendChild(renderProductCard(product));
    });
  }
  
  function updateTotal() {
    if (currentProduct) {
      const total = currentProduct.price * quantity;
      itemTotalPrimary.textContent = `₹${total}`;
      stickyItemTotal.textContent = `₹${total}`;
    }
  }
  
  function updateHeaderWishlistIcon() {
    if (headerWishlistIcon && currentProduct) {
      const isInWishlist = window.OKMart?.isInWishlist?.(currentProduct.id);
      headerWishlistIcon.textContent = isInWishlist ? '❤️' : '🤍';
    }
  }
  
  // ---------- CART FUNCTIONS ----------
  
  function addToCartFromCard(product) {
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
  
  function addCurrentToCart() {
    if (!currentProduct) return;
    
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const existing = cart.find(item => item.id === currentProduct.id);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        mrp: currentProduct.mrp,
        image: currentProduct.image,
        unit: currentProduct.unit,
        quantity: quantity
      });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    showToast(`Added ${quantity} ${currentProduct.name} to cart!`, 'success');
    
    // Reset quantity
    quantity = 1;
    quantityInline.textContent = quantity;
    updateTotal();
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => {
      if (b) b.textContent = total;
    });
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
  
  // ---------- SHARE ----------
  
  function shareCurrentProduct() {
    if (!currentProduct) return;
    
    const shareUrl = window.location.href;
    const message = `🛒 *${currentProduct.name}*\n💰 ₹${currentProduct.price}\n\n${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: currentProduct.name,
        text: `Check out ${currentProduct.name} on OK Mart!`,
        url: shareUrl
      }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  }
  
  // ---------- EVENT LISTENERS ----------
  
  // Quantity controls
  qtyMinusInline.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      quantityInline.textContent = quantity;
      updateTotal();
    }
  });
  
  qtyPlusInline.addEventListener('click', () => {
    quantity++;
    quantityInline.textContent = quantity;
    updateTotal();
  });
  
  // Add to cart buttons
  addToCartPrimaryBtn.addEventListener('click', addCurrentToCart);
  stickyAddBtn.addEventListener('click', addCurrentToCart);
  
  // Wishlist
  if (headerWishlistBtn) {
    headerWishlistBtn.addEventListener('click', () => {
      if (!currentProduct) return;
      
      if (window.OKMart?.toggleWishlist) {
        const added = window.OKMart.toggleWishlist(currentProduct);
        headerWishlistIcon.textContent = added ? '❤️' : '🤍';
        showToast(added ? 'Added to wishlist!' : 'Removed from wishlist', 'success');
      }
    });
  }
  
  // Share
  if (headerShareBtn) {
    headerShareBtn.addEventListener('click', shareCurrentProduct);
  }
  
  // Show/hide sticky bar on scroll
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (!stickyAddBar) return;
    
    const primaryBtn = document.querySelector('.add-to-cart-primary-btn');
    if (!primaryBtn) return;
    
    const btnRect = primaryBtn.getBoundingClientRect();
    const isBtnVisible = btnRect.top < window.innerHeight && btnRect.bottom > 0;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (!isBtnVisible) {
        stickyAddBar.style.display = 'flex';
      } else {
        stickyAddBar.style.display = 'none';
      }
    }, 50);
  });
  
  // ---------- INITIALIZATION ----------
  
  async function init() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    
    if (!productId) {
      loadingState.style.display = 'none';
      errorState.style.display = 'block';
      return;
    }
    
    allProducts = await loadAllProducts();
    currentProduct = getProductById(productId);
    
    renderProduct();
    updateCartBadge();
  }
  
  init();
  
})();
