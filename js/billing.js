// ===== OK MART - BILLING.JS =====
// Admin billing page with PDF invoice generation

(function() {
  'use strict';
  
  // ---------- CONFIGURATION ----------
  const JSON_FILES = ['fruits', 'dairy', 'snacks', 'beverages', 'electronics', 'grocery', 'offers'];
  const FREE_DELIVERY_THRESHOLD = 199;
  const DELIVERY_CHARGE = 20;
  const WHATSAPP_NUMBER = '919982239821';
  
  // Free onion product
  const FREE_ONION = {
    id: 'free_onion_bill',
    name: 'Onion (FREE)',
    price: 0,
    mrp: 30,
    image: 'https://images.pexels.com/photos/144248/pexels-photo-144248.jpeg?auto=compress&cs=tinysrgb&w=200',
    unit: '1 kg',
    quantity: 1,
    isFree: true
  };
  
  // ---------- STATE ----------
  let allProducts = [];
  let billItems = [];
  let searchQuery = '';
  
  // DOM Elements
  const customerName = document.getElementById('customerName');
  const customerPhone = document.getElementById('customerPhone');
  const customerAddress = document.getElementById('customerAddress');
  
  const productSearchInput = document.getElementById('productSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchResults = document.getElementById('searchResults');
  const searchResultsList = document.getElementById('searchResultsList');
  
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const emptyCartMessage = document.getElementById('emptyCartMessage');
  const priceSummary = document.getElementById('priceSummary');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartDelivery = document.getElementById('cartDelivery');
  const cartTotal = document.getElementById('cartTotal');
  const freeOnionRow = document.getElementById('freeOnionRow');
  const deliveryMessage = document.getElementById('deliveryMessage');
  const clearCartBtn = document.getElementById('clearCartBtn');
  
  const generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
  const whatsappShareBtn = document.getElementById('whatsappShareBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const toastMessage = document.getElementById('toastMessage');
  
  // ---------- DATA LOADING ----------
  
  async function loadAllProducts() {
    const products = [];
    
    for (const cat of JSON_FILES) {
      try {
        const response = await fetch(`/data/${cat}.json`);
        if (response.ok) {
          const data = await response.json();
          if (data.products) {
            products.push(...data.products);
          }
        }
      } catch (e) {
        console.warn(`Could not load ${cat}.json`);
      }
    }
    
    return products;
  }
  
  // ---------- BILL CALCULATIONS ----------
  
  function calculateSubtotal() {
    return billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  
  function shouldAddFreeOnion() {
    const subtotal = calculateSubtotal();
    return subtotal >= FREE_DELIVERY_THRESHOLD;
  }
  
  function calculateTotals() {
    const subtotal = calculateSubtotal();
    const hasFreeOnion = shouldAddFreeOnion();
    const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
    const total = subtotal + delivery;
    
    return { subtotal, hasFreeOnion, delivery, total };
  }
  
  // ---------- UI UPDATES ----------
  
  function updateCartUI() {
    const totals = calculateTotals();
    const hasItems = billItems.length > 0;
    
    // Show/hide empty message
    if (hasItems) {
      emptyCartMessage.style.display = 'none';
      priceSummary.style.display = 'block';
    } else {
      emptyCartMessage.style.display = 'block';
      priceSummary.style.display = 'none';
    }
    
    // Update totals
    cartSubtotal.textContent = `₹${totals.subtotal}`;
    cartDelivery.textContent = totals.delivery === 0 ? 'FREE' : `₹${totals.delivery}`;
    cartTotal.textContent = `₹${totals.total}`;
    
    // Free onion row
    freeOnionRow.style.display = totals.hasFreeOnion ? 'flex' : 'none';
    
    // Delivery message
    if (totals.delivery === 0) {
      deliveryMessage.textContent = '🎉 FREE delivery applied!';
      deliveryMessage.style.color = '#10b981';
    } else {
      const remaining = FREE_DELIVERY_THRESHOLD - totals.subtotal;
      deliveryMessage.textContent = `🚚 Add ₹${remaining} more for FREE delivery`;
      deliveryMessage.style.color = '#f59e0b';
    }
    
    renderCartItems();
  }
  
  function renderCartItems() {
    if (billItems.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart-message">
          <span>🛒</span>
          <p>No items added yet</p>
          <p class="hint">Search and add products above</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    billItems.forEach((item, index) => {
      html += `
        <div class="cart-item" data-index="${index}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/50?text=OK'">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${item.price} ${item.unit ? '· ' + item.unit : ''}</div>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-control">
              <button class="qty-btn minus-btn" data-id="${item.id}">−</button>
              <span class="qty-number">${item.quantity}</span>
              <button class="qty-btn plus-btn" data-id="${item.id}">+</button>
            </div>
            <button class="remove-item-btn" data-id="${item.id}">🗑️</button>
          </div>
        </div>
      `;
    });
    
    cartItemsContainer.innerHTML = html;
    
    // Add event listeners
    cartItemsContainer.querySelectorAll('.minus-btn').forEach(btn => {
      btn.addEventListener('click', () => updateQuantity(btn.dataset.id, -1));
    });
    
    cartItemsContainer.querySelectorAll('.plus-btn').forEach(btn => {
      btn.addEventListener('click', () => updateQuantity(btn.dataset.id, 1));
    });
    
    cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', () => removeItem(btn.dataset.id));
    });
  }
  
  // ---------- CART ACTIONS ----------
  
  function addToBill(product) {
    const existing = billItems.find(item => item.id === product.id);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      billItems.push({
        ...product,
        quantity: 1
      });
    }
    
    updateCartUI();
    showToast(`${product.name} added to bill`, 'success');
    
    // Clear search
    productSearchInput.value = '';
    searchQuery = '';
    searchResults.style.display = 'none';
    clearSearchBtn.classList.remove('visible');
  }
  
  function updateQuantity(productId, change) {
    const item = billItems.find(item => item.id === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      item.quantity = newQuantity;
      updateCartUI();
    }
  }
  
  function removeItem(productId) {
    billItems = billItems.filter(item => item.id !== productId);
    updateCartUI();
    showToast('Item removed', 'info');
  }
  
  function clearCart() {
    if (billItems.length === 0) return;
    
    if (confirm('Clear all items from bill?')) {
      billItems = [];
      updateCartUI();
      showToast('Cart cleared', 'info');
    }
  }
  
  // ---------- SEARCH ----------
  
  function filterProducts(query) {
    if (!query || query.length < 2) return [];
    
    const q = query.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 15);
  }
  
  function renderSearchResults(results) {
    if (results.length === 0) {
      searchResultsList.innerHTML = '<div class="no-results">No products found</div>';
    } else {
      let html = '';
      results.forEach(product => {
        html += `
          <div class="search-result-item" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.name}" class="result-image" onerror="this.src='https://via.placeholder.com/45?text=OK'">
            <div class="result-info">
              <div class="result-name">${product.name}</div>
              <span class="result-price">₹${product.price}</span>
              <span class="result-unit">${product.unit || ''}</span>
            </div>
          </div>
        `;
      });
      searchResultsList.innerHTML = html;
      
      // Add click listeners
      searchResultsList.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const productId = item.dataset.productId;
          const product = results.find(p => p.id === productId);
          if (product) addToBill(product);
        });
      });
    }
    
    searchResults.style.display = 'block';
  }
  
  // ---------- PDF GENERATION ----------
  
  function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const name = customerName.value.trim() || 'Walk-in Customer';
    const phone = customerPhone.value.trim() || '-';
    const address = customerAddress.value.trim() || '-';
    const totals = calculateTotals();
    const invoiceNo = 'INV-' + Date.now().toString(36).toUpperCase();
    const date = new Date().toLocaleDateString('en-IN');
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(46, 204, 113);
    doc.text('OK MART', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Fresh Grocery Delivery', 105, 28, { align: 'center' });
    
    // Invoice Info
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice: ${invoiceNo}`, 14, 45);
    doc.text(`Date: ${date}`, 14, 52);
    
    // Customer Info
    doc.setFontSize(11);
    doc.text('Customer Details', 14, 65);
    doc.setFontSize(9);
    doc.text(`Name: ${name}`, 14, 73);
    doc.text(`Phone: +91 ${phone}`, 14, 80);
    doc.text(`Address: ${address}`, 14, 87);
    
    // Items Table
    const tableHeaders = [['Item', 'Qty', 'Price', 'Total']];
    const tableRows = billItems.map(item => [
      item.name,
      item.quantity.toString(),
      `₹${item.price}`,
      `₹${item.price * item.quantity}`
    ]);
    
    // Add free onion if applicable
    if (totals.hasFreeOnion) {
      tableRows.push(['🧅 Onion (FREE)', '1', 'FREE', 'FREE']);
    }
    
    doc.autoTable({
      head: tableHeaders,
      body: tableRows,
      startY: 95,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113], textColor: 255 },
      styles: { fontSize: 9 }
    });
    
    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(9);
    doc.text(`Subtotal:`, 130, finalY);
    doc.text(`₹${totals.subtotal}`, 170, finalY, { align: 'right' });
    
    doc.text(`Delivery:`, 130, finalY + 7);
    doc.text(totals.delivery === 0 ? 'FREE' : `₹${totals.delivery}`, 170, finalY + 7, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Total:`, 130, finalY + 18);
    doc.text(`₹${totals.total}`, 170, finalY + 18, { align: 'right' });
    
    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for shopping with OK Mart!', 105, finalY + 40, { align: 'center' });
    doc.text('Delivery in 10-12 minutes', 105, finalY + 47, { align: 'center' });
    
    // Save PDF
    doc.save(`OKMart_Invoice_${invoiceNo}.pdf`);
  }
  
  // ---------- WHATSAPP SHARE ----------
  
  function shareOnWhatsApp() {
    const name = customerName.value.trim() || 'Customer';
    const phone = customerPhone.value.trim();
    const address = customerAddress.value.trim();
    const totals = calculateTotals();
    
    if (!phone) {
      showToast('Please enter customer phone number', 'error');
      return;
    }
    
    let message = `🛒 *OK Mart Order Invoice*\n\n`;
    message += `👤 *Customer:* ${name}\n`;
    message += `📱 *Phone:* +91 ${phone}\n`;
    message += `🏠 *Address:* ${address || '-'}\n\n`;
    message += `📋 *Items:*\n`;
    
    billItems.forEach(item => {
      message += `  • ${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`;
    });
    
    if (totals.hasFreeOnion) {
      message += `  • 🧅 Onion (FREE) - FREE\n`;
    }
    
    message += `\n💰 *Subtotal:* ₹${totals.subtotal}\n`;
    message += `🚚 *Delivery:* ${totals.delivery === 0 ? 'FREE' : '₹' + totals.delivery}\n`;
    message += `💵 *Total:* ₹${totals.total}\n\n`;
    message += `✅ Thank you for your order!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    showToast('Opening WhatsApp...', 'success');
  }
  
  // ---------- TOAST ----------
  
  function showToast(message, type = 'info') {
    if (!toastMessage) return;
    
    toastMessage.textContent = message;
    toastMessage.className = `toast-message ${type}`;
    toastMessage.classList.add('show');
    
    setTimeout(() => toastMessage.classList.remove('show'), 2500);
  }
  
  // ---------- EVENT LISTENERS ----------
  
  // Search
  productSearchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.classList.toggle('visible', searchQuery.length > 0);
    
    if (searchQuery.length >= 2) {
      const results = filterProducts(searchQuery);
      renderSearchResults(results);
    } else {
      searchResults.style.display = 'none';
    }
  });
  
  productSearchInput.addEventListener('focus', () => {
    if (searchQuery.length >= 2) {
      const results = filterProducts(searchQuery);
      renderSearchResults(results);
    }
  });
  
  clearSearchBtn.addEventListener('click', () => {
    productSearchInput.value = '';
    searchQuery = '';
    searchResults.style.display = 'none';
    clearSearchBtn.classList.remove('visible');
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-section')) {
      searchResults.style.display = 'none';
    }
  });
  
  // Cart actions
  clearCartBtn.addEventListener('click', clearCart);
  
  // Invoice generation
  generateInvoiceBtn.addEventListener('click', () => {
    if (billItems.length === 0) {
      showToast('Add items to generate invoice', 'error');
      return;
    }
    
    loadingOverlay.style.display = 'flex';
    
    setTimeout(() => {
      try {
        generatePDF();
        showToast('PDF generated successfully!', 'success');
      } catch (error) {
        console.error('PDF Error:', error);
        showToast('Error generating PDF', 'error');
      }
      loadingOverlay.style.display = 'none';
    }, 500);
  });
  
  whatsappShareBtn.addEventListener('click', shareOnWhatsApp);
  
  // ---------- INITIALIZATION ----------
  
  async function init() {
    allProducts = await loadAllProducts();
    console.log(`✅ Billing loaded | ${allProducts.length} products available`);
    
    // Load saved customer if exists
    const savedUser = localStorage.getItem('okmart_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (!customerName.value) customerName.value = user.name || '';
      if (!customerPhone.value) customerPhone.value = user.phone || '';
    }
  }
  
  init();
  
})();

