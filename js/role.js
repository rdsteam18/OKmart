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
  
  function securityCheck() {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('/login.html') || path.endsWith('/login') || path.endsWith('login.html')) {
      return true;
    }
    
    const isAdmin = localStorage.getItem("okmart_isAdmin") === "true" || localStorage.getItem("isAdmin") === "true";
    const role = localStorage.getItem("okmart_adminRole") || localStorage.getItem("okmart_subAdmin_role") || localStorage.getItem("adminRole");
    
    if (!isAdmin || role !== 'sub') {
      window.location.replace(LOGIN_PAGE);
      return false;
    }
    
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

