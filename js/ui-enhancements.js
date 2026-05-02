// ===== OK MART - UI/UX ENHANCEMENTS =====

(function() {
  'use strict';

  // ============================================
  // 1. BACK TO TOP BUTTON
  // ============================================
  
  function initBackToTop() {
    // Create button if not exists
    if (!document.querySelector('.back-to-top')) {
      const btn = document.createElement('button');
      btn.className = 'back-to-top';
      btn.innerHTML = '<span>↑</span>';
      btn.setAttribute('aria-label', 'Back to top');
      document.body.appendChild(btn);
      
      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    
    const backToTop = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    });
  }

  // ============================================
  // 2. OFFLINE INDICATOR
  // ============================================
  
  function initOfflineIndicator() {
    // Create indicator if not exists
    if (!document.querySelector('.offline-indicator')) {
      const indicator = document.createElement('div');
      indicator.className = 'offline-indicator';
      indicator.innerHTML = '📡 You are offline. Please check your connection.';
      document.body.appendChild(indicator);
    }
    
    const indicator = document.querySelector('.offline-indicator');
    
    function updateOnlineStatus() {
      if (navigator.onLine) {
        indicator.classList.remove('show');
        if (window.OKMart) {
          window.OKMart.showToast('✅ Back online!', 'success');
        }
      } else {
        indicator.classList.add('show');
        if (window.OKMart) {
          window.OKMart.showToast('📡 No internet connection', 'error');
        }
      }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  // ============================================
  // 3. PULL TO REFRESH
  // ============================================
  
  function initPullToRefresh() {
    let touchStartY = 0;
    let isRefreshing = false;
    
    // Create pull indicator
    if (!document.querySelector('.pull-to-refresh')) {
      const pullDiv = document.createElement('div');
      pullDiv.className = 'pull-to-refresh';
      pullDiv.innerHTML = '↓ Pull to refresh';
      document.body.appendChild(pullDiv);
    }
    
    const pullDiv = document.querySelector('.pull-to-refresh');
    
    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
      }
    });
    
    document.addEventListener('touchmove', (e) => {
      if (window.scrollY === 0 && !isRefreshing) {
        const diff = e.touches[0].clientY - touchStartY;
        if (diff > 60) {
          pullDiv.classList.add('active');
          pullDiv.innerHTML = '🔄 Release to refresh';
        } else if (diff > 20) {
          pullDiv.classList.add('active');
          pullDiv.innerHTML = '↓ Pull to refresh';
        } else {
          pullDiv.classList.remove('active');
          pullDiv.innerHTML = '↓ Pull to refresh';
        }
      }
    });
    
    document.addEventListener('touchend', (e) => {
      if (pullDiv.classList.contains('active') && !isRefreshing) {
        isRefreshing = true;
        pullDiv.innerHTML = '<div class="spinner-small"></div> Refreshing...';
        
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      
      setTimeout(() => {
        pullDiv.classList.remove('active');
        pullDiv.innerHTML = '↓ Pull to refresh';
        isRefreshing = false;
      }, 1000);
    });
  }

  // ============================================
  // 4. LAZY LOAD IMAGES
  // ============================================
  
  function initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    } else {
      // Fallback
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
      });
    }
  }

  // ============================================
  // 5. RIPPLE EFFECT ON BUTTONS
  // ============================================
  
  function initRippleEffect() {
    document.querySelectorAll('button, .btn, .add-btn, .track-btn, .save-btn').forEach(btn => {
      btn.classList.add('ripple');
      
      btn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple-effect');
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.transform = 'scale(0)';
        ripple.style.transition = 'transform 0.5s, opacity 0.5s';
        ripple.style.pointerEvents = 'none';
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
          ripple.style.transform = 'scale(1)';
          ripple.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
          ripple.remove();
        }, 500);
      });
    });
  }

  // ============================================
  // 6. SKELETON LOADING FOR PRODUCTS
  // ============================================
  
  window.showSkeleton = function(containerId, count = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const skeletons = [];
    for (let i = 0; i < count; i++) {
      skeletons.push(`
        <div class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text-sm"></div>
          <div class="skeleton-button"></div>
        </div>
      `);
    }
    
    container.innerHTML = skeletons.join('');
  };
  
  window.hideSkeleton = function(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
  };

  // ============================================
  // 7. PAGE TRANSITIONS
  // ============================================
  
  function initPageTransitions() {
    document.body.classList.add('page-transition');
    
    // Smooth navigation between pages
    document.querySelectorAll('a:not([target="_blank"]):not([href^="http"])').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          e.preventDefault();
          
          document.body.style.opacity = '0';
          document.body.style.transform = 'translateY(20px)';
          document.body.style.transition = 'all 0.3s';
          
          setTimeout(() => {
            window.location.href = href;
          }, 250);
        }
      });
    });
    
    // Reset animation on load
    window.addEventListener('pageshow', () => {
      document.body.style.opacity = '1';
      document.body.style.transform = 'translateY(0)';
    });
  }

  // ============================================
  // 8. BOTTOM NAVIGATION ACTIVE STATE
  // ============================================
  
  function initBottomNavActive() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && currentPath.includes(href.replace(/^\//, ''))) {
        item.classList.add('active');
      } else if (currentPath === '/' || currentPath === '/index.html') {
        if (href === '/' || href === '/index.html') {
          item.classList.add('active');
        }
      }
    });
  }

  // ============================================
  // 9. SCROLL TO TOP ON PAGE CHANGE
  // ============================================
  
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }
  
  window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
  });

  // ============================================
  // 10. TOUCH FEEDBACK FOR MOBILE
  // ============================================
  
  function initTouchFeedback() {
    const touchElements = document.querySelectorAll('button, a, .product-card, .order-list-item');
    
    touchElements.forEach(el => {
      el.addEventListener('touchstart', () => {
        el.style.transform = 'scale(0.97)';
      });
      
      el.addEventListener('touchend', () => {
        setTimeout(() => {
          el.style.transform = '';
        }, 150);
      });
      
      el.addEventListener('touchcancel', () => {
        el.style.transform = '';
      });
    });
  }

  // ============================================
  // 11. NETWORK SPEED INDICATOR (Optional)
  // ============================================
  
  function initNetworkSpeedIndicator() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const speedMap = {
        'slow-2g': '🐢 Very Slow',
        '2g': '🐢 Slow',
        '3g': '📱 3G',
        '4g': '🚀 Fast'
      };
      
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        if (window.OKMart) {
          window.OKMart.showToast('⚠️ Slow connection detected. Images may load slower.', 'warning');
        }
      }
    }
  }

  // ============================================
  // 12. PREVENT DOUBLE TAP ZOOM (Mobile)
  // ============================================
  
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // ============================================
  // 13. ADD TO CART ANIMATION
  // ============================================
  
  window.animateAddToCart = function(element) {
    if (!element) return;
    
    element.style.transform = 'scale(0.9)';
    element.style.background = '#27ae60';
    element.style.color = 'white';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.background = '';
      element.style.color = '';
    }, 200);
    
    // Create flying animation
    const cartIcon = document.querySelector('.cart-icon-link, .cart-icon');
    if (cartIcon) {
      const rect = element.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();
      
      const flyer = document.createElement('div');
      flyer.innerHTML = '🛒';
      flyer.style.position = 'fixed';
      flyer.style.left = rect.left + 'px';
      flyer.style.top = rect.top + 'px';
      flyer.style.fontSize = '24px';
      flyer.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      flyer.style.zIndex = '9999';
      flyer.style.opacity = '1';
      document.body.appendChild(flyer);
      
      setTimeout(() => {
        flyer.style.left = cartRect.left + 'px';
        flyer.style.top = cartRect.top + 'px';
        flyer.style.opacity = '0';
        flyer.style.transform = 'scale(0.5)';
      }, 10);
      
      setTimeout(() => {
        flyer.remove();
      }, 500);
    }
  };

  // ============================================
  // 14. INIT ALL
  // ============================================
  
  document.addEventListener('DOMContentLoaded', () => {
    initBackToTop();
    initOfflineIndicator();
    initPullToRefresh();
    initLazyLoading();
    initRippleEffect();
    initBottomNavActive();
    initTouchFeedback();
    initNetworkSpeedIndicator();
    initPageTransitions();
    
    console.log('✅ UI Enhancements initialized');
  });
  
})();
