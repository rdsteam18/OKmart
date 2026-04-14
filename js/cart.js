// ===== CART.JS =====
// render cart items, summary, handle updates

(function() {
  const container = document.getElementById('cartItemsContainer');
  const summaryDiv = document.getElementById('cartSummary');
  
  function renderCart() {
    const cart = OKMart.getCartItems();
    if (!container) return;
    
    if (cart.length === 0) {
      container.innerHTML = '<div class="empty-cart" style="padding:3rem;text-align:center">🛒 Your cart is empty</div>';
      if (summaryDiv) summaryDiv.innerHTML = '';
      return;
    }
    
    let html = '<div class="cart-list">';
    let subtotal = 0;
    
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      
      html += `
        <div class="cart-item" style="display:flex;gap:16px;padding:16px;background:white;border-radius:16px;margin-bottom:12px;align-items:center;">
          <img src="${item.image}" style="width:70px;height:70px;object-fit:cover;border-radius:12px;">
          <div style="flex:1">
            <h4 style="font-weight:600">${item.name}</h4>
            <span style="font-size:0.8rem;color:#64748b">${item.unit || ''}</span>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
              <span style="font-weight:700">₹${item.price}</span>
              <span style="color:#64748b">x${item.quantity}</span>
            </div>
          </div>
          <div style="font-weight:700">₹${itemTotal}</div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    if (summaryDiv) {
      const delivery = subtotal > 99 ? 0 : 20;
      const total = subtotal + delivery;
      summaryDiv.innerHTML = `
        <div style="background:white;border-radius:16px;padding:16px;margin-top:8px">
          <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>₹${subtotal}</span></div>
          <div style="display:flex;justify-content:space-between;margin-top:8px"><span>Delivery</span><span>${delivery === 0 ? 'FREE' : '₹20'}</span></div>
          <hr style="margin:12px 0">
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.2rem"><span>Total</span><span>₹${total}</span></div>
        </div>
      `;
    }
  }
  
  renderCart();
  // listen to storage/cart updates
  window.addEventListener('okmart:cart-updated', renderCart);
  window.addEventListener('storage', renderCart);
})();
