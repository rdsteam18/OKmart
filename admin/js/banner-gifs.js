// ===== OK MART ADMIN - BANNER GIF LIBRARY =====
// All homepage banner backgrounds live in Firestore collection `bannerGifs`:
//   { name, url, kind: 'festival'|'common', active: bool, createdAt }
// Exactly one banner is active at a time; the site (js/festive.js) uses
// the active banner's URL as the festive background. If none is active,
// the site falls back to its automatic festival-calendar theme.
// The Diwali GIF is a repo file (/assets/diwali-bg.gif) so it is never
// lost; Rama Ekadashi is /assets/rama-ekadashi-bg.gif. New GIFs can be
// added by pasting a link, or by uploading a file (Google sign-in once,
// stored in Firebase Storage under banner-gifs/).

(function () {
  'use strict';

  var db = firebase.firestore();
  var col = db.collection('bannerGifs');
  var grid = document.getElementById('bgGrid');
  var statusEl = document.getElementById('bgStatus');
  var msgEl = document.getElementById('bgMsg');
  var namesById = {};

  function setMsg(t, ok) {
    if (!msgEl) return;
    msgEl.textContent = t;
    msgEl.style.color = ok ? '#006d37' : '#ba1a1a';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------- list ----------
  function loadBanners() {
    if (!grid) return;
    col.orderBy('createdAt', 'desc').get()
      .then(function (snap) {
        var docs = [];
        snap.forEach(function (d) { docs.push({ id: d.id, data: d.data() || {} }); });
        renderGrid(docs);
      })
      .catch(function (e) {
        if (grid) grid.innerHTML = '<p class="text-sm text-red-700">Load nahi ho paya: ' + esc(e.message) + '</p>';
      });
  }

  function renderGrid(docs) {
    var active = docs.find(function (x) { return x.data.active; });
    if (statusEl) {
      statusEl.textContent = active
        ? 'Abhi live: ' + (active.data.name || active.id) + ' — homepage par yahi GIF dikh raha hai.'
        : 'Abhi koi banner select nahi hai — site apne aap festival calendar wala theme dikha rahi hai.';
    }
    var html = '';
    // Auto card: back to the automatic calendar theme.
    html += '<div class="border rounded-2xl overflow-hidden bg-white">' +
      '<div class="h-28 flex items-center justify-center bg-gradient-to-br from-green-700 to-lime-500 text-white font-extrabold text-sm px-3 text-center">Auto<br>Festival Calendar</div>' +
      '<div class="p-3">' +
      '<div class="font-bold text-sm">Auto (festival calendar)</div>' +
      '<div class="text-xs text-gray-500 mb-2">Koi GIF force nahi — theme date se apne aap badlega.</div>' +
      (!active
        ? '<span class="text-xs font-bold text-green-800 bg-green-100 px-2 py-1 rounded-full">● AUTO LIVE</span>'
        : '<button class="text-xs font-bold border rounded-full px-3 py-1" onclick="bgSetAuto()">Auto par wapas</button>') +
      '</div></div>';
    docs.forEach(function (x) {
      var d = x.data;
      namesById[x.id] = d.name || x.id;
      html += '<div class="border rounded-2xl overflow-hidden bg-white">' +
        '<img src="' + esc(d.url || '') + '" alt="" class="w-full h-28 object-cover bg-gray-900" loading="lazy" onerror="this.style.display=\'none\'">' +
        '<div class="p-3">' +
        '<div class="font-bold text-sm">' + esc(d.name || x.id) + '</div>' +
        '<div class="text-xs text-gray-500 mb-2">' + esc(d.kind === 'common' ? 'Common theme' : 'Festival') + ' • ' + esc((d.url || '').slice(0, 42)) + '</div>' +
        (d.active
          ? '<span class="text-xs font-bold text-green-800 bg-green-100 px-2 py-1 rounded-full">● LIVE</span>'
          : '<button class="text-xs font-bold bg-primary text-white rounded-full px-3 py-1" onclick="bgSelect(\'' + esc(x.id) + '\')">Live karo</button>') +
        ' <button class="text-xs font-bold border rounded-full px-3 py-1" onclick="bgRename(\'' + esc(x.id) + '\')">Rename</button>' +
        ' <button class="text-xs font-bold border border-red-300 text-red-700 rounded-full px-3 py-1" onclick="bgDelete(\'' + esc(x.id) + '\', ' + !!d.active + ')">Delete</button>' +
        '</div></div>';
    });
    grid.innerHTML = html;
  }

  // ---------- select / auto / rename / delete ----------
  function setActive(idOrNull) {
    return col.get().then(function (snap) {
      var batch = db.batch();
      snap.forEach(function (d) {
        batch.update(d.ref, { active: d.id === idOrNull });
      });
      return batch.commit();
    }).then(function () {
      setMsg(idOrNull ? '✓ Live kar diya — homepage par yahi banner dikhega.' : '✓ Auto par wapas — ab theme date se apne aap badlega.', true);
      loadBanners();
    }).catch(function (e) { setMsg('Fail: ' + e.message, false); });
  }

  window.bgSelect = function (id) { setActive(id); };
  window.bgSetAuto = function () { setActive(null); };

  window.bgRename = function (id) {
    var oldName = namesById[id] || '';
    var name = window.prompt('Banner ka naya naam:', oldName);
    if (name === null) return;
    name = name.trim();
    if (!name) { setMsg('Naam khaali nahi ho sakta.', false); return; }
    col.doc(id).update({ name: name })
      .then(function () { setMsg('✓ Naam badal diya.', true); loadBanners(); })
      .catch(function (e) { setMsg('Fail: ' + e.message, false); });
  };

  window.bgDelete = function (id, wasActive) {
    if (!window.confirm('Ye banner delete kar doon? ' + (wasActive ? 'Ye abhi LIVE hai — delete karne par site Auto theme par chali jayegi.' : ''))) return;
    col.doc(id).delete()
      .then(function () { setMsg('✓ Delete ho gaya.' + (wasActive ? ' Site ab Auto theme dikhayegi.' : ''), true); loadBanners(); })
      .catch(function (e) { setMsg('Fail: ' + e.message, false); });
  };

  // ---------- add by link ----------
  var addBtn = document.getElementById('bgAddLink');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      var name = (document.getElementById('bgName') || {}).value || '';
      var url = (document.getElementById('bgUrl') || {}).value || '';
      var kind = (document.getElementById('bgKind') || {}).value || 'festival';
      name = name.trim(); url = url.trim();
      if (!name) { setMsg('Banner ka naam likho (jaise Rama Ekadashi).', false); return; }
      if (!url || !/^https?:\/\//i.test(url) && url.charAt(0) !== '/') { setMsg('Sahi GIF link dalo (https://... ya /assets/...).', false); return; }
      col.add({ name: name, url: url, kind: kind, active: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
        .then(function () {
          setMsg('✓ "' + name + '" library me add ho gaya. Live karne ke liye us par "Live karo" dabao.', true);
          document.getElementById('bgName').value = '';
          document.getElementById('bgUrl').value = '';
          loadBanners();
        })
        .catch(function (e) { setMsg('Fail: ' + e.message, false); });
    });
  }

  // ---------- upload (Google sign-in once, then Firebase Storage) ----------
  var authBtn = document.getElementById('bgAuthBtn');
  var authState = document.getElementById('bgAuthState');
  var uploadRow = document.getElementById('bgUploadRow');
  function refreshAuth(user) {
    if (authState) authState.textContent = user ? ('Signed in: ' + (user.email || user.uid)) : 'Upload ke liye ek baar Google se sign in karo.';
    if (uploadRow) uploadRow.style.display = user ? 'flex' : 'none';
    if (authBtn) authBtn.textContent = user ? 'Sign out' : 'Google se sign in karo';
  }
  if (typeof firebase.auth === 'function') {
    firebase.auth().onAuthStateChanged(refreshAuth);
    if (authBtn) {
      authBtn.addEventListener('click', function () {
        var user = firebase.auth().currentUser;
        if (user) {
          firebase.auth().signOut().catch(function (e) { setMsg('Sign out fail: ' + e.message, false); });
        } else {
          var provider = new firebase.auth.GoogleAuthProvider();
          firebase.auth().signInWithPopup(provider)
            .catch(function (e) { setMsg('Sign in fail: ' + e.message + ' — tab tak link se add kar sakte ho.', false); });
        }
      });
    }
  } else if (authState) {
    authState.textContent = 'Upload ke liye auth load nahi hua — link se add karo.';
  }

  var upBtn = document.getElementById('bgUploadBtn');
  if (upBtn) {
    upBtn.addEventListener('click', function () {
      var fileInput = document.getElementById('bgFile');
      var name = ((document.getElementById('bgUpName') || {}).value || '').trim();
      var kind = (document.getElementById('bgUpKind') || {}).value || 'festival';
      var file = fileInput && fileInput.files && fileInput.files[0];
      if (!file) { setMsg('Pehle ek GIF file chuno.', false); return; }
      if (!name) { setMsg('Banner ka naam likho.', false); return; }
      if (file.size > 4 * 1024 * 1024) { setMsg('File 4 MB se badi hai — pehle chhoti GIF banao (12-15 fps, 480-720px).', false); return; }
      var user = firebase.auth().currentUser;
      if (!user) { setMsg('Pehle Google se sign in karo (upar wala button).', false); return; }
      setMsg('Upload ho raha hai…', true);
      var path = 'banner-gifs/' + Date.now() + '_' + file.name.replace(/[^A-Za-z0-9._-]/g, '_');
      firebase.storage().ref(path).put(file)
        .then(function (snap) { return snap.ref.getDownloadURL(); })
        .then(function (url) {
          return col.add({ name: name, url: url, kind: kind, active: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        })
        .then(function () {
          setMsg('✓ Upload ho gaya aur library me add ho gaya. Live karne ke liye "Live karo" dabao.', true);
          fileInput.value = '';
          document.getElementById('bgUpName').value = '';
          loadBanners();
        })
        .catch(function (e) {
          setMsg('Upload fail: ' + e.message + ' — Storage rules block kar rahe hon to link se add karo.', false);
        });
    });
  }

  loadBanners();
})();
