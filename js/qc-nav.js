/* ============================================================
   OK MART — floating bottom-nav cart badge (shared snippet).
   Reads the REAL cart from localStorage key 'okmart_cart' and
   shows the total item count on the Basket tab badge.
   Runs on page load, on pageshow (back/forward cache) and whenever
   a 'cartUpdated' event fires. No dependency on any page's own
   cart code, so every page carrying .qc-bottom-nav stays in sync.
   ============================================================ */
(function () {
  'use strict';

  function refreshQcNavBadge() {
    var badge = document.getElementById('bottomNavCartCount');
    if (!badge) return;
    var count = 0;
    try {
      var cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
      if (Array.isArray(cart)) {
        count = cart.reduce(function (s, i) { return s + (i.quantity || 1); }, 0);
      }
    } catch (e) { count = 0; }
    badge.textContent = count;
    badge.classList.toggle('show', count > 0);
  }

  document.addEventListener('DOMContentLoaded', refreshQcNavBadge);
  window.addEventListener('pageshow', refreshQcNavBadge);
  window.addEventListener('cartUpdated', refreshQcNavBadge);
  window.addEventListener('storage', function (e) {
    if (e.key === 'okmart_cart') refreshQcNavBadge();
  });
  // If this script loads after DOMContentLoaded already fired.
  if (document.readyState !== 'loading') refreshQcNavBadge();
})();
