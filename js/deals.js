// ===== OK MART — DAILY LOOT DEALS (public page) =====
// Reads the Firestore "deals" collection (public read).
// Deals are added from the admin panel (admin/deals.html) or the daily
// Telegram deals pipeline — never hardcoded here. Old deals stay live;
// only their retailer price may change (see the on-page notice).
(function () {
  var grid = document.getElementById('dealsGrid');
  var searchInput = document.getElementById('dealSearch');
  var chips = document.getElementById('retailerChips');
  var allDeals = [];
  var activeRetailer = 'all';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime()) && iso.toDate) d = iso.toDate();
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  }

  function offPercent(price, mrp) {
    if (!mrp || mrp <= price) return '';
    return Math.round(((mrp - price) / mrp) * 100) + '% OFF';
  }

  function render() {
    var q = (searchInput.value || '').toLowerCase().trim();
    var list = allDeals.filter(function (d) {
      if (activeRetailer !== 'all') {
        var r = (d.retailer || '').toLowerCase();
        if (activeRetailer === 'other' && (r === 'amazon' || r === 'flipkart')) return false;
        if (activeRetailer !== 'other' && r !== activeRetailer) return false;
      }
      if (q) {
        var hay = ((d.title || '') + ' ' + (d.category || '') + ' ' + (d.retailer || '') + ' ' + (d.description || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (!list.length) {
      grid.innerHTML = '<div class="deals-empty">Abhi is filter me koi deal nahi hai.<br>Naye deals roz add hote hain — Telegram channel <a href="https://t.me/MEGADELS2" target="_blank" rel="noopener">Mega Dels</a> par bhi deals milte hain.</div>';
      return;
    }

    grid.innerHTML = list.map(function (d) {
      var off = offPercent(d.price, d.mrp);
      return '<article class="deal-card" id="deal-' + esc(d.id) + '">' +
        '<img src="' + esc(d.image) + '" alt="' + esc(d.title) + '" loading="lazy" onerror="this.style.display=\'none\'">' +
        '<div class="deal-card-body">' +
          '<span class="deal-retailer">' + esc(d.retailer || 'Deal') + '</span>' +
          '<h3 class="deal-card-title"><a href="/deal.html?id=' + esc(d.id) + '" style="color:inherit;text-decoration:none;">' + esc(d.title) + '</a></h3>' +
          (d.description ? '<p class="deal-card-desc" style="font-size:13px;color:#555;margin:6px 0;">' + esc(d.description) + '</p>' : '') +
          '<div class="deal-price-row">' +
            '<span class="deal-price">₹' + Number(d.price).toLocaleString('en-IN') + '</span>' +
            (d.mrp ? '<span class="deal-mrp">₹' + Number(d.mrp).toLocaleString('en-IN') + '</span>' : '') +
            (off ? '<span class="deal-off">' + off + '</span>' : '') +
          '</div>' +
          '<a class="deal-buy-btn" href="' + esc(d.affiliateLink) + '" target="_blank" rel="sponsored noopener">Buy Now →</a>' +
          '<span class="deal-date">Deal added: ' + fmtDate(d.createdAt) + ' · Price badal sakta hai</span>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  // Structured data for Google + AI assistants (Product offers).
  function injectSchema() {
    var items = allDeals.map(function (d, i) {
      return {
        '@type': 'Product',
        position: i + 1,
        name: d.title,
        image: d.image,
        description: d.description || d.title,
        category: d.category || undefined,
        brand: { '@type': 'Brand', name: d.retailer || 'OKmart Deals' },
        offers: {
          '@type': 'Offer',
          url: d.affiliateLink,
          priceCurrency: 'INR',
          price: d.price,
          availability: 'https://schema.org/InStock'
        }
      };
    });
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'OKmart Daily Loot Deals',
      itemListElement: items
    });
    document.head.appendChild(script);
  }

  function load() {
    var db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) {
      grid.innerHTML = '<div class="deals-empty">Deals load nahi ho paye. Page refresh karke dobara try karein.</div>';
      return;
    }
    db.collection('deals').orderBy('createdAt', 'desc').get()
      .then(function (snap) {
        allDeals = [];
        snap.forEach(function (doc) {
          var d = doc.data();
          if (d.active !== false) allDeals.push(Object.assign({ id: doc.id }, d));
        });
        injectSchema();
        render();
      })
      .catch(function () {
        grid.innerHTML = '<div class="deals-empty">Deals load nahi ho paye. Page refresh karke dobara try karein.</div>';
      });
  }

  searchInput.addEventListener('input', render);
  chips.addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    chips.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    activeRetailer = btn.getAttribute('data-retailer');
    render();
  });

  load();
})();
