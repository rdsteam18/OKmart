// ===== OK MART - OFFERS.JS =====
// Dynamic offers page with Firebase coupons and banners

(function() {
  'use strict';
  
  // ========== STATE ==========
  let allBanners = [];
  let bannerIndex = 0;
  let bannerInterval;
  
  // ========== DOM ELEMENTS ==========
  const bannerTrack = document.getElementById('bannerTrack');
  const bannerDots = document.getElementById('bannerDots');
  const couponsList = document.getElementById('couponsList');
  const couponCount = document.getElementById('couponCount');
  const toastMessage = document.getElementById('toastMessage');
  
  // ========== LOAD BANNERS ==========
  async function loadBanners() {
    try {
      const snap = await db.collection('banners').where('active', '==', true).get();
      allBanners = [];
      snap.forEach(doc => allBanners.push({ id: doc.id, ...doc.data() }));
      
      if (allBanners.length === 0) {
        // Default banners if none in Firebase
        allBanners = [
          { title: '₹199 Shopping Offer', image: 'https://images.pexels.com/photos/5650026/pexels-photo-5650026.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' },
          { title: 'Free Delivery', image: 'https://images.pexels.com/photos/1639556/pexels-photo-1639556.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' },
          { title: 'SAVE20 Coupon', image: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=600', link: '/offers.html' }
        ];
      }
      
      renderBanners();
      startCarousel();
      
    } catch (err) {
      console.error('Banners error:', err);
      bannerTrack.innerHTML = '<p style="padding:20px;text-align:center;">🎉 Special Offers Available!</p>';
    }
  }
  
  function renderBanners() {
    bannerTrack.innerHTML = allBanners.map((b, i) => `
      <div class="banner-slide">
        <a href="${b.link || '/offers.html'}">
          <img src="${b.image}" alt="${b.title}" loading="${i === 0 ? 'eager' : 'lazy'}" onerror="this.src='https://via.placeholder.com/600x150?text=OK+Mart+Offer'">
        </a>
      </div>
    `).join('');
    
    bannerDots.innerHTML = allBanners.map((_, i) => `
      <span class="banner-dot ${i === 0 ? 'active' : ''}" onclick="window.goToBanner(${i})"></span>
    `).join('');
  }
  
  function goToSlide(index) {
    bannerIndex = index;
    bannerTrack.style.transform = `translateX(-${bannerIndex * 100}%)`;
    document.querySelectorAll('.banner-dot').forEach((d, i) => d.classList.toggle('active', i === bannerIndex));
  }
  
  window.goToBanner = goToSlide;
  
  function startCarousel() {
    if (allBanners.length <= 1) return;
    bannerInterval = setInterval(() => {
      bannerIndex = (bannerIndex + 1) % allBanners.length;
      goToSlide(bannerIndex);
    }, 3000);
    
    // Touch swipe
    let startX = 0;
    bannerTrack.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
    bannerTrack.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) bannerIndex = (bannerIndex + 1) % allBanners.length;
        else bannerIndex = (bannerIndex - 1 + allBanners.length) % allBanners.length;
        goToSlide(bannerIndex);
      }
    });
  }
  
  // ========== LOAD COUPONS ==========
  async function loadCoupons() {
    try {
      const snap = await db.collection('offers').where('active', '==', true).get();
      
      couponCount.textContent = snap.size + ' active';
      
      if (snap.empty) {
        couponsList.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;">No active coupons at the moment</p>';
        return;
      }
      
      couponsList.innerHTML = '';
      snap.forEach(doc => {
        const o = doc.data();
        const card = document.createElement('div');
        card.className = 'coupon-card';
        card.innerHTML = `
          <div class="coupon-header">
            <span class="coupon-code-display">${o.code}</span>
            <span class="coupon-type-badge">${o.type === 'flat' ? '₹' + o.discount + ' OFF' : o.discount + '% OFF'}</span>
          </div>
          <div class="coupon-description">${o.description || 'Save on your order'}</div>
          <div class="coupon-details">
            <span class="coupon-detail-item">🛒 Min: ₹${o.minOrder}</span>
            ${o.maxDiscount ? `<span class="coupon-detail-item">📌 Max: ₹${o.maxDiscount}</span>` : ''}
          </div>
          <div class="coupon-actions">
            <button class="copy-coupon-btn" data-code="${o.code}">📋 Copy Code</button>
            <a href="/cart.html" class="apply-btn">Apply →</a>
          </div>
        `;
        
        card.querySelector('.copy-coupon-btn').addEventListener('click', function() {
          copyCode(o.code, this);
        });
        
        couponsList.appendChild(card);
      });
      
    } catch (err) {
      console.error('Coupons error:', err);
      couponsList.innerHTML = '<p style="text-align:center;color:var(--muted);">Could not load coupons</p>';
    }
  }
  
  async function copyCode(code, button) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    
    button.textContent = '✓ Copied!';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = '📋 Copy Code';
      button.classList.remove('copied');
    }, 2000);
    
    showToast(`Code "${code}" copied!`, 'success');
  }
  
  // ========== TOAST ==========
  function showToast(msg, type = 'info') {
    const toast = toastMessage;
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.color = 'white';
    toast.classList.add('show');
    clearTimeout(window._t);
    window._t = setTimeout(() => toast.classList.remove('show'), 2500);
  }
  
  // ========== INIT ==========
  async function init() {
    await Promise.all([loadBanners(), loadCoupons()]);
    console.log('✅ Offers page ready');
  }
  
  init();
  
})();

