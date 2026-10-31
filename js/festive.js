// ===== OKMART FESTIVE SECTION ENGINE =====
// Hindu festivals + jayantis ONLY (per mandate). Date-driven: the section
// changes automatically on every page load — no cron or rebuild needed.
// EVERY day renders a rich background section (hero + cards + strip +
// must-haves): festival sections start 7 days before the main day;
// common days rotate 7 common themes, so every day is fresh.
// Admin override: Firestore doc settings/festive can replace the headline /
// subtext / offer / CTA of the current day, or hide the section (active:false).
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

  // ---------- countdown helper: N-day lead + main + optional phase-out ----------
  function countdown(mainKey, o) {
    var parts = mainKey.split('-').map(Number);
    var main = new Date(parts[0], parts[1] - 1, parts[2]);
    var out = [];
    var lead = (o.leadCount == null ? 7 : o.leadCount);
    for (var n = lead; n >= 1; n--) {
      var d = new Date(main.getFullYear(), main.getMonth(), main.getDate() - n);
      out.push(day(localKey(d), o.name + ' • Countdown',
        o.name + ' — bas ' + n + ' din baaki',
        o.leadSub, o.offer, o.gradient, o.accent, o.anim));
    }
    out.push(day(mainKey, o.name, o.mainTitle, o.mainSub, o.offer, o.gradient, o.accent, o.anim));
    if (o.phaseout) {
      var p = new Date(main.getFullYear(), main.getMonth(), main.getDate() + 1);
      out.push(day(localKey(p), o.name + ' • Aakhri Mauka', o.name + ' offers jaari hain',
        o.phaseoutSub || 'Festive offers — aaj aakhri din, 15 minute me delivery.',
        o.offer, o.gradient, o.accent, o.anim));
    }
    return out;
  }

  function dayOfYear(d) {
    var start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }

  // ---------- shared rich-section data (real catalog, verified 2026-10-31) ----------
  var FR_CARDS = [
    { t1: 'Desi', t2: 'Essentials', href: '/categories/grocery.html', offer: 'STARTING FROM ₹18',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1136-1280,pr-true,f-auto,q-40,dpr-2/cms/product_variant/7e697dab-8c88-45ec-9525-48eb8af55883/Mapro-Mixed-Fruit-Jam-Tub.jpeg' },
    { t1: 'Dairy &', t2: 'Fresh', href: '/categories/dairy.html', offer: 'STARTING FROM ₹9',
      img: 'https://blogger.googleusercontent.com/img/a/AVvXsEgSisSLO9xv6Pd6jlm025DKbPkWu7HX0ukqEGACObFkw58HEaykgqWHRfHfr2X3TkjM-mChg0L3hw2xWltmsh66mGkenMLMp7GfWGhXdgCY3YpT8dKvVmj_8E2jVOeUNVvFAvUqV4T5ayyP4V04tyY2ZabnFb9Zp-9dbXDtcOnab6BJ3uVlwOyi_Gmf' },
    { t1: 'Snacks &', t2: 'Namkeen', href: '/categories/snacks.html', offer: 'STARTING FROM ₹14',
      img: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_600/NI_CATALOG/IMAGES/CIW/2026/4/13/05fcf9fd-d140-4197-8ede-8c9601ea13a7_81_1.png' },
    { t1: 'Cold Drinks', t2: '& Juices', href: '/categories/beverages.html', offer: 'STARTING FROM ₹33',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1200-1200,pr-true,f-auto,q-40,dpr-2/cms/product_variant/c413f283-6b31-48ec-9bdd-b7efbe9a69d5/Thums-Up-Soft-Drink-Carbonated-Beverage.jpeg' }
  ];
  // Rotating must-haves pool: 6 consecutive items from dayOfYear offset, so the
  // row is fresh every day. All prices/ids/images verified from live Firestore.
  var FR_POOL = [
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
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-2500-2500,pr-true,f-auto,q-40,dpr-2/cms/product_variant/a4d6db79-d36f-4930-8de1-e9e9f5b4b846/Frooti-Mango-Fruit-Juice-Ready-to-Drink-Beverage.jpeg' },
    { name: 'Mapro Mixed Fruit Jam Tub', price: 18, mrp: 20, id: 'dmKEZBUumJItSzm9HKAg',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1136-1280,pr-true,f-auto,q-40,dpr-2/cms/product_variant/7e697dab-8c88-45ec-9525-48eb8af55883/Mapro-Mixed-Fruit-Jam-Tub.jpeg' },
    { name: 'Amul Meetha Dahi', price: 9, mrp: 10, id: '9NJPRReyC7NRApMgP3fJ',
      img: 'https://blogger.googleusercontent.com/img/a/AVvXsEgSisSLO9xv6Pd6jlm025DKbPkWu7HX0ukqEGACObFkw58HEaykgqWHRfHfr2X3TkjM-mChg0L3hw2xWltmsh66mGkenMLMp7GfWGhXdgCY3YpT8dKvVmj_8E2jVOeUNVvFAvUqV4T5ayyP4V04tyY2ZabnFb9Zp-9dbXDtcOnab6BJ3uVlwOyi_Gmf' },
    { name: 'Parle Krackjack Sweet and Salty Biscuits', price: 35, mrp: 40, id: '3hqCyUqzLb1Ag8ewdo1G',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1000-1000,pr-true,f-auto,q-40,dpr-2/cms/product_variant/2740d3da-f849-4fdb-a111-0fdd3ccba88c/Parle-Krackjack-Sweet-and-Salty-Biscuits.jpeg' },
    { name: 'Parle Monaco Classic Salty Biscuits', price: 30, mrp: 35, id: 'eEhbLRaRqfKj6kt7NCA0',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1200-1200,pr-true,f-auto,q-40,dpr-2/cms/product_variant/21ffbc7d-1660-4349-8bc6-2407f680c6b0/Parle-Monaco-Classic-Salty-Biscuits.jpeg' },
    { name: 'Yippee Magic Masala Noodles| 4 in 1', price: 55, mrp: 60, id: 'f4RiACBZMBgqNHFyfAPn',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1500-1500,pr-true,f-auto,q-40,dpr-2/cms/product_variant/efd17bcb-ecf7-4ae7-bc2b-9538ce12caa1/Yippee-Magic-Masala-Noodles-4-in-1.jpeg' },
    { name: 'Maaza Mango Fruit Juice 600ml', price: 33, mrp: 35, id: 'oIWpNTESJxsYweLlriIb',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1200-1200,pr-true,f-auto,q-40,dpr-2/cms/product_variant/d5072a7f-924a-46e0-83ed-684612504e2b/Maaza-Mango-Fruit-Juice-Ready-to-Drink-Beverage.jpeg' },
    { name: 'Amul Vanilla Ice Cream Sandwich', price: 30, mrp: 30, id: '5mYOADwcNYFgw1NkHRp7',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-2400-2400,pr-true,f-auto,q-40,dpr-2/cms/product_variant/af6085b6-acbe-4000-878c-ec8296cb33d1/Amul-Vanilla-Ice-Cream-Sandwich.jpeg' },
    { name: 'Vadilal Fun-Ta-Stick | Ice Cream', price: 39, mrp: 40, id: 'ckElRsDtKUzGw03pSq5p',
      img: 'https://cdn1.jiomartjcp.com/v2/catalog-cloud/jiomar/t.resize(w:300)/images/othe/egurhk/.j/pg/49430357315.jpg.3dee8094f6.jpg' },
    { name: 'Hocco Bix Chocolate Chips Ice Cream Cake Sandwich', price: 69, mrp: 70, id: 'iIF40aNf0UVDmE3fapRA',
      img: 'https://www.bbassets.com/media/uploads/p/l/40339921_1-hocco-bix-chocolate-chips-ice-cream-cake-sandwich.jpg' },
    { name: 'Frooti Mango Fruit Juice 1.2L', price: 65, mrp: 70, id: 'd33BiC1n535SUl299M6k',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1200-1200,pr-true,f-auto,q-40,dpr-2/cms/product_variant/7d519109-be1f-4afc-9fd9-59b123236ac1/Frooti-Mango-Fruit-Juice-Ready-to-Drink-Beverage.jpeg' },
    { name: 'Maaza Mango Fruit Juice 1.2L', price: 65, mrp: 70, id: 'k7kWtLHDriaTbtC8ijUf',
      img: 'https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1200-1200,pr-true,f-auto,q-40,dpr-2/cms/product_variant/491f3c9f-bd4a-43e5-8452-0db0810599cd/Maaza-Mango-Fruit-Juice-Ready-to-Drink-Beverage.jpeg' }
  ];

  // ---------- common days: 7 rotating themes, one per day (har roj ek naya) ----------
  var COMMON_THEMES = [
    day('', 'OK Mart • Fresh & Fast', 'Fresh grocery, 15 minute me 🛒',
      'Milk, sabzi, snacks aur daily essentials — Jantanagar, Satellite, Prahlad Nagar me superfast delivery.',
      'Daily Loot Deals — roz naye offers', ['#006d37', '#84c225'], '#d9f99d', 'dots'),
    day('', 'OK Mart • Loot Deals Day', 'Aaj ke Loot Deals ⚡',
      'Roz naye deals, best prices — aaj ka deal haath se na jaane do.',
      'Up to 80% OFF tak ke deals', ['#7c2d12', '#f59e0b'], '#fbbf24', 'sparkles'),
    day('', 'OK Mart • Snacks Time', 'Snacks Time! 🍿',
      'Chips, biscuits, chocolates aur namkeen — shaam ki bhookh ka solution, 15 minute me.',
      'Snacks starting ₹10', ['#4c0519', '#f472b6'], '#fbcfe8', 'petals'),
    day('', 'OK Mart • Dairy Fresh', 'Dairy & Fresh 🥛',
      'Doodh, dahi, paneer aur ice cream — fresh, har roz.',
      'Dairy starting ₹9', ['#0c4a6e', '#38bdf8'], '#bae6fd', 'dots'),
    day('', 'OK Mart • Kitchen Stock-up', 'Kitchen Stock-up 🛒',
      'Atta, dal, chawal, masale aur oil — mahine bhar ka saaman ek order me.',
      'Grocery starting ₹18', ['#78350f', '#facc15'], '#fde047', 'diyas'),
    day('', 'OK Mart • Thanda & Taza', 'Thanda & Taza 🥤',
      'Cold drinks, juices aur shakes — 15 minute me, chilled.',
      'Drinks starting ₹33', ['#134e4a', '#2dd4bf'], '#99f6e4', 'dots'),
    day('', 'OK Mart • Weekend Treat', 'Weekend Treat 🎉',
      'Family ke liye kuch special — sweets, snacks aur desserts, sab kuch ek jagah.',
      'Treats starting ₹10', ['#3b0764', '#a855f7'], '#d8b4fe', 'sparkles')
  ];

  function commonThemeFor(d) {
    var t = COMMON_THEMES[dayOfYear(d) % COMMON_THEMES.length];
    return day(localKey(d), t.tag, t.title, t.subtitle, t.offer, t.gradient, t.accent, t.anim);
  }

  function tagText(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length !== 6) return '#111827';
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#111827' : '#ffffff';
  }

  // ---------- festival calendar ----------
  // ---------- festival calendar ----------
  // Rule (2026-10-31): every festival runs a rich background section starting
  // 7 days before its main day. 2027 dates per published panchang lists (local
  // panchang may shift a lunar date by ±1 day — correct on notice). Ram Navami
  // (15 Apr) and Dussehra (9 Oct) have no separate countdown because their
  // preceding week is Navratri itself. Array order = priority on overlaps.
  var FESTIVALS = [
    { id: 'diwali-2026', name: 'Diwali', days: [
      day('2026-11-01', 'Diwali • Countdown', 'Diwali — bas 7 din baaki! 🪔',
        'Diwali ki taiyari — diye, lights, sweets aur dry fruits, sab kuch 15 minute me.',
        'Festive sweets & munchies par best prices', ['#7c2d12', '#f59e0b'], '#fbbf24', 'diyas'),
      day('2026-11-02', 'Diwali • Countdown', 'Diwali — bas 6 din baaki! 🪔',
        'Diwali ki taiyari — diye, lights, sweets aur dry fruits, sab kuch 15 minute me.',
        'Festive sweets & munchies par best prices', ['#7c2d12', '#f59e0b'], '#fbbf24', 'diyas'),
      day('2026-11-03', 'Diwali • Countdown', 'Diwali — bas 5 din baaki! 🪔',
        'Diwali ki taiyari — diye, lights, sweets aur dry fruits, sab kuch 15 minute me.',
        'Festive sweets & munchies par best prices', ['#7c2d12', '#f59e0b'], '#fbbf24', 'diyas'),
      day('2026-11-04', 'Diwali • Countdown', 'Diwali — bas 4 din baaki! 🪔',
        'Diwali ki taiyari — diye, lights, sweets aur dry fruits, sab kuch 15 minute me.',
        'Festive sweets & munchies par best prices', ['#7c2d12', '#f59e0b'], '#fbbf24', 'diyas'),
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
      day('2027-01-07', 'Uttarayan • Countdown', 'Uttarayan — bas 7 din baaki! 🪁',
        'Uttarayan ki taiyari — patang, manja aur til-gud, sab kuch 15 minute me.',
        'Kite-flying essentials', ['#0c4a6e', '#fb923c'], '#fdba74', 'kites'),
      day('2027-01-08', 'Uttarayan • Countdown', 'Uttarayan — bas 6 din baaki! 🪁',
        'Uttarayan ki taiyari — patang, manja aur til-gud, sab kuch 15 minute me.',
        'Kite-flying essentials', ['#0c4a6e', '#fb923c'], '#fdba74', 'kites'),
      day('2027-01-09', 'Uttarayan • Countdown', 'Uttarayan — bas 5 din baaki! 🪁',
        'Uttarayan ki taiyari — patang, manja aur til-gud, sab kuch 15 minute me.',
        'Kite-flying essentials', ['#0c4a6e', '#fb923c'], '#fdba74', 'kites'),
      day('2027-01-10', 'Uttarayan • Countdown', 'Uttarayan — bas 4 din baaki! 🪁',
        'Uttarayan ki taiyari — patang, manja aur til-gud, sab kuch 15 minute me.',
        'Kite-flying essentials', ['#0c4a6e', '#fb923c'], '#fdba74', 'kites'),
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
      day('2027-02-27', 'Shivaratri • Countdown', 'Maha Shivaratri — bas 7 din baaki 🔱',
        'Maha Shivaratri ki taiyari — doodh, dahi, phal aur puja saaman.',
        'Vrat essentials', ['#1e1b4b', '#6366f1'], '#a5b4fc', 'moon'),
      day('2027-02-28', 'Shivaratri • Countdown', 'Maha Shivaratri — bas 6 din baaki 🔱',
        'Maha Shivaratri ki taiyari — doodh, dahi, phal aur puja saaman.',
        'Vrat essentials', ['#1e1b4b', '#6366f1'], '#a5b4fc', 'moon'),
      day('2027-03-01', 'Shivaratri • Countdown', 'Maha Shivaratri — bas 5 din baaki 🔱',
        'Maha Shivaratri ki taiyari — doodh, dahi, phal aur puja saaman.',
        'Vrat essentials', ['#1e1b4b', '#6366f1'], '#a5b4fc', 'moon'),
      day('2027-03-02', 'Shivaratri • Countdown', 'Maha Shivaratri — bas 4 din baaki 🔱',
        'Maha Shivaratri ki taiyari — doodh, dahi, phal aur puja saaman.',
        'Vrat essentials', ['#1e1b4b', '#6366f1'], '#a5b4fc', 'moon'),
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
      day('2027-03-15', 'Holi • Countdown', 'Holi — bas 7 din baaki! 🎨',
        'Holi ki taiyari — rang, gulal, gujiya aur thandai, sab kuch 15 minute me.',
        'Holi colours & snacks', ['#831843', '#f472b6'], '#fbcfe8', 'petals'),
      day('2027-03-16', 'Holi • Countdown', 'Holi — bas 6 din baaki! 🎨',
        'Holi ki taiyari — rang, gulal, gujiya aur thandai, sab kuch 15 minute me.',
        'Holi colours & snacks', ['#831843', '#f472b6'], '#fbcfe8', 'petals'),
      day('2027-03-17', 'Holi • Countdown', 'Holi — bas 5 din baaki! 🎨',
        'Holi ki taiyari — rang, gulal, gujiya aur thandai, sab kuch 15 minute me.',
        'Holi colours & snacks', ['#831843', '#f472b6'], '#fbcfe8', 'petals'),
      day('2027-03-18', 'Holi • Countdown', 'Holi — bas 4 din baaki! 🎨',
        'Holi ki taiyari — rang, gulal, gujiya aur thandai, sab kuch 15 minute me.',
        'Holi colours & snacks', ['#831843', '#f472b6'], '#fbcfe8', 'petals'),
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
    { id: 'ram-navami-2027', name: 'Ram Navami', days: [
      day('2027-04-15', 'Ram Navami', 'Ram Navami 🙏',
        'Prabhu Shri Ram ka janmotsav — puja saaman aur meetha, 15 minute me.',
        'Ram Navami specials', ['#7c2d12', '#f59e0b'], '#fbbf24', 'diyas')
    ]},
    { id: 'navratri-2027', name: 'Chaitra Navratri', days: [
      day('2027-03-31', 'Navratri • Countdown', 'Chaitra Navratri — bas 7 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-04-01', 'Navratri • Countdown', 'Chaitra Navratri — bas 6 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-04-02', 'Navratri • Countdown', 'Chaitra Navratri — bas 5 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-04-03', 'Navratri • Countdown', 'Chaitra Navratri — bas 4 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-04-04', 'Navratri • Countdown', 'Chaitra Navratri — bas 3 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-04-05', 'Navratri • Countdown', 'Chaitra Navratri — bas 2 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-04-06', 'Navratri • Countdown', 'Chaitra Navratri — bas 1 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas')
    ].concat(navratriDays('2027-04-07')) },
    { id: 'hanuman-2027', name: 'Hanuman Jayanti', days: countdown('2027-04-20', {
      name: 'Hanuman Jayanti', leadCount: 4,
      leadSub: 'Hanuman Jayanti ki taiyari — puja saaman, meetha aur phool.',
      mainTitle: 'Hanuman Jayanti 🙏',
      mainSub: 'Bajrangbali ka janmotsav — puja saaman aur meetha, 15 minute me.',
      offer: 'Hanuman Jayanti specials',
      gradient: ['#7c2d12', '#f97316'], accent: '#fdba74', anim: 'diyas',
      phaseout: true, phaseoutSub: 'Prasad aur puja saaman abhi bhi 15 minute me.' }) },
    { id: 'rath-2027', name: 'Rath Yatra', days: countdown('2027-07-05', {
      name: 'Rath Yatra',
      leadSub: 'Rath Yatra ki taiyari — prasad aur festive saaman.',
      mainTitle: 'Rath Yatra 🛕',
      mainSub: 'Jagannath ji ki yatra — prasad aur festive saaman, 15 minute me.',
      offer: 'Festive specials',
      gradient: ['#7c2d12', '#f59e0b'], accent: '#fbbf24', anim: 'diyas',
      phaseout: true }) },
    { id: 'raksha-2027', name: 'Raksha Bandhan', days: countdown('2027-08-17', {
      name: 'Raksha Bandhan',
      leadSub: 'Rakhi, gifts aur meetha — behen-bhai ke pyaar ki taiyari.',
      mainTitle: 'Happy Raksha Bandhan! 🪢',
      mainSub: 'Rakhi, meetha aur gifts — bhai-behen ke pyaar ka din, 15 minute me.',
      offer: 'Rakhis, sweets & gifts',
      gradient: ['#831843', '#f472b6'], accent: '#fbcfe8', anim: 'sparkles',
      phaseout: false }) },
    { id: 'janmashtami-2027', name: 'Janmashtami', days: countdown('2027-08-25', {
      name: 'Janmashtami',
      leadSub: 'Janmashtami ki taiyari — doodh, dahi, makhan aur meetha.',
      mainTitle: 'Shri Krishna Janmashtami 🦚',
      mainSub: 'Makhan, meetha aur puja saaman — Nand ke anand bhayo, 15 minute me.',
      offer: 'Janmashtami specials',
      gradient: ['#1e1b4b', '#7c3aed'], accent: '#c4b5fd', anim: 'moon',
      phaseout: true }) },
    { id: 'ganesh-2027', name: 'Ganesh Chaturthi', days: countdown('2027-09-04', {
      name: 'Ganesh Chaturthi',
      leadSub: 'Ganpati Bappa ki taiyari — modak, puja saaman aur phool.',
      mainTitle: 'Ganpati Bappa Morya! 🙏',
      mainSub: 'Modak, puja saaman aur meetha — Bappa ka swagat, 15 minute me.',
      offer: 'Modak & puja specials',
      gradient: ['#7c2d12', '#f97316'], accent: '#fdba74', anim: 'diyas',
      phaseout: false }).concat([
      day('2027-09-05', 'Ganesh Utsav • Day 2', 'Ganpati Utsav jaari 🙏',
        'Modak aur prasad — Bappa ke darshan, 15 minute me.',
        'Utsav specials', ['#7c2d12', '#f97316'], '#fdba74', 'diyas'),
      day('2027-09-06', 'Ganesh Utsav • Day 3', 'Ganpati Utsav jaari 🙏',
        'Modak aur prasad — Bappa ke darshan, 15 minute me.',
        'Utsav specials', ['#7c2d12', '#f97316'], '#fdba74', 'diyas'),
      day('2027-09-07', 'Ganesh Utsav • Day 4', 'Ganpati Utsav jaari 🙏',
        'Modak aur prasad — Bappa ke darshan, 15 minute me.',
        'Utsav specials', ['#7c2d12', '#f97316'], '#fdba74', 'diyas'),
      day('2027-09-08', 'Ganesh Utsav • Day 5', 'Ganpati Utsav jaari 🙏',
        'Modak aur prasad — Bappa ke darshan, 15 minute me.',
        'Utsav specials', ['#7c2d12', '#f97316'], '#fdba74', 'diyas'),
      day('2027-09-09', 'Ganesh Utsav • Day 6', 'Ganpati Utsav jaari 🙏',
        'Modak aur prasad — Bappa ke darshan, 15 minute me.',
        'Utsav specials', ['#7c2d12', '#f97316'], '#fdba74', 'diyas'),
      day('2027-09-10', 'Ganesh Utsav • Day 7', 'Ganpati Utsav jaari 🙏',
        'Modak aur prasad — Bappa ke darshan, 15 minute me.',
        'Utsav specials', ['#7c2d12', '#f97316'], '#fdba74', 'diyas'),
      day('2027-09-11', 'Ganesh Utsav • Day 8', 'Ganpati Utsav jaari 🙏',
        'Modak aur prasad — Bappa ke darshan, 15 minute me.',
        'Utsav specials', ['#7c2d12', '#f97316'], '#fdba74', 'diyas'),
      day('2027-09-12', 'Ganesh Utsav • Day 9', 'Ganpati Utsav jaari 🙏',
        'Modak aur prasad — Bappa ke darshan, 15 minute me.',
        'Utsav specials', ['#7c2d12', '#f97316'], '#fdba74', 'diyas'),
      day('2027-09-13', 'Ganesh Utsav • Day 10', 'Ganpati Utsav jaari 🙏',
        'Modak aur prasad — Bappa ke darshan, 15 minute me.',
        'Utsav specials', ['#7c2d12', '#f97316'], '#fdba74', 'diyas'),
      day('2027-09-14', 'Ganesh Utsav • Visarjan', 'Ganpati Bappa Morya, agle baras tu jaldi aa 🙏',
        'Visarjan ke baad bhi prasad aur meetha — 15 minute me.',
        'Utsav specials', ['#7c2d12', '#f97316'], '#fdba74', 'diyas')
    ]) },
    { id: 'sharad-navratri-2027', name: 'Sharad Navratri', days: [
      day('2027-09-23', 'Sharad Navratri • Countdown', 'Sharad Navratri — bas 7 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-09-24', 'Sharad Navratri • Countdown', 'Sharad Navratri — bas 6 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-09-25', 'Sharad Navratri • Countdown', 'Sharad Navratri — bas 5 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-09-26', 'Sharad Navratri • Countdown', 'Sharad Navratri — bas 4 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-09-27', 'Sharad Navratri • Countdown', 'Sharad Navratri — bas 3 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-09-28', 'Sharad Navratri • Countdown', 'Sharad Navratri — bas 2 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas'),
      day('2027-09-29', 'Sharad Navratri • Countdown', 'Sharad Navratri — bas 1 din baaki 🙏',
        'Navratri ki taiyari — vrat ka saaman, phal aur falhaar, 15 minute me.',
        'Navratri specials — falhaar & vrat essentials', ['#3b0764', '#a855f7'], '#d8b4fe', 'diyas')
    ].concat(navratriDays('2027-09-30')) },
    { id: 'dussehra-2027', name: 'Dussehra', days: [
      day('2027-10-09', 'Dussehra • Vijayadashami', 'Shubh Dussehra! 🏹',
        'Burai par achhai ki jeet — meetha aur festive saaman, 15 minute me.',
        'Dussehra specials', ['#7c2d12', '#ef4444'], '#fca5a5', 'sparkles'),
      day('2027-10-10', 'Dussehra • Aakhri Mauka', 'Dussehra offers jaari hain 🏹',
        'Meetha aur festive saaman abhi bhi 15 minute me.',
        'Festive offers — aaj aakhri din', ['#7c2d12', '#ef4444'], '#fca5a5', 'sparkles')
    ]},
    { id: 'karva-2027', name: 'Karva Chauth', days: countdown('2027-10-18', {
      name: 'Karva Chauth',
      leadSub: 'Karva Chauth ki taiyari — sargi, meetha aur puja saaman.',
      mainTitle: 'Karva Chauth 🌙',
      mainSub: 'Sargi, meetha aur puja saaman — 15 minute me.',
      offer: 'Sargi & sweets',
      gradient: ['#831843', '#f472b6'], accent: '#fbcfe8', anim: 'moon',
      phaseout: true }) },
    { id: 'diwali-2027', name: 'Diwali', days: countdown('2027-10-29', {
      name: 'Diwali',
      leadSub: 'Diwali ki taiyari — diye, lights, sweets aur dry fruits.',
      mainTitle: '🪔 Shubh Deepavali!',
      mainSub: 'Lakshmi Puja ki shubhkamnayein — dry fruits, sweets, ghee aur diye, 15 minute me.',
      offer: 'Diwali Loot Deals — aaj ke best prices',
      gradient: ['#4c0519', '#f59e0b'], accent: '#fbbf24', anim: 'sparkles',
      phaseout: true }) },
    { id: 'chhath-2027', name: 'Chhath Puja', days: countdown('2027-11-04', {
      name: 'Chhath Puja',
      leadSub: 'Chhath ki taiyari — thekua, phal aur puja saaman.',
      mainTitle: 'Chhath Puja 🌅',
      mainSub: 'Thekua, phal aur puja saaman — Chhathi Maiya ka prasad, 15 minute me.',
      offer: 'Chhath specials',
      gradient: ['#7c2d12', '#f59e0b'], accent: '#fbbf24', anim: 'diyas',
      phaseout: true }) }
  ];

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
    return { festival: null, theme: commonThemeFor(new Date()) };
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

  // ---------- rich section render (background + hero + cards + strip + must-haves) ----------
  function renderRich(theme, festivalName) {
    var slot = document.getElementById('festiveBanner');
    if (!slot) return;
    var isFestival = !!festivalName;
    var primary = theme.cta || { text: 'Order Now 🛒', href: '/categories.html' };
    var cards = FR_CARDS.map(function (c) {
      return '<a class="fr-card" href="' + esc(c.href) + '">' +
        '<span class="fr-card-t">' + esc(c.t1) + '<br>' + esc(c.t2) + '</span>' +
        '<img class="fr-card-img" src="' + esc(c.img) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
        '<span class="fr-card-offer">' + esc(c.offer) + '</span></a>';
    }).join('');
    var today = new Date();
    var start = dayOfYear(today) % FR_POOL.length;
    var prods = '';
    for (var i = 0; i < 6; i++) {
      var p = FR_POOL[(start + i) % FR_POOL.length];
      var mrp = (p.mrp && p.mrp > p.price) ? '<s>₹' + p.mrp + '</s>' : '';
      prods += '<a class="fr-prod" href="/product.html?id=' + esc(p.id) + '">' +
        '<img src="' + esc(p.img) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
        '<span class="fr-prod-name">' + esc(p.name) + '</span>' +
        '<span class="fr-prod-price">₹' + p.price + ' ' + mrp + '</span></a>';
    }
    var mustTitle = isFestival ? (festivalName + ' Must-Haves') : 'Aaj ke Must-Haves';
    slot.innerHTML =
      '<section class="fr-wrap">' +
      '<div class="fr-bg" style="background:linear-gradient(135deg,' + theme.gradient[0] + ',' + theme.gradient[1] + ')">' +
      '<canvas class="fr-canvas" aria-hidden="true"></canvas>' +
      '<div class="fr-art">' + (ART[theme.anim] || ART.dots) + '</div>' +
      '<div class="fr-hero">' +
      '<span class="fr-tag" style="background:' + theme.accent + ';color:' + tagText(theme.accent) + '">' + esc(theme.tag) + '</span>' +
      '<h2 class="fr-title">' + esc(theme.title) + '</h2>' +
      '<p class="fr-sub">' + esc(theme.subtitle) + '</p>' +
      (theme.offer ? '<span class="fr-offer">' + esc(theme.offer) + '</span>' : '') +
      '<div class="fr-ctas">' +
      '<a class="fr-cta-primary" href="' + esc(primary.href) + '">' + esc(primary.text) + '</a>' +
      '<a class="fr-cta-ghost" href="/deals.html">Grab Loot Deal ⚡</a>' +
      '</div></div>' +
      '<div class="fr-cards">' + cards + '</div>' +
      '<a class="fr-strip" href="/deals.html">' +
      '<span class="fr-strip-flag">⚡</span>' +
      '<span class="fr-strip-text"><b>Aaj ke Loot Deals</b>' +
      '<small>' + (isFestival ? esc(festivalName) + ' specials • ' : '') + 'Roz naye offers • 15 minute me</small></span>' +
      '<span class="fr-strip-arrow">›</span></a>' +
      '</div>' +
      '<div class="fr-must"><h3>' + esc(mustTitle) + '</h3>' +
      '<div class="fr-prods">' + prods + '</div></div>' +
      '</section>';
    startCanvas(slot.querySelector('.fr-canvas'), theme.anim);
    console.log('[OKMart Festive] Active Theme: ' + (isFestival ? (festivalName + ' • ' + theme.date + ' — ' + theme.tag) : ('Common • ' + theme.date + ' — ' + theme.tag)) + ' | Rich section');
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
    renderRich(theme, festivalName);
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
