// checkout.js – simple placeholder summary
(function() {
  const summary = document.getElementById('checkoutSummary');
  const cart = OKMart.getCartItems();
  if (summary && cart.length) {
    const subtotal = cart.reduce((sum, i) => sum + i.price*i.quantity, 0);
    summary.innerHTML = `<p style="padding:1rem;background:white;border-radius:16px">💰 Total: ₹${subtotal}</p>`;
  }
  
  document.getElementById('checkoutForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    OKMart.clearCart();
    window.location.href = 'success.html';
  });
})();
