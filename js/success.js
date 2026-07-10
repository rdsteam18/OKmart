// ===== OK MART - SUCCESS.JS =====
// Success page with repeat order functionality

(function() {
  'use strict';
  
  // ---------- DOM ELEMENTS ----------
  const orderReference = document.getElementById('orderReference');
  const repeatOrderBtn = document.getElementById('repeatOrderBtn');
  const toastMessage = document.getElementById('toastMessage');
  
  // ---------- CHECK ORDER EXISTENCE ----------
  
  function checkOrderExists() {
    const lastOrder = localStorage.getItem('okmart_last_order');
    
    // If no order and cart is also empty, could be direct access
    const cart = localStorage.getItem('okmart_cart');
    const hasCart = cart && JSON.parse(cart).length > 0;
    
    if (!lastOrder && !hasCart) {
      // Optional: redirect after a delay or show message
      console.log('No order found - this is normal if accessed directly');
    }
    
    return lastOrder;
  }
  
  // ---------- DISPLAY ORDER REFERENCE ----------
  
  function displayOrderReference() {
    const lastOrder = localStorage.getItem('okmart_last_order');
    
    if (lastOrder && orderReference) {
      try {
        const order = JSON.parse(lastOrder);
        
        if (order.orderId) {
          orderReference.innerHTML = `
            <span class="order-id">Order #${order.orderId}</span>
          `;
        }
        
        // Display order time if available
        if (order.orderTime) {
          const orderDate = new Date(order.orderTime);
          const timeStr = orderDate.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          const timeEl = document.createElement('div');
          timeEl.style.fontSize = '0.8rem';
          timeEl.style.color = 'var(--text-muted)';
          timeEl.style.marginTop = '4px';
          timeEl.textContent = `Placed at ${timeStr}`;
          
          orderReference.appendChild(timeEl);
        }
        
      } catch (e) {
        console.error('Error parsing order:', e);
      }
    }
  }
  
  // ---------- TOAST NOTIFICATION ----------
  
  function showToast(message, type = 'info') {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 3000);
  }
  
  // ---------- REPEAT ORDER FUNCTIONALITY ----------
  
  function repeatLastOrder() {
    const lastOrder = localStorage.getItem('okmart_last_order');
    
    if (!lastOrder) {
      showToast('No previous order found', 'error');
      return;
    }
    
    try {
      const order = JSON.parse(lastOrder);
      
      if (!order.items || order.items.length === 0) {
        showToast('Previous order is empty', 'error');
        return;
      }
      
      // Load items into cart
      const cartItems = order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        mrp: item.mrp,
        image: item.image,
        unit: item.unit,
        quantity: item.quantity
      }));
      
      // Save to cart
      localStorage.setItem('okmart_cart', JSON.stringify(cartItems));
      
      // Show success message
      showToast(`🛒 ${cartItems.length} items added to cart!`, 'success');
      
      // Disable button temporarily
      if (repeatOrderBtn) {
        repeatOrderBtn.disabled = true;
        repeatOrderBtn.textContent = '✓ Added to Cart';
        
        setTimeout(() => {
          repeatOrderBtn.disabled = false;
          repeatOrderBtn.textContent = '🔄 Repeat Last Order';
        }, 2000);
      }
      
      // Option: redirect to cart after short delay
      setTimeout(() => {
        window.location.href = 'cart.html';
      }, 1500);
      
    } catch (e) {
      console.error('Error repeating order:', e);
      showToast('Failed to repeat order', 'error');
    }
  }
  
  // ---------- EVENT LISTENERS ----------
  
  if (repeatOrderBtn) {
    repeatOrderBtn.addEventListener('click', repeatLastOrder);
  }
  
  // ---------- INITIALIZATION ----------
  
  function init() {
    checkOrderExists();
    displayOrderReference();
    
    // Update cart badge
    if (window.OKMart && window.OKMart.getCartItems) {
      const cart = window.OKMart.getCartItems();
      const badges = document.querySelectorAll('.cart-badge');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      badges.forEach(badge => {
        if (badge) badge.textContent = totalItems;
      });
    }
    
    console.log('✅ Success page initialized');
  }
  
  init();
  
})();

