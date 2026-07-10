// ===== OK Mart - SUB ADMIN LOGIN SYSTEM =====
// Firebase authentication with role-based access for sub-admins only

(function() {
  'use strict';
  
  // ============================================
  // DOM ELEMENTS
  // ============================================
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const errorMessage = document.getElementById('errorMessage');
  const togglePassword = document.getElementById('togglePassword');
  
  // ============================================
  // SESSION CHECK
  // ============================================
  function checkExistingSession() {
    const isAdmin = localStorage.getItem('okmart_isSubAdmin');
    const loginTime = parseInt(localStorage.getItem('okmart_subAdmin_loginTime') || '0');
    const sessionExpiry = 12 * 60 * 60 * 1000; // 12 hours
    
    if (isAdmin === 'true' && (Date.now() - loginTime) < sessionExpiry) {
      window.location.href = 'index.html';
      return true;
    }
    
    // Clear expired session
    if (isAdmin === 'true') {
      clearSubAdminSession();
    }
    
    return false;
  }
  
  // Redirect if already logged in
  if (checkExistingSession()) {
    // Already redirected
  }
  
  // ============================================
  // PASSWORD TOGGLE
  // ============================================
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
  });
  
  // ============================================
  // LOGIN FUNCTION
  // ============================================
  async function handleLogin(username, password) {
    // Show loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    errorMessage.classList.remove('show');
    
    // Clear previous error styles
    usernameInput.classList.remove('error');
    passwordInput.classList.remove('error');
    
    try {
      // Query Firestore admins collection
      const snapshot = await db.collection('admins')
        .where('username', '==', username)
        .where('password', '==', password)
        .where('active', '==', true)
        .get();
      
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (!snapshot.empty) {
        const adminData = snapshot.docs[0].data();
        
        // Check if user is a sub-admin
        if (adminData.role !== 'sub') {
          showError('This login is for sub-admins only. Please use the main admin login.');
          passwordInput.value = '';
          console.warn('⚠️ Non-sub-admin attempted sub-admin login:', username);
          
          loginBtn.classList.remove('loading');
          loginBtn.disabled = false;
          return;
        }
        
        // ============================================
        // ✅ LOGIN SUCCESSFUL
        // ============================================
        
        // Save sub-admin session to localStorage
        localStorage.setItem('okmart_isSubAdmin', 'true');
        localStorage.setItem('okmart_subAdmin_username', username);
        localStorage.setItem('okmart_subAdmin_role', adminData.role || 'sub');
        localStorage.setItem('okmart_subAdmin_categories', JSON.stringify(adminData.categories || []));
        localStorage.setItem('okmart_subAdmin_loginTime', Date.now().toString());
        
        // Also set standard admin flags for compatibility
        localStorage.setItem('okmart_isAdmin', 'true');
        localStorage.setItem('okmart_admin_username', username);
        localStorage.setItem('okmart_admin_role', adminData.role || 'sub');
        localStorage.setItem('okmart_admin_categories', JSON.stringify(adminData.categories || []));
        localStorage.setItem('okmart_admin_loginTime', Date.now().toString());
        
        console.log('✅ Sub-admin logged in:', username);
        console.log('📂 Allowed categories:', adminData.categories);
        
        // Success state
        loginBtn.classList.remove('loading');
        loginBtn.classList.add('success');
        loginBtn.innerHTML = '<span>✅ Login Successful!</span>';
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
        
      } else {
        // ============================================
        // ❌ LOGIN FAILED
        // ============================================
        showError('Invalid username or password. Please try again.');
        passwordInput.value = '';
        passwordInput.focus();
        
        // Shake inputs
        usernameInput.classList.add('error');
        passwordInput.classList.add('error');
        setTimeout(() => {
          usernameInput.classList.remove('error');
          passwordInput.classList.remove('error');
        }, 500);
        
        console.warn('❌ Failed sub-admin login attempt:', username);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'unavailable' || error.code === 'resource-exhausted') {
        showError('Server connection error. Please try again.');
      } else {
        showError('Something went wrong. Please try again.');
      }
      
    } finally {
      // Reset button state (if not success)
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
      
      if (!loginBtn.classList.contains('success')) {
        loginBtn.innerHTML = '<span class="btn-spinner"></span><span class="btn-text">🔐 Login to Dashboard</span>';
      }
    }
  }
  
  // ============================================
  // SHOW ERROR
  // ============================================
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Auto hide after 5 seconds
    clearTimeout(window._errorTimeout);
    window._errorTimeout = setTimeout(() => {
      errorMessage.classList.remove('show');
    }, 5000);
  }
  
  // ============================================
  // FORM SUBMISSION
  // ============================================
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validation
    if (!username) {
      showError('Please enter your username');
      usernameInput.focus();
      usernameInput.classList.add('error');
      setTimeout(() => usernameInput.classList.remove('error'), 500);
      return;
    }
    
    if (!password) {
      showError('Please enter your password');
      passwordInput.focus();
      passwordInput.classList.add('error');
      setTimeout(() => passwordInput.classList.remove('error'), 500);
      return;
    }
    
    if (password.length < 4) {
      showError('Password must be at least 4 characters');
      return;
    }
    
    // Attempt login
    handleLogin(username, password);
  });
  
  // ============================================
  // CLEAR SESSION
  // ============================================
  window.clearSubAdminSession = function() {
    localStorage.removeItem('okmart_isSubAdmin');
    localStorage.removeItem('okmart_subAdmin_username');
    localStorage.removeItem('okmart_subAdmin_role');
    localStorage.removeItem('okmart_subAdmin_categories');
    localStorage.removeItem('okmart_subAdmin_loginTime');
    
    // Also clear standard admin flags
    localStorage.removeItem('okmart_isAdmin');
    localStorage.removeItem('okmart_admin_username');
    localStorage.removeItem('okmart_admin_role');
    localStorage.removeItem('okmart_admin_categories');
    localStorage.removeItem('okmart_admin_loginTime');
  };
  
  // ============================================
  // KEYBOARD SHORTCUT
  // ============================================
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement === passwordInput) {
      loginForm.dispatchEvent(new Event('submit'));
    }
  });
  
  // ============================================
  // INIT
  // ============================================
  console.log('🔧 Sub-admin login system ready');
  console.log('💡 Demo credentials: friend / okmart2024');
  
})();

