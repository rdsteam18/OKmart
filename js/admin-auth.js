// ===== OK MART - ADMIN ROUTE PROTECTION =====
// Include this file on ALL admin pages to protect them

(function() {
  'use strict';
  
  const ADMIN_LOGIN_PAGE = 'login.html';
  const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours
  
  function checkAdminAuth() {
    const isAdmin = localStorage.getItem('okmart_isAdmin');
    const loginTime = parseInt(localStorage.getItem('okmart_admin_loginTime') || '0');
    const sessionExpired = (Date.now() - loginTime) > SESSION_DURATION;
    
    // Not logged in or session expired
    if (isAdmin !== 'true' || sessionExpired) {
      // Clear any stale data
      if (sessionExpired) {
        localStorage.removeItem('okmart_isAdmin');
        localStorage.removeItem('okmart_admin_username');
        localStorage.removeItem('okmart_admin_loginTime');
        localStorage.removeItem('okmart_admin_role');
      }
      
      // Get current page path
      const currentPath = window.location.pathname;
      const currentPage = currentPath.split('/').pop();
      
      // Don't redirect if already on login page
      if (currentPage !== ADMIN_LOGIN_PAGE && currentPage !== 'login.html') {
        console.warn('🔒 Unauthorized access - Redirecting to login');
        window.location.href = ADMIN_LOGIN_PAGE;
      }
      
      return false;
    }
    
    // Refresh login time on activity
    localStorage.setItem('okmart_admin_loginTime', Date.now().toString());
    
    // Logged in successfully
    console.log('✅ Admin authenticated');
    return true;
  }
  
  // Run check immediately
  checkAdminAuth();
  
  // ========== EXPOSE LOGOUT FUNCTION ==========
  window.adminLogout = function() {
    localStorage.removeItem('okmart_isAdmin');
    localStorage.removeItem('okmart_admin_username');
    localStorage.removeItem('okmart_admin_loginTime');
    localStorage.removeItem('okmart_admin_role');
    window.location.href = ADMIN_LOGIN_PAGE;
  };
  
  // ========== EXPOSE CHECK FUNCTION ==========
  window.isAdminLoggedIn = function() {
    return localStorage.getItem('okmart_isAdmin') === 'true' && 
           (Date.now() - parseInt(localStorage.getItem('okmart_admin_loginTime') || '0')) < SESSION_DURATION;
  };
  
  // ========== AUTO LOGOUT ON INACTIVITY (OPTIONAL) ==========
  let inactivityTimer;
  
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (window.isAdminLoggedIn()) {
        console.log('🔒 Auto logout due to inactivity');
        window.adminLogout();
      }
    }, 30 * 60 * 1000); // 30 minutes of inactivity
  }
  
  // Track user activity
  ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer);
  });
  
  resetInactivityTimer();
  
})();
