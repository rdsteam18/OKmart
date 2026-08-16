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
  
  // ========== INIT ==========
  async function init() {
    await loadBanners();
    console.log('✅ Offers page ready');
  }
  
  init();
  
})();

