// ===== OK Mart - Animated Notification Permission Popup =====
(function() {
  'use strict';
  
  // ============================================
  // CONFIGURATION
  // ============================================
  var POPUP_DELAY = 3000; // Show after 3 seconds
  var COOLDOWN_HOURS = 24; // Don't show again for 24 hours
  var STORAGE_KEY = 'okmart_notification_popup_dismissed';
  
  // ============================================
  // CHECK IF POPUP SHOULD BE SHOWN
  // ============================================
  function shouldShowPopup() {
    // Check 1: Notification API supported?
    if (!('Notification' in window)) {
      console.log('🔔 Notifications not supported');
      return false;
    }
    
    // Check 2: Permission already granted or denied?
    if (Notification.permission !== 'default') {
      console.log('🔔 Permission already:', Notification.permission);
      return false;
    }
    
    // Check 3: Was popup dismissed before?
    var dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      var dismissedTime = parseInt(dismissed, 10);
      var cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < cooldownMs) {
        var hoursLeft = Math.ceil((cooldownMs - (Date.now() - dismissedTime)) / (60 * 60 * 1000));
        console.log('🔔 Popup dismissed, showing again in', hoursLeft, 'hours');
        return false;
      }
    }
    
    // Check 4: Already subscribed via Firebase?
    if (FirebaseHelper && FirebaseHelper.getStoredFCMToken && FirebaseHelper.getStoredFCMToken()) {
      console.log('🔔 Already have FCM token');
      return false;
    }
    
    return true;
  }
  
  // ============================================
  // CREATE POPUP HTML
  // ============================================
  function createPopupHTML() {
    var popup = document.createElement('div');
    popup.id = 'notificationPopup';
    popup.className = 'notification-popup-overlay';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', 'Enable notifications');
    
    popup.innerHTML = 
      '<div class="notification-popup-card">' +
        
        // Close button
        '<button class="popup-close-btn" id="popupCloseBtn" aria-label="Close">✕</button>' +
        
        // Animated Bell Icon
        '<div class="popup-icon-wrapper">' +
          '<div class="popup-icon-ring"></div>' +
          '<div class="popup-icon-ring-2"></div>' +
          '<span class="popup-icon">🔔</span>' +
        '</div>' +
        
        // Content
        '<h2 class="popup-heading">Stay Updated 🚀</h2>' +
        '<p class="popup-subtext">Get latest offers, order updates &amp; important alerts instantly</p>' +
        
        // Benefits list
        '<div class="popup-benefits">' +
          '<div class="benefit-item"><span>🎁</span> Exclusive Offers</div>' +
          '<div class="benefit-item"><span>📦</span> Order Updates</div>' +
          '<div class="benefit-item"><span>⚡</span> Flash Deals</div>' +
        '</div>' +
        
        // Buttons
        '<div class="popup-buttons">' +
          '<button class="popup-primary-btn" id="popupEnableBtn">' +
            '<span class="btn-text">Enable Notifications</span>' +
            '<span class="btn-ripple"></span>' +
          '</button>' +
          '<button class="popup-secondary-btn" id="popupLaterBtn">Maybe Later</button>' +
        '</div>' +
        
      '</div>' +
      // Backdrop
      '<div class="popup-backdrop"></div>';
    
    return popup;
  }
  
  // ============================================
  // ADD STYLES
  // ============================================
  function addPopupStyles() {
    if (document.getElementById('notificationPopupStyles')) return;
    
    var style = document.createElement('style');
    style.id = 'notificationPopupStyles';
    style.textContent = 
      '/* ===== NOTIFICATION POPUP STYLES ===== */' +
      
      '.notification-popup-overlay {' +
        'position: fixed; top: 0; left: 0; right: 0; bottom: 0;' +
        'z-index: 9999; display: flex; align-items: flex-end; justify-content: center;' +
        'padding: 0 16px 30px;' +
        'opacity: 0; visibility: hidden;' +
        'transition: opacity .4s ease, visibility .4s ease;' +
      '}' +
      
      '.notification-popup-overlay.show {' +
        'opacity: 1; visibility: visible;' +
      '}' +
      
      '.notification-popup-overlay.exit {' +
        'opacity: 0;' +
      '}' +
      
      '.popup-backdrop {' +
        'position: absolute; top: 0; left: 0; right: 0; bottom: 0;' +
        'background: rgba(0,0,0,.4); backdrop-filter: blur(4px);' +
        '-webkit-backdrop-filter: blur(4px);' +
      '}' +
      
      '.notification-popup-card {' +
        'position: relative; z-index: 1;' +
        'background: rgba(255,255,255,.95);' +
        'backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);' +
        'border-radius: 24px; padding: 32px 24px 24px;' +
        'max-width: 420px; width: 100%;' +
        'box-shadow: 0 20px 50px rgba(0,0,0,.12), 0 0 0 1px rgba(255,255,255,.5);' +
        'text-align: center;' +
        'transform: translateY(30px);' +
        'transition: transform .4s cubic-bezier(.34,1.56,.64,1);' +
      '}' +
      
      '.notification-popup-overlay.show .notification-popup-card {' +
        'transform: translateY(0);' +
      '}' +
      
      '.notification-popup-overlay.exit .notification-popup-card {' +
        'transform: translateY(30px);' +
      '}' +
      
      /* Close Button */
      '.popup-close-btn {' +
        'position: absolute; top: 14px; right: 14px;' +
        'width: 32px; height: 32px; border-radius: 50%;' +
        'background: #f1f5f9; border: none; font-size: 1rem;' +
        'color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center;' +
        'transition: all .2s;' +
      '}' +
      '.popup-close-btn:hover { background: #e2e8f0; color: #1a1e2b; }' +
      
      /* Icon Wrapper */
      '.popup-icon-wrapper {' +
        'position: relative; width: 80px; height: 80px; margin: 0 auto 20px;' +
      '}' +
      '.popup-icon {' +
        'position: relative; z-index: 2; font-size: 2.5rem;' +
        'display: flex; align-items: center; justify-content: center;' +
        'width: 100%; height: 100%;' +
        'animation: bellBounce 2s ease-in-out infinite;' +
      '}' +
      '.popup-icon-ring {' +
        'position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);' +
        'width: 100%; height: 100%; border-radius: 50%;' +
        'background: radial-gradient(circle, rgba(99,102,241,.15) 0%, transparent 70%);' +
        'animation: ringPulse 2s ease-in-out infinite;' +
      '}' +
      '.popup-icon-ring-2 {' +
        'position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);' +
        'width: 130%; height: 130%; border-radius: 50%;' +
        'border: 2px dashed rgba(99,102,241,.2);' +
        'animation: ringRotate 8s linear infinite;' +
      '}' +
      
      '@keyframes bellBounce {' +
        '0%,100% { transform: rotate(0); }' +
        '10% { transform: rotate(15deg); }' +
        '20% { transform: rotate(-15deg); }' +
        '30% { transform: rotate(10deg); }' +
        '40% { transform: rotate(-10deg); }' +
        '50% { transform: rotate(0); }' +
      '}' +
      '@keyframes ringPulse {' +
        '0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }' +
        '50% { transform: translate(-50%,-50%) scale(1.2); opacity: .5; }' +
      '}' +
      '@keyframes ringRotate {' +
        '0% { transform: translate(-50%,-50%) rotate(0deg); }' +
        '100% { transform: translate(-50%,-50%) rotate(360deg); }' +
      '}' +
      
      /* Heading */
      '.popup-heading {' +
        'font-size: 1.4rem; font-weight: 800; color: #1a1e2b; margin-bottom: 8px;' +
      '}' +
      '.popup-subtext {' +
        'font-size: .9rem; color: #6b7280; margin-bottom: 20px; line-height: 1.5;' +
      '}' +
      
      /* Benefits */
      '.popup-benefits {' +
        'display: flex; justify-content: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;' +
      '}' +
      '.benefit-item {' +
        'display: flex; align-items: center; gap: 6px;' +
        'font-size: .78rem; font-weight: 600; color: #4f46e5;' +
        'background: #eef2ff; padding: 8px 14px; border-radius: 20px;' +
      '}' +
      '.benefit-item span { font-size: 1rem; }' +
      
      /* Buttons */
      '.popup-buttons {' +
        'display: flex; flex-direction: column; gap: 10px;' +
      '}' +
      '.popup-primary-btn {' +
        'width: 100%; padding: 16px;' +
        'background: linear-gradient(135deg, #6366f1, #8b5cf6);' +
        'color: white; border: none; border-radius: 16px;' +
        'font-weight: 700; font-size: 1rem; cursor: pointer;' +
        'position: relative; overflow: hidden;' +
        'transition: all .2s;' +
        'box-shadow: 0 6px 20px rgba(99,102,241,.3);' +
      '}' +
      '.popup-primary-btn:hover { transform: scale(1.02); box-shadow: 0 8px 25px rgba(99,102,241,.4); }' +
      '.popup-primary-btn:active { transform: scale(.97); }' +
      '.popup-primary-btn .btn-ripple {' +
        'position: absolute; top: 50%; left: 50%;' +
        'width: 0; height: 0; border-radius: 50%;' +
        'background: rgba(255,255,255,.3);' +
        'transform: translate(-50%,-50%);' +
        'transition: width .6s, height .6s;' +
      '}' +
      '.popup-primary-btn:active .btn-ripple {' +
        'width: 300px; height: 300px;' +
      '}' +
      '.popup-primary-btn.success {' +
        'background: linear-gradient(135deg, #10b981, #059669);' +
      '}' +
      '.popup-secondary-btn {' +
        'width: 100%; padding: 14px;' +
        'background: #f1f5f9; color: #6b7280;' +
        'border: 1.5px solid #e5e7eb; border-radius: 16px;' +
        'font-weight: 600; font-size: .9rem; cursor: pointer;' +
        'transition: all .2s;' +
      '}' +
      '.popup-secondary-btn:hover { background: #e2e8f0; color: #1a1e2b; }' +
      
      /* Mobile */
      '@media (max-width: 480px) {' +
        '.notification-popup-card { padding: 24px 18px 20px; }' +
        '.popup-heading { font-size: 1.2rem; }' +
        '.popup-benefits { gap: 8px; }' +
        '.benefit-item { font-size: .7rem; padding: 6px 10px; }' +
      '}';
    
    document.head.appendChild(style);
  }
  
  // ============================================
  // SHOW POPUP
  // ============================================
  function showPopup() {
    if (!shouldShowPopup()) return;
    
    // Add styles
    addPopupStyles();
    
    // Create popup
    var popup = createPopupHTML();
    document.body.appendChild(popup);
    
    // Trigger animation after a frame
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        popup.classList.add('show');
      });
    });
    
    // ========== EVENT LISTENERS ==========
    
    // Enable button
    var enableBtn = popup.querySelector('#popupEnableBtn');
    enableBtn.addEventListener('click', function() {
      // Ripple effect
      var ripple = this.querySelector('.btn-ripple');
      ripple.style.width = '300px';
      ripple.style.height = '300px';
      
      // Call Firebase permission
      if (FirebaseHelper && FirebaseHelper.requestNotificationPermission) {
        FirebaseHelper.requestNotificationPermission(function(token, error) {
          if (token) {
            // Success!
            enableBtn.classList.add('success');
            enableBtn.querySelector('.btn-text').textContent = '✓ Notifications Enabled!';
            
            // Show success toast
            if (window.showToast) {
              window.showToast('🔔 Notifications enabled!', 'success');
            }
            
            // Close popup after delay
            setTimeout(function() {
              dismissPopup(popup);
            }, 1500);
          } else {
            // Failed
            console.log('Notification permission denied');
            dismissPopup(popup);
          }
        });
      } else {
        // Fallback if Firebase not available
        Notification.requestPermission().then(function(permission) {
          if (permission === 'granted') {
            enableBtn.classList.add('success');
            enableBtn.querySelector('.btn-text').textContent = '✓ Notifications Enabled!';
            setTimeout(function() { dismissPopup(popup); }, 1500);
          } else {
            dismissPopup(popup);
          }
        });
      }
    });
    
    // Maybe Later button
    var laterBtn = popup.querySelector('#popupLaterBtn');
    laterBtn.addEventListener('click', function() {
      dismissPopup(popup, true);
    });
    
    // Close button
    var closeBtn = popup.querySelector('#popupCloseBtn');
    closeBtn.addEventListener('click', function() {
      dismissPopup(popup, true);
    });
    
    // Backdrop click
    var backdrop = popup.querySelector('.popup-backdrop');
    backdrop.addEventListener('click', function() {
      dismissPopup(popup, true);
    });
  }
  
  // ============================================
  // DISMISS POPUP
  // ============================================
  function dismissPopup(popup, saveCooldown) {
    // Save cooldown if "Maybe Later"
    if (saveCooldown) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
    
    // Exit animation
    popup.classList.add('exit');
    popup.classList.remove('show');
    
    // Remove from DOM after animation
    setTimeout(function() {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 400);
  }
  
  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Show popup after delay
    setTimeout(function() {
      showPopup();
    }, POPUP_DELAY);
    
    console.log('🔔 Notification popup ready (showing in ' + (POPUP_DELAY / 1000) + 's)');
  }
  
  // Wait for page to fully load
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
  
})();
