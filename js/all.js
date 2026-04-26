// ===== OK Mart - Explore All Products Page =====
(function(){'use strict';
const CART_KEY='okmart_cart',WISHLIST_KEY='okmart_wishlist',RECENT_KEY='okmart_recent';
const CATEGORIES=[
  {id:'dairy',name:'Dairy',icon:'🥛'},{id:'fruits',name:'Fruits',icon:'🍎'},
  {id:'vegetables',name:'Vegetables',icon:'🥬'},{id:'snacks',name:'Snacks',icon:'🍿'},
  {id:'beverages',name:'Beverages',icon:'🥤'},{id:'grocery',name:'Grocery',icon:'🧺'},
  {id:'electronics',name:'Electronics',icon:'📱'},{id:'bakery',name:'Bakery',icon:'🥐'},
  {id:'personal',name:'Personal',icon:'🧴'},{id:'household',name:'Household',icon:'🧹'}
];

let allProducts=[],displayedCount=12,currentFilter='all',currentAllSort='popular',allSortOpen=false;

// ========== LOAD ALL PRODUCTS ==========
db.collection('products').where('active','!=',false).onSnapshot(snap=>{
  allProducts=[];snap.forEach(d=>allProducts.push({id:d.id,...d.data()}));
  renderAll();
});

function renderAll(){
  renderCategoryGrid();
  renderTrending();
  renderCategoryScrollSections();
  renderAllProductsGrid();
  renderRecentlyViewed();
  updateCartUI();
}

// ========== CATEGORY GRID ==========
function renderCategoryGrid(){
  document.getElementById('categoryGrid').innerHTML=CATEGORIES.map(c=>`<div class="category-card" onclick="scrollToCategory('${c.id}')"><span class="category-icon">${c.icon}</span><span class="category-name">${c.name}</span></div>`).join('');
}
window.scrollToCategory=(id)=>{const el=document.getElementById('cat-'+id);if(el)el.scrollIntoView({behavior:'smooth'});};

// ========== TRENDING ==========
function renderTrending(){
  const trending=allProducts.filter(p=>p.popular).slice(0,8);
  const slider=document.getElementById('trendingSlider');
  slider.innerHTML='';
  trending.forEach(p=>slider.appendChild(createProductCard(p)));
}

// ========== CATEGORY SCROLL SECTIONS ==========
function renderCategoryScrollSections(){
  const container=document.getElementById('categoryScrollSections');
  container.innerHTML='';
  CATEGORIES.forEach(cat=>{
    const products=allProducts.filter(p=>p.category===cat.id).slice(0,8);
    if(!products.length)return;
    const section=document.createElement('section');
    section.className='trending-section';section.id='cat-'+cat.id;
    section.innerHTML=`<div class="section-header-row"><h2 class="section-heading">${cat.icon} ${cat.name}</h2><a href="/categories/${cat.id==='personal'?'personal-care':cat.id}.html" class="view-all-link" style="color:var(--primary);font-size:.8rem;font-weight:600;text-decoration:none;">View All →</a></div><div class="product-slider"></div>`;
    const slider=section.querySelector('.product-slider');
    products.forEach(p=>slider.appendChild(createProductCard(p)));
    container.appendChild(section);
  });
}

// ========== ALL PRODUCTS GRID ==========
function getAllFiltered(){
  let f=[...allProducts];
  switch(currentFilter){
    case'under100':f=f.filter(p=>p.price<100);break;
    case'discount':f=f.filter(p=>p.mrp&&p.mrp>p.price);break;
    case'popular':f=f.filter(p=>p.popular);break;
    case'new':f.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));break;
  }
  switch(currentAllSort){
    case'price-low':f.sort((a,b)=>a.price-b.price);break;
    case'price-high':f.sort((a,b)=>b.price-a.price);break;
    case'discount':f.sort((a,b)=>{const da=a.mrp?((a.mrp-a.price)/a.mrp):0,db=b.mrp?((b.mrp-b.price)/b.mrp):0;return db-da;});break;
    default:f.sort((a,b)=>(b.popular?1:0)-(a.popular?1:0));
  }
  return f;
}

function renderAllProductsGrid(){
  const filtered=getAllFiltered();
  const grid=document.getElementById('allProductsGrid');
  grid.innerHTML='';
  const toShow=filtered.slice(0,displayedCount);
  toShow.forEach(p=>grid.appendChild(createProductCard(p,true)));
  document.getElementById('loadMoreBtn').style.display=displayedCount>=filtered.length?'none':'block';
}

window.loadMore=()=>{displayedCount+=12;renderAllProductsGrid();};

// ========== RECENTLY VIEWED ==========
function renderRecentlyViewed(){
  const recent=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');
  const section=document.getElementById('recentSection');
  const slider=document.getElementById('recentSlider');
  if(!recent.length){section.style.display='none';return;}
  section.style.display='block';slider.innerHTML='';
  recent.slice(0,8).forEach(id=>{const p=allProducts.find(p=>p.id===id);if(p)slider.appendChild(createProductCard(p));});
}

window.clearRecent=()=>{localStorage.removeItem(RECENT_KEY);renderRecentlyViewed();};

