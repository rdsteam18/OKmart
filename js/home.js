// ===== OK MART - HOME.JS =====
// Modern home page with product detail modal

(function() {
  'use strict';
  
  // ---------- STATE ----------
  let allProducts = [];
  let currentProduct = null;
  let modalQuantity = 1;
  
  // DOM Elements
  const productGrid = document.getElementById('productGrid');
  const recommendedGrid = document.getElementById('recommendedGrid');
  const loadingState = document.getElementById('loadingState');
  const bottomCartBar = document.getElementById('bottomCartBar');
  const bottomCartCount = document.getElementById('bottomCartCount');
  const bottomCartTotal = document.getElementById('bottomCartTotal');
  
  // Modal Elements
  const modalOverlay = document.getElementById('productModalOverlay');
  const modal = document.getElementById('productModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalShareBtn = document.getElementById('modalShareBtn');
  const modalProductImage = document.getElementById('modalProductImage');
  const modalProductName = document.getElementById('modalProductName');
  const modalProductUnit = document.getElementById('modalProductUnit');
  const modalProductPrice = document.getElementById('modalProductPrice');
  const modalProductMrp = document.getElementById('modalProductMrp');
  const modalDiscountBadge = document.getElementById('modalDiscountBadge');
  const modalQtyMinus = document.getElementById('modalQtyMinus');
  const modalQtyPlus = document.getElementById('modalQtyPlus');
  const modalQtyNumber = document.getElementById('modalQtyNumber');
  const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
  const modalItemTotal = document.getElementById('modalItemTotal');
  const toastMessage = document.getElementById('toastMessage');
  
  // ---------- DATA LOADING ----------
  async function loadProducts() {
    try {
      const response = await fetch('/data/products.json');
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      allProducts = data.products || [];
      return allProducts;
    } catch (e) {
      console.error('Error loading products:', e);
      return [];
    }
  }
  
  // ---------- RENDERING ----------
  function renderProductCard(product) {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      <div class="product-rating">
        <span class="stars-small">★★★★½</span>
        <span class="rating-small">4.5</span>
      </div>
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${product.price}</span>
        ${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      </div>
      <button class="add-btn">ADD</button>
    `;
    
    // Open modal on card click
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('add-btn')) {
        openProductModal(product);
      }
    });
    
    // Add to cart from card
    card.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product, 1);
    });
    
    return card;
  }
  
  function renderProducts() {
    if (productGrid) {
      productGrid.innerHTML = '';
      allProducts.slice(0, 6).forEach(product => {
        productGrid.appendChild(renderProductCard(product));
      });
    }
    
    if (recommendedGrid) {
      recommendedGrid.innerHTML = '';
      allProducts.slice(0, 4).forEach(product => {
        const card = renderProductCard(product);
        recommendedGrid.appendChild(card);
      });
    }
  }
  
  // ---------- PRODUCT MODAL ----------
  function openProductModal(product) {
    currentProduct = product;
    modalQuantity = 1;
    
    // Update modal content
    modalProductImage.src = product.image;
    modalProductImage.alt = product.name;
    modalProductName.textContent = product.name;
    modalProductUnit.textContent = product.unit || '';
    modalProductPrice.textContent = `₹${product.price}`;
    
    if (product.mrp && product.mrp > product.price) {
      modalProductMrp.textContent = `₹${product.mrp}`;
      const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
      modalDiscountBadge.textContent = `${discount}% OFF`;
      modalDiscountBadge.style.display = 'inline-block';
    } else {
      modalProductMrp.textContent = '';
      modalDiscountBadge.style.display = 'none';
    }
    
    updateModalTotal();
    modalQtyNumber.textContent = modalQuantity;
    
    // Show modal with animation
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeProductModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
  }
  
  function updateModalTotal() {
    if (currentProduct) {
      const total = currentProduct.price * modalQuantity;
      modalItemTotal.textContent = `₹${total}`;
    }
  }
  
  // ---------- CART FUNCTIONS ----------
  function getCart() {
    const stored = localStorage.getItem('okmart_cart');
    return stored ? JSON.parse(stored) : [];
  }
  
  function saveCart(cart) {
    localStorage.setItem('okmart_cart', JSON.stringify(cart));
    updateCartUI();
  }
  
  function addToCart(product, quantity = 1) {
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
        quantity: quantity
      });
    }
    
    saveCart(cart);
    showToast(`${product.name} added to cart!`, 'success');
    
    // Close modal if open
    if (modalOverlay.classList.contains('active')) {
      closeProductModal();
    }
  }
  
  function updateCartUI() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update badges
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.textContent = totalItems;
    });
    
    // Update bottom bar
    if (bottomCartCount) {
      bottomCartCount.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    }
    if (bottomCartTotal) {
      bottomCartTotal.textContent = `₹${subtotal}`;
    }
    
    // Show/hide bottom bar
    if (bottomCartBar) {
      bottomCartBar.style.display = totalItems > 0 ? 'block' : 'none';
    }
  }
  
  function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 2500);
  }
  
  // ---------- SHARE FUNCTION ----------
  function shareProduct(product) {
    const shareText = `🛒 ${product.name}\n💰 ₹${product.price}\n\nOrder on OK Mart!`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank');
  }
  
  // ---------- EVENT LISTENERS ----------
  modalCloseBtn.addEventListener('click', closeProductModal);
  
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeProductModal();
    }
  });
  
  modalShareBtn.addEventListener('click', () => {
    if (currentProduct) {
      shareProduct(currentProduct);
    }
  });
  
  modalQtyMinus.addEventListener('click', () => {
    if (modalQuantity > 1) {
      modalQuantity--;
      modalQtyNumber.textContent = modalQuantity;
      updateModalTotal();
    }
  });
  
  modalQtyPlus.addEventListener('click', () => {
    modalQuantity++;
    modalQtyNumber.textContent = modalQuantity;
    updateModalTotal();
  });
  
  modalAddToCartBtn.addEventListener('click', () => {
    if (currentProduct) {
      addToCart(currentProduct, modalQuantity);
    }
  });
  
  // Swipe down to close
  let startY = 0;
  modal.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  });
  
  modal.addEventListener('touchmove', (e) => {
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 50) {
      closeProductModal();
    }
  });
  
  // Search functionality
  document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) {
        window.location.href = `/search.html?query=${encodeURIComponent(query)}`;
      }
    }
  });
  
  // ---------- INITIALIZATION ----------
  async function init() {
    const products = await loadProducts();
    allProducts = products;
    renderProducts();
    updateCartUI();
    
    // Hide bottom bar initially if cart empty
    const cart = getCart();
    if (bottomCartBar) {
      bottomCartBar.style.display = cart.length > 0 ? 'block' : 'none';
    }
  }
  
  init();
  
})();
