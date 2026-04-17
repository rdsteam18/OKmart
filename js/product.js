(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const JSON_FILES = ['fruits', 'dairy', 'snacks', 'beverages', 'electronics', 'grocery', 'offers'];
  
  let allProducts = [];
  let currentProduct = null;
  let quantity = 1;
  
  const loadingState = document.getElementById('loadingState');
  const productContent = document.getElementById('productContent');
  const errorState = document.getElementById('errorState');
  const productImage = document.getElementById('productImage');
  const productName = document.getElementById('productName');
  const productUnit = document.getElementById('productUnit');
  const productPrice = document.getElementById('productPrice');
  const productMrp = document.getElementById('productMrp');
  const discountBadge = document.getElementById('discountBadge');
  const relatedGrid = document.getElementById('relatedGrid');
  const quantitySpan = document.getElementById('quantity');
  const itemTotal = document.getElementById('itemTotal');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const toastMessage = document.getElementById('toastMessage');
  
  async function loadAllProducts() {
    const products = [];
    for (const cat of JSON_FILES) {
      try {
        const response = await fetch(`/data/${cat}.json`);
        if (response.ok) {
          const data = await response.json();
          if (data.products) products.push(...data.products);
        }
      } catch (e) {}
    }
    return products;
  }
  
  function getProductById(id) {
    return allProducts.find(p => p.id === id);
  }
  
  function getRelatedProducts(category, excludeId) {
    return allProducts
      .filter(p => p.category === category && p.id !== excludeId)
      .slice(0, 4);
  }
  
  function renderProduct() {
    if (!currentProduct) {
      loadingState.style.display = 'none';
      errorState.style.display = 'block';
      return;
    }
    
    productImage.src = currentProduct.image;
    productImage.alt = currentProduct.name;
    productName.textContent = currentProduct.name;
    productUnit.textContent = currentProduct.unit || '';
    productPrice.textContent = `₹${currentProduct.price}`;
    
    const discount = currentProduct.mrp ? Math.round(((currentProduct.mrp - currentProduct.price) / currentProduct.mrp) * 100) : 0;
    
    if (currentProduct.mrp && currentProduct.mrp > currentProduct.price) {
      productMrp.textContent = `₹${currentProduct.mrp}`;
      discountBadge.textContent = `${discount}% OFF`;
      discountBadge.style.display = 'inline-block';
    } else {
      productMrp.textContent = '';
      discountBadge.style.display = 'none';
    }
    
    updateTotal();
    
    // Render related
    const related = getRelatedProducts(currentProduct.category, currentProduct.id);
    relatedGrid.innerHTML = '';
    related.forEach(product => {
      const card = renderProductCard(product);
      relatedGrid.appendChild(card);
    });
    
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
  
  function addToCartFromCard(product) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    showToast(`${product.name} added!`);
  }
  
  function updateTotal() {
    if (currentProduct) {
      itemTotal.textContent = `₹${currentProduct.price * quantity}`;
    }
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => b.textContent = total);
  }
  
  function showToast(message) {
    toastMessage.textContent = message;
    toastMessage.classList.add('show');
    setTimeout(() => toastMessage.classList.remove('show'), 2000);
  }
  
  // Event Listeners
  qtyMinus.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      quantitySpan.textContent = quantity;
      updateTotal();
    }
  });
  
  qtyPlus.addEventListener('click', () => {
    quantity++;
    quantitySpan.textContent = quantity;
    updateTotal();
  });
  
  addToCartBtn.addEventListener('click', () => {
    if (!currentProduct) return;
    
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const existing = cart.find(item => item.id === currentProduct.id);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ ...currentProduct, quantity });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    showToast(`Added ${quantity} ${currentProduct.name} to cart!`);
    
    quantity = 1;
    quantitySpan.textContent = quantity;
    updateTotal();
  });
  
  // Init
  async function init() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    
    allProducts = await loadAllProducts();
    
    if (productId) {
      currentProduct = getProductById(productId);
    }
    
    renderProduct();
    updateCartBadge();
  }
  
  init();
})();
