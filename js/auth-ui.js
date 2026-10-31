// OKMART — Google Sign-In UI for profile.html (customers).
// Waits for firebase.js auth init (window.okmartAuthReady).
// Never touches profile/address logic — it only owns the Google box.
(function () {
  function init() {
    var loginBtn = document.getElementById('googleLoginBtn');
    var logoutBtn = document.getElementById('googleLogoutBtn');
    if (!loginBtn) return;

    function render(user) {
      var out = document.getElementById('googleLoggedOut');
      var inn = document.getElementById('googleLoggedIn');
      if (user) {
        if (out) out.style.display = 'none';
        if (inn) inn.style.display = 'flex';
        var name = document.getElementById('googleUserName');
        var email = document.getElementById('googleUserEmail');
        var photo = document.getElementById('googleUserPhoto');
        if (name) name.textContent = user.displayName || 'Google User';
        if (email) email.textContent = user.email || '';
        if (photo) {
          if (user.photoURL) { photo.src = user.photoURL; photo.style.display = 'block'; }
          else photo.style.display = 'none';
        }
      } else {
        if (out) out.style.display = 'block';
        if (inn) inn.style.display = 'none';
      }
    }

    loginBtn.addEventListener('click', async () => {
      try {
        var auth = await window.okmartAuthReady;
        if (!auth) {
          alert('Login service could not load. Please check your connection and try again.');
          return;
        }
        var provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
      } catch (e) {
        console.warn('Google sign-in failed:', e.message);
        alert('Google sign-in failed: ' + (e.message || 'Please try again.'));
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          var auth = await window.okmartAuthReady;
          if (auth) await auth.signOut();
        } catch (e) { console.warn('Sign-out failed:', e.message); }
        location.reload();
      });
    }

    if (window.okmartAuthReady) {
      window.okmartAuthReady.then((auth) => {
        if (!auth) return;
        render(auth.currentUser);
        auth.onAuthStateChanged(render);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
