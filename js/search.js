// ===== OK MART - ADVANCED SEARCH CONTROLLER (MATCHING IMAGES 3 & 4) =====

(function() {
  'use strict';

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const voiceSearchBtn = document.getElementById('voiceSearchBtn');
  const liveSuggestionsContainer = document.getElementById('liveSuggestionsContainer');
  const suggestionsList = document.getElementById('suggestionsList');
  const defaultSearchContent = document.getElementById('defaultSearchContent');
  const pastSearchesSection = document.getElementById('pastSearchesSection');
  const pastChipsContainer = document.getElementById('pastChipsContainer');
  const clearPastSearchesBtn = document.getElementById('clearPastSearchesBtn');
  const quickPicksScroll = document.getElementById('quickPicksScroll');
  const trendingScroll = document.getElementById('trendingScroll');
  const searchResultsSection = document.getElementById('searchResultsSection');
  const searchResultsGrid = document.getElementById('searchResultsGrid');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsCount = document.getElementById('resultsCount');
  const searchBottomCartCount = document.getElementById('searchBottomCartCount');

  // State
  let allProducts = [];
  let pastSearches = [];
  let typingTimer;

  // 1. Load Products from Firebase
  async function loadProducts() {
    try {
      if (typeof db !== 'undefined' && db) {
        const snap = await db.collection('products').where('active', '==', true).get();
        allProducts = [];
        snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Fallback products:', e);
    }
    renderPastSearches();
    renderQuickPicks();
    renderTrending();
    updateCartUI();
  }

  // 2. Past Searches
  function loadPastSearches() {
    try {
      pastSearches = JSON.parse(localStorage.getItem('okmart_recent_searches') || '[]');
      if (pastSearches.length === 0) {
        pastSearches = ['santoor soap', 'madhur sugar', 'jasmine hair oil', 'sprite', 'milk'];
      }
    } catch (e) {
      pastSearches = ['santoor soap', 'madhur sugar', 'jasmine hair oil', 'sprite', 'milk'];
    }
  }

  function savePastSearches() {
    localStorage.setItem('okmart_recent_searches', JSON.stringify(pastSearches.slice(0, 10)));
  }

  function addPastSearch(q) {
    if (!q || !q.trim()) return;
    const term = q.trim().toLowerCase();
    pastSearches = pastSearches.filter(s => s.toLowerCase() !== term);
    pastSearches.unshift(term);
    savePastSearches();
    renderPastSearches();
  }

  function renderPastSearches() {
    if (!pastChipsContainer) return;
    if (pastSearches.length === 0) {
      if (pastSearchesSection) pastSearchesSection.style.display = 'none';
      return;
    }
    if (pastSearchesSection) pastSearchesSection.style.display = 'block';
    pastChipsContainer.innerHTML = pastSearches.slice(0, 8).map(term => `
      <div class="past-search-chip" onclick="executeSearch('${escapeHtml(term)}')">${escapeHtml(term)}</div>
    `).join('');
  }

  if (clearPastSearchesBtn) {
    clearPastSearchesBtn.onclick = () => {
      pastSearches = [];
      savePastSearches();
      renderPastSearches();
      showToast('Past searches cleared');
    };
  }

  // 3. Quick Picks & Trending Shelves (Image 3)
  function renderQuickPicks() {
    if (!quickPicksScroll) return;
    const picks = allProducts.slice(0, 8);
    if (picks.length === 0) {
      quickPicksScroll.innerHTML = '<div style="padding:10px; color:#888;">No items found</div>';
      return;
    }
    quickPicksScroll.innerHTML = picks.map(p => createShelfProductCard(p)).join('');
  }

  function renderTrending() {
    if (!trendingScroll) return;
    const trending = [...allProducts].reverse().slice(0, 8);
    if (trending.length === 0) {
      trendingScroll.innerHTML = '<div style="padding:10px; color:#888;">No items found</div>';
      return;
    }
    trendingScroll.innerHTML = trending.map(p => createShelfProductCard(p)).join('');
  }

  function createShelfProductCard(p) {
    const disc = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    const wishlist = JSON.parse(localStorage.getItem('okmart_wishlist') || '[]');
    const isWishlisted = wishlist.includes(p.id);
    const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
    const cartItem = cart.find(i => i.id === p.id);
    const inCartQty = cartItem ? cartItem.quantity : 0;

    return `
      <div class="shelf-product-card" onclick="location.href='/product.html?id=${p.id}'">
        <button class="wishlist-heart-btn ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist('${p.id}', this)" aria-label="Wishlist">
          ${isWishlisted ? '❤️' : '🤍'}
        </button>
        <div class="shelf-img-container">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://via.placeholder.com/140?text=OK+Mart'">
        </div>
        <span class="shelf-unit-tag">${p.unit || '1 Unit'}</span>
        <div class="shelf-price-row">
          <span class="shelf-price-curr">₹${p.price}</span>
          ${p.mrp ? `<span class="shelf-price-mrp">₹${p.mrp}</span>` : ''}
          ${disc > 0 ? `<span class="shelf-price-discount">${disc}% off</span>` : ''}
        </div>
        <h4 class="shelf-title">${escapeHtml(p.name)}</h4>
        <div class="shelf-quick-tag">⚡ Quick</div>
        ${inCartQty > 0 ? `
          <div class="qty-stepper-btn" onclick="event.stopPropagation()">
            <button class="qty-step-action" onclick="updateSearchItemQty('${p.id}', -1)">−</button>
            <span class="qty-step-value">${inCartQty}</span>
            <button class="qty-step-action" onclick="updateSearchItemQty('${p.id}', 1)">+</button>
          </div>
        ` : `
          <button class="shelf-add-btn" onclick="event.stopPropagation(); addProductToCart('${p.id}')">
            ADD
          </button>
        `}
      </div>
    `;
  }

  // 4. Live Typing Suggestions (Image 4)
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const val = searchInput.value.trim();
      if (clearSearchBtn) {
        if (val) clearSearchBtn.classList.add('visible');
        else clearSearchBtn.classList.remove('visible');
      }

      clearTimeout(typingTimer);
      if (!val) {
        liveSuggestionsContainer.style.display = 'none';
        searchResultsSection.style.display = 'none';
        defaultSearchContent.style.display = 'block';
        return;
      }

      typingTimer = setTimeout(() => {
        showLiveSuggestions(val);
      }, 150);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        if (val) {
          executeSearch(val);
        }
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.onclick = () => {
      searchInput.value = '';
      clearSearchBtn.classList.remove('visible');
      liveSuggestionsContainer.style.display = 'none';
      searchResultsSection.style.display = 'none';
      defaultSearchContent.style.display = 'block';
      searchInput.focus();
    };
  }

  function showLiveSuggestions(query) {
    const q = query.toLowerCase();
    const matched = allProducts.filter(p => (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)).slice(0, 6);

    if (matched.length === 0) {
      suggestionsList.innerHTML = `
        <div class="show-all-results-row" onclick="executeSearch('${escapeHtml(query)}')">
          <span style="font-size:1.1rem;">🔍</span>
          <span>Show all results for '<strong>${escapeHtml(query)}</strong>'</span>
        </div>
      `;
    } else {
      suggestionsList.innerHTML = matched.map(p => `
        <div class="suggestion-row-item" onclick="executeSearch('${escapeHtml(p.name)}')">
          <div class="suggestion-thumb-box">
            <img src="${p.image}" alt="${escapeHtml(p.name)}" onerror="this.src='https://via.placeholder.com/40'">
          </div>
          <div class="suggestion-text-label">
            ${highlightMatch(p.name, query)}
          </div>
        </div>
      `).join('') + `
        <div class="show-all-results-row" onclick="executeSearch('${escapeHtml(query)}')">
          <span style="font-size:1.1rem; color:#16a34a;">🔍</span>
          <span>Show all results for '<strong>${escapeHtml(query)}</strong>'</span>
        </div>
      `;
    }

    liveSuggestionsContainer.style.display = 'block';
    defaultSearchContent.style.display = 'none';
    searchResultsSection.style.display = 'none';
  }

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escapeHtml(text);
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + query.length);
    const after = text.substring(idx + query.length);
    return `${escapeHtml(before)}<strong>${escapeHtml(match)}</strong>${escapeHtml(after)}`;
  }

  // 5. Execute Search (Display Results Grid)
  window.executeSearch = function(query) {
    if (!query) return;
    if (searchInput) {
      searchInput.value = query;
      if (clearSearchBtn) clearSearchBtn.classList.add('visible');
    }
    addPastSearch(query);

    const q = query.toLowerCase();
    const results = allProducts.filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );

    liveSuggestionsContainer.style.display = 'none';
    defaultSearchContent.style.display = 'none';
    searchResultsSection.style.display = 'block';

    resultsTitle.textContent = `Results for "${query}"`;
    resultsCount.textContent = `${results.length} products`;

    if (results.length === 0) {
      searchResultsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #6b7280;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🔍</div>
          <h3 style="font-size: 1rem; font-weight: 700; color: #111827; margin-bottom: 4px;">No products found</h3>
          <p style="font-size: 0.82rem;">Try searching for milk, bread, fruits, snacks, or drinks.</p>
        </div>
      `;
      return;
    }

    searchResultsGrid.innerHTML = results.map(p => createShelfProductCard(p)).join('');
  };

  // 6. Voice Search
  if (voiceSearchBtn) {
    voiceSearchBtn.onclick = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast('Voice search not supported in this browser');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.start();
      showToast('Listening... Speak now 🎙️');

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          executeSearch(transcript);
        }
      };
      recognition.onerror = () => {
        showToast('Voice search failed. Please try typing.');
      };
    };
  }

  // 7. Cart & Wishlist Handlers
  window.addProductToCart = function(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        unit: product.unit,
        quantity: 1
      });
    }
    localStorage.setItem('okmart_cart', JSON.stringify(cart));
    updateCartUI();
    refreshCards();
    showToast(`${product.name} added to cart!`);
  };

  window.updateSearchItemQty = function(id, delta) {
    const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
    const idx = cart.findIndex(i => i.id === id);
    if (idx === -1) return;

    cart[idx].quantity += delta;
    if (cart[idx].quantity <= 0) cart.splice(idx, 1);
    localStorage.setItem('okmart_cart', JSON.stringify(cart));
    updateCartUI();
    refreshCards();
  };

  window.toggleWishlist = function(id, btn) {
    let wishlist = JSON.parse(localStorage.getItem('okmart_wishlist') || '[]');
    const idx = wishlist.indexOf(id);
    if (idx > -1) {
      wishlist.splice(idx, 1);
      if (btn) { btn.textContent = '🤍'; btn.classList.remove('active'); }
      showToast('Removed from wishlist');
    } else {
      wishlist.push(id);
      if (btn) { btn.textContent = '❤️'; btn.classList.add('active'); }
      showToast('Added to wishlist');
    }
    localStorage.setItem('okmart_wishlist', JSON.stringify(wishlist));
  };

  function updateCartUI() {
    try {
      const cart = JSON.parse(localStorage.getItem('okmart_cart') || '[]');
      const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
      if (searchBottomCartCount) searchBottomCartCount.textContent = count;
    } catch(e) {}
  }

  function refreshCards() {
    renderQuickPicks();
    renderTrending();
    if (searchResultsSection.style.display === 'block') {
      const q = (searchInput.value || '').trim();
      if (q) executeSearch(q);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      if (m === '"') return '&quot;';
      if (m === "'") return '&#39;';
      return m;
    });
  }

  function showToast(msg) {
    const t = document.getElementById('toastMessage');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(window._st);
    window._st = setTimeout(() => t.style.display = 'none', 2000);
  }

  // Init
  loadPastSearches();
  loadProducts();

  // Check URL param ?q=
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get('q');
  if (qParam) {
    setTimeout(() => executeSearch(qParam), 300);
  }

})();
