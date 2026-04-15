// ===== OK MART - HOME V2.JS =====

(function() {
  'use strict';
  
  let allProducts = [];
  
  const offersGrid = document.getElementById('offersGrid');
  const popularGrid = document.getElementById('popularGrid');
  const searchInput = document.getElementById('searchInput');
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  
  // Load offers from offers.json
  async function loadOffers() {
    try {
      const response = await fetch('/data/offers.json');
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Error loading offers:', error);
      return [];
    }
  }
  
  // Load popular products from multiple categories
  async function loadPopularProducts() {
    const categories = ['fruits', 'dairy', 'snacks', 'beverages', 'electronics', 'grocery'];
    const popularProducts = [];
    
    for (const cat of categories) {
      try {
        const response = await fetch(`/data/${cat}.json`);
        const data = await response.json();
        const popular = data.products.filter(p => p.popular).slice(0, 2);
        popularProducts.push(...popular);
      } catch (e) {
        console.warn(`Could not load ${cat}:`, e);
      }
    }
    
    return popularProducts.slice(0, 8);
  }
  
  // Render offers
  async function renderOffers() {
    const offers = await loadOffers();
    
    if (offersGrid) {
      offersGrid.innerHTML = '';
      
      offers.slice(0, 4).forEach(product => {
        const card = window.OKMart.renderProductCard(product);
        
        const offerBadge = document.createElement('span');
        offerBadge.className = 'offer-badge';
        offerBadge.textContent = product.offerTag || 'OFFER';
        offerBadge.style.cssText = 'position:absolute;top:8px;right:8px;background:#ef4444;color:white;padding:4px 10px;border-radius:40px;font-size:0.65rem;font-weight:600;z-index:2;';
        card.style.position = 'relative';
        card.appendChild(offerBadge);
        
        offersGrid.appendChild(card);
      });
    }
  }
  
  // Render popular products
  async function renderPopularProducts() {
    const popular = await loadPopularProducts();
    
    if (popularGrid) {
      popularGrid.innerHTML = '';
      
      popular.forEach(product => {
        const card = window.OKMart.renderProductCard(product);
        
        const badge = document.createElement('span');
        badge.className = 'product-badge';
        badge.textContent = '🔥 Popular';
        badge.style.cssText = 'position:absolute;top:8px;left:8px;background:#27ae60;color:white;padding:4px 10px;border-radius:40px;font-size:0.65rem;font-weight:600;z-index:2;';
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
        
        popularGrid.appendChild(card);
      });
    }
  }
  
  // Search functionality
  if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', () => {
      const query = searchInput?.value.trim();
      if (query) {
        window.location.href = `/search.html?query=${encodeURIComponent(query)}`;
      }
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          window.location.href = `/search.html?query=${encodeURIComponent(query)}`;
        }
      }
    });
    
    searchInput.addEventListener('input', (e) => {
      clearSearchBtn?.classList.toggle('visible', e.target.value.length > 0);
    });
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      clearSearchBtn.classList.remove('visible');
    });
  }
  
  // Initialize
  async function init() {
    await renderOffers();
    await renderPopularProducts();
    
    if (window.OKMart) {
      const cart = window.OKMart.getCartItems();
      const badges = document.querySelectorAll('.cart-badge');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      badges.forEach(badge => { if (badge) badge.textContent = totalItems; });
    }
  }
  
  init();
})();
