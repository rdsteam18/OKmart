// ===== OK Mart - Role System =====
(function() {
  'use strict';
  
  const LOGIN_PAGE = '/sub-admin/login.html';
  
  // Get allowed categories
  window.getAllowedCategories = function() {
    try {
      return JSON.parse(localStorage.getItem("allowedCategories") || '[]');
    } catch(e) { return []; }
  };
  
  // Check if user is sub-admin
  window.isSubAdmin = function() {
    return localStorage.getItem("isAdmin") === "true" && 
           localStorage.getItem("adminRole") === "sub";
  };
  
  // Security check - runs on every page
  function securityCheck() {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const role = localStorage.getItem("adminRole");
    const loginTime = parseInt(localStorage.getItem("adminLoginTime") || '0');
    const expired = (Date.now() - loginTime) > (12 * 60 * 60 * 1000);
    
    if (!isAdmin || role !== 'sub' || expired) {
      if (expired) {
        localStorage.clear();
      }
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage !== 'login.html') {
        window.location.href = LOGIN_PAGE;
      }
      return false;
    }
    
    localStorage.setItem("adminLoginTime", Date.now().toString());
    return true;
  }
  
  // Category validation
  window.canAccessCategory = function(category) {
    const allowed = window.getAllowedCategories();
    return allowed.includes('all') || allowed.includes(category);
  };
  
  // Filter helpers
  window.filterByCategory = function(items, field = 'category') {
    const allowed = window.getAllowedCategories();
    if (allowed.includes('all')) return items;
    return items.filter(item => allowed.includes(item[field]));
  };
  
  window.orderHasAllowedItems = function(order) {
    const allowed = window.getAllowedCategories();
    if (allowed.includes('all')) return true;
    return (order.items || []).some(item => {
      const cat = (item.category || '').toLowerCase();
      return allowed.some(a => cat.includes(a) || a.includes(cat));
    });
  };
  
  window.filterOrderItems = function(order) {
    const allowed = window.getAllowedCategories();
    if (allowed.includes('all')) return order.items || [];
    return (order.items || []).filter(item => {
      const cat = (item.category || '').toLowerCase();
      return allowed.some(a => cat.includes(a) || a.includes(cat));
    });
  };
  
  // Logout
  window.subAdminLogout = function() {
    localStorage.clear();
    window.location.href = LOGIN_PAGE;
  };
  
  // Run check
  securityCheck();
  
})();
