// ===== OK MART - PRODUCT.JS =====
// Complete product page with share and related products

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
  const stickyAddBar = document.getElementById('stickyAddBar');
  
  const productImage = document.getElementById('productImage');
  const productName = document.getElementById('productName');
  const productUnit = document.getElementById('productUnit');
  const productPrice = document.getElementById('productPrice');
  const productMrp = document.getElementById('productMrp');
  const discountBadge = document.getElementById('discountBadge');
  const savingsAmount = document.getElementById('savingsAmount');
  const productDescription = document.getElementById('productDescription');
  const relatedGrid = document.getElementById('relatedGrid');
  
  const quantitySpan = document.getElementById('quantity');
  const itemTotal = document.getElementById('itemTotal');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const headerShareBtn = document.getElementById('headerShareBtn');
  
  const toastMessage = document.getElementById('toastMessage');
  const pageTitle = document.getElementById('pageTitle');
  
  // Meta tags for social sharing
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
      stickyAddBar.style.display = 'none';
      return;
    }
    
    // Update page title
    document.title = `${currentProduct.name} | OK Mart`;
    if (pageTitle) pageTitle.textContent = currentProduct.name;
    
    // Update meta tags for sharing
    const shareUrl = window.location.href;
    if (ogUrl) ogUrl.content = shareUrl;
    if (ogTitle) ogTitle.content = currentProduct.name;
    if (ogDescription) ogDescription.content = `Buy ${currentProduct.name} at OK Mart. Fast delivery in 12 minutes.`;
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
    } else {
      productMrp.textContent = '';
      discountBadge.style.display = 'none';
      document.getElementById('savingsInfo').style.display = 'none';
    }
    
    // Description
    if (currentProduct.description) {
      productDescription.textContent = currentProduct.description;
    } else {
      productDescription.textContent = `Fresh and high-quality ${currentProduct.name.toLowerCase()} sourced directly from trusted suppliers. Perfect for your daily needs.`;
    }
    
    // Render related products
    const related = getRelatedProducts(currentProduct.category, currentProduct.id);
    renderRelatedProducts(related);
    
    // Update total
    updateTotal();
    
    // Show content
    loadingState.style.display = 'none';
    productContent.style.display = 'block';
    stickyAddBar.style.display = 'flex';
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
      relatedGrid.innerHTML = '<p style="grid-column:1/-1;color:var(--text-muted);">No related products</p>';
      return;
    }
    
    products.forEach(product => {
      relatedGrid.appendChild(renderProductCard(product));
    });
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
    
    quantity = 1;
    quantitySpan.textContent = quantity;
    updateTotal();
  }
  
  function updateTotal() {
    if (currentProduct) {
      itemTotal.textContent = `₹${currentProduct.price * quantity}`;
    }
  }
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => {
      if (b) b.textContent = total;
    });
  }
  
  // ---------- SHARE FUNCTIONS ----------
  
  function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    setTimeout(() => toastMessage.classList.remove('show'), 2500);
  }
  
  function shareCurrentProduct() {
    if (!currentProduct) return;
    
    const shareUrl = window.location.href;
    const message = `🛒 *Check this product on OK Mart!*\n\n*${currentProduct.name}*\n💰 ₹${currentProduct.price}${currentProduct.mrp ? ` (MRP ₹${currentProduct.mrp})` : ''}\n\nOrder now 👇\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // Show share options
    showShareOptions(shareUrl, currentProduct);
  }
  
  function showShareOptions(shareUrl, product) {
    const popup = document.createElement('div');
    popup.className = 'share-popup';
    popup.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      padding: 16px;
      z-index: 1000;
      display: flex;
      gap: 16px;
      border: 1px solid #e5e7eb;
    `;
    
    popup.innerHTML = `
      <button class="share-popup-btn" data-action="whatsapp" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 12px 20px;
        border-radius: 16px;
        transition: background 0.15s;
      ">
        <span style="font-size: 2rem;">💬</span>
        <span style="font-weight: 600;">WhatsApp</span>
      </button>
      <button class="share-popup-btn" data-action="copy" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 12px 20px;
        border-radius: 16px;
        transition: background 0.15s;
      ">
        <span style="font-size: 2rem;">📋</span>
        <span style="font-weight: 600;">Copy Link</span>
      </button>
    `;
    
    document.body.appendChild(popup);
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'share-popup-overlay active';
    overlay.addEventListener('click', () => {
      popup.remove();
      overlay.remove();
    });
    document.body.appendChild(overlay);
    
    popup.querySelector('[data-action="whatsapp"]').addEventListener('click', () => {
      const message = `🛒 *${product.name}*\n💰 ₹${product.price}\n\n${shareUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      popup.remove();
      overlay.remove();
    });
    
    popup.querySelector('[data-action="copy"]').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard!', 'success');
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Link copied!', 'success');
      }
      popup.remove();
      overlay.remove();
    });
  }
  
  // ---------- EVENT LISTENERS ----------
  
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
  
  addToCartBtn.addEventListener('click', addCurrentToCart);
  
  headerShareBtn.addEventListener('click', shareCurrentProduct);
  
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
