function loadCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let container = document.getElementById("cartItems");

    container.innerHTML = "";

    cart.forEach((item, i) => {
        container.innerHTML += `
        <div>
            <p>${item.name} - ₹${item.price} x ${item.qty}</p>
            <button onclick="changeQty(${i},1)">+</button>
            <button onclick="changeQty(${i},-1)">-</button>
        </div>
        `;
    });
}

function changeQty(i, val) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart[i].qty += val;

    if (cart[i].qty <= 0) cart.splice(i,1);

    localStorage.setItem("cart", JSON.stringify(cart));

    loadCart();
}