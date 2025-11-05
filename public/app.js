const PRODUCTS = [
    {
        id: "p1",
        name: "Laptop",
        price: 450,
        img: "/images/laptop.jpg",
    },
    {
        id: "p2",
        name: "Random ahh",
        price: 250,
        img: "/images/random.jpg",
    },
    {
        id: "p3",
        name: "Mobile",
        price: 350,
        img: "/images/phone.jpg",
    },
    {
        id: "p4",
        name: "Speaker(250g)",
        price: 650,
        img: "/images/random.jpg",
    },
    {
        id: "p5",
        name: "Speaker(250g)",
        price: 650,
        img: "/images/phone.jpg",
    },
    {
        id: "p6",
        name: "Speaker(250g)",
        price: 650,
        img: "/images/speaker.jpg",
    },
];

const CART_KEY = "cj_cart_v1";
function $(s) {
    return document.querySelector(s);
}
function $all(s) {
    return Array.from(document.querySelectorAll(s));
}

let cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}");

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
}

function renderProducts() {
    const grid = $("#products");
    const tpl = document.getElementById("product-tpl");
    PRODUCTS.forEach((p) => {
        const node = tpl.content.cloneNode(true);
        node.querySelector(".product-img").src = p.img;
        node.querySelector(".product-img").alt = p.name;
        node.querySelector(".product-name").textContent = p.name;
        node.querySelector(".product-price").textContent = `${p.price} NPR`;
        const btn = node.querySelector(".add-btn");
        btn.addEventListener("click", () => addToCart(p.id));
        grid.appendChild(node);
    });
}

function addToCart(pid) {
    cart[pid] = (cart[pid] || 0) + 1;
    saveCart();
    flashCartCount();
}
function flashCartCount() {
    $("#cart-count").textContent = Object.values(cart).reduce(
        (s, n) => s + n,
        0
    );
    $("#view-cart").animate(
        [{ transform: "scale(1.04)" }, { transform: "scale(1)" }],
        { duration: 180 }
    );
}

function updateCartUI() {
    $("#cart-count").textContent = Object.values(cart).reduce(
        (s, n) => s + n,
        0
    );
    const list = $("#cart-list");
    list.innerHTML = "";
    let subtotal = 0;
    for (const pid of Object.keys(cart)) {
        const qty = cart[pid];
        const product = PRODUCTS.find((x) => x.id === pid);
        if (!product) continue;
        const li = document.createElement("li");
        li.className = "cart-item";
        li.innerHTML = `
      <div>
        <div><strong>${product.name}</strong></div>
        <div class="small-muted">${
            product.price
        } NPR × <input class="qty-input" data-pid="${pid}" type="number" min="1" value="${qty}"></div>
      </div>
      <div>
        <div style="text-align:right">${product.price * qty} NPR</div>
        <button data-remove="${pid}" class="small-muted">Remove</button>
      </div>
    `;
        list.appendChild(li);
        subtotal += product.price * qty;
    }
    $("#subtotal").textContent = subtotal;
    attachCartControls();
}

function attachCartControls() {
    $all(".qty-input").forEach((inp) =>
        inp.addEventListener("change", (e) => {
            const pid = e.target.dataset.pid;
            const v = parseInt(e.target.value) || 1;
            cart[pid] = v;
            saveCart();
        })
    );
    $all("[data-remove]").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            const pid = e.target.dataset.remove;
            delete cart[pid];
            saveCart();
        })
    );
}

$("#view-cart").addEventListener("click", () =>
    $("#cart-panel").classList.toggle("hidden")
);
$("#continue-shopping").addEventListener("click", () =>
    $("#cart-panel").classList.add("hidden")
);

$("#checkout-btn").addEventListener("click", () => {
    const items = Object.entries(cart);
    if (items.length === 0) {
        alert("Cart is empty");
        return;
    }

    let amt = 0;
    items.forEach(([pid, qty]) => {
        const p = PRODUCTS.find((x) => x.id === pid);
        amt += p.price * qty;
    });

    const pid = "CJ_" + Date.now();
    const order = {
        orderId: pid,
        items: items.map(([pid, qty]) => ({ productId: pid, qty })),
        amount: amt,
        createdAt: new Date().toISOString(),
    };
    localStorage.setItem("cj_latest_order", JSON.stringify(order));

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/pay";
    const i1 = document.createElement("input");
    i1.type = "hidden";
    i1.name = "amount";
    i1.value = amt;
    form.appendChild(i1);
    const i2 = document.createElement("input");
    i2.type = "hidden";
    i2.name = "pid";
    i2.value = pid;
    form.appendChild(i2);
    document.body.appendChild(form);
    form.submit();
});

renderProducts();
updateCartUI();
