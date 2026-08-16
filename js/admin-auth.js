// ===== OK MART - ADMIN AUTHENTICATION =====

function isCurrentPageLogin() {
  const path = window.location.pathname.toLowerCase();
  return path.endsWith('/login.html') || path.endsWith('/login') || path.endsWith('login.html');
}

// Check if admin is logged in
function checkAdminAuth() {
  // If on login page, DO NOT redirect automatically - let user view and use the login form
  if (isCurrentPageLogin()) {
    return;
  }
  
  const isLoggedIn = localStorage.getItem('okmart_isAdmin') === 'true' || 
                     localStorage.getItem('adminLoggedIn') === 'true' || 
                     localStorage.getItem('isAdmin') === 'true';
                     
  let loginTime = parseInt(localStorage.getItem('okmart_admin_loginTime') || localStorage.getItem('adminLoginTime') || '0');
  const sessionExpiry = 24 * 60 * 60 * 1000; // 24 hours
  
  // If logged in, ensure all keys are synced and timestamp is active
  if (isLoggedIn) {
    if (!loginTime || (Date.now() - loginTime) >= sessionExpiry) {
      loginTime = Date.now();
    }
    localStorage.setItem('okmart_isAdmin', 'true');
    localStorage.setItem('okmart_admin_loginTime', loginTime.toString());
    localStorage.setItem('adminLoggedIn', 'true');
    return true;
  }
  
  // Not logged in and on a protected admin page -> redirect to login.html cleanly
  clearAdminKeys();
  window.location.replace('login.html');
  return false;
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
    window.location.replace('login.html');
  }
}

// Expose globally
window.adminLogout = adminLogout;
window.logout = adminLogout;
window.checkAdminAuth = checkAdminAuth;

// Run auth check on page load
checkAdminAuth();
