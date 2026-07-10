// ===== OK MART - ADMIN LOGIN SYSTEM =====
// Firebase authentication with session management

(function() {
  'use strict';
  
  // ========== DOM ELEMENTS ==========
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const errorMessage = document.getElementById('errorMessage');
  const togglePassword = document.getElementById('togglePassword');
  const rememberMe = document.getElementById('rememberMe');
  
  // ========== SESSION CHECK ==========
  function checkExistingSession() {
    const isAdmin = localStorage.getItem('okmart_isAdmin');
    const loginTime = parseInt(localStorage.getItem('okmart_admin_loginTime') || '0');
    const sessionExpiry = 12 * 60 * 60 * 1000; // 12 hours
    
    if (isAdmin === 'true' && (Date.now() - loginTime) < sessionExpiry) {
      window.location.href = 'index.html';
      return true;
    }
    
    // Clear expired session
    if (isAdmin === 'true') {
      clearAdminSession();
    }
    
    return false;
  }
  
  // Redirect if already logged in
  if (checkExistingSession()) {
    // Already redirected
  }
  
  // ========== PASSWORD TOGGLE ==========
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
  });
  
  // ========== LOGIN FUNCTION ==========
  async function handleLogin(username, password) {
    // Show loading
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    errorMessage.classList.remove('show');
    
    try {
      // Query Firebase admins collection
      const snapshot = await db.collection('admins')
        .where('username', '==', username)
        .where('password', '==', password)
        .where('active', '==', true)
        .get();
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (!snapshot.empty) {
        // ✅ LOGIN SUCCESSFUL
        const adminData = snapshot.docs[0].data();
        
        // Save session
        localStorage.setItem('okmart_isAdmin', 'true');
        localStorage.setItem('okmart_admin_username', username);
        localStorage.setItem('okmart_admin_loginTime', Date.now().toString());
        
        if (adminData.role) {
          localStorage.setItem('okmart_admin_role', adminData.role);
        }
        
        // Remember me - store username
        if (rememberMe.checked) {
          localStorage.setItem('okmart_admin_remembered', username);
        } else {
          localStorage.removeItem('okmart_admin_remembered');
        }
        
        // Success state
        loginBtn.classList.remove('loading');
        loginBtn.classList.add('success');
        loginBtn.innerHTML = '<span>✅ Login Successful!</span>';
        
        console.log('✅ Admin logged in:', username);
        
        // Redirect
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
        
      } else {
        // ❌ LOGIN FAILED
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
        
        console.warn('❌ Failed login attempt:', username);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if Firebase is connected
      if (error.code === 'unavailable' || error.code === 'resource-exhausted') {
        showError('Server connection error. Please try again.');
      } else {
        showError('Something went wrong. Please try again.');
      }
      
    } finally {
      // Reset button
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
      
      if (!loginBtn.classList.contains('success')) {
        loginBtn.innerHTML = '<span class="btn-spinner"></span><span class="btn-text">🔐 Login to Dashboard</span>';
      }
    }
  }
  
  // ========== SHOW ERROR ==========
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Auto hide after 5 seconds
    clearTimeout(window._errorTimeout);
    window._errorTimeout = setTimeout(() => {
      errorMessage.classList.remove('show');
    }, 5000);
  }
  
  // ========== FORM SUBMIT ==========
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
  
  // ========== LOAD REMEMBERED USERNAME ==========
  const remembered = localStorage.getItem('okmart_admin_remembered');
  if (remembered) {
    usernameInput.value = remembered;
    rememberMe.checked = true;
    passwordInput.focus();
  }
  
  // ========== CLEAR SESSION ==========
  window.clearAdminSession = function() {
    localStorage.removeItem('okmart_isAdmin');
    localStorage.removeItem('okmart_admin_username');
    localStorage.removeItem('okmart_admin_loginTime');
    localStorage.removeItem('okmart_admin_role');
    // Keep remembered username
  };
  
  // ========== KEYBOARD SHORTCUT ==========
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement === passwordInput) {
      loginForm.dispatchEvent(new Event('submit'));
    }
  });
  
  console.log('🔒 Admin login system ready');
  console.log('💡 Default credentials: admin / okmart2024');
  
})();

