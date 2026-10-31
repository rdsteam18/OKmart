// ===== OKMART WALLET — virtual cash (referral rewards live here) =====
// - Referral code/link UNCHANGED ('OK' + uid last 6). Only the reward's home
//   changes: referrer's Rs 20 auto-credits to the wallet when a friend's first
//   order succeeds (no Profile Apply tap anymore).
// - Friend's first-order Rs 20 instant off is UNCHANGED (referral.js).
// - Checkout: logged-in users can apply wallet balance up to the bill total.
// - Storage: Firestore 'wallets' (doc per uid: { balance }) + 'walletTxns'
//   (flat ledger docs: { uid, type, amount, reason, ... }). All writes are
//   best-effort and never block checkout or the UI. Login is required —
//   guests have no wallet (same rule as the referral code).
(function () {
  'use strict';

  var REWARD = 20;

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function currentUser() {
    try {
      var u = JSON.parse(safeGet('okmart_user') || 'null');
      return (u && u.uid) ? u : null;
    } catch (e) { return null; }
  }

  function codeFor(uid) { return 'OK' + String(uid).slice(-6).toUpperCase(); }

  function firestore() {
    try {
      return (typeof firebase !== 'undefined' && firebase.firestore)
        ? firebase.firestore() : null;
    } catch (e) { return null; }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  function serverTs() {
    try { return firebase.firestore.FieldValue.serverTimestamp(); } catch (e) { return null; }
  }

  // ---------- balance ----------
  async function getBalance() {
    var user = currentUser();
    if (!user) return 0;
    var fdb = firestore();
    if (!fdb) return 0;
    try {
      var doc = await fdb.collection('wallets').doc(user.uid).get();
      if (!doc.exists) return 0;
      var b = (doc.data() || {}).balance;
      return (typeof b === 'number' && b > 0) ? Math.floor(b) : 0;
    } catch (e) { return 0; }
  }

  // ---------- sweep pending referral rewards into the wallet ----------
  // Atomic per referral doc (transaction): only a doc still 'pending' gets
  // credited, so two tabs sweeping at once cannot double-credit.
  async function sweepPendingRewards(code) {
    var user = currentUser();
    var fdb = firestore();
    if (!user || !fdb) return { credited: 0, count: 0 };
    var myCode = code || codeFor(user.uid);
    var credited = 0, count = 0;
    try {
      var snap = await fdb.collection('referrals')
        .where('referrerCode', '==', myCode)
        .where('referrerReward', '==', 'pending').get();
      var docs = [];
      snap.forEach(function (d) { docs.push(d); });
      for (var i = 0; i < docs.length; i++) {
        var refDoc = docs[i];
        try {
          await fdb.runTransaction(async function (tx) {
            var refSnap = await tx.get(refDoc.ref);
            if (!refSnap.exists) return;
            if ((refSnap.data() || {}).referrerReward !== 'pending') return;
            var walletRef = fdb.collection('wallets').doc(user.uid);
            var wSnap = await tx.get(walletRef);
            var bal = (wSnap.exists && typeof (wSnap.data() || {}).balance === 'number')
              ? (wSnap.data() || {}).balance : 0;
            var txnRef = fdb.collection('walletTxns').doc();
            tx.set(txnRef, {
              uid: user.uid, type: 'credit', amount: REWARD, reason: 'referral',
              referralDocId: refDoc.id, createdAt: serverTs()
            });
            tx.set(walletRef, { balance: bal + REWARD, updatedAt: serverTs() }, { merge: true });
            tx.update(refDoc.ref, { referrerReward: 'wallet-credited' });
          });
          credited += REWARD; count++;
        } catch (e) { /* best-effort: this doc stays pending for the next sweep */ }
      }
    } catch (e) { /* query failed: best-effort, try again next visit */ }
    if (count > 0) refreshDisplays();
    return { credited: credited, count: count };
  }

  // ---------- debit at checkout ----------
  async function debit(amount, orderId) {
    var user = currentUser();
    var fdb = firestore();
    if (!user || !fdb || !amount || amount <= 0) return false;
    try {
      await fdb.runTransaction(async function (tx) {
        var walletRef = fdb.collection('wallets').doc(user.uid);
        var wSnap = await tx.get(walletRef);
        var bal = (wSnap.exists && typeof (wSnap.data() || {}).balance === 'number')
          ? (wSnap.data() || {}).balance : 0;
        var use = Math.min(amount, bal);
        if (use <= 0) return;
        var txnRef = fdb.collection('walletTxns').doc();
        tx.set(txnRef, {
          uid: user.uid, type: 'debit', amount: use, reason: 'checkout',
          orderId: orderId || null, createdAt: serverTs()
        });
        tx.set(walletRef, { balance: bal - use, updatedAt: serverTs() }, { merge: true });
      });
      refreshDisplays();
      return true;
    } catch (e) { return false; }
  }

  // ---------- header chip ----------
  async function renderHeaderChip() {
    var chip = document.getElementById('walletChip');
    if (!chip) return;
    var user = currentUser();
    if (!user) { chip.style.display = 'none'; return; }
    var bal = await getBalance();
    var balEl = document.getElementById('walletChipBalance');
    if (balEl) balEl.textContent = '₹' + bal;
    chip.style.display = 'inline-flex';
  }

  // ---------- profile wallet box ----------
  async function renderProfileWallet(box) {
    if (!box) return;
    var user = currentUser();
    if (!user) {
      box.innerHTML =
        '<h3 style="margin:0 0 6px;font-size:1rem;">💰 Wallet</h3>' +
        '<p style="margin:0 0 10px;color:#4b5563;font-size:.88rem;">Refer karke ₹' + REWARD +
        ' kamao — wallet me jama hoga, checkout par use kar sakoge.</p>' +
        '<button id="walletLoginBtn" style="background:#006d37;color:#fff;border:0;font-weight:700;' +
        'padding:10px 16px;border-radius:8px;cursor:pointer;">Google se login karke wallet pao</button>';
      var btn = box.querySelector('#walletLoginBtn');
      if (btn) btn.addEventListener('click', function () {
        var g = document.getElementById('googleAuthBox');
        if (g) g.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    box.innerHTML =
      '<h3 style="margin:0 0 6px;font-size:1rem;">💰 Wallet</h3>' +
      '<div style="font-size:1.6rem;font-weight:900;" id="walletBalanceBig">₹…</div>' +
      '<p style="margin:2px 0 10px;color:#4b5563;font-size:.85rem;">Referral reward ka balance — checkout par claim karo.</p>' +
      '<div id="walletTxns" style="font-size:.85rem;color:#4b5563;">History load ho rahi hai…</div>';
    var bal = await getBalance();
    var big = box.querySelector('#walletBalanceBig');
    if (big) big.textContent = '₹' + bal;
    var txEl = box.querySelector('#walletTxns');
    var fdb = firestore();
    if (!fdb || !txEl) return;
    try {
      var snap = await fdb.collection('walletTxns').where('uid', '==', user.uid).get();
      var rows = [];
      snap.forEach(function (d) { rows.push(d.data() || {}); });
      rows.sort(function (a, b) {
        var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
      rows = rows.slice(0, 10);
      if (!rows.length) {
        txEl.textContent = 'Abhi koi transaction nahi — pehla referral reward yahan dikhega.';
        return;
      }
      txEl.innerHTML = rows.map(function (t) {
        var sign = t.type === 'credit' ? '+' : '−';
        var color = t.type === 'credit' ? '#006d37' : '#b91c1c';
        var label = t.type === 'credit' ? 'Referral reward' : 'Checkout par use';
        return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #f3f4f6;">' +
          '<span>' + esc(label) + '</span>' +
          '<b style="color:' + color + ';">' + sign + '₹' + (t.amount || 0) + '</b></div>';
      }).join('');
    } catch (e) {
      txEl.textContent = 'History abhi load nahi ho payi — baad me phir dekhein.';
    }
  }

  function refreshDisplays() {
    renderHeaderChip();
    var box = document.getElementById('walletBox');
    if (box) renderProfileWallet(box);
  }

  window.okmartWallet = {
    currentUser: currentUser,
    codeFor: codeFor,
    getBalance: getBalance,
    sweepPendingRewards: sweepPendingRewards,
    debit: debit,
    renderHeaderChip: renderHeaderChip,
    renderProfileWallet: renderProfileWallet,
    refreshDisplays: refreshDisplays
  };

  document.addEventListener('DOMContentLoaded', function () {
    renderHeaderChip();
    var box = document.getElementById('walletBox');
    if (box) renderProfileWallet(box);
    // Auto-credit pending referral rewards on any page, once logged in.
    var user = currentUser();
    if (user) sweepPendingRewards();
    if (window.okmartAuthReady && window.okmartAuthReady.then) {
      window.okmartAuthReady.then(function () {
        renderHeaderChip();
        var b2 = document.getElementById('walletBox');
        if (b2) renderProfileWallet(b2);
        var u2 = currentUser();
        if (u2) sweepPendingRewards();
      });
    }
  });
})();
