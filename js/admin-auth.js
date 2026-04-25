// ===== OK MART - ADMIN ROUTE PROTECTION =====
// Include this on ALL admin pages

(function() {
  'use strict';
  
  const ADMIN_LOGIN_PAGE = 'login.html';
  const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours
  
  function checkAuth() {
    const isAdmin = localStorage.getItem('okmart_isAdmin');
    const loginTime = parseInt(localStorage.getItem('okmart_admin_loginTime') || '0');
    const expired = (Date.now() - loginTime) > SESSION_DURATION;
    
    if (isAdmin !== 'true' || expired) {
      if (expired) {
        localStorage.removeItem('okmart_isAdmin');
        localStorage.removeItem('okmart_admin_username');
        localStorage.removeItem('okmart_admin_loginTime');
      }
      
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage !== ADMIN_LOGIN_PAGE) {
        window.location.href = ADMIN_LOGIN_PAGE;
      }
      return false;
    }
    
    // Refresh login timestamp
    localStorage.setItem('okmart_admin_loginTime', Date.now().toString());
    return true;
  }
  
  checkAuth();
  
  // Logout function
  window.adminLogout = function() {
    localStorage.removeItem('okmart_isAdmin');
    localStorage.removeItem('okmart_admin_username');
    localStorage.removeItem('okmart_admin_loginTime');
    localStorage.removeItem('okmart_admin_role');
    window.location.href = ADMIN_LOGIN_PAGE;
  };
  
  window.isAdminLoggedIn = function() {
    return localStorage.getItem('okmart_isAdmin') === 'true';
  };
  
})();
