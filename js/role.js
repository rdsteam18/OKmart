// ===== OK Mart - ROLE-BASED SECURITY SYSTEM =====
// Central security for all sub-admin operations

(function() {
  'use strict';

  // ============================================
  // 1. CONSTANTS & CONFIGURATION
  // ============================================
  const LOGIN_PAGE = '/sub-admin/login.html';
  const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const LOGS_KEY = 'okmart_subadmin_logs';

  // ============================================
  // 2. CORE SECURITY CHECK (RUN ON EVERY PAGE)
  // ============================================
  function enforceSecurity() {
    const isAdmin = localStorage.getItem('okmart_isAdmin') === 'true';
    const adminRole = localStorage.getItem('okmart_adminRole') || localStorage.getItem('okmart_subAdmin_role');
    const loginTime = parseInt(localStorage.getItem('okmart_subAdmin_loginTime') || '0');
    const sessionExpired = (Date.now() - loginTime) > SESSION_DURATION;

    // Check 1: Not logged in
    if (!isAdmin) {
      redirectToLogin('No active session');
      return false;
    }

    // Check 2: Not a sub-admin
    if (adminRole !== 'sub') {
      redirectToLogin('Invalid role: ' + adminRole);
      return false;
    }

    // Check 3: Session expired
    if (sessionExpired) {
      clearAllSessionData();
      redirectToLogin('Session expired');
      return false;
    }

    // Check 4: No categories assigned
    const categories = getStoredCategories();
    if (!categories || categories.length === 0) {
      showAccessDenied('No categories assigned to your account');
      return false;
    }

    // Refresh session timestamp
    refreshSession();
    
    console.log('✅ Security check passed | Role:', adminRole, '| Categories:', categories.join(', '));
    return true;
  }

  // ============================================
  // 3. REDIRECT TO LOGIN
  // ============================================
  function redirectToLogin(reason) {
    console.warn('🔒 Security redirect:', reason);
    clearAllSessionData();
    
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    
    if (currentPage !== 'login.html') {
      window.location.href = LOGIN_PAGE;
    }
  }

  // ============================================
  // 4. GET STORED CATEGORIES
  // ============================================
  function getStoredCategories() {
    try {
      const cats = localStorage.getItem('okmart_subAdmin_categories') || 
                   localStorage.getItem('okmart_admin_categories') || 
                   '[]';
      return JSON.parse(cats);
    } catch (e) {
      return [];
    }
  }

  // ============================================
  // 5. REFRESH SESSION
  // ============================================
  function refreshSession() {
    const now = Date.now().toString();
    localStorage.setItem('okmart_subAdmin_loginTime', now);
    localStorage.setItem('okmart_admin_loginTime', now);
  }

  // ============================================
  // 6. CLEAR ALL SESSION DATA
  // ============================================
  function clearAllSessionData() {
    const keysToRemove = [
      'okmart_isAdmin',
      'okmart_isSubAdmin',
      'okmart_adminRole',
      'okmart_subAdmin_role',
      'okmart_admin_username',
      'okmart_subAdmin_username',
      'okmart_admin_categories',
      'okmart_subAdmin_categories',
      'okmart_admin_loginTime',
      'okmart_subAdmin_loginTime'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // ============================================
  // 7. CATEGORY ACCESS VALIDATION
  // ============================================
  function validateCategoryAccess(category, action = 'perform this action') {
    const allowedCategories = getStoredCategories();
    
    if (!allowedCategories.includes('all') && !allowedCategories.includes(category)) {
      const error = `❌ Access Denied: You cannot ${action} in category "${category}"`;
      console.error(error);
      
      // Log the attempt
      logSecurityEvent({
        type: 'ACCESS_DENIED',
        action: action,
        category: category,
        allowedCategories: allowedCategories,
        success: false
      });
      
      // Show visual feedback if in browser
      showAccessDenied(`You can only ${action} in: ${allowedCategories.join(', ')}`);
      
      return false;
    }
    
    return true;
  }

  // ============================================
  // 8. DATA FILTERING FUNCTIONS
  // ============================================
  
  /**
   * Filter products array to only show allowed categories
   */
  function filterProducts(products) {
    const allowedCategories = getStoredCategories();
    if (allowedCategories.includes('all')) return products;
    
    return products.filter(product => 
      allowedCategories.includes(product.category)
    );
  }

  /**
   * Check if an order contains items from allowed categories
   */
  function orderHasAllowedItems(order) {
    const allowedCategories = getStoredCategories();
    if (allowedCategories.includes('all')) return true;
    
    const items = order.items || [];
    return items.some(item => {
      const itemCategory = (item.category || '').toLowerCase();
      return allowedCategories.some(ac => 
        itemCategory.includes(ac) || ac.includes(itemCategory)
      );
    });
  }

  /**
   * Filter order items to only show allowed categories
   */
  function filterOrderItems(order) {
    const allowedCategories = getStoredCategories();
    if (allowedCategories.includes('all')) return order.items || [];
    
    const items = order.items || [];
    return items.filter(item => {
      const itemCategory = (item.category || '').toLowerCase();
      return allowedCategories.some(ac => 
        itemCategory.includes(ac) || ac.includes(itemCategory)
      );
    });
  }

  /**
   * Calculate total for allowed items only
   */
  function calculateAllowedTotal(order) {
    const allowedItems = filterOrderItems(order);
    return allowedItems.reduce((sum, item) => 
      sum + ((item.price || 0) * (item.quantity || 1)), 0
    );
  }

  /**
   * Filter offers by category
   */
  function filterOffers(offers) {
    const allowedCategories = getStoredCategories();
    if (allowedCategories.includes('all')) return offers;
    
    return offers.filter(offer => 
      !offer.category || allowedCategories.includes(offer.category)
    );
  }

  /**
   * Filter banners by category
   */
  function filterBanners(banners) {
    const allowedCategories = getStoredCategories();
    if (allowedCategories.includes('all')) return banners;
    
    return banners.filter(banner => 
      !banner.category || allowedCategories.includes(banner.category)
    );
  }

  // ============================================
  // 9. UI PROTECTION
  // ============================================
  
  function showAccessDenied(message) {
    // Create or update a warning banner
    let banner = document.getElementById('accessDeniedBanner');
    
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'accessDeniedBanner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #fee2e2;
        color: #991b1b;
        padding: 14px 20px;
        text-align: center;
        font-weight: 600;
        font-size: 0.9rem;
        z-index: 9999;
        animation: slideDown 0.3s ease;
        border-bottom: 2px solid #ef4444;
      `;
      document.body.prepend(banner);
      
      // Add animation style
      const style = document.createElement('style');
      style.textContent = '@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }';
      document.head.appendChild(style);
    }
    
    banner.textContent = '⚠️ ' + message;
    banner.style.display = 'block';
    
    // Auto-hide after 5 seconds
    clearTimeout(window._accessDeniedTimer);
    window._accessDeniedTimer = setTimeout(() => {
      banner.style.display = 'none';
    }, 5000);
  }

  /**
   * Hide UI elements that sub-admin shouldn't access
   */
  function hideRestrictedElements() {
    // Hide settings links
    document.querySelectorAll('.restricted-super-admin').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide global settings tabs
    const settingsTab = document.querySelector('[data-requires="super"]');
    if (settingsTab) settingsTab.style.display = 'none';
  }

  /**
   * Disable buttons for restricted categories
   */
  function disableRestrictedButtons(category) {
    if (!validateCategoryAccess(category)) {
      document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.title = 'You do not have access to this category';
      });
    }
  }

  // ============================================
  // 10. LOGGING SYSTEM
  // ============================================
  
  function logSecurityEvent(event) {
    try {
      const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
      
      logs.push({
        ...event,
        admin: localStorage.getItem('okmart_subAdmin_username') || 'unknown',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100)
      });
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
      
      // Also log to console
      console.log('📝 Security Event:', event);
    } catch (e) {
      console.warn('Failed to log event:', e);
    }
  }

  /**
   * Get all security logs
   */
  function getSecurityLogs() {
    try {
      return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear security logs
   */
  function clearSecurityLogs() {
    localStorage.removeItem(LOGS_KEY);
  }

  // ============================================
  // 11. INACTIVITY MONITOR
  // ============================================
  
  let inactivityTimer;

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      const isLoggedIn = localStorage.getItem('okmart_isAdmin') === 'true';
      if (isLoggedIn) {
        console.log('🔒 Auto logout due to inactivity');
        logSecurityEvent({
          type: 'AUTO_LOGOUT',
          action: 'inactivity_timeout',
          success: true
        });
        clearAllSessionData();
        window.location.href = LOGIN_PAGE;
      }
    }, INACTIVITY_TIMEOUT);
  }

  // Track user activity
  ['click', 'keypress', 'scroll', 'mousemove', 'touchstart', 'touchmove'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, { passive: true });
  });

  // ============================================
  // 12. EXPORT ALL FUNCTIONS TO WINDOW
  // ============================================
  
  window.Security = {
    // Core
    enforce: enforceSecurity,
    getCategories: getStoredCategories,
    refreshSession: refreshSession,
    logout: () => {
      logSecurityEvent({
        type: 'LOGOUT',
        action: 'manual_logout',
        success: true
      });
      clearAllSessionData();
      window.location.href = LOGIN_PAGE;
    },
    
    // Validation
    validateCategory: validateCategoryAccess,
    canAccess: (category) => {
      const allowed = getStoredCategories();
      return allowed.includes('all') || allowed.includes(category);
    },
    
    // Filtering
    filterProducts: filterProducts,
    filterOrderItems: filterOrderItems,
    filterOffers: filterOffers,
    filterBanners: filterBanners,
    orderHasAllowedItems: orderHasAllowedItems,
    calculateAllowedTotal: calculateAllowedTotal,
    
    // UI
    showAccessDenied: showAccessDenied,
    hideRestrictedElements: hideRestrictedElements,
    disableRestrictedButtons: disableRestrictedButtons,
    
    // Logging
    log: logSecurityEvent,
    getLogs: getSecurityLogs,
    clearLogs: clearSecurityLogs,
    
    // Session
    clearSession: clearAllSessionData
  };

  // ============================================
  // 13. AUTO-RUN SECURITY CHECK
  // ============================================
  
  // Run on every page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (enforceSecurity()) {
        hideRestrictedElements();
        resetInactivityTimer();
      }
    });
  } else {
    if (enforceSecurity()) {
      hideRestrictedElements();
      resetInactivityTimer();
    }
  }

  // Log page access
  logSecurityEvent({
    type: 'PAGE_ACCESS',
    action: 'page_load',
    page: window.location.pathname,
    success: true
  });

  console.log('🛡️ Role-based security system activated');
  console.log('📂 Allowed categories:', getStoredCategories().join(', '));

})();
