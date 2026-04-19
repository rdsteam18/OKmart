// ===== OK MART - OFFERS.JS =====
// Complete offers page with coupons, deals, and bank offers

(function() {
  'use strict';
  
  const CART_KEY = 'okmart_cart';
  
  // Offers data
  const offersData = {
    offers: [
      {
        id: 'o1',
        title: 'SAVE20',
        description: 'Get ₹20 off on orders above ₹250',
        code: 'SAVE20',
        minOrder: 250,
        type: 'discount',
        badge: '🔥 Hot Deal',
        badgeColor: '#ef4444',
        expiry: 'Valid till 31st Dec',
        terms: 'Applicable on all products. Cannot be combined.',
        icon: '💰'
      },
      {
        id: 'o2',
        title: 'FREE ONION',
        description: '1kg Onion FREE on orders above ₹199',
        code: 'ONIONFREE',
        minOrder: 199,
        type: 'freebie',
        badge: '🎁 Freebie',
        badgeColor: '#f59e0b',
        expiry: 'Auto-applied at checkout',
        terms: 'Free onion added automatically when cart reaches ₹199.',
        icon: '🧅'
      },
      {
        id: 'o3',
        title: 'FIRST50',
        description: '₹50 off on your first order above ₹299',
        code: 'FIRST50',
        minOrder: 299,
        type: 'discount',
        badge: '👋 New User',
        badgeColor: '#3b82f6',
        expiry: 'First order only',
        terms: 'Valid only for new customers. One time use.',
        icon: '🎁'
      },
      {
        id: 'o4',
        title: 'FREEDELIVERY',
        description: 'FREE delivery on orders above ₹199',
        code: 'FREEDEL199',
        minOrder: 199,
        type: 'delivery',
        badge: '🚚 Free Delivery',
        badgeColor: '#10b981',
        expiry: 'Ongoing offer',
        terms: 'Automatically applied at checkout.',
        icon: '🚚'
      },
      {
        id: 'o5',
        title: 'WEEKEND10',
        description: '10% off on weekends (Sat-Sun)',
        code: 'WEEKEND10',
        minOrder: 300,
        type: 'discount',
        badge: '📅 Weekend',
        badgeColor: '#8b5cf6',
        expiry: 'Sat & Sun only',
        terms: 'Maximum discount ₹50. Valid only on weekends.',
        icon: '📅'
      },
      {
        id: 'o6',
        title: 'B1G1 SNACKS',
        description: 'Buy 1 Get 1 Free on selected snacks',
        code: 'B1G1SNACK',
        minOrder: 99,
        type: 'bogo',
        badge: '🎉 BOGO',
        badgeColor: '#ec4899',
        expiry: 'Limited time',
        terms: 'Applicable on selected snacks only.',
        icon: '🍿'
      },
      {
        id: 'o7',
        title: 'COMBO100',
        description: '₹100 off on orders above ₹499',
        code: 'COMBO100',
        minOrder: 499,
        type: 'discount',
        badge: '💎 Premium',
        badgeColor: '#06b6d4',
        expiry: 'Limited period',
        terms: 'Applicable on all products.',
        icon: '💎'
      },
      {
        id: 'o8',
        title: 'DAIRY5',
        description: '5% cashback on dairy products',
        code: 'DAIRY5',
        minOrder: 150,
        type: 'cashback',
        badge: '🥛 Dairy',
        badgeColor: '#14b8a6',
        expiry: 'Auto-applied',
        terms: 'Cashback credited as wallet points.',
        icon: '🥛'
      }
    ]
  };
  
  const bankOffers = [
    { bank: 'HDFC Bank', offer: '10% instant discount', discount: 'Up to ₹100', icon: '🏦' },
    { bank: 'ICICI Bank', offer: '5% cashback on grocery', discount: 'Up to ₹75', icon: '💳' },
    { bank: 'SBI Credit Card', offer: '₹50 off on ₹500+', discount: '₹50 OFF', icon: '🏧' },
    { bank: 'Paytm Wallet', offer: '5% cashback', discount: 'Up to ₹50', icon: '📱' }
  ];
  
  // DOM Elements
  const offersLoadingState = document.getElementById('offersLoadingState');
  const offersGrid = document.getElementById('offersGrid');
  const emptyState = document.getElementById('emptyState');
  const offersCount = document.getElementById('offersCount');
  const bankOffersList = document.getElementById('bankOffersList');
  const toastMessage = document.getElementById('toastMessage');
  
  // ---------- RENDERING ----------
  
  function renderOfferCard(offer) {
    const card = document.createElement('div');
    card.className = 'offer-card';
    card.dataset.offerId = offer.id;
    
    card.innerHTML = `
      ${offer.badge ? `<span class="offer-badge" style="background: ${offer.badgeColor};">${offer.badge}</span>` : ''}
      
      <div class="offer-header">
        <div class="offer-icon">${offer.icon}</div>
        <div class="offer-title-section">
          <h3 class="offer-title">${offer.title}</h3>
          <span class="offer-type">${offer.type}</span>
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
            Code: ${offer.code}
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
          <span>⏰</span> ${offer.expiry}
        </span>
        <span class="offer-terms" title="${offer.terms}">Terms</span>
      </div>
    `;
    
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
  
  function renderBankOfferCard(bank) {
    const card = document.createElement('div');
    card.className = 'bank-offer-card';
    card.innerHTML = `
      <div class="bank-icon">${bank.icon}</div>
      <div class="bank-info">
        <div class="bank-name">${bank.bank}</div>
        <div class="bank-offer-text">${bank.offer}</div>
      </div>
      <span class="bank-discount">${bank.discount}</span>
    `;
    return card;
  }
  
  function renderOffers() {
    const offers = offersData.offers;
    
    if (offersLoadingState) offersLoadingState.style.display = 'none';
    
    if (offers.length === 0) {
      offersGrid.style.display = 'none';
      emptyState.style.display = 'block';
      if (offersCount) offersCount.textContent = '0 active offers';
      return;
    }
    
    offersGrid.style.display = 'flex';
    emptyState.style.display = 'none';
    
    if (offersCount) {
      offersCount.textContent = `${offers.length} active offer${offers.length !== 1 ? 's' : ''}`;
    }
    
    offersGrid.innerHTML = '';
    offers.forEach(offer => {
      offersGrid.appendChild(renderOfferCard(offer));
    });
  }
  
  function renderBankOffers() {
    if (bankOffersList) {
      bankOffersList.innerHTML = '';
      bankOffers.forEach(bank => {
        bankOffersList.appendChild(renderBankOfferCard(bank));
      });
    }
  }
  
  // ---------- COPY FUNCTIONALITY ----------
  
  async function copyCode(code, button) {
    if (!code) return;
    
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Code "${code}" copied!`, 'success');
      
      if (button) {
        const originalHTML = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = '<span>✓</span> Copied!';
        
        setTimeout(() => {
          button.classList.remove('copied');
          button.innerHTML = originalHTML;
        }, 2000);
      }
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      showToast(`Code "${code}" copied!`, 'success');
      
      if (button) {
        const originalHTML = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = '<span>✓</span> Copied!';
        
        setTimeout(() => {
          button.classList.remove('copied');
          button.innerHTML = originalHTML;
        }, 2000);
      }
    }
  }
  
  // ---------- TOAST ----------
  
  function showToast(message, type = 'info') {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => toastMessage.classList.remove('show'), 2500);
  }
  
  // ---------- CART BADGE ----------
  
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => {
      if (b) b.textContent = total;
    });
  }
  
  // ---------- INITIALIZATION ----------
  
  function init() {
    renderOffers();
    renderBankOffers();
    updateCartBadge();
    
    console.log('✅ Offers page initialized |', offersData.offers.length, 'offers');
  }
  
  init();
  
})();
