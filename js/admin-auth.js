// ===== OK MART - ADMIN AUTHENTICATION =====

// Check if admin is logged in
function checkAdminAuth() {
  const isLoggedIn = localStorage.getItem('okmart_isAdmin');
  const loginTime = parseInt(localStorage.getItem('okmart_admin_loginTime') || '0');
  const sessionExpiry = 12 * 60 * 60 * 1000; // 12 hours
  const currentPage = window.location.pathname.split('/').pop();
  
  // Skip login page
  if (currentPage === 'login.html') {
    if (isLoggedIn === 'true' && (Date.now() - loginTime) < sessionExpiry) {
      window.location.href = 'index.html';
    }
    return;
  }
  
  // Check for all admin pages
  if (isLoggedIn !== 'true' || (Date.now() - loginTime) >= sessionExpiry) {
    // Clear session
    localStorage.removeItem('okmart_isAdmin');
    localStorage.removeItem('okmart_admin_username');
    localStorage.removeItem('okmart_admin_loginTime');
    localStorage.removeItem('okmart_admin_role');
    window.location.href = 'login.html';
  }
}

// Admin logout
function adminLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('okmart_isAdmin');
    localStorage.removeItem('okmart_admin_username');
    localStorage.removeItem('okmart_admin_loginTime');
    localStorage.removeItem('okmart_admin_role');
    window.location.href = 'login.html';
  }
}

// Run auth check on page load
checkAdminAuth();
