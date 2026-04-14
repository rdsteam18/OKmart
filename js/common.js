// js/common.js – reusable utilities, cart indicator sync (dummy)
(function() {
  // Simple cart count getter (dummy, will be replaced later)
  function getCartItemCount() {
    // for UI demo: parse from session or default 2 (for cart page demo)
    if (window.location.pathname.includes('cart.html')) return 2;
    if (window.location.pathname.includes('checkout.html')) return 2;
    return 2; // home page shows 2 items
  }

  function updateCartIndicators() {
    const count = getCartItemCount();
    document.querySelectorAll('.js-cart-count-indicator').forEach(el => {
      el.textContent = count;
    });
    const itemCountSpan = document.querySelector('.js-cart-item-count');
    if (itemCountSpan) {
      itemCountSpan.textContent = count + (count === 1 ? ' item' : ' items');
    }
  }

  window.updateAllCartIndicators = updateCartIndicators;

  document.addEventListener('DOMContentLoaded', () => {
    updateCartIndicators();
    // make tap targets friendly
  });
})();
