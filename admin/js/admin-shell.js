/* OK Mart Admin — shared shell behaviour (all 12 sidebar pages).
   Opens/closes the dark sidebar drawer on mobile; desktop sidebar is
   always visible via CSS. Also handles the separate Admin PWA install
   (the customer app has its own manifest; this one installs as "OK Admin").
   No page-specific logic lives here. */
(function () {
  function init() {
    var btn = document.getElementById('adminShellMenuBtn');
    var side = document.getElementById('adminSidebar');
    var back = document.getElementById('adminShellBackdrop');
    var closeBtn = document.getElementById('adminShellCloseBtn');
    if (!side) return;
    function open() {
      side.classList.add('open');
      if (back) back.classList.add('show');
    }
    function close() {
      side.classList.remove('open');
      if (back) back.classList.remove('show');
    }
    if (btn) btn.addEventListener('click', function () {
      side.classList.contains('open') ? close() : open();
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (back) back.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    side.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
    initInstallButton();
  }

  /* "Install App" button in the sidebar footer. Shows only when the
     browser offers installation (beforeinstallprompt). On iOS there is
     no install prompt — the button explains Share > Add to Home Screen. */
  var deferredPrompt = null;
  function initInstallButton() {
    var footer = document.querySelector('.admin-shell-footer');
    if (!footer || document.getElementById('adminInstallBtn')) return;
    var b = document.createElement('button');
    b.id = 'adminInstallBtn';
    b.type = 'button';
    b.style.display = 'none';
    b.innerHTML = '<span class="material-symbols-outlined">install_mobile</span> Install App';
    b.addEventListener('click', function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
      } else {
        alert('App install karne ke liye:\n\niPhone (Safari): Share button > Add to Home Screen\n\nAndroid (Chrome): menu (⋮) > Install app / Add to Home screen');
      }
    });
    footer.appendChild(b);
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) b.style.display = 'flex';
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      b.style.display = 'flex';
    });
    window.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      b.style.display = 'none';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
