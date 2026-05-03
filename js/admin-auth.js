// ===== OK MART - ADMIN AUTHENTICATION =====

// Check if admin is logged in
function checkAdminAuth() {
  const isLoggedIn = localStorage.getItem('adminLoggedIn');
  const currentPage = window.location.pathname;
  
  // Skip login page
  if (currentPage.includes('login.html')) {
    if (isLoggedIn === 'true') {
      window.location.href = 'index.html';
    }
    return;
  }
  
  // Check for all admin pages
  if (isLoggedIn !== 'true') {
    window.location.href = 'login.html';
  }
}

// Admin logout
function adminLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminEmail');
    window.location.href = 'login.html';
  }
}

// Run auth check on page load
checkAdminAuth();
