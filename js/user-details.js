(function() {
  'use strict';
  
  const USER_KEY = 'okmart_user';
  
  const form = document.getElementById('userForm');
  const fullName = document.getElementById('fullName');
  const phoneNumber = document.getElementById('phoneNumber');
  const userAddress = document.getElementById('userAddress');
  const userPincode = document.getElementById('userPincode');
  const userEmail = document.getElementById('userEmail');
  const toastMessage = document.getElementById('toastMessage');
  
  const nameError = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');
  const addressError = document.getElementById('addressError');
  const pincodeError = document.getElementById('pincodeError');
  
  const ALLOWED_PINCODES = ['380026', '382418', '380058', '110001', '400001', '560001'];
  
  function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    setTimeout(() => toastMessage.classList.remove('show'), 2500);
  }
  
  function validateForm() {
    let isValid = true;
    
    if (!fullName.value.trim() || fullName.value.trim().length < 2) {
      nameError.textContent = 'Please enter your full name';
      isValid = false;
    } else {
      nameError.textContent = '';
    }
    
    const phone = phoneNumber.value.trim();
    if (!/^\d{10}$/.test(phone)) {
      phoneError.textContent = 'Please enter a valid 10-digit number';
      isValid = false;
    } else {
      phoneError.textContent = '';
    }
    
    if (!userAddress.value.trim() || userAddress.value.trim().length < 5) {
      addressError.textContent = 'Please enter your complete address';
      isValid = false;
    } else {
      addressError.textContent = '';
    }
    
    const pincode = userPincode.value.trim();
    if (!/^\d{6}$/.test(pincode)) {
      pincodeError.textContent = 'Please enter a valid 6-digit pincode';
      isValid = false;
    } else if (!ALLOWED_PINCODES.includes(pincode)) {
      pincodeError.textContent = 'Delivery not available in this area';
      isValid = false;
    } else {
      pincodeError.textContent = '';
    }
    
    return isValid;
  }
  
  function saveUserData() {
    const userData = {
      name: fullName.value.trim(),
      phone: phoneNumber.value.trim(),
      address: userAddress.value.trim(),
      pincode: userPincode.value.trim(),
      email: userEmail.value.trim() || '',
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return userData;
  }
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      saveUserData();
      showToast('Profile saved! Redirecting...', 'success');
      
      setTimeout(() => {
        const returnTo = sessionStorage.getItem('returnTo') || '/index.html';
        sessionStorage.removeItem('returnTo');
        window.location.href = returnTo;
      }, 1000);
    }
  });
  
  // Pre-fill if editing
  const existingUser = localStorage.getItem(USER_KEY);
  if (existingUser) {
    const user = JSON.parse(existingUser);
    fullName.value = user.name || '';
    phoneNumber.value = user.phone || '';
    userAddress.value = user.address || '';
    userPincode.value = user.pincode || '';
    userEmail.value = user.email || '';
  }
})();

