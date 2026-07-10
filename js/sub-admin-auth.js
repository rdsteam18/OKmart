// ===== OK Mart - SUB ADMIN PAGE PROTECTION =====
// Include this on EVERY sub-admin page

(function() {
  'use strict';
  
  const LOGIN_PAGE = 'login.html';
  
  function checkAccess() {
    const isAdmin = localStorage.getItem('okmart_isAdmin') === 'true';
    const adminRole = localStorage.getItem('okmart_adminRole') || 
                     localStorage.getItem('okmart_subAdmin_role');
    const loginTime = parseInt(localStorage.getItem('okmart_subAdmin_loginTime') || '0');
    const expired = (Date.now() - loginTime) > (12 * 60 * 60 * 1000);
    
    if (!isAdmin || adminRole !== 'sub' || expired) {
      // Clear stale data
      if (expired) {
        const keys = ['okmart_isAdmin','okmart_isSubAdmin','okmart_adminRole',
                      'okmart_subAdmin_role','okmart_admin_username','okmart_subAdmin_username',
                      'okmart_admin_categories','okmart_subAdmin_categories',
                      'okmart_admin_loginTime','okmart_subAdmin_loginTime'];
        keys.forEach(k => localStorage.removeItem(k));
      }
      
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage !== LOGIN_PAGE) {
        window.location.href = LOGIN_PAGE;
      }
      return false;
    }
    
    // Refresh timestamp
    const now = Date.now().toString();
    localStorage.setItem('okmart_subAdmin_loginTime', now);
    localStorage.setItem('okmart_admin_loginTime', now);
    
    return true;
  }
  
  // Run check
  checkAccess();
  
  // Expose helpers
  window.getAllowedCategories = function() {
    try {
      return JSON.parse(localStorage.getItem('okmart_subAdmin_categories') || 
                        localStorage.getItem('okmart_admin_categories') || '[]');
    } catch(e) { return []; }
  };
  
  window.subAdminLogout = function() {
    const keys = ['okmart_isAdmin','okmart_isSubAdmin','okmart_adminRole',
                  'okmart_subAdmin_role','okmart_admin_username','okmart_subAdmin_username',
                  'okmart_admin_categories','okmart_subAdmin_categories',
                  'okmart_admin_loginTime','okmart_subAdmin_loginTime'];
    keys.forEach(k => localStorage.removeItem(k));
    window.location.href = LOGIN_PAGE;
  };
  
})();

