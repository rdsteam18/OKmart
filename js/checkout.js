// ===== OK MART - CHECKOUT.JS =====
(function() {
  const WHATSAPP_NUMBER = '919982239821';
  const FREE_THRESHOLD = 199;
  const DELIVERY_CHARGE = 20;
  
  let cart = [];
  let couponDiscount = 0;
  let appliedCoupon = null;
  
  const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
  
  // Redirect if cart empty
  if (cart.length === 0) { location.href = '/index.html'; return; }
  
  // Load user data
  const userData = JSON.parse(localStorage.getItem('okmart_user') || '{}');
  document.getElementById('customerName').value = userData.name || '';
  document.getElementById('customerPhone').value = userData.phone || '';
  document.getElementById('customerAddress').value = userData.address || '';
  
  // Calculate totals
  function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = subtotal >= FREE_THRESHOLD ? 0 : DELIVERY_CHARGE;
    const total = Math.max(0, subtotal - couponDiscount + delivery);
    return { subtotal, delivery, total, couponDiscount };
  }
  
  // Render cart items
  const itemsContainer = document.getElementById('cartItems');
  cart.forEach(item => {
    itemsContainer.innerHTML += `<div class="item-row"><span>${item.name} x${item.quantity}</span><span>₹${item.price * item.quantity}</span></div>`;
  });
  
  // Update totals display
  function updateTotalDisplay() {
    const t = calculateTotal();
    document.getElementById('subtotal').textContent = `₹${t.subtotal}`;
    document.getElementById('delivery').textContent = t.delivery === 0 ? 'FREE' : `₹${t.delivery}`;
    document.getElementById('total').textContent = `₹${t.total}`;
  }
  updateTotalDisplay();
  
  // Coupon apply
  document.getElementById('applyCoupon').addEventListener('click', async () => {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    if (!code) return;
    
    const snapshot = await db.collection('offers').where('code', '==', code).where('active', '==', true).get();
    if (snapshot.empty) { alert('Invalid or expired coupon'); return; }
    
    const offer = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    const { subtotal } = calculateTotal();
    
    if (subtotal < offer.minOrder) { alert(`Minimum order ₹${offer.minOrder} required`); return; }
    
    if (offer.type === 'flat') {
      couponDiscount = offer.discount;
    } else if (offer.type === 'percent') {
      const calc = Math.round((subtotal * offer.discount) / 100);
      couponDiscount = offer.maxDiscount ? Math.min(calc, offer.maxDiscount) : calc;
    }
    
    appliedCoupon = offer;
    document.getElementById('couponMsg').textContent = `✅ Coupon ${code} applied! -₹${couponDiscount}`;
    document.getElementById('couponMsg').style.color = '#10b981';
    updateTotalDisplay();
  });
  
  // Place Order
  document.getElementById('placeOrderBtn').addEventListener('click', async () => {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim().replace(/\D/g, '');
    const address = document.getElementById('customerAddress').value.trim();
    
    if (!name || !phone || !address) { alert('Please fill all fields'); return; }
    if (!/^\d{10}$/.test(phone)) { alert('Invalid phone number'); return; }
    
    // Save user data
    localStorage.setItem('okmart_user', JSON.stringify({ name, phone, address }));
    
    const totals = calculateTotal();
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    
    const orderData = {
      orderId,
      customerName: name,
      customerPhone: phone,
      phone: phone,
      name: name,
      customerAddress: address,
      address: address,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      subtotal: totals.subtotal,
      delivery: totals.delivery,
      total: totals.total,
      couponDiscount: totals.couponDiscount,
      couponCode: appliedCoupon?.code || null,
      status: 'received',
      orderDate: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };
    
    try {
      // Save to Firebase
      await db.collection('orders').add(orderData);
      console.log('✅ Order saved:', orderId);
      
      // Build WhatsApp message
      let message = `🛒 *New Order – OK Mart*\n\n`;
      message += `👤 *Name:* ${name}\n`;
      message += `📱 *Phone:* ${phone}\n`;
      message += `📍 *Address:* ${address}\n\n`;
      message += `🧾 *Items:*\n`;
      cart.forEach(item => {
        message += `  • ${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`;
      });
      message += `\n💰 *Subtotal:* ₹${totals.subtotal}\n`;
      if (totals.couponDiscount > 0) message += `🏷️ *Coupon:* -₹${totals.couponDiscount}\n`;
      message += `🚚 *Delivery:* ${totals.delivery === 0 ? 'FREE' : '₹' + totals.delivery}\n`;
      message += `💵 *Total:* ₹${totals.total}\n\n`;
      message += `🆔 *Order ID:* ${orderId}\n\n`;
      message += `📦 Track: ${location.origin}/tracking.html\n`;
      message += `✅ Please confirm this order.`;
      
      // Open WhatsApp
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
      
      // Clear cart
      localStorage.removeItem('okmart_cart');
      
      // Save to orders history
      const orders = JSON.parse(localStorage.getItem('okmart_orders') || '[]');
      orders.push(orderData);
      localStorage.setItem('okmart_orders', JSON.stringify(orders));
      
      // Redirect to success
      setTimeout(() => { location.href = `/success.html?order=${orderId}`; }, 500);
      
    } catch (error) {
      console.error('Order failed:', error);
      alert('Failed to place order. Please try again.');
    }
  });
})();
