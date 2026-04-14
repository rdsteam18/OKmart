// ===== CATEGORY.JS =====
// filters products by category slug

(async function() {
  const categorySlug = window.__OKMART_CATEGORY;
  if (!categorySlug) {
    console.warn('No category defined');
    return;
  }
  
  const products = await OKMart.getProductsByCategory(categorySlug);
  const grid = document.getElementById('categoryProductGrid');
  
  if (grid) {
    grid.innerHTML = '';
    if (products.length === 0) {
      grid.innerHTML = '<p style="padding:2rem;text-align:center">No products found in this category.</p>';
      return;
    }
    
    products.forEach(product => {
      const card = OKMart.renderProductCard(product);
      grid.appendChild(card);
    });
  }
  
  // Optional: update title based on category
  const titleMap = {
    'dairy': '🥛 Dairy & Eggs',
    'snacks': '🍿 Snacks & Munchies',
    'grocery': '🧺 Grocery Staples'
  };
  const heading = document.querySelector('.category-title');
  if (heading && titleMap[categorySlug]) {
    heading.textContent = titleMap[categorySlug];
  }
})();
