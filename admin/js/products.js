// ===== OK MART - PRODUCT MANAGEMENT =====
(function() {
  const db = window.db;
  
  const productsGrid = document.getElementById('productsGrid');
  const productModal = document.getElementById('productModal');
  const deleteModal = document.getElementById('deleteModal');
  const productForm = document.getElementById('productForm');
  const toast = document.getElementById('toast');
  
  let currentDeleteId = null;
  let editingId = null;
  
  // Mobile menu
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
  });
  
  // Open modal
  document.getElementById('addProductBtn')?.addEventListener('click', () => openModal());
  document.getElementById('addProductMobileBtn')?.addEventListener('click', () => openModal());
  document.getElementById('closeModal')?.addEventListener('click', () => productModal.classList.remove('active'));
  
  function openModal(product = null) {
    editingId = product?.id || null;
    document.getElementById('modalTitle').textContent = product ? 'Edit Product' : 'Add Product';
    document.getElementById('productId').value = product?.id || '';
    document.getElementById('prodName').value = product?.name || '';
    document.getElementById('prodPrice').value = product?.price || '';
    document.getElementById('prodMrp').value = product?.mrp || '';
    document.getElementById('prodImage').value = product?.image || '';
    document.getElementById('prodCategory').value = product?.category || '';
    document.getElementById('prodUnit').value = product?.unit || '';
    document.getElementById('prodPopular').checked = product?.popular || false;
    productModal.classList.add('active');
  }
  
  // Save product
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productData = {
      name: document.getElementById('prodName').value,
      price: Number(document.getElementById('prodPrice').value),
      mrp: Number(document.getElementById('prodMrp').value) || 0,
      image: document.getElementById('prodImage').value,
      category: document.getElementById('prodCategory').value,
      unit: document.getElementById('prodUnit').value,
      popular: document.getElementById('prodPopular').checked,
      updatedAt: new Date().toISOString()
    };
    
    try {
      if (editingId) {
        await db.collection('products').doc(editingId).update(productData);
        showToast('Product updated!', 'success');
      } else {
        await db.collection('products').add({ ...productData, createdAt: new Date().toISOString() });
        showToast('Product added!', 'success');
      }
      productModal.classList.remove('active');
      productForm.reset();
    } catch (error) {
      showToast('Error saving product', 'error');
    }
  });
  
  // Delete confirmation
  function confirmDelete(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteProductName').textContent = `Delete "${name}"?`;
    deleteModal.classList.add('active');
  }
  
  document.getElementById('cancelDelete').addEventListener('click', () => deleteModal.classList.remove('active'));
  document.getElementById('confirmDelete').addEventListener('click', async () => {
    if (currentDeleteId) {
      await db.collection('products').doc(currentDeleteId).delete();
      deleteModal.classList.remove('active');
      showToast('Product deleted', 'success');
    }
  });
  
  // Real-time products listener
  db.collection('products').onSnapshot((snapshot) => {
    const products = [];
    snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
    
    const searchQuery = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    
    let filtered = products;
    if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));
    if (categoryFilter !== 'all') filtered = filtered.filter(p => p.category === categoryFilter);
    
    productsGrid.innerHTML = filtered.length === 0 
      ? '<p class="loading-text">No products found</p>'
      : filtered.map(p => `
        <div class="product-admin-card">
          <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/80'">
          <div class="product-admin-info">
            <div class="product-admin-name">${p.name}</div>
            <div class="product-admin-price">₹${p.price} ${p.mrp ? `<span style="text-decoration:line-through;color:var(--muted);font-size:0.8rem;">₹${p.mrp}</span>` : ''}</div>
            <div class="product-admin-category">${p.category} · ${p.unit || 'N/A'}</div>
            <div class="product-admin-actions">
              <button class="edit-btn" onclick="window.editProduct('${p.id}')">✏️ Edit</button>
              <button class="delete-btn" onclick="window.deleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')">🗑️ Delete</button>
            </div>
          </div>
        </div>
      `).join('');
  });
  
  // Search & filter
  document.getElementById('productSearch')?.addEventListener('input', () => {
    db.collection('products').get().then(snapshot => {
      snapshot.forEach(doc => {});
    });
  });
  
  // Global functions for buttons
  window.editProduct = (id) => {
    db.collection('products').doc(id).get().then(doc => {
      if (doc.exists) openModal({ id: doc.id, ...doc.data() });
    });
  };
  
  window.deleteProduct = (id, name) => confirmDelete(id, name);
  
  function showToast(msg, type = 'info') {
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
  
})();

