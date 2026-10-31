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

/* ============================================================
   OKMART NO-ZOOM — pinch / double-tap / gesture / shortcut zoom
   is disabled site-wide. Identical copies live in js/firebase.js,
   js/common.js and js/qc-nav.js (keep in sync). The guard makes
   double-loading harmless. Map pinching inside #mapPicker is
   intentionally left working so the location map stays usable.
   ============================================================ */
(function () {
  if (window.__okmartNoZoom) return;
  window.__okmartNoZoom = true;
  var VIEWPORT = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  function enforceViewport() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }
    if (meta.getAttribute('content') !== VIEWPORT) meta.setAttribute('content', VIEWPORT);
  }
  function inMap(e) {
    return e.target && e.target.closest && e.target.closest('#mapPicker, .leaflet-container');
  }
  enforceViewport();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceViewport);
  }
  var style = document.createElement('style');
  style.textContent = 'html,body{touch-action:pan-x pan-y;}';
  document.head.appendChild(style);
  document.addEventListener('gesturestart', function (e) { if (!inMap(e)) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturechange', function (e) { if (!inMap(e)) e.preventDefault(); }, { passive: false });
  document.addEventListener('gestureend', function (e) { if (!inMap(e)) e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', function (e) { if (!inMap(e)) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1 && !inMap(e)) e.preventDefault();
  }, { passive: false });
  document.addEventListener('wheel', function (e) {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) e.preventDefault();
  });
})();