// Add to recent when clicking product
function addToRecent(productId){
  let recent=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');
  recent=recent.filter(id=>id!==productId);
  recent.unshift(productId);
  if(recent.length>20)recent=recent.slice(0,20);
  localStorage.setItem(RECENT_KEY,JSON.stringify(recent));
}

// ========== PRODUCT CARD ==========
function createProductCard(product,isGrid=false){
  const d=product.mrp?Math.round(((product.mrp-product.price)/product.mrp)*100):0;
  const c=document.createElement('div');c.className='product-card';
  if(isGrid)c.style.flex='unset';
  c.innerHTML=`<img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://placehold.co/200/eee/999?text=🛒'">${product.popular?'<span class="product-badge">🔥</span>':''}<button class="wishlist-heart">${isInWishlist(product.id)?'❤️':'🤍'}</button><button class="share-mini">📤</button><h3 class="product-name">${product.name}</h3><span class="product-unit">${product.unit||''}</span><div class="price-row"><span class="current-price">₹${product.price}</span>${product.mrp&&product.mrp>product.price?`<span class="mrp-price">₹${product.mrp}</span>`:''}${d>0?`<span class="discount-badge">${d}% OFF</span>`:''}</div><button class="add-btn">ADD</button>`;
  c.addEventListener('click',e=>{if(!e.target.closest('button')){addToRecent(product.id);location.href=`/product.html?id=${product.id}`;}});
  c.querySelector('.add-btn').addEventListener('click',e=>{e.stopPropagation();addToCart(product);});
  c.querySelector('.wishlist-heart').addEventListener('click',e=>{e.stopPropagation();toggleWishlist(product,e.target);});
  c.querySelector('.share-mini').addEventListener('click',e=>{e.stopPropagation();shareProduct(product);});
  return c;
}

// ========== FILTER CHIPS ==========
document.querySelectorAll('#quickFilterScroll .filter-chip').forEach(chip=>{chip.addEventListener('click',function(){document.querySelectorAll('#quickFilterScroll .filter-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');currentFilter=this.dataset.filter;displayedCount=12;renderAllProductsGrid();});});

// ========== SORT TOGGLE ==========
window.toggleAllSort=()=>{allSortOpen=!allSortOpen;document.getElementById('allSortDropdown').classList.toggle('show',allSortOpen);};
document.querySelectorAll('#allSortDropdown .sort-option').forEach(opt=>{opt.addEventListener('click',function(){currentAllSort=this.dataset.sort;document.querySelectorAll('#allSortDropdown .sort-option').forEach(o=>o.classList.remove('active'));this.classList.add('active');document.getElementById('allSortLabel').textContent=this.textContent.trim();document.getElementById('allSortDropdown').classList.remove('show');allSortOpen=false;displayedCount=12;renderAllProductsGrid();});});
document.addEventListener('click',e=>{if(!e.target.closest('.sort-wrapper')){document.getElementById('allSortDropdown').classList.remove('show');allSortOpen=false;}});

// ========== CART ==========
function getCart(){return JSON.parse(localStorage.getItem(CART_KEY)||'[]');}
function saveCart(c){localStorage.setItem(CART_KEY,JSON.stringify(c));updateCartUI();}
function addToCart(p){const c=getCart();const x=c.find(i=>i.id===p.id);if(x)x.quantity++;else c.push({id:p.id,name:p.name,price:p.price,mrp:p.mrp,image:p.image,unit:p.unit,quantity:1});saveCart(c);showToast(`${p.name} added!`,'success');}
function updateCartUI(){const c=getCart();const t=c.reduce((s,i)=>s+i.quantity,0),st=c.reduce((s,i)=>s+(i.price*i.quantity),0);document.getElementById('cartBadge').textContent=t;const b=document.getElementById('floatingCartBar');if(t>0){b.classList.add('visible');document.getElementById('barCartCount').textContent=`${t} item${t!==1?'s':''}`;document.getElementById('barCartTotal').textContent='₹'+st;}else b.classList.remove('visible');}

function getWishlist(){return JSON.parse(localStorage.getItem(WISHLIST_KEY)||'[]');}
function isInWishlist(id){return getWishlist().some(i=>i.id===id);}
function toggleWishlist(p,el){const w=getWishlist();const i=w.findIndex(x=>x.id===p.id);if(i>-1){w.splice(i,1);el.textContent='🤍';}else{w.push({id:p.id,name:p.name,price:p.price,image:p.image});el.textContent='❤️';}localStorage.setItem(WISHLIST_KEY,JSON.stringify(w));}
function shareProduct(p){const url=`${location.origin}/product.html?id=${p.id}`;if(navigator.share)navigator.share({title:p.name,url}).catch(()=>{});else window.open(`https://wa.me/?text=${encodeURIComponent(`🛒 ${p.name}\n💰 ₹${p.price}\n${url}`)}`,'_blank');}
function showToast(msg,type){const t=document.getElementById('toastMessage');t.textContent=msg;t.style.background=type==='success'?'#10b981':'#1a1e2b';t.style.color='white';t.classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(()=>t.classList.remove('show'),2500);}

updateCartUI();
console.log('✅ Explore page ready');
})();
