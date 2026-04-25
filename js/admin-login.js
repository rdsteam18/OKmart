// ===== OK MART - ADMIN LOGIN SYSTEM =====
// Secure Firebase-based authentication with session management

(function() {
  'use strict';
  
  // ========== DOM ELEMENTS ==========
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const errorMessage = document.getElementById('errorMessage');
  const togglePassword = document.getElementById('togglePassword');
  
  // ========== SESSION CHECK ==========
  // If already logged in, redirect to dashboard
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
    // Show loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    errorMessage.classList.remove('show');
    
    try {
      // Query Firestore admins collection
      const snapshot = await db.collection('admins')
        .where('username', '==', username)
        .where('password', '==', password)
        .where('active', '==', true)
        .get();
      
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!snapshot.empty) {
        // Login successful
        const adminData = snapshot.docs[0].data();
        
        // Save session to localStorage
        localStorage.setItem('okmart_isAdmin', 'true');
        localStorage.setItem('okmart_admin_username', username);
        localStorage.setItem('okmart_admin_loginTime', Date.now().toString());
        
        if (adminData.role) {
          localStorage.setItem('okmart_admin_role', adminData.role);
        }
        
        // Success animation
        loginBtn.style.background = '#10b981';
        loginBtn.querySelector('.btn-text').textContent = '✅ Login Successful!';
        loginBtn.classList.remove('loading');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 400);
        
        console.log('✅ Admin login successful:', username);
        
      } else {
        // Login failed
        showError('Invalid username or password');
        passwordInput.value = '';
        passwordInput.focus();
        
        // Shake animation on inputs
        usernameInput.classList.add('error');
        passwordInput.classList.add('error');
        setTimeout(() => {
          usernameInput.classList.remove('error');
          passwordInput.classList.remove('error');
        }, 500);
        
        console.warn('❌ Failed login attempt for:', username);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      showError('Connection error. Please try again.');
      
    } finally {
      // Reset button state
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
    }
  }
  
  // ========== SHOW ERROR ==========
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      errorMessage.classList.remove('show');
    }, 4000);
  }
  
  // ========== FORM SUBMISSION ==========
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
  
  // ========== CLEAR SESSION ==========
  window.clearAdminSession = function() {
    localStorage.removeItem('okmart_isAdmin');
    localStorage.removeItem('okmart_admin_username');
    localStorage.removeItem('okmart_admin_loginTime');
    localStorage.removeItem('okmart_admin_role');
  };
  
  // ========== KEYBOARD SHORTCUT ==========
  // Press Enter to submit
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement === passwordInput) {
      loginForm.dispatchEvent(new Event('submit'));
    }
  });
  
  console.log('🔒 Admin login system ready');
  
})();
