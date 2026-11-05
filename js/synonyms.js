// ===== OK MART - SEARCH SYNONYMS + FUZZY MATCHING =====
// Lets users find products even with wrong spellings or Hinglish words:
//   "pyaj" / "piyaz" -> onion, "tamatar" -> tomato, "doodh" -> milk,
//   "onoin" / "tomatoo" -> fuzzy-matched to onion / tomato.
// If nothing matches, the search page shows related suggestions instead of
// an empty dead-end. Pure client-side, no backend change.
//
// Exposes window.okmartSearch = { matchProducts(products, query) } where
// matchProducts returns { results, didYouMean, suggestions, expandedTo }.
//   results     — products sorted best-match first
//   didYouMean  — a close correction string, or null
//   suggestions — related products shown when results are empty
//   expandedTo  — canonical term the query was expanded to, or null

(function() {
  'use strict';

  // ---------- normalization ----------
  function normalize(str) {
    return (str || '').toLowerCase().trim()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // "onions" -> "onion", "wafers" -> "wafer" (helps plural queries match).
  function singularize(word) {
    if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.length > 3 && word.endsWith('es')) return word.slice(0, -2);
    if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
    return word;
  }

  function tokensOf(str) {
    return normalize(str).split(' ').filter(Boolean).map(singularize);
  }

  // Connector words that must never match: without this, "anda" (egg)
  // fuzzy-matches the English word "and" inside product names.
  var STOPWORDS = { 'and': 1, 'with': 1, 'for': 1, 'the': 1, 'of': 1,
    'a': 1, 'an': 1, 'in': 1, 'on': 1, 'to': 1, 'per': 1, 'x': 1 };

  // ---------- synonym map: alias -> canonical search terms ----------
  // Canonical terms are plain English words that appear in real product
  // names or categories, so an alias hit behaves like typing the real word.
  // Only aliases for things OKmart actually sells (or their category) are
  // listed; anything else falls through to fuzzy + related suggestions.
  var SYNONYMS = {
    // vegetables & fruits
    'pyaj': ['onion'], 'piyaz': ['onion'], 'pyaaz': ['onion'], 'pyaaj': ['onion'],
    'kanda': ['onion'], 'kandha': ['onion'], 'onions': ['onion'],
    'tamatar': ['tomato'], 'tamata': ['tomato'], 'tameta': ['tomato'],
    'dhaniya': ['coriander'], 'dhania': ['coriander'], 'kothmir': ['coriander'],
    'dhania patta': ['coriander'],
    'sabzi': ['vegetables'], 'sabji': ['vegetables'], 'bhaji': ['vegetables'],
    'fal': ['fruits'], 'phal': ['fruits'], 'fruit': ['fruits'],
    'tarbooz': ['watermelon'], 'kalingad': ['watermelon'],
    // dairy
    'doodh': ['milk'], 'dudh': ['milk'],
    'dahi': ['curd'], 'doi': ['curd'],
    'makkhan': ['butter'],
    'chaas': ['buttermilk'], 'chas': ['buttermilk'], 'chhach': ['buttermilk'],
    'kulfi': ['ice cream'], 'candy': ['ice cream'], 'icecream': ['ice cream'],
    'matka kulfi': ['kulfi'],
    // grocery staples
    'atta': ['atta'], 'aata': ['atta'], 'chakki atta': ['atta'],
    'cheeni': ['sugar'], 'shakkar': ['sugar'], 'sakkar': ['sugar'],
    'namak': ['salt'],
    'tel': ['oil'],
    'chai': ['tea'], 'cha': ['tea'], 'kadak chai': ['tea'],
    'dal': ['dal'], 'daal': ['dal'], 'arhar': ['toor dal'],
    'besan': ['besan'],
    'poha': ['poha'],
    'chai patti': ['tea'],
    // beverages
    'thanda': ['beverages'], 'cold drink': ['beverages'], 'soft drink': ['beverages'],
    'soda': ['soda'],
    'juice': ['juice'], 'ras': ['juice'],
    'coke': ['coca-cola'], 'cola': ['coca-cola'],
    'energy drink': ['energy'],
    // snacks & bakery
    'namkeen': ['snacks'], 'chips': ['wafers'], 'wafers': ['wafers'],
    'biscuit': ['biscuits'], 'biskut': ['biscuits'], 'cookie': ['biscuits'],
    'noodles': ['noodles'], 'maggi': ['noodles'], 'ramen': ['noodles'],
    'pasta': ['pasta'],
    'pizza': ['pizza'],
    'chocolate': ['chocolate'], 'chaklet': ['chocolate'], 'chocklet': ['chocolate'],
    'bread': ['bread'], 'double roti': ['bread'], 'roti': ['bread'],
    'bhelpuri': ['bhelpuri'],
    // household & personal
    'detergent': ['detergent'], 'washing powder': ['detergent'],
    'surf': ['detergent'], 'kapde dhone ka powder': ['detergent'],
    'floor cleaner': ['floor cleaner'], 'pocha': ['floor cleaner'],
    'diaper': ['diaper'],
    'pad': ['napkin'], 'napkin': ['napkin'], 'sanitary pad': ['napkin'],
    'pen': ['pen'],
    'bulb': ['bulb'], 'light': ['bulb'],
    'coconut oil': ['coconut oil'],
    // categories as words
    'dairy': ['dairy'], 'grocery': ['grocery'], 'snacks': ['snacks'],
    'beverages': ['beverages'], 'household': ['household'],
    'bakery': ['bakery'], 'personal': ['personal']
  };

  // Words users type for things OKmart does NOT sell, mapped to the
  // closest category so the no-match screen still shows useful related
  // products instead of random best discounts.
  var UNSOLD_HINTS = {
    'aloo': 'vegetables', 'alu': 'vegetables', 'batata': 'vegetables', 'bateta': 'vegetables',
    'chawal': 'grocery', 'rice': 'grocery', 'basmati': 'grocery', 'maida': 'grocery',
    'haldi': 'grocery', 'mirchi': 'grocery', 'masale': 'grocery',
    'anda': 'dairy', 'egg': 'dairy',
    'pepsi': 'beverages', 'sprite rival': 'beverages',
    'sabun': 'household', 'soap': 'household', 'shampoo': 'household'
  };
  var PHRASES = Object.keys(SYNONYMS).filter(function(k) { return k.indexOf(' ') !== -1; })
    .sort(function(a, b) { return b.length - a.length; });

  // Expand a raw query into canonical search terms (original words kept).
  function expandQuery(rawQuery) {
    var q = normalize(rawQuery);
    var terms = [];
    var expandedTo = null;
    var rest = q;
    PHRASES.forEach(function(phrase) {
      if (rest.indexOf(phrase) !== -1) {
        rest = rest.replace(phrase, ' ');
        SYNONYMS[phrase].forEach(function(t) { terms.push(t); });
        if (!expandedTo) expandedTo = SYNONYMS[phrase][0];
      }
    });
    tokensOf(rest).forEach(function(tok) {
      if (STOPWORDS[tok]) return;
      if (SYNONYMS[tok]) {
        SYNONYMS[tok].forEach(function(t) { terms.push(t); });
        if (!expandedTo) expandedTo = SYNONYMS[tok][0];
      } else {
        terms.push(tok);
      }
    });
    return { terms: terms, expandedTo: expandedTo };
  }

  // ---------- fuzzy matching (Damerau-Levenshtein) ----------
  // Adjacent transposition costs 1, so the most common typo kind
  // ("onoin" for "onion") matches while random words still do not.
  function levenshtein(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    var prev2 = [], prev = [], cur = [];
    for (var j = 0; j <= n; j++) prev[j] = j;
    for (var i = 1; i <= m; i++) {
      cur[0] = i;
      for (var k = 1; k <= n; k++) {
        var cost = (a[i - 1] === b[k - 1]) ? 0 : 1;
        cur[k] = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + cost);
        if (i > 1 && k > 1 && a[i - 1] === b[k - 2] && a[i - 2] === b[k - 1]) {
          cur[k] = Math.min(cur[k], prev2[k - 2] + 1);
        }
      }
      prev2 = prev; prev = cur; cur = [];
    }
    return prev[n];
  }

  function maxDistance(word) {
    if (word.length >= 7) return 2;
    if (word.length >= 4) return 1;
    return 0;
  }

  // Best fuzzy distance between a query token and any word of a text.
  function tokenDistance(token, text) {
    var best = Infinity;
    tokensOf(text).forEach(function(w) {
      if (STOPWORDS[w]) return;
      var d = levenshtein(token, w);
      if (d < best) best = d;
    });
    return best;
  }

  // ---------- main matcher ----------
  function matchProducts(products, rawQuery) {
    var q = normalize(rawQuery);
    if (!q) return { results: [], didYouMean: null, suggestions: [], expandedTo: null };
    var exp = expandQuery(rawQuery);
    var terms = exp.terms;
    var expandedTo = exp.expandedTo;
    var queryTokens = tokensOf(q);

    var scored = [];
    var bestFuzzy = { dist: Infinity, word: null, product: null };
    var hadExact = false;

    products.forEach(function(p) {
      var name = (p.name || '').toLowerCase();
      var cat = (p.category || '').toLowerCase();
      var desc = (p.description || '').toLowerCase();
      var nameTokens = tokensOf(name);
      var score = 0;
      var matchedAll = true;

      terms.forEach(function(term) {
        var termTokens = tokensOf(term);
        termTokens.forEach(function(tok) {
          if (nameTokens.indexOf(tok) !== -1) {
            // whole-word match in the name: "salt" puts Tata Salt first,
            // ahead of "salty"/"salted" substring matches
            score += 150;
            hadExact = true;
          } else if (nameTokens.some(function(w) { return w.indexOf(tok) === 0; })) {
            // word-prefix only: "choco" finds chocolate, but "anda"
            // (egg) must NOT match the middle of "chandan"
            score += 80;
            hadExact = true;
          } else if (cat.indexOf(tok) !== -1) {
            score += 70;
            hadExact = true;
          } else if (desc.indexOf(tok) !== -1) {
            score += 40;
            hadExact = true;
          } else {
            // fuzzy: close misspelling of a product/category word
            var dName = tokenDistance(tok, name);
            var dCat = tokenDistance(tok, cat);
            var d = Math.min(dName, dCat);
            if (d <= maxDistance(tok)) {
              score += 55 - d * 15;
              if (d < bestFuzzy.dist) {
                // remember the closest real word for "did you mean"
                var words = tokensOf(name + ' ' + cat);
                var bw = null, bd = Infinity;
                words.forEach(function(w) {
                  if (STOPWORDS[w]) return;
                  var dd = levenshtein(tok, w);
                  if (dd < bd) { bd = dd; bw = w; }
                });
                bestFuzzy = { dist: d, word: bw, product: p };
              }
            } else {
              matchedAll = false;
            }
          }
        });
      });

      if (score > 0) {
        if (matchedAll) score += 25;
        var disc = (p.mrp > p.price) ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
        scored.push({ p: p, score: score, disc: disc });
      }
    });

    scored.sort(function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return b.disc - a.disc;
    });

    var results = scored.map(function(s) { return s.p; });

    // "Did you mean" — only when NOTHING matched exactly, i.e. the
    // results (if any) came purely from fuzzy matching. Never second-
    // guess a query that already found its product ("salt" must not
    // suggest "salty", "lemon and chandan" must not suggest "chana").
    var didYouMean = null;
    if (!hadExact && bestFuzzy.word && bestFuzzy.dist > 0 && bestFuzzy.dist <= 2) {
      var typed = queryTokens.join(' ');
      if (bestFuzzy.word !== typed) didYouMean = bestFuzzy.word;
    }

    // Related suggestions when nothing matched: same category as the best
    // fuzzy candidate, else highest-discount products (never empty shelves).
    var suggestions = [];
    if (results.length === 0) {
      if (bestFuzzy.product && bestFuzzy.product.category) {
        suggestions = products.filter(function(p) {
          return p.category === bestFuzzy.product.category;
        }).slice(0, 8);
      }
      if (suggestions.length === 0) {
        // Known-but-unsold word ("aloo", "pepsi"): suggest its category.
        var hintCat = UNSOLD_HINTS[q] || null;
        queryTokens.forEach(function(tok) { if (UNSOLD_HINTS[tok]) hintCat = UNSOLD_HINTS[tok]; });
        if (hintCat) {
          suggestions = products.filter(function(p) {
            return (p.category || '').toLowerCase() === hintCat;
          }).slice(0, 8);
        }
      }
      if (suggestions.length === 0) {
        suggestions = products.slice().sort(function(a, b) {
          var da = (a.mrp > a.price) ? ((a.mrp - a.price) / a.mrp) : 0;
          var db = (b.mrp > b.price) ? ((b.mrp - b.price) / b.mrp) : 0;
          return db - da;
        }).slice(0, 8);
      }
    }

    return { results: results, didYouMean: didYouMean, suggestions: suggestions, expandedTo: expandedTo };
  }

  window.okmartSearch = {
    matchProducts: matchProducts,
    expandQuery: expandQuery,
    normalize: normalize
  };
})();
