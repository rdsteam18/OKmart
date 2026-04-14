// js/cart.js – cart page UI (quantity/remove placeholders)
(function(){
  document.addEventListener('DOMContentLoaded', function() {
    // quantity plus/minus demo (no real logic)
    const qtyBtns = document.querySelectorAll('.qty-btn');
    qtyBtns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        const control = this.closest('.quantity-control');
        const valueSpan = control.querySelector('.qty-value');
        let val = parseInt(valueSpan.textContent) || 1;
        if (this.textContent.includes('+')) val++;
        else if (this.textContent.includes('−') && val > 1) val--;
        valueSpan.textContent = val;
        // (no price recalculation, just UI)
      });
    });

    // remove button dummy
    document.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', function() {
        const card = this.closest('.cart-item-card');
        if (card) card.style.opacity = '0.5';
        setTimeout(() => card?.remove(), 150);
      });
    });
  });
})();
