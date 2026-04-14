// ===== HOME.JS =====
// Load popular + all products, render grid & category pills

(async function() {
  const products = await OKMart.getProducts();
  if (!products.length) return;
  
  // ----- 1. Render category pills (dynamic categories) -----
  const categoriesSet = new Set(products.map(p => p.category));
  const categories = Array.from(categoriesSet);
  
  const pillsContainer = document.getElementById('categoryPillsContainer');
  if (pillsContainer) {
    const categoryNames = {
      'dairy': '🥛 Dairy',
      'snacks': '🍿 Snacks',
      'grocery': '🧺 Grocery'
    };
    
    categories.forEach(cat => {
      const link = document.createElement('a');
      link.href = `categories/${cat}.html`;
      link.className = 'category-pill';
      link.style.cssText = `
        display: inline-block;
        background: white;
        padding: 8px 18px;
        border-radius: 40px;
        margin: 0 6px 6px 0;
        text-decoration: none;
        color: var(--text-dark);
        font-weight: 500;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-light);
      `;
      link.textContent = categoryNames[cat] || cat;
      pillsContainer.appendChild(link);
    });
  }
  
  // ----- 2. Home product grid: popular first, then rest -----
  const popularProducts = products.filter(p => p.popular === true);
  const otherProducts = products.filter(p => !p.popular);
  
  // concat: popular first
  const sortedForHome = [...popularProducts, ...otherProducts];
  
  const grid = document.getElementById('productGrid');
  if (grid) {
    grid.innerHTML = '';
    sortedForHome.forEach(product => {
      const card = OKMart.renderProductCard(product);
      grid.appendChild(card);
    });
  }
})();
