/* OK Mart Admin — shared shell behaviour (all 12 sidebar pages).
   Opens/closes the dark sidebar drawer on mobile; desktop sidebar is
   always visible via CSS. No page-specific logic lives here. */
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
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
