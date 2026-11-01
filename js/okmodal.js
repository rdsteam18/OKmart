// ===== OKmart branded modal — replaces native confirm()/alert() on customer pages =====
// Usage:
//   const ok = await window.OKModal.confirm('Are you sure...?', { title: 'Clear Cart', confirmText: 'Clear All', cancelText: 'Keep Items' });
//   await window.OKModal.alert('Saved!');
// confirm() resolves true only when the user taps the confirm button.
// alert() resolves when the user dismisses it.
// If OKModal is missing on a page, call sites fall back to the native dialog.
(function () {
  'use strict';

  var overlay = null;
  var titleEl = null;
  var msgEl = null;
  var okBtn = null;
  var cancelBtn = null;
  var queue = [];
  var current = null;

  function build() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'okmodal-overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="okmodal-card" role="dialog" aria-modal="true">' +
        '<div class="okmodal-bar"></div>' +
        '<div class="okmodal-title">OKmart</div>' +
        '<div class="okmodal-msg"></div>' +
        '<div class="okmodal-actions">' +
          '<button type="button" class="okmodal-btn okmodal-cancel">Cancel</button>' +
          '<button type="button" class="okmodal-btn okmodal-ok">OK</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    titleEl = overlay.querySelector('.okmodal-title');
    msgEl = overlay.querySelector('.okmodal-msg');
    okBtn = overlay.querySelector('.okmodal-ok');
    cancelBtn = overlay.querySelector('.okmodal-cancel');
    okBtn.addEventListener('click', function () { close(true); });
    cancelBtn.addEventListener('click', function () { close(false); });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close(current && current.isAlert ? true : false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && current) close(current.isAlert ? true : false);
    });
  }

  function showNext() {
    if (current || queue.length === 0) return;
    current = queue.shift();
    build();
    titleEl.textContent = current.title;
    msgEl.textContent = current.message;
    okBtn.textContent = current.okText;
    cancelBtn.textContent = current.cancelText;
    cancelBtn.style.display = current.isAlert ? 'none' : '';
    overlay.hidden = false;
    document.body.classList.add('okmodal-open');
    try { okBtn.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
  }

  function close(result) {
    if (!current) return;
    var done = current.resolve;
    current = null;
    overlay.hidden = true;
    document.body.classList.remove('okmodal-open');
    done(result);
    showNext();
  }

  function open(message, opts, isAlert) {
    return new Promise(function (resolve) {
      queue.push({
        message: String(message == null ? '' : message),
        title: (opts && opts.title) || 'OKmart',
        okText: (opts && (opts.okText || opts.confirmText)) || 'OK',
        cancelText: (opts && opts.cancelText) || 'Cancel',
        isAlert: !!isAlert,
        resolve: resolve
      });
      showNext();
    });
  }

  window.OKModal = {
    confirm: function (message, opts) { return open(message, opts, false); },
    alert: function (message, opts) { return open(message, opts, true); }
  };
})();
