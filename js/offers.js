// ===== OK MART - OFFERS.JS =====
// Dynamic offers page with coupon copy functionality

(function() {
  'use strict';
  
  // ---------- STATE ----------
  let allOffers = [];
  
  // DOM Elements
  const offersGrid = document.getElementById('offersGrid');
  const offersLoadingState = document.getElementById('offersLoadingState');
  const emptyState = document.getElementById('emptyState');
  const offersCount = document.getElementById('offersCount');
  const toastMessage = document.getElementById('toastMessage');
  
  // Offer type icons
  const typeIcons = {
    'discount': '💰',
    'freebie': '🎁',
    'delivery': '🚚',
    'bogo': '🎉',
    'cashback': '💵'
  };
  
  // ---------- DATA LOADING ----------
  
  async function loadOffers() {
    try {
      const response = await fetch('/data/offers.json');
      if (!response.ok) throw new Error('Failed to load offers');
      const data = await response.json();
      allOffers = data.offers || [];
      return allOffers;
    } catch (error) {
      console.error('Error loading offers:', error);
      return [];
    }
  }
  
  // ---------- RENDERING ----------
  
  function renderOfferCard(offer) {
    const card = document.createElement('div');
    card.className = 'offer-card';
    card.dataset.offerId = offer.id;
    
    const icon = typeIcons[offer.type] || '🏷️';
    
    card.innerHTML = `
      ${offer.badge ? `<span class="offer-badge" style="background: ${offer.badgeColor || '#ef4444'};">${offer.badge}</span>` : ''}
      
      <div class="offer-header">
        <div class="offer-icon">${icon}</div>
        <div class="offer-title-section">
          <h3 class="offer-title">${offer.title}</h3>
          <span class="offer-type">${offer.type || 'Offer'}</span>
        </div>
      </div>
      
      <p class="offer-description">${offer.description}</p>
      
      <div class="offer-details">
        <span class="detail-item">
          <span class="detail-icon">🛒</span>
          Min. Order: ₹${offer.minOrder}
        </span>
        ${offer.code ? `
          <span class="detail-item">
            <span class="detail-icon">🏷️</span>
            Use Code: ${offer.code}
          </span>
        ` : ''}
      </div>
      
      ${offer.code ? `
        <div class="coupon-section">
          <div class="coupon-code" data-code="${offer.code}">${offer.code}</div>
          <button class="copy-btn" data-code="${offer.code}">
            <span>📋</span> Copy
          </button>
        </div>
      ` : ''}
      
      <div class="offer-footer">
        <span class="offer-expiry">
          <span>⏰</span> ${offer.expiry || 'Limited time'}
        </span>
        ${offer.terms ? `
          <span class="offer-terms">Terms & Conditions</span>
          <div class="terms-tooltip">${offer.terms}</div>
        ` : ''}
      </div>
    `;
    
    // Add event listeners
    const couponCode = card.querySelector('.coupon-code');
    const copyBtn = card.querySelector('.copy-btn');
    
    if (couponCode) {
      couponCode.addEventListener('click', () => copyCode(offer.code, copyBtn));
    }
    
    if (copyBtn) {
      copyBtn.addEventListener('click', () => copyCode(offer.code, copyBtn));
    }
    
    return card;
  }
  
  function renderOffers() {
    if (offersLoadingState) {
      offersLoadingState.style.display = 'none';
    }
    
    if (allOffers.length === 0) {
      offersGrid.style.display = 'none';
      emptyState.style.display = 'block';
      if (offersCount) offersCount.textContent = '0 active offers';
      return;
    }
    
    offersGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    if (offersCount) {
      offersCount.textContent = `${allOffers.length} active offer${allOffers.length !== 1 ? 's' : ''}`;
    }
    
    offersGrid.innerHTML = '';
    
    allOffers.forEach(offer => {
      offersGrid.appendChild(renderOfferCard(offer));
    });
  }
  
  // ---------- COPY FUNCTIONALITY ----------
  
  async function copyCode(code, button) {
    if (!code) return;
    
    try {
      await navigator.clipboard.writeText(code);
      
      // Show success feedback
      showToast(`Code "${code}" copied!`, 'success');
      
      // Update button state
      if (button) {
        const originalText = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = '<span>✓</span> Copied!';
        
        setTimeout(() => {
          button.classList.remove('copied');
          button.innerHTML = originalText;
        }, 2000);
      }
      
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      showToast(`Code "${code}" copied!`, 'success');
      
      if (button) {
        const originalText = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = '<span>✓</span> Copied!';
        
        setTimeout(() => {
          button.classList.remove('copied');
          button.innerHTML = originalText;
        }, 2000);
      }
    }
  }
  
  // ---------- TOAST NOTIFICATION ----------
  
  function showToast(message, type = 'info') {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 3000);
  }
  
  // ---------- INITIALIZATION ----------
  
  async function init() {
    try {
      // Load offers
      await loadOffers();
      
      // Render offers
      renderOffers();
      
      // Update cart badge
      if (window.OKMart && window.OKMart.getCartItems) {
        const cart = window.OKMart.getCartItems();
        const badges = document.querySelectorAll('.cart-badge');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        badges.forEach(badge => {
          if (badge) badge.textContent = totalItems;
        });
      }
      
      console.log('✅ Offers page initialized |', allOffers.length, 'offers');
      
    } catch (error) {
      console.error('Failed to initialize offers page:', error);
      if (offersLoadingState) {
        offersLoadingState.innerHTML = `
          <div class="empty-icon">⚠️</div>
          <h3>Failed to load offers</h3>
          <p>Please refresh the page</p>
        `;
      }
    }
  }
  
  // Start the app
  init();
  
  // Expose for debugging
  window.OKMartOffers = {
    getOffers: () => allOffers,
    refresh: init,
    copyCode
  };
  
})();
