// ===== OK MART - SEARCH.JS =====
// Dedicated search results page with primary results and related suggestions

(function() {
  'use strict';
  
  // ---------- STATE ----------
  let allProducts = [];
  let searchQuery = '';
  let primaryResults = [];
  let relatedResults = [];
  
  // DOM Elements
  const searchLoadingState = document.getElementById('searchLoadingState');
  const searchResultsContainer = document.getElementById('searchResultsContainer');
  const searchResultTitle = document.getElementById('searchResultTitle');
  const resultCount = document.getElementById('resultCount');
  const primaryResultsGrid = document.getElementById('primaryResultsGrid');
  const relatedResultsGrid = document.getElementById('relatedResultsGrid');
  const emptySearchState = document.getElementById('emptySearchState');
  const emptySearchMessage = document.getElementById('emptySearchMessage');
  const suggestedEmptyGrid = document.getElementById('suggestedEmptyGrid');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const clearHeaderSearch = document.getElementById('clearHeaderSearch');
  const primaryResultsTitle = document.getElementById('primaryResultsTitle');
  const relatedProductsSection = document.getElementById('relatedProductsSection');
  
  // ---------- UTILITY FUNCTIONS ----------
  
  // Get search query from URL
  function getSearchQueryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('query') || '';
  }
  
  // Update URL with search query
  function updateURL(query) {
    const url = new URL(window.location);
    url.searchParams.set('query', query);
    window.history.replaceState({}, '', url);
  }
  
  // Calculate match score for sorting
  function getMatchScore(productName, query) {
    const nameLower = productName.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match
    if (nameLower === queryLower) return 100;
    
    // Starts with query
    if (nameLower.startsWith(queryLower)) return 80;
    
    // Contains query as whole word
    const words = nameLower.split(/\s+/);
    if (words.some(word => word === queryLower)) return 60;
    
    // Contains query
    if (nameLower.includes(queryLower)) return 40;
    
    // Category match
    return 20;
  }
  
  // Check if product matches search query
  function productMatchesQuery(product, query) {
    const queryLower = query.toLowerCase();
    const nameLower = product.name.toLowerCase();
    const categoryLower = product.category.toLowerCase();
    
    return nameLower.includes(queryLower) || categoryLower.includes(queryLower);
  }
  
  // Search products
  function searchProducts(query) {
    if (!query || query.trim().length === 0) {
      return { primary: [], related: [] };
    }
    
    const queryLower = query.toLowerCase().trim();
    
    // Find all matching products
    const matches = allProducts.filter(product => 
      productMatchesQuery(product, queryLower)
    );
    
    // Sort by match score (priority)
    const sortedMatches = matches.sort((a, b) => {
      const scoreA = getMatchScore(a.name, queryLower);
      const scoreB = getMatchScore(b.name, queryLower);
      
      if (scoreB !== scoreA) return scoreB - scoreA;
      
      // Then by popular
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      
      return 0;
    });
    
    // Get related products (from same categories as matches, excluding already matched)
    const matchedIds = new Set(sortedMatches.map(p => p.id));
    const matchedCategories = new Set(sortedMatches.map(p => p.category));
    
    const related = allProducts.filter(product => {
      // Not already in primary results
      if (matchedIds.has(product.id)) return false;
      
      // From same category as a matched product
      return matchedCategories.has(product.category);
    });
    
    // Sort related by popular first, then random-ish
    const sortedRelated = related.sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return 0;
    }).slice(0, 8);
    
    return {
      primary: sortedMatches,
      related: sortedRelated
    };
  }
  
  // Get popular products (for empty state)
  function getPopularProducts(limit = 6) {
    return allProducts
      .filter(p => p.popular === true)
      .sort((a, b) => b.price - a.price)
      .slice(0, limit);
  }
  
  // Highlight matching text
  function highlightText(text, query) {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="search-match-highlight">$1</span>');
  }
  
  // ---------- RENDERING FUNCTIONS ----------
  
  // Render primary results
  function renderPrimaryResults() {
    if (!primaryResultsGrid) return;
    
    primaryResultsGrid.innerHTML = '';
    
    if (primaryResults.length === 0) {
      const noResultsMsg = document.createElement('div');
      noResultsMsg.className = 'no-results-message';
      noResultsMsg.textContent = 'No matching products found';
      primaryResultsGrid.appendChild(noResultsMsg);
      return;
    }
    
    primaryResults.forEach(product => {
      const card = OKMart.renderProductCard(product);
      
      // Highlight product name if it matches
      const nameEl = card.querySelector('.product-name');
      if (nameEl && searchQuery) {
        nameEl.innerHTML = highlightText(product.name, searchQuery);
      }
      
      // Add popular badge
      if (product.popular) {
        const badge = document.createElement('span');
        badge.className = 'product-badge';
        badge.textContent = '🔥 Popular';
        badge.style.cssText = `
          position: absolute;
          top: 8px;
          left: 8px;
          background: #27ae60;
          color: white;
          padding: 4px 10px;
          border-radius: 40px;
          font-size: 0.65rem;
          font-weight: 600;
          z-index: 2;
        `;
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
      }
      
      primaryResultsGrid.appendChild(card);
    });
  }
  
  // Render related results
  function renderRelatedResults() {
    if (!relatedResultsGrid) return;
    
    relatedResultsGrid.innerHTML = '';
    
    if (relatedResults.length === 0) {
      // If no related, show popular products instead
      const popular = getPopularProducts(4);
      popular.forEach(product => {
        const card = OKMart.renderProductCard(product);
        
        if (product.popular) {
          const badge = document.createElement('span');
          badge.className = 'product-badge';
          badge.textContent = '🔥 Popular';
          badge.style.cssText = `
            position: absolute;
            top: 8px;
            left: 8px;
            background: #27ae60;
            color: white;
            padding: 4px 10px;
            border-radius: 40px;
            font-size: 0.65rem;
            font-weight: 600;
            z-index: 2;
          `;
          card.style.position = 'relative';
          card.insertBefore(badge, card.firstChild);
        }
        
        relatedResultsGrid.appendChild(card);
      });
      return;
    }
    
    relatedResults.forEach(product => {
      const card = OKMart.renderProductCard(product);
      
      if (product.popular) {
        const badge = document.createElement('span');
        badge.className = 'product-badge';
        badge.textContent = '🔥 Popular';
        badge.style.cssText = `
          position: absolute;
          top: 8px;
          left: 8px;
          background: #27ae60;
          color: white;
          padding: 4px 10px;
          border-radius: 40px;
          font-size: 0.65rem;
          font-weight: 600;
          z-index: 2;
        `;
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
      }
      
      relatedResultsGrid.appendChild(card);
    });
  }
  
  // Render empty state with suggestions
  function renderEmptyState() {
    if (!suggestedEmptyGrid) return;
    
    const popularProducts = getPopularProducts(6);
    
    suggestedEmptyGrid.innerHTML = '';
    
    popularProducts.forEach(product => {
      const card = OKMart.renderProductCard(product);
      
      if (product.popular) {
        const badge = document.createElement('span');
        badge.className = 'product-badge';
        badge.textContent = '🔥 Popular';
        badge.style.cssText = `
          position: absolute;
          top: 8px;
          left: 8px;
          background: #27ae60;
          color: white;
          padding: 4px 10px;
          border-radius: 40px;
          font-size: 0.65rem;
          font-weight: 600;
          z-index: 2;
        `;
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
      }
      
      suggestedEmptyGrid.appendChild(card);
    });
    
    if (emptySearchMessage && searchQuery) {
      emptySearchMessage.textContent = `We couldn't find any products matching "${searchQuery}"`;
    }
  }
  
  // Update UI based on search results
  function updateUI() {
    // Update title
    if (searchResultTitle) {
      if (searchQuery) {
        searchResultTitle.innerHTML = `Results for <span class="search-query-highlight">"${searchQuery}"</span>`;
      } else {
        searchResultTitle.textContent = 'All Products';
      }
    }
    
    // Update result count
    if (resultCount) {
      const count = primaryResults.length;
      resultCount.textContent = `${count} item${count !== 1 ? 's' : ''} found`;
    }
    
    // Update primary results title
    if (primaryResultsTitle) {
      if (searchQuery) {
        primaryResultsTitle.textContent = `Search Results (${primaryResults.length})`;
      } else {
        primaryResultsTitle.textContent = 'All Products';
      }
    }
    
    // Show/hide sections based on results
    if (primaryResults.length === 0) {
      // Show empty state
      emptySearchState.style.display = 'block';
      
      // Hide related section if no primary results
      if (relatedProductsSection) {
        relatedProductsSection.style.display = 'none';
      }
      
      renderEmptyState();
    } else {
      // Hide empty state
      emptySearchState.style.display = 'none';
      
      // Show related section
      if (relatedProductsSection) {
        relatedProductsSection.style.display = relatedResults.length > 0 ? 'block' : 'none';
      }
      
      renderPrimaryResults();
      renderRelatedResults();
    }
    
    // Show results container, hide loading
    if (searchLoadingState) {
      searchLoadingState.style.display = 'none';
    }
    if (searchResultsContainer) {
      searchResultsContainer.style.display = 'block';
    }
  }
  
  // Perform search and update UI
  function performSearch(query) {
    searchQuery = query;
    
    // Update header input
    if (headerSearchInput) {
      headerSearchInput.value = query;
      clearHeaderSearch?.classList.toggle('visible', query.length > 0);
    }
    
    if (!query || query.trim().length === 0) {
      // Show all products as primary
      primaryResults = allProducts.sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return 0;
      });
      relatedResults = [];
    } else {
      const results = searchProducts(query);
      primaryResults = results.primary;
      relatedResults = results.related;
    }
    
    updateUI();
  }
  
  // ---------- EVENT LISTENERS ----------
  
  // Header search input
  if (headerSearchInput) {
    headerSearchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      clearHeaderSearch?.classList.toggle('visible', query.length > 0);
    });
    
    headerSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          updateURL(query);
          performSearch(query);
        }
        headerSearchInput.blur();
      }
    });
  }
  
  // Clear search button
  if (clearHeaderSearch) {
    clearHeaderSearch.addEventListener('click', () => {
      if (headerSearchInput) {
        headerSearchInput.value = '';
        clearHeaderSearch.classList.remove('visible');
        headerSearchInput.focus();
      }
    });
  }
  
  // ---------- INITIALIZATION ----------
  
  async function init() {
    try {
      // Get search query from URL
      const urlQuery = getSearchQueryFromURL();
      
      // Fetch products
      allProducts = await OKMart.getProducts();
      
      if (!allProducts.length) {
        throw new Error('No products loaded');
      }
      
      // Perform initial search
      performSearch(urlQuery);
      
      // Preload popular product images
      const popular = getPopularProducts(6);
      popular.forEach(p => {
        const img = new Image();
        img.src = p.image;
      });
      
    } catch (error) {
      console.error('Failed to load search page:', error);
      
      if (searchLoadingState) {
        searchLoadingState.innerHTML = `
          <div class="empty-search-icon">⚠️</div>
          <h3>Failed to load products</h3>
          <p>Please check your connection and refresh</p>
          <button class="browse-all-btn" onclick="location.reload()">Retry</button>
        `;
      }
    }
  }
  
  // Start the app
  init();
  
  // Expose for debugging
  window.OKMartSearch = {
    performSearch,
    getState: () => ({
      query: searchQuery,
      primaryCount: primaryResults.length,
      relatedCount: relatedResults.length
    })
  };
  
})();
