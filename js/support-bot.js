/* OK Mart Support Bot — simple on-site customer support assistant.
 *
 * NOT an LLM: answers come from a fixed knowledge base + live store
 * settings, so prices and policies are never hallucinated. The bot
 * resolves simple questions itself (charges, service area, wallet,
 * address, tracking guidance) and ONLY escalates real problems to the
 * team — after collecting verified details (problem type, 10-digit
 * phone, order detail, problem description) and getting the customer's
 * confirmation. Escalation goes to the team's WhatsApp with a pre-filled
 * verified complaint, and is also saved (best-effort) to Firestore
 * 'supportRequests' for a record.
 *
 * Loaded on every storefront page via the loader at the end of
 * js/common.js. Opened programmatically with window.OKMartSupport.open().
 */
(function () {
  if (window.OKMartSupport && window.OKMartSupport._api) return;

  var SUPPORT_WHATSAPP = '919982239821';

  /* ---------- styles ---------- */
  var css = [
    '#okmSupportBtn{position:fixed;right:16px;bottom:20px;z-index:9990;display:flex;align-items:center;gap:8px;background:#15803d;color:#fff;border:none;border-radius:999px;padding:12px 18px;font-weight:800;font-size:0.95rem;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)}',
    '#okmSupportBtn:hover{background:#166534}',
    '#okmSupportPanel{position:fixed;right:16px;bottom:84px;z-index:9990;width:min(360px,calc(100vw - 32px));height:min(480px,calc(100vh - 120px));background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif}',
    '#okmSupportPanel.open{display:flex}',
    '#okmSupportHead{background:#15803d;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px}',
    '#okmSupportHead b{font-size:1rem}',
    '#okmSupportHead small{display:block;font-weight:400;opacity:.9;font-size:.78rem;margin-top:2px}',
    '#okmSupportClose{background:none;border:none;color:#fff;font-size:1.3rem;cursor:pointer;line-height:1}',
    '#okmSupportMsgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f8fafc}',
    '.okmMsg{max-width:85%;padding:10px 12px;border-radius:12px;font-size:.9rem;line-height:1.5}',
    '.okmMsg.bot{background:#fff;border:1px solid #e5e7eb;align-self:flex-start;border-bottom-left-radius:4px}',
    '.okmMsg.user{background:#15803d;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}',
    '.okmMsg a{color:#006d37;font-weight:700}',
    '.okmMsg.user a{color:#fff}',
    '#okmSupportChips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:#f8fafc}',
    '.okmChip{background:#fff;border:1.5px solid #bbf7d0;color:#14532d;font-weight:700;font-size:.8rem;padding:6px 12px;border-radius:999px;cursor:pointer}',
    '.okmChip:hover{background:#f0fdf4}',
    '#okmSupportForm{display:flex;gap:8px;padding:10px;border-top:1px solid #e5e7eb;background:#fff}',
    '#okmSupportInput{flex:1;border:1px solid #d1d5db;border-radius:999px;padding:10px 14px;font-size:.9rem;outline:none}',
    '#okmSupportSend{background:#15803d;color:#fff;border:none;border-radius:999px;padding:10px 16px;font-weight:800;cursor:pointer}',
    '@media (max-width:768px){#okmSupportBtn{bottom:88px}#okmSupportPanel{bottom:152px}}'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- dom ---------- */
  var btn = document.createElement('button');
  btn.id = 'okmSupportBtn';
  btn.setAttribute('aria-label', 'Help and support');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-2.9-.4-4.2-1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg><span>Help</span>';
  document.body.appendChild(btn);

  var panel = document.createElement('div');
  panel.id = 'okmSupportPanel';
  panel.innerHTML =
    '<div id="okmSupportHead"><div><b>OK Mart Support</b><small>Simple sawalon ka jawab turant. Asli problem hogi to verified details ke saath team ko bhej dunga.</small></div><button id="okmSupportClose" aria-label="Close">✕</button></div>' +
    '<div id="okmSupportMsgs"></div>' +
    '<div id="okmSupportChips"></div>' +
    '<form id="okmSupportForm"><input id="okmSupportInput" type="text" placeholder="Apna sawal ya problem likhein..." autocomplete="off"><button id="okmSupportSend" type="submit">Send</button></form>';
  document.body.appendChild(panel);

  var msgsEl = panel.querySelector('#okmSupportMsgs');
  var chipsEl = panel.querySelector('#okmSupportChips');
  var inputEl = panel.querySelector('#okmSupportInput');

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function addMsg(html, who) {
    var d = document.createElement('div');
    d.className = 'okmMsg ' + who;
    d.innerHTML = html;
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function setChips(list) {
    chipsEl.innerHTML = '';
    list.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'okmChip';
      b.textContent = c.label;
      b.addEventListener('click', function () { onUserText(c.value || c.label, true); });
      chipsEl.appendChild(b);
    });
  }
  function settings() {
    try {
      var s = (typeof window.getStoreSettings === 'function') ? window.getStoreSettings() : {};
      return {
        threshold: s.freeDeliveryThreshold || s.globalFreeThreshold || 199,
        base: s.baseDeliveryCharge || s.defaultDeliveryCharge || 30,
        handling: s.handlingFee || s.packagingFee || 5
      };
    } catch (e) {
      return { threshold: 199, base: 30, handling: 5 };
    }
  }

  /* ---------- escalation state machine ---------- */
  var escState = null; // {step, type, phone, order, detail}
  var fallbackCount = 0;

  var MAIN_CHIPS = [
    { label: 'Delivery charges', value: 'delivery charges kitne hain' },
    { label: 'Mera area serviceable hai?', value: 'mera area me delivery hai' },
    { label: 'Order track karein', value: 'order kahan hai' },
    { label: 'Wallet / Referral', value: 'wallet referral kaise kaam karta hai' },
    { label: 'Koi problem hai', value: 'mujhe problem hai' }
  ];

  function startEscalation() {
    escState = { step: 'type', type: '', phone: '', order: '', detail: '' };
    addMsg('Theek hai, main aapki problem team tak pahuncha dunga — pehle kuch details verify kar lein taaki team turant action le sake. <b>Problem kis type ki hai?</b>', 'bot');
    setChips([
      { label: 'Damaged / galat item', value: '__type__Damaged ya galat item' },
      { label: 'Item missing', value: '__type__Item missing' },
      { label: 'Payment issue', value: '__type__Payment issue' },
      { label: 'Order nahi pahuncha', value: '__type__Order nahi pahuncha' },
      { label: 'Wallet credit nahi mila', value: '__type__Wallet credit nahi mila' },
      { label: 'Order cancel karna hai', value: '__type__Order cancel karna hai' },
      { label: 'Kuch aur', value: '__type__Kuch aur' }
    ]);
  }

  function escSummary() {
    return '<b>Complaint ka summary — please confirm karein:</b><br>' +
      'Problem: ' + esc(escState.type) + '<br>' +
      'Phone: ' + esc(escState.phone) + '<br>' +
      'Order: ' + esc(escState.order) + '<br>' +
      'Detail: ' + esc(escState.detail);
  }

  function sendEscalation() {
    var text = 'OK Mart Support Complaint (verified by support bot)\n' +
      'Problem: ' + escState.type + '\n' +
      'Phone: ' + escState.phone + '\n' +
      'Order: ' + escState.order + '\n' +
      'Detail: ' + escState.detail;
    try {
      var db = window.db;
      if (db && db.collection) {
        db.collection('supportRequests').add({
          type: 'support', problemType: escState.type, phone: escState.phone,
          order: escState.order, detail: escState.detail,
          status: 'pending', source: 'support-bot',
          createdAt: new Date().toISOString()
        }).catch(function () {});
      }
    } catch (e) {}
    var url = 'https://wa.me/' + SUPPORT_WHATSAPP + '?text=' + encodeURIComponent(text);
    addMsg('Ho gaya! Maine aapki <b>verified complaint</b> team ko bhej di hai. Neeche diye gaye button se ye WhatsApp par bhi khul jayega taaki aapko turant reply mil sake.', 'bot');
    setChips([{ label: 'WhatsApp par complaint bhejein', value: '__wa__' }]);
    escState = null;
    window.open(url, '_blank');
  }

  function onEscalationText(text) {
    if (/^(cancel|ruko|band karo|stop)$/i.test(text.trim())) {
      escState = null;
      addMsg('Theek hai, complaint rok di hai. Koi aur madad chahiye to batayein.', 'bot');
      setChips(MAIN_CHIPS);
      return;
    }
    if (escState.step === 'phone') {
      var digits = text.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
      if (!/^[6-9]\d{9}$/.test(digits)) {
        addMsg('Ye number sahi nahi lag raha. Please apna <b>10-digit mobile number</b> dobara bhejein (jis par order kiya tha).', 'bot');
        return;
      }
      escState.phone = digits;
      escState.step = 'order';
      addMsg('Shukriya. Ab <b>order ki detail</b> batayein — order ki date aur kya-kya item the (ya order id, agar ho).', 'bot');
      setChips([]);
      return;
    }
    if (escState.step === 'order') {
      if (text.trim().length < 3) {
        addMsg('Thodi aur detail dein — order ki date aur items likhein.', 'bot');
        return;
      }
      escState.order = text.trim();
      escState.step = 'detail';
      addMsg('Aur ab <b>problem ko thoda detail me</b> batayein — kya hua, kab hua, kya galat mila?', 'bot');
      return;
    }
    if (escState.step === 'detail') {
      if (text.trim().length < 3) {
        addMsg('Problem ko thoda detail me likhein taaki team samajh sake.', 'bot');
        return;
      }
      escState.detail = text.trim();
      escState.step = 'confirm';
      addMsg(escSummary(), 'bot');
      setChips([
        { label: 'Haan, bhejo', value: '__confirm_yes__' },
        { label: 'Sudharna hai', value: '__confirm_no__' }
      ]);
      return;
    }
  }

  /* ---------- intents ---------- */
  function has(text) {
    var words = Array.prototype.slice.call(arguments, 1);
    return words.some(function (w) { return text.indexOf(w) !== -1; });
  }

  function answerCharges() {
    var s = settings();
    addMsg('Delivery charges bilkul clear hain:<br>• Order <b>₹' + s.threshold + ' se upar</b> ho to delivery <b>FREE</b>.<br>• Usse kam par delivery charge <b>₹' + s.base + '</b> lagta hai.<br>• Har order par Handling Fee <b>₹' + s.handling + '</b> lagti hai.<br>Ye sab cart aur checkout me total ke saath dikhta hai.', 'bot');
  }
  function answerTime() {
    addMsg('OK Mart <b>15-minute quick delivery</b> ka vaada karta hai — ye aapke area par depend karta hai. Order WhatsApp par confirm hone ke baad rider nikalta hai. Agar order late ho raha hai to Track Order page par dekhein ya mujhe "problem hai" batayein.', 'bot');
  }
  function answerTrack() {
    addMsg('<a href="/track-order.html">Track Order page</a> par apna phone number daal kar order ki sthiti dekh sakte ho. Order WhatsApp par confirm hota hai, isliye WhatsApp par bhi update milta hai.', 'bot');
  }
  function answerWallet() {
    addMsg('Refer & Earn aisa hai: apna referral code dost ko dein — uske <b>pehle order par use ₹20 off</b> milta hai, aur <b>aapko ₹20 wallet credit</b> milta hai. Wallet balance aur history Profile page ke Wallet section me dikhta hai, aur checkout me wallet use kar sakte ho.', 'bot');
  }
  function answerAddress() {
    addMsg('<a href="/profile.html">Profile page</a> par Addresses section me jaakar apna address badal sakte ho, naya add kar sakte ho ya purana hata sakte ho. Order karne se pehle sahi address select karna mat bhoolein.', 'bot');
  }
  function answerPayment() {
    addMsg('Payment ke do tareeke hain: <b>Cash on Delivery</b> aur <b>Online Payment</b>. Agar payment kat gaya par order confirm nahi hua, to ye asli problem hai — main aapki verified complaint team ko bhej dunga.', 'bot');
    setChips([{ label: 'Payment problem ki complaint karein', value: 'mujhe problem hai' }]);
  }
  function answerOffers() {
    addMsg('Roz ke loot deals <a href="/deals.html">Daily Loot Deals page</a> par milte hain — har deal ka apna page hota hai jahan live price dikhta hai.', 'bot');
  }
  function askPincode() {
    escState = { step: 'pincode' };
    addMsg('Zaroor! Apna <b>6-digit pincode</b> bhejein, main abhi check karke batata hoon ki aapke area me delivery hai ya nahi.', 'bot');
    setChips([]);
  }
  function checkPincode(pin) {
    addMsg('Pincode ' + esc(pin) + ' check kar raha hoon...', 'bot');
    var done = function (state) {
      if (state === 'ok') addMsg('Good news! Pincode <b>' + esc(pin) + '</b> par delivery <b>available hai</b>. Aap order kar sakte ho.', 'bot');
      else if (state === 'blocked') addMsg('Afsoos, pincode <b>' + esc(pin) + '</b> par delivery <b>available nahi dikh rahi</b>. Aas-paas ka pincode try karein, ya team se WhatsApp par pooch lein — ho sakta hai aapka area jald jud jaye.', 'bot');
      else addMsg('Pincode check nahi ho paya (network issue). Please thodi der baad dobara try karein, ya checkout par pincode daal kar dekhein.', 'bot');
      setChips(MAIN_CHIPS);
    };
    try {
      var fn = window.OKMart && window.OKMart.getServiceablePincodeState;
      if (typeof fn === 'function') fn(pin).then(done, function () { done('unknown'); });
      else done('unknown');
    } catch (e) { done('unknown'); }
  }

  function onUserText(raw, fromChip) {
    var text = (raw || '').trim();
    if (!text) return;
    if (!fromChip || text.indexOf('__') !== 0) addMsg(esc(text), 'user');

    /* special chip actions */
    if (text === '__wa__') { setChips(MAIN_CHIPS); return; }
    if (text === '__confirm_yes__') { sendEscalation(); return; }
    if (text === '__confirm_no__') {
      escState = { step: 'type', type: escState.type, phone: escState.phone, order: '', detail: '' };
      addMsg('Theek hai, dobara batayein — <b>order ki detail</b> phir se likhein.', 'bot');
      escState.step = 'order';
      setChips([]);
      return;
    }
    if (text.indexOf('__type__') === 0) {
      escState.type = text.replace('__type__', '');
      escState.step = 'phone';
      addMsg('Problem type: <b>' + esc(escState.type) + '</b> note kar li. Ab apna <b>10-digit mobile number</b> bhejein (jis par order kiya tha).', 'bot');
      setChips([]);
      return;
    }

    /* escalation flow owns the conversation */
    if (escState && escState.step === 'pincode' && /^\d{6}$/.test(text)) {
      escState = null;
      checkPincode(text);
      return;
    }
    if (escState && ['phone', 'order', 'detail'].indexOf(escState.step) !== -1) {
      onEscalationText(text);
      return;
    }
    if (escState && escState.step === 'pincode') {
      addMsg('Please sirf <b>6-digit pincode</b> bhejein.', 'bot');
      return;
    }
    escState = null;

    var t = text.toLowerCase();
    var pinMatch = t.match(/\b\d{6}\b/);
    if (pinMatch && has(t, 'pincode', 'area', 'delivery', 'seva', 'service')) { checkPincode(pinMatch[0]); return; }

    if (has(t, 'problem', 'shikayat', 'complaint', 'kharab', 'toota', 'galat', 'missing', 'kam aaya', 'nahi mila', 'refund', 'paisa wapas', 'kat gaya', 'cancel', 'radd', 'agent', 'human', 'baat karni', 'madad nahi')) { startEscalation(); return; }
    if (has(t, 'charge', 'fees', 'handling', 'free delivery', '199', 'kitna lagega')) { answerCharges(); setChips(MAIN_CHIPS); return; }
    if (has(t, 'kab aayega', 'kitni der', 'late', 'time', '15 min', 'der ho')) { answerTime(); setChips(MAIN_CHIPS); return; }
    if (has(t, 'track', 'kahan hai', 'order status', 'pahucha', 'status')) { answerTrack(); setChips(MAIN_CHIPS); return; }
    if (has(t, 'wallet', 'referral', 'refer', 'reward', 'credit', '20')) { answerWallet(); setChips(MAIN_CHIPS); return; }
    if (has(t, 'address', 'pata', 'badalna', 'naya address')) { answerAddress(); setChips(MAIN_CHIPS); return; }
    if (has(t, 'payment', 'cod', 'cash', 'online', 'upi', 'pay')) { answerPayment(); return; }
    if (has(t, 'offer', 'deal', 'discount', 'coupon', 'loot')) { answerOffers(); setChips(MAIN_CHIPS); return; }
    if (has(t, 'area', 'pincode', 'delivery hai', 'seva', 'service')) { askPincode(); return; }
    if (has(t, 'hi', 'hello', 'hey', 'namaste', 'namaskar')) {
      addMsg('Namaste! Main OK Mart Support Bot hoon. Neeche diye options me se chunein ya apna sawal likhein.', 'bot');
      setChips(MAIN_CHIPS);
      return;
    }

    fallbackCount++;
    if (fallbackCount >= 2) {
      addMsg('Maaf kijiye, main ye samajh nahi paya. Agar ye koi asli problem hai to main aapki verified complaint team ko bhej dunga — bas "Koi problem hai" chunein.', 'bot');
      setChips([{ label: 'Koi problem hai', value: 'mujhe problem hai' }, { label: 'Delivery charges', value: 'delivery charges kitne hain' }]);
    } else {
      addMsg('Samajh nahi paya — thoda aur detail me batayein, ya neeche ke options me se chunein.', 'bot');
      setChips(MAIN_CHIPS);
    }
  }

  /* ---------- wiring ---------- */
  function open() {
    panel.classList.add('open');
    if (!panel.dataset.welcomed) {
      panel.dataset.welcomed = '1';
      addMsg('Namaste! Main <b>OK Mart Support Bot</b> hoon. Delivery charges, area, wallet, order tracking jaise sawalon ka jawab main turant de dunga. Asli problem (kharab item, payment, refund) hogi to details verify karke team ko bhej dunga.', 'bot');
      setChips(MAIN_CHIPS);
    }
    setTimeout(function () { inputEl.focus(); }, 50);
  }
  function close() { panel.classList.remove('open'); }
  btn.addEventListener('click', function () {
    if (panel.classList.contains('open')) close(); else open();
  });
  panel.querySelector('#okmSupportClose').addEventListener('click', close);
  panel.querySelector('#okmSupportForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = inputEl.value;
    inputEl.value = '';
    onUserText(v, false);
  });

  /* profile "Help & Support" row, if present */
  var supportRow = document.getElementById('openSupportBtn');
  if (supportRow) supportRow.addEventListener('click', open);

  var api = { open: open, close: close };
  var holder = window.OKMartSupport || {};
  holder._api = api;
  window.OKMartSupport = holder;
  (holder._q || []).forEach(function (q) { if (q === 'open') open(); });
  holder._q = [];
})();
