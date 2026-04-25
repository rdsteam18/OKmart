// ===== OK MART - COMMON.JS =====
const CART_KEY = 'okmart_cart';
const WISHLIST_KEY = 'okmart_wishlist';
const USER_KEY = 'okmart_user';

// Cart Functions
window.OKMart = {
  getCart: () => JSON.parse(localStorage.getItem(CART_KEY) || '[]'),
  
  saveCart: (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.OKMart.updateCartBadge();
  },
  
  addToCart: (product, qty = 1) => {
    const cart = window.OKMart.getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) { existing.quantity += qty; }
    else { cart.push({ ...product, quantity: qty }); }
    window.OKMart.saveCart(cart);
    window.OKMart.showToast(`${product.name} added!`, 'success');
  },
  
  updateCartBadge: () => {
    const cart = window.OKMart.getCart();
    const total = cart.reduce((sum, i) => sum + i.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => b.textContent = total);
  },
  
  // Wishlist
  getWishlist: () => JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'),
  
  toggleWishlist: (product, heartEl) => {
    const wishlist = window.OKMart.getWishlist();
    const idx = wishlist.findIndex(i => i.id === product.id);
    if (idx > -1) { wishlist.splice(idx, 1); if (heartEl) heartEl.textContent = '🤍'; return false; }
    else { wishlist.push({ id: product.id, name: product.name, price: product.price, image: product.image }); if (heartEl) heartEl.textContent = '❤️'; return true; }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  },
  
  isInWishlist: (id) => window.OKMart.getWishlist().some(i => i.id === id),
  
  // Share
  shareProduct: (product) => {
    const url = `${location.origin}/product.html?id=${product.id}`;
    if (navigator.share) navigator.share({ title: product.name, url });
    else window.open(`https://wa.me/?text=${encodeURIComponent(`🛒 ${product.name}\n💰 ₹${product.price}\n${url}`)}`, '_blank');
  },
  
  // Toast
  showToast: (msg, type = 'info') => {
    const toast = document.getElementById('toastMessage') || document.createElement('div');
    if (!toast.id) { toast.id = 'toastMessage'; toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:40px;font-weight:500;z-index:999;opacity:0;transition:0.3s;white-space:nowrap;'; document.body.appendChild(toast); }
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.color = 'white';
    toast.style.opacity = '1';
    toast.style.bottom = '100px';
    setTimeout(() => { toast.style.opacity = '0'; toast.style.bottom = '80px'; }, 2500);
  },
  
  // Product Card Renderer
  renderProductCard: (product, onAdd) => {
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/200?text=OK'">
      ${product.popular ? '<span class="product-badge">🔥</span>' : ''}
      <button class="wishlist-btn">${window.OKMart.isInWishlist(product.id) ? '❤️' : '🤍'}</button>
      <button class="share-btn">📤</button>
      <h3 class="product-name">${product.name}</h3>
      <span class="product-unit">${product.unit || ''}</span>
      <div class="price-row"><span class="current-price">₹${product.price}</span>${product.mrp && product.mrp > product.price ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}</div>
      <button class="add-btn">ADD</button>
    `;
    card.addEventListener('click', e => { if (!e.target.closest('button')) location.href = `/product.html?id=${product.id}`; });
    card.querySelector('.add-btn').addEventListener('click', e => { e.stopPropagation(); window.OKMart.addToCart(product); });
    card.querySelector('.wishlist-btn').addEventListener('click', e => { e.stopPropagation(); window.OKMart.toggleWishlist(product, e.target); });
    card.querySelector('.share-btn').addEventListener('click', e => { e.stopPropagation(); window.OKMart.shareProduct(product); });
    return card;
  }
};

// Init cart badge on load
document.addEventListener('DOMContentLoaded', () => window.OKMart.updateCartBadge());
