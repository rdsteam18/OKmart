// js/home.js – home interactions (UI only)
(function(){
  document.addEventListener('DOMContentLoaded', function() {
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', function(e) {
        chips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        // no business logic, just UI
      });
    });

    // add to cart buttons – just UI feedback (no logic)
    const addButtons = document.querySelectorAll('.btn-add-to-cart');
    addButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        this.textContent = 'Added ✓';
        setTimeout(() => { this.textContent = 'Add'; }, 800);
        // update dummy cart badge
        if (window.updateAllCartIndicators) {
          // demo: we could increment, but keep stable.
        }
      });
    });
  });
})();
