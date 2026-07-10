// ===== OK MART - PWA INSTALL PROMPT =====

(function() {
  'use strict';
  
  let deferredPrompt;
  let installPromptShown = false;
  
  // Check if app is already installed
  function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }
  
  // Check if user has dismissed the prompt before
  function hasUserDismissedPrompt() {
    return localStorage.getItem('pwa_install_dismissed') === 'true';
  }
  
  // Save that user dismissed the prompt
  function setUserDismissedPrompt() {
    localStorage.setItem('pwa_install_dismissed', 'true');
  }
  
  // Create install prompt UI
  function createInstallPrompt() {
    if (installPromptShown) return;
    if (isAppInstalled()) return;
    if (hasUserDismissedPrompt()) return;
    
    const promptEl = document.createElement('div');
    promptEl.id = 'pwaInstallPrompt';
    promptEl.className = 'pwa-install-prompt';
    promptEl.innerHTML = `
      <div class="pwa-prompt-content">
        <div class="pwa-prompt-icon">🛒</div>
        <div class="pwa-prompt-text">
          <h4>Install OK Mart App</h4>
          <p>Get faster access and better experience</p>
        </div>
        <button class="pwa-install-btn" id="pwaInstallBtn">Install</button>
        <button class="pwa-dismiss-btn" id="pwaDismissBtn">✕</button>
      </div>
    `;
    
    document.body.appendChild(promptEl);
    
    // Add styles
    addPromptStyles();
    
    // Event listeners
    document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User response: ${outcome}`);
        deferredPrompt = null;
      }
      promptEl.remove();
      installPromptShown = false;
    });
    
    document.getElementById('pwaDismissBtn').addEventListener('click', () => {
      promptEl.remove();
      installPromptShown = false;
      setUserDismissedPrompt();
    });
    
    installPromptShown = true;
    
    // Auto-hide after 30 seconds
    setTimeout(() => {
      if (promptEl.parentNode) {
        promptEl.remove();
        installPromptShown = false;
      }
    }, 30000);
  }
  
  // Add styles for install prompt
  function addPromptStyles() {
    if (document.getElementById('pwaPromptStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'pwaPromptStyles';
    style.textContent = `
      .pwa-install-prompt {
        position: fixed;
        bottom: 80px;
        left: 16px;
        right: 16px;
        background: white;
        border-radius: 20px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        z-index: 1000;
        animation: slideUpPWA 0.3s ease-out;
        border: 1px solid #e2e8f0;
        max-width: 500px;
        margin: 0 auto;
      }
      
      @keyframes slideUpPWA {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .pwa-prompt-content {
        display: flex;
        align-items: center;
        padding: 16px;
        gap: 12px;
        position: relative;
      }
      
      .pwa-prompt-icon {
        font-size: 2.5rem;
        flex-shrink: 0;
      }
      
      .pwa-prompt-text {
        flex: 1;
      }
      
      .pwa-prompt-text h4 {
        font-size: 1rem;
        font-weight: 700;
        color: #1e2a2e;
        margin-bottom: 2px;
      }
      
      .pwa-prompt-text p {
        font-size: 0.8rem;
        color: #64748b;
      }
      
      .pwa-install-btn {
        background: #84c225;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 40px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }
      
      .pwa-install-btn:hover {
        background: #5f930e;
      }
      
      .pwa-dismiss-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 1rem;
        cursor: pointer;
        padding: 4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      
      .pwa-dismiss-btn:hover {
        background: #f1f5f9;
        color: #64748b;
      }
      
      @media (max-width: 480px) {
        .pwa-install-prompt {
          left: 12px;
          right: 12px;
          bottom: 70px;
        }
        
        .pwa-prompt-content {
          padding: 12px;
        }
        
        .pwa-prompt-icon {
          font-size: 2rem;
        }
      }
      
      /* Hide prompt when PWA bottom bar is visible */
      .sticky-cart-bar.visible ~ .pwa-install-prompt {
        bottom: 100px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    console.log('[PWA] beforeinstallprompt fired');
    
    // Show install prompt after 3 seconds
    setTimeout(() => {
      createInstallPrompt();
    }, 3000);
  });
  
  // Track app installation
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
    
    // Hide any visible prompt
    const promptEl = document.getElementById('pwaInstallPrompt');
    if (promptEl) promptEl.remove();
    
    // Show success message
    showInstallSuccess();
  });
  
  function showInstallSuccess() {
    const toast = document.createElement('div');
    toast.className = 'install-success-toast';
    toast.innerHTML = '✅ App installed successfully!';
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 40px;
      font-weight: 500;
      z-index: 1001;
      animation: slideUpFade 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }
  
  // Check for updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
  
  // Expose manual install trigger
  window.installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Manual install: ${outcome}`);
      deferredPrompt = null;
      return true;
    } else if (isAppInstalled()) {
      alert('App is already installed!');
      return false;
    } else {
      alert('Installation is not available right now. You can install from browser menu.');
      return false;
    }
  };
  
  console.log('[PWA] PWA module loaded');
  
})();

