// ===== OKMART REFERRAL PROGRAM — Share & Earn =====
// Referrer + referred user BOTH get Rs 20 off.
// - Logged-in user gets a deterministic code: 'OK' + last 6 chars of uid.
// - Share link: https://okmart.netlify.app/?ref=CODE (WhatsApp share).
// - ?ref= is captured to localStorage; checkout auto-applies Rs 20 on the
//   referred user's first order and records a 'referrals' doc (best-effort).
// - Referrer's reward is applied from the Profile Refer section (Apply button
//   arms the next checkout); checkout marks that referrals doc redeemed.
// No coupon codes, no offers-collection dependency. All Firestore writes are
// best-effort and never block checkout or the UI.
(function () {
  'use strict';

  var SITE = 'https://okmart.netlify.app/';
  var REWARD = 20;

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function safeRemove(k) { try { localStorage.removeItem(k); } catch (e) {} }

  // ---------- 1. Capture ?ref= on any page ----------
  try {
    var ref = new URLSearchParams(window.location.search).get('ref');
    if (ref && /^OK[A-Za-z0-9]{4,12}$/.test(ref) && !safeGet('okmart_ref_used')) {
      safeSet('okmart_ref', ref);
    }
  } catch (e) {}

  // ---------- 2. Homepage strip for referred visitors ----------
  document.addEventListener('DOMContentLoaded', function () {
    var strip = document.getElementById('referralStrip');
    if (strip) {
      var r = safeGet('okmart_ref');
      if (r && !safeGet('okmart_ref_used')) {
        strip.style.display = 'block';
        strip.textContent = '🎁 Referred offer: aapke pehle order par ₹' + REWARD +
          ' OFF lagega — checkout par apne aap apply hoga.';
      }
    }
    var box = document.getElementById('referralBox');
    if (box) {
      // Render at once, then re-render when Firebase auth state resolves,
      // so a logged-in user sees their code even on slow auth loads.
      renderReferralBox(box);
      if (window.okmartAuthReady && window.okmartAuthReady.then) {
        window.okmartAuthReady.then(function () { renderReferralBox(box); });
      }
    }
  });

  function currentUser() {
    try {
      var u = JSON.parse(safeGet('okmart_user') || 'null');
      return (u && u.uid) ? u : null;
    } catch (e) { return null; }
  }

  function referralCodeFor(uid) {
    return 'OK' + String(uid).slice(-6).toUpperCase();
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  function firestore() {
    try {
      return (typeof firebase !== 'undefined' && firebase.firestore)
        ? firebase.firestore() : null;
    } catch (e) { return null; }
  }

  // ---------- 3. Profile Refer & Earn box ----------
  function renderReferralBox(box) {
    var user = currentUser();
    if (!user) {
      box.innerHTML =
        '<h3 style="margin:0 0 6px;font-size:1rem;">🎁 Refer &amp; Earn</h3>' +
        '<p style="margin:0 0 10px;color:#4b5563;font-size:.88rem;">Apne padosi ko refer karo — ' +
        'aapko aur unko, dono ko agli grocery par ₹' + REWARD + ' ki chhoot milegi.</p>' +
        '<button id="referLoginBtn" style="background:#006d37;color:#fff;border:0;font-weight:700;' +
        'padding:10px 16px;border-radius:8px;cursor:pointer;">Google se login karke code pao</button>';
      var btn = box.querySelector('#referLoginBtn');
      if (btn) btn.addEventListener('click', function () {
        var g = document.getElementById('googleAuthBox');
        if (g) g.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    var code = referralCodeFor(user.uid);
    var shareText = 'OK Mart se grocery 15 minute me aati hai! Mere link se order karo ' +
      'aur hum dono ko ₹' + REWARD + ' OFF milega: ' + SITE + '?ref=' + code;
    var waLink = 'https://wa.me/?text=' + encodeURIComponent(shareText);
    box.innerHTML =
      '<h3 style="margin:0 0 6px;font-size:1rem;">🎁 Refer &amp; Earn</h3>' +
      '<p style="margin:0 0 10px;color:#4b5563;font-size:.88rem;">Apne padosi ko refer karo — ' +
      'aapko aur unko, dono ko agli grocery par ₹' + REWARD + ' ki chhoot milegi.</p>' +
      '<div style="display:flex;gap:8px;align-items:stretch;">' +
      '<div style="flex:1;background:#f0fdf4;border:1.5px dashed #059669;border-radius:8px;' +
      'display:flex;align-items:center;justify-content:center;font-weight:800;letter-spacing:.08em;">' + esc(code) + '</div>' +
      '<button id="referCopyBtn" style="background:#111827;color:#fff;border:0;font-weight:700;' +
      'padding:10px 14px;border-radius:8px;cursor:pointer;">Copy</button>' +
      '<a href="' + waLink + '" target="_blank" rel="noopener" style="background:#25D366;color:#fff;' +
      'font-weight:700;padding:10px 14px;border-radius:8px;text-decoration:none;display:flex;align-items:center;">WhatsApp</a>' +
      '</div>' +
      '<p id="referStatus" style="margin:10px 0 0;color:#4b5563;font-size:.85rem;">Reward status check ho raha hai…</p>';

    var copyBtn = box.querySelector('#referCopyBtn');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var link = SITE + '?ref=' + code;
      function done() { copyBtn.textContent = 'Copied ✓'; setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(done).catch(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = link; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });

    // Reward status: any referrals doc for my code with reward pending?
    var statusEl = box.querySelector('#referStatus');
    var fdb = firestore();
    if (!fdb) { statusEl.textContent = 'Reward status abhi check nahi ho paya — baad me phir dekhein.'; return; }
    fdb.collection('referrals').where('referrerCode', '==', code).get()
      .then(function (snap) {
        var pending = null, redeemed = 0, total = 0;
        snap.forEach(function (d) {
          total++;
          var v = d.data() || {};
          if (v.referrerReward === 'pending' && !pending) pending = d.id;
          if (v.referrerReward === 'redeemed') redeemed++;
        });
        if (pending) {
          statusEl.innerHTML = '🎉 ' + total + ' friend(s) ne order kiya! ' +
            'Aapka ₹' + REWARD + ' reward taiyaar hai — ' +
            '<button id="referApplyBtn" style="background:#006d37;color:#fff;border:0;font-weight:700;' +
            'padding:6px 12px;border-radius:6px;cursor:pointer;">Next order par apply karo</button>';
          var applyBtn = box.querySelector('#referApplyBtn');
          if (applyBtn) applyBtn.addEventListener('click', function () {
            safeSet('okmart_reward_doc', pending);
            safeRemove('okmart_reward_used');
            statusEl.textContent = '✓ Reward armed! Aapke agle order par ₹' + REWARD + ' OFF apne aap lagega.';
          });
        } else if (redeemed > 0) {
          statusEl.textContent = '✓ ' + redeemed + ' referral reward use ho chuka hai. Naye referrals par naya reward milega.';
        } else if (total > 0) {
          statusEl.textContent = total + ' referral order(s) mile — reward jald update hoga.';
        } else {
          statusEl.textContent = 'Abhi koi referral order nahi — link share karo aur ₹' + REWARD + ' kamao.';
        }
      })
      .catch(function () {
        statusEl.textContent = 'Reward status abhi check nahi ho paya — baad me phir dekhein.';
      });
  }

  // ---------- 4. Checkout helper (used by checkout.js) ----------
  // Returns { amount, type, code, docId }. Called by checkout.js, which caps
  // the amount at the bill total so a tiny cart never goes negative.
  window.okmartReferralDiscount = function () {
    try {
      var ref = safeGet('okmart_ref');
      if (ref && !safeGet('okmart_ref_used')) {
        return { amount: REWARD, type: 'referred', code: ref, docId: null };
      }
      var doc = safeGet('okmart_reward_doc');
      if (doc && !safeGet('okmart_reward_used')) {
        return { amount: REWARD, type: 'reward', code: null, docId: doc };
      }
    } catch (e) {}
    return { amount: 0, type: null, code: null, docId: null };
  };

  // Finalize after a successful order (called by checkout.js). Sets the
  // used-flags FIRST (so no double use), then writes Firestore best-effort.
  window.okmartReferralFinalize = function (disc, orderId, phone) {
    try {
      if (!disc || !disc.amount) return;
      if (disc.type === 'referred') {
        safeSet('okmart_ref_used', '1');
        safeRemove('okmart_ref');
      } else if (disc.type === 'reward') {
        safeSet('okmart_reward_used', '1');
        safeRemove('okmart_reward_doc');
      }
      var fdb = firestore();
      if (!fdb) return;
      if (disc.type === 'referred') {
        fdb.collection('referrals').add({
          referrerCode: disc.code, referredPhone: phone || null, orderId: orderId || null,
          referralDiscount: REWARD, referrerReward: 'pending',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function () {});
      } else if (disc.type === 'reward' && disc.docId) {
        fdb.collection('referrals').doc(disc.docId).update({ referrerReward: 'redeemed' }).catch(function () {});
      }
    } catch (e) {}
  };
})();
