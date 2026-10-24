// ===== OK MART — SINGLE DEAL DETAIL PAGE =====
// URL: /deal.html?id=<firestore doc id>
// Reads ONE doc from the Firestore "deals" collection and renders a
// product-specific page: own title, meta description, OG tags, canonical
// URL and single-Product JSON-LD, so Google can index every product
// individually. Deals list page (deals.html) links here per product,
// which is how Google discovers each product URL.
(function () {
  var box = document.getElementById('dealDetail');

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

  function setMeta(attr, key, content) {
    var sel = 'meta[' + attr + '="' + key + '"]';
    var tag = document.querySelector(sel);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  }

  function setCanonical(url) {
    var link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  function injectSchema(d) {
    var product = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: d.title,
      image: d.image,
      description: d.description || d.title,
      brand: { '@type': 'Brand', name: d.retailer || 'OKmart Deals' },
      offers: {
        '@type': 'Offer',
        url: d.affiliateLink,
        priceCurrency: 'INR',
        price: d.price,
        availability: 'https://schema.org/InStock'
      }
    };
    if (d.category) product.category = d.category;
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(product);
    document.head.appendChild(script);
  }

  function render(d) {
    var off = offPercent(d.price, d.mrp);
    var priceText = '₹' + Number(d.price).toLocaleString('en-IN');
    var desc = (d.description || d.title) + ' — ' + priceText +
      (d.mrp ? ' (MRP ₹' + Number(d.mrp).toLocaleString('en-IN') + ')' : '') +
      '. Price badal sakta hai.';

    document.title = d.title + ' | OK Mart';
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', d.title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', d.image || '');
    setCanonical('https://okmart.netlify.app/deal.html?id=' + encodeURIComponent(d.id));
    injectSchema(d);

    box.innerHTML =
      '<article class="deal-detail">' +
        '<img src="' + esc(d.image) + '" alt="' + esc(d.title) + '" style="width:100%;border-radius:14px;" onerror="this.style.display=\'none\'">' +
        '<div style="margin-top:12px;">' +
          '<span class="deal-retailer">' + esc(d.retailer || 'Deal') + '</span>' +
          '<h1 style="font-size:20px;margin:8px 0;">' + esc(d.title) + '</h1>' +
          (d.description ? '<p style="font-size:14px;color:#444;margin:8px 0;">' + esc(d.description) + '</p>' : '') +
          '<div class="deal-price-row">' +
            '<span class="deal-price">' + priceText + '</span>' +
            (d.mrp ? '<span class="deal-mrp">₹' + Number(d.mrp).toLocaleString('en-IN') + '</span>' : '') +
            (off ? '<span class="deal-off">' + off + '</span>' : '') +
          '</div>' +
          '<a class="deal-buy-btn" href="' + esc(d.affiliateLink) + '" target="_blank" rel="sponsored noopener">Buy Now →</a>' +
          '<span class="deal-date">Deal added: ' + fmtDate(d.createdAt) + ' · Price badal sakta hai</span>' +
          '<p style="margin-top:14px;"><a href="/deals.html">← Saare deals dekhein</a></p>' +
        '</div>' +
      '</article>';
  }

  function notFound(msg) {
    box.innerHTML = '<div class="deals-empty">' + msg +
      '<br><a href="/deals.html">Saare deals dekhein →</a></div>';
  }

  function load() {
    var id = new URLSearchParams(location.search).get('id');
    if (!id) { notFound('Koi deal select nahi hui.'); return; }
    var db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) { notFound('Deal load nahi ho paya. Page refresh karke dobara try karein.'); return; }
    db.collection('deals').doc(id).get()
      .then(function (doc) {
        if (!doc.exists) { notFound('Ye deal nahi mili. Ho sakta hai deal hata di gayi ho.'); return; }
        var d = doc.data();
        if (d.active === false) { notFound('Ye deal ab active nahi hai.'); return; }
        d.id = doc.id;
        render(d);
      })
      .catch(function () {
        notFound('Deal load nahi ho paya. Page refresh karke dobara try karein.');
      });
  }

  load();
})();
