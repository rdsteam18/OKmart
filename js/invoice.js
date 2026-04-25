// ===== OK MART - INVOICE SYSTEM =====
// PDF generation, download, print, WhatsApp sharing

(function() {
  'use strict';
  
  // ========== GET ORDER ID FROM URL ==========
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('id') || params.get('order');
  
  if (!orderId) {
    document.getElementById('invItemsTable').innerHTML = 
      '<tr><td colspan="5" style="text-align:center;color:#ef4444;">No order ID provided</td></tr>';
  }
  
  // ========== LOAD ORDER FROM FIREBASE ==========
  let orderData = null;
  
  async function loadOrder() {
    if (!orderId) return;
    
    try {
      // Try as document ID first
      let doc = await db.collection('orders').doc(orderId).get();
      
      // If not found, search by orderId field
      if (!doc.exists) {
        const snapshot = await db.collection('orders').where('orderId', '==', orderId).get();
        if (!snapshot.empty) {
          doc = snapshot.docs[0];
        }
      }
      
      if (doc && doc.exists) {
        orderData = { id: doc.id, ...doc.data() };
        renderInvoice();
      } else {
        // Try localStorage
        const localOrders = JSON.parse(localStorage.getItem('okmart_orders') || '[]');
        const localOrder = localOrders.find(o => o.orderId === orderId);
        if (localOrder) {
          orderData = localOrder;
          renderInvoice();
        } else {
          showError('Order not found');
        }
      }
      
    } catch (err) {
      console.error('Error loading order:', err);
      showError('Failed to load order');
    }
  }
  
  function showError(msg) {
    document.getElementById('invItemsTable').innerHTML = 
      `<tr><td colspan="5" style="text-align:center;color:#ef4444;">${msg}</td></tr>`;
  }
  
  // ========== RENDER INVOICE ==========
  function renderInvoice() {
    if (!orderData) return;
    
    const o = orderData;
    const items = o.items || [];
    
    // Meta
    document.getElementById('invOrderId').textContent = '#' + (o.orderId || o.id?.slice(-8).toUpperCase() || 'N/A');
    document.getElementById('invOrderId2').textContent = '#' + (o.orderId || o.id?.slice(-8).toUpperCase() || 'N/A');
    document.getElementById('invDate').textContent = 'Date: ' + new Date(o.orderDate || o.date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    document.getElementById('invStatus').textContent = 'Status: ' + (o.status || 'received');
    
    // Customer
    document.getElementById('invCustomerName').textContent = o.customerName || o.name || 'Customer';
    document.getElementById('invCustomerPhone').textContent = o.customerPhone || o.phone || '-';
    document.getElementById('invCustomerAddress').textContent = o.customerAddress || o.address || '-';
    
    // Items
    const tbody = document.getElementById('invItemsTable');
    let subtotal = 0;
    
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);">No items</td></tr>';
    } else {
      tbody.innerHTML = items.map((item, i) => {
        const total = (item.price || 0) * (item.quantity || 1);
        subtotal += total;
        return `
          <tr>
            <td>${i + 1}</td>
            <td class="font-bold">${item.name}</td>
            <td class="text-right">${item.quantity || 1}</td>
            <td class="text-right">₹${item.price || 0}</td>
            <td class="text-right font-bold">₹${total}</td>
          </tr>
        `;
      }).join('');
    }
    
    const delivery = o.delivery || 0;
    const discount = o.couponDiscount || 0;
    const total = o.total || (subtotal + delivery - discount);
    
    document.getElementById('invSubtotal').textContent = '₹' + subtotal.toLocaleString('en-IN');
    
    if (discount > 0) {
      document.getElementById('invDiscountRow').style.display = 'flex';
      document.getElementById('invDiscount').textContent = '-₹' + discount.toLocaleString('en-IN');
    }
    
    document.getElementById('invDelivery').textContent = delivery === 0 ? 'FREE' : '₹' + delivery;
    document.getElementById('invTotal').textContent = '₹' + total.toLocaleString('en-IN');
  }
  
  // ========== DOWNLOAD PDF ==========
  window.downloadPDF = function() {
    if (!orderData) return showToast('No order data', 'error');
    
    const loading = document.getElementById('loadingOverlay');
    loading.style.display = 'flex';
    
    setTimeout(() => {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const o = orderData;
        const items = o.items || [];
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(39, 174, 96);
        doc.text('OK Mart', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text('Fresh Grocery Delivery | +91 99822 39821', 105, 27, { align: 'center' });
        
        // Invoice title
        doc.setFontSize(16);
        doc.setTextColor(26, 30, 43);
        doc.text('INVOICE', 105, 40, { align: 'center' });
        
        // Order Info
        doc.setFontSize(9);
        doc.text(`Order ID: ${o.orderId || 'N/A'}`, 14, 52);
        doc.text(`Date: ${new Date(o.orderDate || o.date).toLocaleDateString('en-IN')}`, 14, 58);
        doc.text(`Status: ${o.status || 'received'}`, 14, 64);
        
        // Customer Info
        doc.setFontSize(10);
        doc.text('Bill To:', 14, 76);
        doc.setFontSize(9);
        doc.text(`${o.customerName || o.name || 'Customer'}`, 14, 83);
        doc.text(`Phone: ${o.customerPhone || o.phone || '-'}`, 14, 89);
        doc.text(`Address: ${o.customerAddress || o.address || '-'}`, 14, 95);
        
        // Items Table
        const tableRows = items.map((item, i) => [
          (i + 1).toString(),
          item.name,
          (item.quantity || 1).toString(),
          '₹' + (item.price || 0),
          '₹' + ((item.price || 0) * (item.quantity || 1))
        ]);
        
        let subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
        const delivery = o.delivery || 0;
        const discount = o.couponDiscount || 0;
        const total = o.total || (subtotal + delivery - discount);
        
        doc.autoTable({
          head: [['#', 'Product', 'Qty', 'Price', 'Total']],
          body: tableRows,
          startY: 102,
          theme: 'grid',
          headStyles: { fillColor: [46, 204, 113], textColor: 255 },
          styles: { fontSize: 9 }
        });
        
        const finalY = doc.lastAutoTable.finalY + 10;
        
        doc.setFontSize(9);
        doc.text('Subtotal:', 130, finalY);
        doc.text('₹' + subtotal.toLocaleString('en-IN'), 170, finalY, { align: 'right' });
        
        if (discount > 0) {
          doc.text('Discount:', 130, finalY + 7);
          doc.text('-₹' + discount, 170, finalY + 7, { align: 'right' });
        }
        
        doc.text('Delivery:', 130, finalY + (discount > 0 ? 14 : 7));
        doc.text(delivery === 0 ? 'FREE' : '₹' + delivery, 170, finalY + (discount > 0 ? 14 : 7), { align: 'right' });
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL:', 130, finalY + (discount > 0 ? 24 : 17));
        doc.text('₹' + total.toLocaleString('en-IN'), 170, finalY + (discount > 0 ? 24 : 17), { align: 'right' });
        
        // Footer
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('Thank you for shopping with OK Mart!', 105, finalY + 35, { align: 'center' });
        doc.text('For queries: WhatsApp +91 99822 39821', 105, finalY + 41, { align: 'center' });
        
        doc.save(`OKMart_Invoice_${o.orderId || 'order'}.pdf`);
        showToast('✅ PDF downloaded!', 'success');
        
      } catch (err) {
        console.error('PDF Error:', err);
        showToast('❌ Error generating PDF', 'error');
      }
      
      loading.style.display = 'none';
    }, 300);
  };
  
  // ========== PRINT INVOICE ==========
  window.printInvoice = function() {
    window.print();
  };
  
  // ========== SEND WHATSAPP ==========
  window.sendWhatsApp = function() {
    if (!orderData) return showToast('No order data', 'error');
    
    const o = orderData;
    const phone = o.customerPhone || o.phone || '';
    const items = o.items || [];
    const total = o.total || 0;
    
    let message = `🧾 *OK Mart - Order Invoice*\n\n`;
    message += `📋 Order ID: ${o.orderId || 'N/A'}\n`;
    message += `📅 Date: ${new Date(o.orderDate || o.date).toLocaleDateString('en-IN')}\n\n`;
    message += `🛒 *Items:*\n`;
    items.forEach(item => {
      message += `  • ${item.name} x${item.quantity || 1} - ₹${(item.price || 0) * (item.quantity || 1)}\n`;
    });
    message += `\n💰 *Total: ₹${total.toLocaleString('en-IN')}*\n\n`;
    message += `🙏 Thank you for shopping with OK Mart!\n`;
    message += `📞 Contact: +91 99822 39821\n`;
    message += `🌐 ${window.location.origin}`;
    
    if (phone && /^\d{10}$/.test(phone)) {
      window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      // Open with admin number if customer phone not available
      window.open(`https://wa.me/919982239821?text=${encodeURIComponent(message)}`, '_blank');
    }
    
    showToast('Opening WhatsApp...', 'success');
  };
  
  // ========== TOAST ==========
  function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
  
  // ========== INIT ==========
  loadOrder();
  
})();
