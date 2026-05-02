// ===== OK Mart - Notification Popup =====
(function() {
  'use strict';
  
  // 3 second baad popup show hoga
  var DELAY = 3000;
  // 24 ghante baad fir show hoga agar dismiss kiya
  var COOLDOWN = 24 * 60 * 60 * 1000;
  var STORAGE_KEY = 'okmart_notify_dismissed';
  
  function shouldShow() {
    if (!('Notification' in window)) return false;
    if (Notification.permission !== 'default') return false;
    
    var dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      if (Date.now() - parseInt(dismissed) < COOLDOWN) return false;
    }
    
    return true;
  }
  
  function createPopup() {
    var overlay = document.createElement('div');
    overlay.id = 'notifyPopup';
    overlay.style.cssText = 
      'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;' +
      'display:flex;align-items:flex-end;justify-content:center;' +
      'padding:0 16px 30px;opacity:0;visibility:hidden;' +
      'transition:opacity .4s,visibility .4s;';
    
    overlay.innerHTML = 
      '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);"></div>' +
      '<div style="position:relative;z-index:1;background:rgba(255,255,255,.95);' +
        'backdrop-filter:blur(20px);border-radius:24px;padding:32px 24px 24px;' +
        'max-width:420px;width:100%;text-align:center;' +
        'box-shadow:0 20px 50px rgba(0,0,0,.12);' +
        'transform:translateY(30px);transition:transform .4s cubic-bezier(.34,1.56,.64,1);">' +
        
        '<span style="font-size:3rem;display:block;margin-bottom:16px;animation:bellBounce 2s infinite;">🔔</span>' +
        '<h2 style="font-size:1.4rem;font-weight:800;margin-bottom:8px;">Stay Updated 🚀</h2>' +
        '<p style="color:#6b7280;margin-bottom:20px;">Get latest offers & order updates instantly</p>' +
        
        '<button id="notifyEnable" style="width:100%;padding:16px;' +
          'background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;' +
          'border:none;border-radius:16px;font-weight:700;font-size:1rem;' +
          'cursor:pointer;margin-bottom:10px;">Enable Notifications</button>' +
        
        '<button id="notifyLater" style="width:100%;padding:14px;' +
          'background:#f1f5f9;color:#6b7280;border:1.5px solid #e5e7eb;' +
          'border-radius:16px;font-weight:600;cursor:pointer;">Maybe Later</button>' +
      '</div>';
    
    return overlay;
  }
  
  function addStyles() {
    if (document.getElementById('notifyStyles')) return;
    var style = document.createElement('style');
    style.id = 'notifyStyles';
    style.textContent = '@keyframes bellBounce{0%,100%{transform:rotate(0)}10%{transform:rotate(15deg)}20%{transform:rotate(-15deg)}30%{transform:rotate(10deg)}40%{transform:rotate(-10deg)}50%{transform:rotate(0)}}';
    document.head.appendChild(style);
  }
  
  function showPopup() {
    if (!shouldShow()) return;
    
    addStyles();
    var popup = createPopup();
    document.body.appendChild(popup);
    
    setTimeout(function() {
      popup.style.opacity = '1';
      popup.style.visibility = 'visible';
      popup.querySelector('div:last-child').style.transform = 'translateY(0)';
    }, 100);
    
    // Enable button
    popup.querySelector('#notifyEnable').addEventListener('click', function() {
      if (window.FirebaseHelper && window.FirebaseHelper.requestPermission) {
        window.FirebaseHelper.requestPermission(function(token, err) {
          if (token) {
            this.textContent = '✓ Enabled!';
            this.style.background = 'linear-gradient(135deg,#10b981,#059669)';
            setTimeout(function() { popup.remove(); }, 1500);
          } else {
            popup.remove();
          }
        }.bind(this));
      } else {
        Notification.requestPermission().then(function(p) {
          if (p === 'granted') {
            this.textContent = '✓ Enabled!';
            this.style.background = 'linear-gradient(135deg,#10b981,#059669)';
          }
          setTimeout(function() { popup.remove(); }, 1500);
        }.bind(this));
      }
    });
    
    // Later button
    popup.querySelector('#notifyLater').addEventListener('click', function() {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      popup.style.opacity = '0';
      setTimeout(function() { popup.remove(); }, 400);
    });
  }
  
  // Show after delay
  setTimeout(showPopup, DELAY);
  console.log('🔔 Notification popup ready');
})();
