// ===== OK MART - ADMIN AUTH CHECK =====
// Include this on ALL admin pages to protect them

(function() {
  const isLoggedIn = sessionStorage.getItem('okmart_admin_logged') === 'true';
  const loginTime = parseInt(sessionStorage.getItem('okmart_admin_time') || '0');
  const sessionExpired = Date.now() - loginTime > 8 * 60 * 60 * 1000; // 8 hours
  
  if (!isLoggedIn || sessionExpired) {
    sessionStorage.removeItem('okmart_admin_logged');
    sessionStorage.removeItem('okmart_admin_time');
    window.location.href = 'login.html';
  }
})();
