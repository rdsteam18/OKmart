// ===== OK MART - ADMIN AUTHENTICATION =====

// Check if admin is logged in
function checkAdminAuth() {
  const isLoggedIn = localStorage.getItem('okmart_isAdmin') === 'true' || 
                     localStorage.getItem('adminLoggedIn') === 'true' || 
                     localStorage.getItem('isAdmin') === 'true';
                     
  let loginTime = parseInt(localStorage.getItem('okmart_admin_loginTime') || localStorage.getItem('adminLoginTime') || '0');
  const sessionExpiry = 12 * 60 * 60 * 1000; // 12 hours
  const currentPage = window.location.pathname.split('/').pop() || '';
  
  // If logged in but loginTime was missing, backfill it now
  if (isLoggedIn && !loginTime) {
    loginTime = Date.now();
    localStorage.setItem('okmart_admin_loginTime', loginTime.toString());
  }
  
  // Skip login page
  if (currentPage === 'login.html') {
    if (isLoggedIn && (Date.now() - loginTime) < sessionExpiry) {
      window.location.href = 'index.html';
    }
    return;
  }
  
  // Check for all admin pages
  if (!isLoggedIn || (Date.now() - loginTime) >= sessionExpiry) {
    // Clear admin session
    clearAdminKeys();
    window.location.href = 'login.html';
  }
}

function clearAdminKeys() {
  const adminKeys = [
    'okmart_isAdmin',
    'okmart_admin_username',
    'okmart_admin_loginTime',
    'okmart_admin_role',
    'adminLoggedIn',
    'adminEmail',
    'adminUsername',
    'adminLoginTime'
  ];
  adminKeys.forEach(key => localStorage.removeItem(key));
}

// Admin logout
function adminLogout() {
  if (confirm('Are you sure you want to logout?')) {
    clearAdminKeys();
    window.location.href = 'login.html';
  }
}

// Expose globally
window.adminLogout = adminLogout;
window.logout = adminLogout;

// Run auth check on page load
checkAdminAuth();
