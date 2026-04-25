// ===== OK MART - PRODUCT.JS =====
// Dynamic product detail page with Firebase

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  const WISHLIST_KEY = 'okmart_wishlist';
  
  // ========== STATE ==========
  let product = null;
  let quantity = 1;
  let allProducts = []; // For related products
  
  // ========== GET PRODUCT ID FROM URL ==========
  const params = new URLSearchParams(location.search);
  const productId = params.get('id');
  
  if (!productId) {
    showError();
  }
  
  // ========== DOM ELEMENTS ==========
  const loadingState = document.getElementById('loadingState');
  const productContent = document.getElementById('productContent');
  const errorState = document.getElementById('errorState');
  
  const productImage = document.getElementById('productImage');
  const productName = document.getElementById('productName');
  const productUnit = document.getElementById('productUnit');
  const productPrice = document.getElementById('productPrice');
  const productMrp = document.getElementById('productMrp');
  const discountBadge = document.getElementById('discountBadge');
  const savingsInfo = document.getElementById('savingsInfo');
  const savingsAmount = document.getElementById('savingsAmount');
  const productDescription = document.getElementById('productDescription');
  
  const qtyNumber = document.getElementById('qtyNumber');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const itemTotal = document.getElementById('itemTotal');
  const addToCartBtn = document.getElementById('addToCartBtn');
  
  const stickyBottomBar = document.getElementById('stickyBottomBar');
  const stickyProductName = document.getElementById('stickyProductName');
  const stickyProductPrice = document.getElementById('stickyProductPrice');
  const stickyItemTotal = document.getElementById('stickyItemTotal');
  const stickyAddBtn = document.getElementById('stickyAddBtn');
  
  const headerWishlistBtn = document.getElementById('headerWishlistBtn');
  const headerWishlistIcon = document.getElementById('headerWishlistIcon');
  const headerShareBtn = document.getElementById('headerShareBtn');
  
  const relatedSlider = document.getElementById('relatedSlider');
  
  const toastMessage = document.getElementById('toastMessage');
  
  // Meta tags for sharing
  const ogUrl = document.getElementById('ogUrl');
  const ogTitle = document.getElementById('ogTitle');
  const ogDescription = document.getElementById('ogDescription');
  const ogImage = document.getElementById('ogImage');
  
  // ========== FIREBASE: LOAD PRODUCT ==========
  async function loadProduct() {
    try {
      const doc = await db.collection('products').doc(productId).get();
      
      if (!doc.exists) {
        showError();
        return;
      }
      
      product = { id: doc.id, ...doc.data() };
      renderProduct();
      loadRelatedProducts();
      
      document.getElementById('loadingState').style.display = 'none';
      document.getElementById('productContent').style.display = 'block';
      
    } catch (err) {
      console.error('Error loading product:', err);
      showError();
    }
  }
  
  async function loadRelatedProducts() {
    if (!product || !product.category) return;
    
    try {
      const snapshot = await db.collection('products')
        .where('category', '==', product.category)
        .limit(10)
        .get();
      
      relatedSlider.innerHTML = '';
      
      let count = 0;
      snapshot.forEach(doc => {
        if (doc.id !== product.id && count < 6) {
          const p = { id: doc.id, ...doc.data() };
          relatedSlider.appendChild(createMiniCard(p));
          count++;
        }
      });
      
      if (count === 0) {
        // Load any popular products if no related
        const popularSnap = await db.collection('products').where('popular', '==', true).limit(6).get();
        popularSnap.forEach(doc => {
          if (doc.id !== product.id) {
            const p = { id: doc.id, ...doc.data() };
            relatedSlider.appendChild(createMiniCard(p));
          }
        });
      }
      
    } catch (err) {
      relatedSlider.innerHTML = '<p style="color:var(--muted);padding:20px;">Could not load related products</p>';
    }
  }
  
  // ========== RENDER PRODUCT ==========
  function renderProduct() {
    // Meta tags
    const shareUrl = location.href;
    if (ogUrl) ogUrl.content = shareUrl;
    if (ogTitle) ogTitle.content = product.name;
    if (ogDescription) ogDescription.content = `Buy ${product.name} at OK Mart. Fast delivery.`;
    if (ogImage) ogImage.content = product.image;
    
    // Page title
    document.title = `${product.name} | OK Mart`;
    
    // Product details
    productImage.src = product.image;
    productImage.alt = product.name;
    productName.textContent = product.name;
    productUnit.textContent = product.unit || '';
    productPrice.textContent = `₹${product.price}`;
    
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    if (product.mrp && product.mrp > product.price) {
      productMrp.textContent = `₹${product.mrp}`;
      discountBadge.textContent = `${discount}% OFF`;
      discountBadge.style.display = 'inline-block';
      savingsAmount.textContent = `₹${product.mrp - product.price}`;
      savingsInfo.style.display = 'block';
    } else {
      productMrp.textContent = '';
      discountBadge.style.display = 'none';
      savingsInfo.style.display = 'none';
    }
    
    productDescription.textContent = product.description || 
      `Fresh and high-quality ${product.name.toLowerCase()} sourced directly from trusted suppliers. Perfect for your daily needs.`;
    
    // Sticky bar
    stickyProductName.textContent = product.name;
    stickyProductPrice.textContent = `₹${product.price}`;
    
    // Wishlist icon
    updateWishlistIcon();
    
    // Update total
    updateTotal();
  }
  
  function createMiniCard(p) {
    const discount = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=OK'">
      ${p.popular ? '<span class="product-badge">🔥</span>' : ''}
      <button class="wishlist-mini">${isInWishlist(p.id) ? '❤️' : '🤍'}</button>
      <button class="share-mini">📤</button>
      <h3 class="product-name">${p.name}</h3>
      <span class="product-unit">${p.unit || ''}</span>
      <div class="price-row">
        <span class="current-price">₹${p.price}</span>
        ${p.mrp && p.mrp > p.price ? `<span class="mrp-price">₹${p.mrp}</span>` : ''}
        ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      </div>
      <button class="add-btn">ADD</button>
    `;
    
    card.addEventListener('click', e => {
      if (!e.target.closest('button')) location.href = `/product.html?id=${p.id}`;
    });
    card.querySelector('.add-btn').addEventListener('click', e => { e.stopPropagation(); addToCart(p); });
    card.querySelector('.wishlist-mini').addEventListener('click', e => { e.stopPropagation(); toggleWishlist(p, e.target); });
    card.querySelector('.share-mini').addEventListener('click', e => { e.stopPropagation(); shareProduct(p); });
    
    return card;
  }
  
  function updateTotal() {
    if (product) {
      const total = product.price * quantity;
      itemTotal.textContent = `₹${total}`;
      stickyItemTotal.textContent = `₹${total}`;
    }
  }
  
  function updateWishlistIcon() {
    if (product && headerWishlistIcon) {
      headerWishlistIcon.textContent = isInWishlist(product.id) ? '❤️' : '🤍';
    }
  }
  
  function showError() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
  }
  
  // ========== CART ==========
  function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartUI(); }
  
  function addToCart(p, qty) {
    const cart = getCart();
    const item = p || product;
    const quantityToAdd = qty || quantity;
    const existing = cart.find(i => i.id === item.id);
    if (existing) existing.quantity += quantityToAdd;
    else cart.push({ id: item.id, name: item.name, price: item.price, mrp: item.mrp, image: item.image, unit: item.unit, quantity: quantityToAdd });
    saveCart(cart);
    showToast(`${item.name} added!`, 'success');
    quantity = 1;
    qtyNumber.textContent = quantity;
    updateTotal();
  }
  
  function updateCartUI() {
    const cart = getCart();
    const total = cart.reduce((s, i) => s + i.quantity, 0);
    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = total;
    
    const bar = document.getElementById('floatingCartBar');
    const barCount = document.getElementById('barCartCount');
    const barTotal = document.getElementById('barCartTotal');
    
    if (total > 0) {
      bar.classList.add('visible');
      if (barCount) barCount.textContent = `${total} item${total !== 1 ? 's' : ''}`;
      if (barTotal) barTotal.textContent = `₹${subtotal}`;
    } else {
      bar.classList.remove('visible');
    }
  }
  
  // ========== WISHLIST ==========
  function getWishlist() { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); }
  function isInWishlist(id) { return getWishlist().some(i => i.id === id); }
  
  function toggleWishlist(p, heartEl) {
    const item = p || product;
    const w = getWishlist();
    const idx = w.findIndex(i => i.id === item.id);
    if (idx > -1) { w.splice(idx, 1); if (heartEl) heartEl.textContent = '🤍'; showToast('Removed from wishlist'); }
    else { w.push({ id: item.id, name: item.name, price: item.price, image: item.image }); if (heartEl) heartEl.textContent = '❤️'; showToast('Added to wishlist!', 'success'); }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(w));
    updateWishlistIcon();
  }
  
  // ========== SHARE ==========
  function shareProduct(p) {
    const item = p || product;
    const url = `${location.origin}/product.html?id=${item.id}`;
    if (navigator.share) navigator.share({ title: item.name, url }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(`🛒 ${item.name}\n💰 ₹${item.price}\n${url}`)}`, '_blank');
  }
  
  // ========== TOAST ==========
  function showToast(msg, type = 'info') {
    const toast = toastMessage;
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.color = 'white';
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }
  
  // ========== EVENT LISTENERS ==========
  qtyMinus.addEventListener('click', () => { if (quantity > 1) { quantity--; qtyNumber.textContent = quantity; updateTotal(); } });
  qtyPlus.addEventListener('click', () => { quantity++; qtyNumber.textContent = quantity; updateTotal(); });
  
  addToCartBtn.addEventListener('click', () => addToCart());
  stickyAddBtn.addEventListener('click', () => addToCart());
  
  headerWishlistBtn.addEventListener('click', () => toggleWishlist());
  headerShareBtn.addEventListener('click', () => shareProduct());
  
  // Show/hide sticky bar on scroll
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const btnRect = addToCartBtn.getBoundingClientRect();
      if (btnRect.bottom < 0 || btnRect.top > window.innerHeight) {
        stickyBottomBar.classList.add('visible');
      } else {
        stickyBottomBar.classList.remove('visible');
      }
    }, 50);
  });
  
  // ========== INIT ==========
  async function init() {
    await loadProduct();
    updateCartUI();
    console.log('✅ Product page ready');
  }
  
  init();
  
})();
