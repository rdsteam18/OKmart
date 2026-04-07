const allowedPincodes = ["400052","400051"];

function placeOrder() {

    let name = document.getElementById("name").value;
    let phone = document.getElementById("phone").value;
    let address = document.getElementById("address").value;
    let pincode = document.getElementById("pincode").value;

    if (!allowedPincodes.includes(pincode)) {
        alert("Delivery not available ❌");
        return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    localStorage.setItem("lastOrder", JSON.stringify(cart));

    alert("Order placed ✅");

    localStorage.removeItem("cart");

    window.location.href = "success.html";
}