// js/checkout.js – checkout interactions (UI only)
(function(){
  document.addEventListener('DOMContentLoaded', function() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(opt => {
      opt.addEventListener('click', function() {
        paymentOptions.forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
      });
    });
  });
})();
