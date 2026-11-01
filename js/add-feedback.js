// ===== OKmart add-to-cart feedback (shared helper, cart behavior unchanged) =====
// Call from every add-to-cart handler AFTER the cart write:
//   window.okmartAddFeedback(buttonElementOrNull, productImageUrlOrNull)
// Does three things: (a) the tapped button briefly morphs to a "✓ Added"
// state, (b) a small thumbnail/dot flies from the button to the Basket tab,
// (c) the basket badge bumps. All failures are swallowed — feedback must
// never break adding to cart. Safe to call when the helper's CSS is absent
// (fly uses the Web Animations API; the button morph needs .ok-add-success
// from css/common.css, and degrades to a plain text swap without it).
(function () {
  'use strict';

  function findBasketTarget() {
    var badge = document.getElementById('bottomNavCartCount') ||
      document.querySelector('.cart-badge, .cart-count');
    if (badge) {
      var link = badge.closest ? badge.closest('a') : null;
      return link || badge;
    }
    return document.querySelector('a[href="/cart.html"]');
  }

  function bumpBadge() {
    var badge = document.getElementById('bottomNavCartCount') ||
      document.querySelector('.cart-badge, .cart-count');
    if (badge && badge.animate) {
      try {
        badge.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }],
          { duration: 450, easing: 'ease-out' }
        );
      } catch (e) { /* ignore */ }
    }
  }

  window.okmartAddFeedback = function (btn, imgSrc, opts) {
    try {
      // (a) Button morphs to a success state, then restores itself
      // (opts.morph === false skips this for buttons with their own morph).
      if (btn && btn.tagName && !(opts && opts.morph === false)) {
        var origHtml = btn.innerHTML;
        btn.classList.add('ok-add-success');
        btn.textContent = '✓ Added';
        setTimeout(function () {
          if (document.contains(btn)) {
            btn.innerHTML = origHtml;
            btn.classList.remove('ok-add-success');
          }
        }, 1200);
      }
      bumpBadge();

      // (b) Fly-to-basket: thumbnail (or green dot) arcs to the Basket tab.
      var target = findBasketTarget();
      if (!btn || !btn.getBoundingClientRect || !target) return;
      var r = btn.getBoundingClientRect();
      var t = target.getBoundingClientRect();
      if (!r.width || !t.width) return;
      var startX = r.left + r.width / 2 - 22;
      var startY = r.top + r.height / 2 - 22;
      var dx = (t.left + t.width / 2) - (r.left + r.width / 2);
      var dy = (t.top + t.height / 2) - (r.top + r.height / 2);
      var fly;
      if (imgSrc) {
        fly = document.createElement('img');
        fly.src = imgSrc;
        fly.alt = '';
      } else {
        fly = document.createElement('span');
      }
      fly.className = 'ok-fly-item';
      // Essential geometry inline so the fly works even on pages that do
      // not load css/common.css (the class adds the same look elsewhere).
      fly.style.position = 'fixed';
      fly.style.width = '44px';
      fly.style.height = '44px';
      fly.style.borderRadius = '50%';
      fly.style.objectFit = 'cover';
      fly.style.zIndex = '10001';
      fly.style.pointerEvents = 'none';
      fly.style.background = '#16a34a';
      fly.style.border = '2px solid #ffffff';
      fly.style.boxShadow = '0 4px 14px rgba(0,0,0,0.25)';
      fly.style.left = startX + 'px';
      fly.style.top = startY + 'px';
      document.body.appendChild(fly);
      if (!fly.animate) { setTimeout(function () { fly.remove(); }, 800); return; }
      var anim = fly.animate([
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
        { transform: 'translate(' + (dx * 0.5) + 'px, ' + (dy - 60) + 'px) scale(0.8)', opacity: 1, offset: 0.6 },
        { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.15)', opacity: 0.2 }
      ], { duration: 750, easing: 'cubic-bezier(.3,.7,.3,1)' });
      anim.onfinish = function () { fly.remove(); bumpBadge(); };
      anim.oncancel = function () { fly.remove(); };
    } catch (e) { /* feedback must never break cart */ }
  };
})();
