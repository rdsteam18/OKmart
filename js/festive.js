// ===== OKMART FESTIVE BANNER ENGINE =====
// Hindu festivals ONLY (per mandate). Date-driven: the theme changes
// automatically on every page load — no cron or rebuild needed.
// Admin override: Firestore doc settings/festive can replace the headline /
// subtext / offer / CTA of the current day, or hide the banner (active:false).
// Fallback: if no override and no festival today -> clean brand banner.
(function () {
  'use strict';

  // ---------- date helpers (LOCAL date, never UTC) ----------
  function localKey(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // ---------- day builder ----------
  function day(date, tag, title, subtitle, offer, gradient, accent, anim, cta) {
    return { date: date, tag: tag, title: title, subtitle: subtitle, offer: offer || '',
      gradient: gradient, accent: accent, anim: anim, cta: cta || null };
  }

  // ---------- Navratri (9 days, traditional colour order) ----------
  function navratriDays(startKey) {
    var forms = ['Shailputri', 'Brahmacharini', 'Chandraghanta', 'Kushmanda',
      'Skandamata', 'Katyayani', 'Kalaratri', 'Mahagauri', 'Siddhidatri'];
    var colors = ['#FFD700', '#2E9E5B', '#9E9E9E', '#FF7A00', '#FFFFFF',
      '#E53935', '#1A237E', '#F06292', '#7B1FA2'];
    var colorNames = ['Yellow', 'Green', 'Grey', 'Orange', 'White', 'Red',
      'Royal Blue', 'Pink', 'Purple'];
    var motifs = ['Dandiya sticks', 'Garba earthen pots', 'Traditional prints',
      'Festive lights', 'Flower garlands', 'Dandiya night', 'Garba beats',
      'White blooms', 'Blessings'];
    var out = [];
    var parts = startKey.split('-').map(Number);
    for (var i = 0; i < 9; i++) {
      var d = new Date(parts[0], parts[1] - 1, parts[2] + i);
      var key = localKey(d);
      out.push(day(key,
        'Navratri • Day ' + (i + 1) + ' • ' + colorNames[i],
        'Navratri Day ' + (i + 1) + ' — Maa ' + forms[i] + ' 🙏',
        'Aaj ka rang: ' + colorNames[i] + ' • ' + motifs[i] +
        ' • Vrat ka saaman, phal aur falhaar — 15 minute me.',
        'Navratri specials — falhaar & vrat essentials',
        ['#3b0764', colors[i]], colors[i], 'diyas', null));
    }
    return out;
  }

  // ---------- festival calendar ----------
  var FESTIVALS = [
    { id: 'diwali-2026', name: 'Diwali', days: [
      day('2026-11-05', 'Diwali • Countdown', 'Diwali aa rahi hai — bas 3 din baaki! 🪔',
        'Ghar sajane ka saaman, dry fruits, sweets aur diye — sab kuch 15 minute me.',
        'Festive sweets & munchies par best prices', ['#7c2d12', '#f59e0b'], '#fbbf24', 'diyas'),
      day('2026-11-06', 'Dhanteras • Shubh Din', 'Shubh Dhanteras! ✨',
        'Sona, dry fruits, ghee aur puja saaman — shagun ki shopping, 15 minute me.',
        'Ghee & dry fruits par festive deals', ['#78350f', '#facc15'], '#fde047', 'diyas'),
      day('2026-11-07', 'Choti Diwali', 'Choti Diwali ki roshni 🪔',
        'Diye, lights aur meetha — kal ki badi Diwali ki taiyari aaj hi.',
        'Sweets & munchies delivered in 15 mins', ['#9a3412', '#fb923c'], '#fdba74', 'sparkles'),
      day('2026-11-08', 'Diwali • Shubh Deepavali', '🪔 Shubh Deepavali!',
        'Lakshmi Puja ki shubhkamnayein — dry fruits, kaju katli, ghee aur diye, 15 minute me ghar tak.',
        'Diwali Loot Deals — aaj ke best prices', ['#4c0519', '#f59e0b'], '#fbbf24', 'sparkles'),
      day('2026-11-09', 'Diwali • Aakhri Mauka', 'Diwali offers jaari hain ✨',
        'Mehman-nawazi abhi baaki hai — sweets aur snacks abhi bhi 15 minute me.',
        'Festive offers — aaj aakhri din', ['#7c2d12', '#fbbf24'], '#fde68a', 'diyas'),
      day('2026-11-11', 'Bhai Dooj', 'Bhai Dooj ki mithaas 🍬',
        'Bhai-behen ke pyaar ka din — meetha aur gifts, 15 minute me.',
        'Sweets & gifts par deals', ['#831843', '#f472b6'], '#fbcfe8', 'sparkles')
    ]},
    { id: 'uttarayan-2027', name: 'Uttarayan', days: [
      day('2027-01-11', 'Uttarayan • Countdown', 'Uttarayan — bas 3 din baaki! 🪁',
        'Patang, manja aur til-gud ki taiyari shuru — sab kuch 15 minute me.',
        'Kite-flying essentials', ['#0c4a6e', '#fb923c'], '#fdba74', 'kites'),
      day('2027-01-12', 'Uttarayan • Taiyari', 'Patang ki taiyari 🪁',
        'Sabse unchi patang ke liye manja, til-gud aur chikki — order karo.',
        'Til-gud & chikki deals', ['#0c4a6e', '#38bdf8'], '#bae6fd', 'kites'),
      day('2027-01-13', 'Uttarayan • Eve', 'Uttarayan eve — til-gud khao 🪁',
        'Kal aasmaan patangon se bhar jayega — aaj hi saaman ready rakho.',
        'Undhiyu & festive snacks', ['#0c4a6e', '#facc15'], '#fde047', 'kites'),
      day('2027-01-14', 'Uttarayan • Makar Sankranti', 'Happy Uttarayan! 🪁',
        'Patang, til-gud, chikki aur undhiyu — aasman bhar do, 15 minute me.',
        'Uttarayan specials — patang & snacks', ['#0369a1', '#f59e0b'], '#fbbf24', 'kites'),
      day('2027-01-15', 'Uttarayan • Aakhri Mauka', 'Uttarayan offers jaari hain 🪁',
        'Patangbazi ka maza abhi baaki — snacks aur til-gud abhi bhi 15 minute me.',
        'Festive offers — aaj aakhri din', ['#0c4a6e', '#fbbf24'], '#fde68a', 'kites')
    ]},
    { id: 'shivaratri-2027', name: 'Maha Shivaratri', days: [
      day('2027-03-03', 'Shivaratri • Countdown', 'Maha Shivaratri — bas 3 din baaki 🔱',
        'Vrat ki taiyari shuru — doodh, dahi, phal aur puja saaman.',
        'Vrat essentials', ['#1e1b4b', '#6366f1'], '#a5b4fc', 'moon'),
      day('2027-03-04', 'Shivaratri • Countdown', 'Maha Shivaratri — bas 2 din baaki 🔱',
        'Bel patra, doodh aur falhaar — sab kuch 15 minute me.',
        'Falhaar & vrat deals', ['#1e1b4b', '#818cf8'], '#c7d2fe', 'moon'),
      day('2027-03-05', 'Shivaratri • Eve', 'Maha Shivaratri eve 🔱',
        'Kal ka vrat — aaj hi saaman ready rakho, 15 minute me delivery.',
        'Vrat ka saaman', ['#1e1b4b', '#a78bfa'], '#ddd6fe', 'moon'),
      day('2027-03-06', 'Maha Shivaratri', 'Maha Shivaratri 🔱',
        'Har Har Mahadev — vrat ka saaman, doodh, dahi, phal, 15 minute me.',
        'Shivaratri specials', ['#172554', '#7c3aed'], '#c4b5fd', 'moon'),
      day('2027-03-07', 'Shivaratri • Aakhri Mauka', 'Shivaratri offers jaari hain 🔱',
        'Prasad aur falhaar abhi bhi 15 minute me.',
        'Festive offers — aaj aakhri din', ['#1e1b4b', '#818cf8'], '#c7d2fe', 'moon')
    ]},
    { id: 'holi-2027', name: 'Holi', days: [
      day('2027-03-19', 'Holi • Countdown', 'Holi — bas 3 din baaki! 🎨',
        'Rang, gulal aur gujiya ki taiyari — sab kuch 15 minute me.',
        'Holi colours & snacks', ['#831843', '#f472b6'], '#fbcfe8', 'petals'),
      day('2027-03-20', 'Holi • Countdown', 'Rangon ki taiyari 🎨',
        'Herbal gulal, gujiya aur thandai — Holi ready, 15 minute me.',
        'Gujiya & thandai deals', ['#9d174d', '#fb923c'], '#fdba74', 'petals'),
      day('2027-03-21', 'Holika Dahan', 'Holika Dahan 🔥',
        'Burai par achhai ki jeet — puja saaman aur meetha, 15 minute me.',
        'Puja & sweets', ['#7c2d12', '#ef4444'], '#fca5a5', 'bonfire'),
      day('2027-03-22', 'Holi • Rangwali Holi', 'Rangwali Holi! 🎨',
        'Rang barse! Gulal, gujiya, thandai — Holi ka maza, 15 minute me.',
        'Holi Loot Deals — aaj ke best prices', ['#be185d', '#f59e0b'], '#fcd34d', 'petals'),
      day('2027-03-23', 'Holi • Aakhri Mauka', 'Holi offers jaari hain 🎨',
        'Rang khelna abhi baaki — snacks aur thandai abhi bhi 15 minute me.',
        'Festive offers — aaj aakhri din', ['#9d174d', '#f472b6'], '#fbcfe8', 'petals')
    ]},
    { id: 'navratri-2027', name: 'Chaitra Navratri', days: navratriDays('2027-04-07') }
  ];

  var DEFAULT_THEME = day('', 'OK Mart', 'Fresh grocery, 15 minute me 🛒',
    'Milk, sabzi, snacks aur daily essentials — Jantanagar, Satellite, Prahlad Nagar me superfast delivery.',
    'Daily Loot Deals — roz naye offers', ['#006d37', '#84c225'], '#d9f99d', 'dots');

  // ---------- Sardar Patel Jayanti takeover (2026-10-31, single day) ----------
  // Style reference: the screenshot layout (background section + hero + cards +
  // strip + must-haves row). Content is Patel Jayanti ONLY.
  // Real OKmart catalog data, verified from live Firestore 2026-10-31.
  var PJ_CARDS = [
    { t1: 'Desi', t2: 'Essentials', href: '/categories/grocery.html', offer: 'STARTING FROM ₹18',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1136-1280,pr-true,f-auto,q-40,dpr-2/cms/product_variant/7e697dab-8c88-45ec-9525-48eb8af55883/Mapro-Mixed-Fruit-Jam-Tub.jpeg' },
    { t1: 'Dairy &', t2: 'Fresh', href: '/categories/dairy.html', offer: 'STARTING FROM ₹9',
      img: 'https://blogger.googleusercontent.com/img/a/AVvXsEgSisSLO9xv6Pd6jlm025DKbPkWu7HX0ukqEGACObFkw58HEaykgqWHRfHfr2X3TkjM-mChg0L3hw2xWltmsh66mGkenMLMp7GfWGhXdgCY3YpT8dKvVmj_8E2jVOeUNVvFAvUqV4T5ayyP4V04tyY2ZabnFb9Zp-9dbXDtcOnab6BJ3uVlwOyi_Gmf' },
    { t1: 'Snacks &', t2: 'Namkeen', href: '/categories/snacks.html', offer: 'STARTING FROM ₹14',
      img: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_600/NI_CATALOG/IMAGES/CIW/2026/4/13/05fcf9fd-d140-4197-8ede-8c9601ea13a7_81_1.png' },
    { t1: 'Cold Drinks', t2: '& Juices', href: '/categories/beverages.html', offer: 'STARTING FROM ₹33',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1200-1200,pr-true,f-auto,q-40,dpr-2/cms/product_variant/c413f283-6b31-48ec-9bdd-b7efbe9a69d5/Thums-Up-Soft-Drink-Carbonated-Beverage.jpeg' }
  ];
  var PJ_MUST = [
    { name: 'Cadbury Dairy Milk Chocolate Bar', price: 19, mrp: 20, id: 'jqucrf7S94kZmorAgsPt',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1100-1100,pr-true,f-auto,q-40,dpr-2/cms/product_variant/22fc81bf-16dd-47ec-bad9-d6a24e113a02/Cadbury-Dairy-Milk-Chocolate-Bar-Smooth-Rich-Milk.jpeg' },
    { name: 'Cadbury Oreo Chocolate Biscuits', price: 10, mrp: 0, id: 'bWjasUxubo5kG2AP9Lq8',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1100-1100,pr-true,f-auto,q-40,dpr-2/cms/product_variant/0164562b-e446-4530-9707-0253fada85b1/Cadbury-Oreo-Chocolate-Flavour-Creme-Sandwich-Biscuits.jpeg' },
    { name: 'Maggi 2-Minute Masala Noodles', price: 14, mrp: 15, id: '2AC2f9RN1w3I2tPg6AMo',
      img: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_600/NI_CATALOG/IMAGES/CIW/2026/4/13/05fcf9fd-d140-4197-8ede-8c9601ea13a7_81_1.png' },
    { name: 'Kwality Wall\'s Cornetto Double Chocolate', price: 34, mrp: 35, id: 'f1isTNkHKseAgatN24SE',
      img: 'https://www.bbassets.com/media/uploads/p/l/40062731_7-kwality-walls-cornetto-double-chocolate-frozen-dessert.jpg' },
    { name: 'Thums Up Soft Drink 1.25L', price: 65, mrp: 70, id: '0d7LO0t1AqBDARTSWNNc',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1200-1200,pr-true,f-auto,q-40,dpr-2/cms/product_variant/c413f283-6b31-48ec-9bdd-b7efbe9a69d5/Thums-Up-Soft-Drink-Carbonated-Beverage.jpeg' },
    { name: 'Frooti Mango Fruit Juice 600ml', price: 33, mrp: 35, id: 'p9bZKSB321udK7g3HRHc',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-2500-2500,pr-true,f-auto,q-40,dpr-2/cms/product_variant/a4d6db79-d36f-4930-8de1-e9e9f5b4b846/Frooti-Mango-Fruit-Juice-Ready-to-Drink-Beverage.jpeg' }
  ];
  var PJ_DAYS = [
    day('2026-10-31', 'Rashtriya Ekta Diwas', 'SARDAR',
      'Bharat ke Loh Purush ki 151st jayanti — ekta ka sandesh, har ghar tak.',
      'Ek Bharat, Shreshtha Bharat', ['#ff9933', '#138808'], '#1e3a8a', 'dots')
  ];
  PJ_DAYS.forEach(function (d) { d.takeover = true; });
  FESTIVALS.unshift({ id: 'patel-jayanti-2026', name: 'Sardar Patel Jayanti', days: PJ_DAYS });

  function findToday() {
    var today = localKey(new Date());
    for (var i = 0; i < FESTIVALS.length; i++) {
      var days = FESTIVALS[i].days;
      for (var j = 0; j < days.length; j++) {
        if (days[j].date === today) return { festival: FESTIVALS[i], theme: days[j] };
      }
    }
    return { festival: null, theme: DEFAULT_THEME };
  }

  // ---------- decorative SVG art per animation ----------
  var ART = {
    diyas: '<svg viewBox="0 0 120 90" width="110" height="84"><ellipse cx="60" cy="68" rx="46" ry="12" fill="#b45309"/><path d="M20 62 Q60 88 100 62 Q60 74 20 62" fill="#92400e"/><ellipse cx="60" cy="52" rx="10" ry="16" fill="#fbbf24"/><ellipse cx="60" cy="56" rx="5" ry="9" fill="#f97316"/></svg>',
    sparkles: '<svg viewBox="0 0 120 90" width="110" height="84"><text x="60" y="62" font-size="62" text-anchor="middle">🪔</text></svg>',
    petals: '<svg viewBox="0 0 120 90" width="110" height="84"><circle cx="40" cy="45" r="16" fill="#f472b6"/><circle cx="75" cy="35" r="13" fill="#facc15"/><circle cx="70" cy="62" r="14" fill="#38bdf8"/></svg>',
    kites: '<svg viewBox="0 0 120 90" width="110" height="84"><polygon points="60,8 88,42 60,76 32,42" fill="#f59e0b" stroke="#b45309" stroke-width="2"/><polyline points="60,76 52,88 66,84" fill="none" stroke="#7c2d12" stroke-width="2"/></svg>',
    moon: '<svg viewBox="0 0 120 90" width="110" height="84"><path d="M78 12 A42 42 0 1 0 78 78 A34 34 0 1 1 78 12" fill="#fde68a"/></svg>',
    bonfire: '<svg viewBox="0 0 120 90" width="110" height="84"><ellipse cx="60" cy="52" rx="14" ry="22" fill="#f97316"/><ellipse cx="60" cy="60" rx="8" ry="12" fill="#facc15"/><rect x="30" y="68" width="60" height="6" rx="3" fill="#78350f"/></svg>',
    dots: '<svg viewBox="0 0 120 90" width="110" height="84"><circle cx="60" cy="45" r="26" fill="#84c225"/><text x="60" y="56" font-size="30" text-anchor="middle">🛒</text></svg>'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  // ---------- canvas particles ----------
  function startCanvas(canvas, anim) {
    if (!canvas || !canvas.getContext) return;
    var reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, parts = [];
    var COLORS = {
      diyas: ['#fbbf24', '#f97316', '#fde68a'],
      sparkles: ['#fde047', '#fbbf24', '#ffffff'],
      petals: ['#f472b6', '#facc15', '#38bdf8', '#fb923c'],
      kites: ['#f59e0b', '#38bdf8', '#f472b6', '#4ade80'],
      moon: ['#fef3c7', '#e0e7ff', '#ffffff'],
      bonfire: ['#f97316', '#ef4444', '#facc15'],
      dots: ['#d9f99d', '#ffffff', '#a3e635']
    }[anim] || ['#ffffff'];
    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(50, r.width); H = Math.max(50, r.height);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(init) {
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : H + 10,
        s: 2 + Math.random() * 5,
        v: 0.3 + Math.random() * 0.9,
        ph: Math.random() * Math.PI * 2,
        c: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    }
    function reset() {
      parts = [];
      var n = Math.min(38, Math.max(14, Math.floor(W / 28)));
      for (var i = 0; i < n; i++) parts.push(spawn(true));
    }
    resize(); reset();
    window.addEventListener('resize', function () { resize(); reset(); });
    if (reduced) { draw(0); return; }
    var raf = null;
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (anim === 'petals' || anim === 'kites') {
          p.y += p.v * 0.7; p.x += Math.sin((t / 900) + p.ph) * 0.6;
        } else {
          p.y -= p.v; p.x += Math.sin((t / 1200) + p.ph) * 0.4;
        }
        if (p.y < -12 || p.y > H + 12) parts[i] = spawn(false);
        var a = 0.35 + 0.4 * Math.abs(Math.sin((t / 500) + p.ph));
        ctx.globalAlpha = a; ctx.fillStyle = p.c;
        if (anim === 'sparkles') {
          ctx.fillRect(p.x - p.s, p.y, p.s * 2, 1.4);
          ctx.fillRect(p.x, p.y - p.s, 1.4, p.s * 2);
        } else if (anim === 'kites') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(0.6);
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); ctx.restore();
        } else if (anim === 'petals') {
          ctx.beginPath(); ctx.ellipse(p.x, p.y, p.s, p.s * 0.55,
            Math.sin((t / 700) + p.ph), 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
      else if (!document.hidden && !raf) { raf = requestAnimationFrame(draw); }
    });
  }

  // ---------- render ----------
  function renderBanner(theme, festivalName) {
    var slot = document.getElementById('festiveBanner');
    if (!slot) return;
    var primary = theme.cta || { text: 'Order Now 🛒', href: '/categories.html' };
    slot.innerHTML =
      '<div class="festive-banner" style="background:linear-gradient(135deg,' +
      theme.gradient[0] + ',' + theme.gradient[1] + ')">' +
      '<canvas class="festive-canvas" aria-hidden="true"></canvas>' +
      '<div class="festive-content">' +
      '<span class="festive-tag" style="background:' + theme.accent + '">' + esc(theme.tag) + '</span>' +
      '<h2 class="festive-title">' + esc(theme.title) + '</h2>' +
      '<p class="festive-sub">' + esc(theme.subtitle) + '</p>' +
      (theme.offer ? '<span class="festive-offer">' + esc(theme.offer) + '</span>' : '') +
      '<div class="festive-ctas">' +
      '<a class="festive-cta-primary" href="' + esc(primary.href) + '">' + esc(primary.text) + '</a>' +
      '<a class="festive-cta-ghost" href="/deals.html">Grab Loot Deal ⚡</a>' +
      '</div></div>' +
      '<div class="festive-art">' + (ART[theme.anim] || ART.dots) + '</div>' +
      '</div>';
    startCanvas(slot.querySelector('.festive-canvas'), theme.anim);
    var label = festivalName ? (festivalName + ' • ' + theme.date + ' — ' + theme.tag)
      : ('Default brand theme');
    console.log('[OKMart Festive] Active Theme: ' + label + ' | Animation: ' + theme.anim);
  }

  // ---------- Patel Jayanti takeover renderer (tricolor background section) ----------
  function pjChakra(size, color, opacity) {
    var spokes = '';
    for (var i = 0; i < 24; i++) {
      spokes += '<line x1="50" y1="4" x2="50" y2="96" transform="rotate(' + (i * 15) + ' 50 50)"/>';
    }
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" opacity="' + opacity + '" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="46" fill="none" stroke="' + color + '" stroke-width="3"/>' +
      '<g stroke="' + color + '" stroke-width="2">' + spokes + '</g>' +
      '<circle cx="50" cy="50" r="8" fill="' + color + '"/></svg>';
  }
  function renderPatelTakeover(theme, festivalName) {
    var slot = document.getElementById('festiveBanner');
    if (!slot) return;
    var cards = PJ_CARDS.map(function (c) {
      return '<a class="pj-card" href="' + esc(c.href) + '">' +
        '<span class="pj-card-t">' + esc(c.t1) + '<br>' + esc(c.t2) + '</span>' +
        '<img class="pj-card-img" src="' + esc(c.img) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
        '<span class="pj-card-offer">' + esc(c.offer) + '</span></a>';
    }).join('');
    var prods = PJ_MUST.map(function (p) {
      var mrp = (p.mrp && p.mrp > p.price) ? '<s>₹' + p.mrp + '</s>' : '';
      return '<a class="pj-prod" href="/product.html?id=' + esc(p.id) + '">' +
        '<img src="' + esc(p.img) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
        '<span class="pj-prod-name">' + esc(p.name) + '</span>' +
        '<span class="pj-prod-price">₹' + p.price + ' ' + mrp + '</span></a>';
    }).join('');
    slot.innerHTML =
      '<section class="pj-wrap">' +
      '<div class="pj-bg">' +
      '<div class="pj-chakra-bg">' + pjChakra(320, '#1e3a8a', '0.10') + '</div>' +
      '<div class="pj-chakra">' + pjChakra(54, '#1e3a8a', '1') + '</div>' +
      '<div class="pj-hero">' +
      '<div class="pj-kicker">🇮🇳 Rashtriya Ekta Diwas • 31 October</div>' +
      '<h2 class="pj-title">' + esc(theme.title || 'SARDAR') + '</h2>' +
      '<div class="pj-name">VALLABHBHAI PATEL</div>' +
      '<div class="pj-jayanti">J A Y A N T I</div>' +
      '<p class="pj-sub">' + esc(theme.subtitle || '') + '</p>' +
      '<a class="pj-cta" href="/deals.html">Shop Ekta Deals →</a>' +
      '</div>' +
      '<div class="pj-cards">' + cards + '</div>' +
      '<a class="pj-strip" href="/deals.html">' +
      '<span class="pj-strip-flag">🇮🇳</span>' +
      '<span class="pj-strip-text"><b>' + esc(theme.offer || 'Ek Bharat, Shreshtha Bharat') + '</b>' +
      '<small>Rashtriya Ekta Diwas • Aaj ke loot deals</small></span>' +
      '<span class="pj-strip-arrow">›</span></a>' +
      '</div>' +
      '<div class="pj-must"><h3>Aaj ke Must-Haves</h3>' +
      '<div class="pj-prods">' + prods + '</div></div>' +
      '</section>';
    console.log('[OKMart Festive] Active Theme: ' + (festivalName || 'Sardar Patel Jayanti') + ' • ' + theme.date + ' — ' + theme.tag + ' | Takeover');
  }

  function render(theme, festivalName) {
    if (theme.takeover) { renderPatelTakeover(theme, festivalName); return; }
    renderBanner(theme, festivalName);
  }

  // ---------- admin override (Firestore settings/festive) ----------
  function applyOverride(found) {
    var theme = found.theme;
    try {
      if (typeof firebase === 'undefined' || !firebase.firestore) { render(theme, found.festival && found.festival.name); return; }
      firebase.firestore().collection('settings').doc('festive').get()
        .then(function (doc) {
          if (!doc.exists) { render(theme, found.festival && found.festival.name); return; }
          var o = doc.data() || {};
          if (o.active === false) {
            var slot = document.getElementById('festiveBanner');
            if (slot) slot.style.display = 'none';
            console.log('[OKMart Festive] Banner hidden by admin override.');
            return;
          }
          if (o.headline) theme.title = o.headline;
          if (o.subtext) theme.subtitle = o.subtext;
          if (o.offer) theme.offer = o.offer;
          if (o.ctaText || o.ctaLink) {
            theme.cta = { text: o.ctaText || 'Order Now 🛒', href: o.ctaLink || '/categories.html' };
          }
          render(theme, found.festival && found.festival.name);
        })
        .catch(function () { render(theme, found.festival && found.festival.name); });
    } catch (e) { render(theme, found.festival && found.festival.name); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyOverride(findToday());
  });
})();
