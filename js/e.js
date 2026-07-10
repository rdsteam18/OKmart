/* =========================
   GLOBAL VARIABLES
========================= */
let allProducts = [];

/* =========================
   LOAD PRODUCTS FROM JSON
========================= */
fetch("products.json")
.then(res => res.json())
.then(data => {
    allProducts = Object.values(data).flat();

    if (document.getElementById("productList")) {
        loadProducts(allProducts);
    }
});

/* =========================
   LOAD PRODUCTS
========================= */
function loadProducts(list) {
    let container = document.getElementById("productList");
    container.innerHTML = "";

    list.forEach(p => {
        container.innerHTML += `
        <div class="product">
            <img src="${p.image}">
            <h4>${p.name}</h4>
            <p>₹${p.price}</p>
            <button onclick="addToCart('${p.name}', ${p.price})">Add</button>
        </div>
        `;
    });
}

/* =========================
   SEARCH
========================= */
function searchProduct() {
    let input = document.getElementById("search").value.toLowerCase();

    let filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(input)
    );

    loadProducts(filtered);
}

/* =========================
   CATEGORY FILTER
========================= */
function filterCategory(cat) {

    fetch("products.json")
    .then(res => res.json())
    .then(data => {

        if (cat === "all") {
            loadProducts(Object.values(data).flat());
        } else {
            loadProducts(data[cat]);
        }
    });
}

/* =========================
   CART SYSTEM
========================= */
function addToCart(name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let item = cart.find(i => i.name === name);

    if (item) {
        item.qty += 1;
    } else {
        cart.push({name, price, qty:1});
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    updateCartCount();
   /* animation trigger */
event.target.classList.add("animate-btn");

let card = event.target.closest(".product");
if (card) {
    card.classList.add("animate-card");
}

/* remove after animation */
setTimeout(() => {
    event.target.classList.remove("animate-btn");
    if (card) card.classList.remove("animate-card");
}, 300);
}

/* =========================
   CART COUNT
========================= */
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let count = 0;
    cart.forEach(i => count += i.qty);

    let el = document.getElementById("cartCount");
    if (el) el.innerText = count;
}

/* =========================
   REPEAT ORDER
========================= */
function repeatOrder() {
    let last = JSON.parse(localStorage.getItem("lastOrder")) || [];

    if (last.length === 0) {
        alert("No previous order");
        return;
    }

    localStorage.setItem("cart", JSON.stringify(last));
    updateCartCount();
}
/* =========================
   BOTTOM CART BAR
========================= */
function updateBottomBar() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let bar = document.getElementById("bottomBar");
    let totalEl = document.getElementById("bottomTotal");

    if (!bar || !totalEl) return;

    if (cart.length === 0) {
        bar.style.display = "none";
        return;
    }

    let total = 0;

    cart.forEach(i => {
        total += i.price * i.qty;
    });

    bar.style.display = "flex";
    totalEl.innerText = "₹" + total;
}

/* call this after cart update */
const oldAddToCart = addToCart;

addToCart = function(name, price) {
    oldAddToCart(name, price);
    updateBottomBar();
};

/* on load */
window.addEventListener("load", updateBottomBar);

