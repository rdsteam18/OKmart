// ===== OK Mart - SUB ADMIN PAGE PROTECTION =====
// Include this on EVERY sub-admin page

(function() {
  'use strict';
  
  const LOGIN_PAGE = 'login.html';
  
  function checkAccess() {
    const isAdmin = localStorage.getItem('okmart_isAdmin') === 'true' || localStorage.getItem('isAdmin') === 'true';
    const adminRole = localStorage.getItem('okmart_adminRole') || 
                      localStorage.getItem('okmart_subAdmin_role') ||
                      localStorage.getItem('adminRole');
                      
    let loginTime = parseInt(localStorage.getItem('okmart_subAdmin_loginTime') || localStorage.getItem('adminLoginTime') || '0');
    const expired = loginTime > 0 && ((Date.now() - loginTime) > (12 * 60 * 60 * 1000));
    const currentPage = window.location.pathname.split('/').pop() || '';
    
    // Skip checking on login page itself - NEVER redirect on login.html
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('/login.html') || path.endsWith('/login') || path.endsWith('login.html')) {
      return true;
    }
    
    if (!isAdmin || adminRole !== 'sub' || expired) {
      // Clear stale data
      clearSubAdminKeys();
      window.location.replace(LOGIN_PAGE);
      return false;
    }
    
    // Refresh timestamp
    const now = Date.now().toString();
    localStorage.setItem('okmart_subAdmin_loginTime', now);
    localStorage.setItem('okmart_admin_loginTime', now);
    
    return true;
  }
  
  function clearSubAdminKeys() {
    const keys = [
      'okmart_isAdmin',
      'okmart_isSubAdmin',
      'okmart_adminRole',
      'okmart_subAdmin_role',
      'okmart_admin_username',
      'okmart_subAdmin_username',
      'okmart_admin_categories',
      'okmart_subAdmin_categories',
      'okmart_admin_loginTime',
      'okmart_subAdmin_loginTime',
      'isAdmin',
      'adminRole',
      'adminUsername',
      'allowedCategories',
      'adminLoginTime'
    ];
    keys.forEach(k => localStorage.removeItem(k));
  }
  
  // Run check
  checkAccess();
  
  // Expose helpers
  window.getAllowedCategories = function() {
    try {
      return JSON.parse(localStorage.getItem('okmart_subAdmin_categories') || 
                        localStorage.getItem('okmart_admin_categories') || 
                        localStorage.getItem('allowedCategories') || '[]');
    } catch(e) { return []; }
  };
  
  window.subAdminLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
      clearSubAdminKeys();
      window.location.href = LOGIN_PAGE;
    }
  };
  
  window.logout = window.subAdminLogout;
  
})();
