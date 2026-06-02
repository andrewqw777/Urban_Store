console.log("cart.js pornit");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeCode = (s) =>
  (s || "").toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");

const parsePriceText = (txt) =>
  Number(String(txt || "").replace(/[^\d.]/g, "")) || 0;

const fmt = (n, curr) =>
  (Number(n) || 0).toLocaleString("ro-RO") + (curr ? " " + curr : "");

function genCode(prefix = "AH") {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const block = (n) =>
    Array.from({ length: n }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  return `${prefix}-${block(4)}-${block(4)}`;
}

function buildOrderDetails(cart) {
  return cart
    .map(
      (it) => `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:10px;">
        <div>
          <div style="font-weight:700; color:#111;">${it.name}</div>
          ${it.size ? `<div style="font-size:13px; color:#666;">Mărime: ${it.size}</div>` : ""}
          <div style="font-size:13px; color:#666;">Cantitate: ${it.qty}</div>
        </div>
        <div style="font-weight:700; color:#111; white-space:nowrap;">${fmt(it.price * it.qty, it.currency || "MDL")}</div>
      </div>
    `
    )
    .join("");
}

/* ================= STATE ================= */

const state = {
  cart: [],
  coupon: { code: null, percent: 0, validated: false, consumed: false },
};

/* ================= LOCAL STORAGE ================= */

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(state.cart));
  localStorage.setItem("coupon", JSON.stringify(state.coupon));
}

function loadCart() {
  const cart = localStorage.getItem("cart");
  const coupon = localStorage.getItem("coupon");

  if (cart) {
    state.cart = JSON.parse(cart);
  }

  if (coupon) {
    state.coupon = JSON.parse(coupon);
  }
}

/* ================= LOAD ================= */

loadCart();

/* ================= ELEMENTS ================= */

const $drawer = document.getElementById("cartDrawer");
const $openCart = document.getElementById("openCart");
const $closeCart = document.getElementById("closeCart");
const $cartItems = document.getElementById("cartItems");
const $cartCount = document.getElementById("cartCount");

const $sumSubtotal = document.getElementById("sumSubtotal");
const $sumDiscount = document.getElementById("sumDiscount");
const $sumTotal = document.getElementById("sumTotal");

const $applyCoupon = document.getElementById("applyCoupon");
const $couponInput = document.getElementById("couponInput");
const $couponMsg = document.getElementById("couponMsg");
const $checkoutForm = document.getElementById("checkoutForm");

const $contactForm = document.getElementById("contactForm");
const $formMsg = document.getElementById("formMsg");

const $checkoutBtn = document.getElementById("checkoutBtn");
const $checkoutModal = document.getElementById("checkoutModal");
const $closeCheckout = document.getElementById("closeCheckout");

const $mSumSubtotal = document.getElementById("mSumSubtotal");
const $mSumDiscount = document.getElementById("mSumDiscount");
const $mSumTotal = document.getElementById("mSumTotal");

/* ================= FUNCTIONS ================= */

function readProductFromCard(card) {
  if (!card) return null;

  const id = card.dataset.id;
  const name =
    card.dataset.name ||
    card.querySelector("h3, .title")?.textContent?.trim() ||
    "Produs";

  const currency = card.dataset.currency || "MDL";
  const img = card.dataset.img || card.querySelector("img")?.src || "";

  let price = Number(card.dataset.price || 0);
  if (!price) {
    const t = card.querySelector(".price,[data-price-text]")?.textContent || "0";
    price = parsePriceText(t);
  }

  const size = card.dataset.size ? String(card.dataset.size) : null;

  return { id, name, price, currency, img, size };
}

function openDrawer() {
  $drawer && $drawer.classList.add("open");
}

function closeDrawer() {
  $drawer && $drawer.classList.remove("open");
}

$openCart && $openCart.addEventListener("click", openDrawer);

if ($closeCart) {
  $closeCart.type = "button";
  $closeCart.addEventListener("click", closeDrawer);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDrawer();
    closeCheckoutModal();
  }
});

function openCheckoutModal() {
  if (!$checkoutModal) return;
  $checkoutModal.classList.add("show");
  $checkoutModal.setAttribute("aria-hidden", "false");
}

function closeCheckoutModal() {
  if (!$checkoutModal) return;
  $checkoutModal.classList.remove("show");
  $checkoutModal.setAttribute("aria-hidden", "true");
}

$checkoutBtn &&
  $checkoutBtn.addEventListener("click", () => {
    if ($checkoutBtn.disabled) return;
    openCheckoutModal();
  });

$closeCheckout && $closeCheckout.addEventListener("click", closeCheckoutModal);

$checkoutModal &&
  $checkoutModal.addEventListener("click", (e) => {
    if (e.target === $checkoutModal) closeCheckoutModal();
  });

function addToCart(p) {
  if (!p || !p.id) return;

  const key = p.size ? `${p.id}__${p.size}` : p.id;

  const i = state.cart.findIndex((x) => x.id === key);
  if (i >= 0) {
    state.cart[i].qty = (state.cart[i].qty || 1) + 1;
  } else {
    state.cart.push({
      id: key,
      baseId: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      qty: 1,
      currency: p.currency || "MDL",
      img: p.img || "",
      size: p.size || "",
    });
  }

  updateCartUI();
}

function removeFromCart(id) {
  state.cart = state.cart.filter((x) => x.id !== id);
  updateCartUI();
}

function setQty(id, delta) {
  const it = state.cart.find((x) => x.id === id);
  if (!it) return;
  it.qty = Math.max(1, (it.qty || 1) + delta);
  updateCartUI();
}

function calcTotals() {
  const subtotal = state.cart.reduce(
    (s, it) => s + (Number(it.price) || 0) * (it.qty || 1),
    0
  );

  const percent = state.coupon.validated
    ? Number(state.coupon.percent || 0)
    : 0;

  const discount = Math.round(subtotal * (percent / 100));
  const total = Math.max(0, subtotal - discount);

  return { subtotal, discount, total };
}

function updateCartUI() {
  if ($cartCount) {
    $cartCount.textContent = state.cart.reduce((s, it) => s + (it.qty || 1), 0);
  }

  if ($cartItems) {
    if (!state.cart.length) {
      $cartItems.innerHTML = `<p class="cart-empty">Coșul este gol.</p>`;
    } else {
      $cartItems.innerHTML = state.cart
        .map(
          (it) => `
        <div class="cart-line">
          <div>
            <div class="line-name">${it.name}</div>
            ${it.size ? `<div class="muted">Mărime: <b>${it.size}</b></div>` : ""}
            <div class="muted">${fmt(it.price, it.currency)} / buc.</div>
          </div>
          <div class="line-actions">
            <div class="qty">
              <button type="button" data-dec="${it.id}">−</button>
              <strong>${it.qty}</strong>
              <button type="button" data-inc="${it.id}">+</button>
            </div>
            <button class="remove" type="button" data-remove="${it.id}">Șterge</button>
          </div>
        </div>`
        )
        .join("");
    }
  }

  const t = calcTotals();

  if ($sumSubtotal) $sumSubtotal.textContent = t.subtotal;
  if ($sumDiscount) $sumDiscount.textContent = t.discount;
  if ($sumTotal) $sumTotal.textContent = t.total;

  if ($mSumSubtotal) $mSumSubtotal.textContent = t.subtotal;
  if ($mSumDiscount) $mSumDiscount.textContent = t.discount;
  if ($mSumTotal) $mSumTotal.textContent = t.total;

  if ($checkoutBtn) $checkoutBtn.disabled = state.cart.length === 0;

  saveCart();
}

/* ================= EVENTS ================= */

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-add-cart, .add-to-cart, [data-add]");
  if (!btn) return;

  const card = btn.closest(".card-item, .card, [data-id]");
  const p = readProductFromCard(card);

  addToCart(p);
  openDrawer();
});

$cartItems &&
  $cartItems.addEventListener("click", (e) => {
    const dec = e.target?.dataset?.dec;
    const inc = e.target?.dataset?.inc;
    const rem = e.target?.dataset?.remove;
    if (dec) setQty(dec, -1);
    if (inc) setQty(inc, +1);
    if (rem) removeFromCart(rem);
  });

/* ================= START ================= */

updateCartUI();

window.addToCart = addToCart;
window.openDrawer = openDrawer;

const localitySelect = document.getElementById("localitySelect");
const pickupOptionBox = document.getElementById("pickupOptionBox");
const paypalBox = document.getElementById("paypal-button-container");
const paypalInfo = document.getElementById("paypalInfo");
const placeOrderBtn = document.getElementById("placeOrder");

localitySelect?.addEventListener("change", () => {
  if (localitySelect.value === "Cahul") {
    pickupOptionBox.style.display = "flex";
  } else {
    pickupOptionBox.style.display = "none";

    const courier = document.querySelector('input[value="Livrare prin curier"]');
    if (courier) courier.checked = true;
  }
});

document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;

    if (method === "online") {
  paypalBox.style.display = "block";

  if (paypalInfo) {
    paypalInfo.style.display = "block";
  }

  placeOrderBtn.style.display = "none";

} else {

  paypalBox.style.display = "none";

  if (paypalInfo) {
    paypalInfo.style.display = "none";
  }

  placeOrderBtn.style.display = "block";
}
  });
});

async function saveOrder(paymentStatus = "Neachitat") {
  const formData = new FormData($checkoutForm);

  const order = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),

    country: formData.get("country"),
    locality: formData.get("locality"),
    address: formData.get("address"),
    apartment: formData.get("apartment"),
    email: (formData.get("email") || "").trim(),
    phone: formData.get("phone"),
    notes: formData.get("notes"),

    deliveryMethod: formData.get("deliveryMethod"),
    paymentMethod: formData.get("paymentMethod"),
    paymentStatus: paymentStatus,

    items: state.cart.map((it) => ({
      id: it.id,
      baseId: it.baseId || it.id,
      name: it.name,
      price: it.price,
      qty: it.qty,
      size: it.size || "",
      currency: it.currency || "MDL",
      img: it.img || "",
    })),

    totals: calcTotals(),
    coupon: state.coupon,
    status: "noua",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  if (!order.email || !emailRegex.test(order.email)) {
    alert("Introdu un email valid");
    return;
  }

  if (!order.phone) {
    alert("Introdu numărul de telefon");
    return;
  }

  if (!order.firstName || !order.lastName) {
    alert("Completează numele și prenumele");
    return;
  }

  if (!state.cart.length) {
    alert("Coșul este gol");
    return;
  }

  const cartForEmail = [...state.cart];

  const docRef = await window.db.collection("orders").add(order);

  await window.emailjs.send("service_kgyensu", "template_yilx0ur", {
    to_name:
      `${order.firstName || ""} ${order.lastName || ""}`.trim() ||
      "Client",
    to_email: order.email,
    order_id: docRef.id,
    order_details: buildOrderDetails(cartForEmail),
    total: fmt(order.totals.total, "MDL"),
  });

  await window.emailjs.send("service_kgyensu", "template_yilx0ur", {
    to_name: "Admin",
    to_email: "ivanciogloadrian@gmail.com",
    order_id: docRef.id,
    order_details: buildOrderDetails(cartForEmail),
    total: fmt(order.totals.total, "MDL"),
  });

  state.cart = [];
  state.coupon = {
    code: null,
    percent: 0,
    validated: false,
    consumed: false,
  };

  saveCart();
  updateCartUI();

  alert("Comanda a fost plasată cu succes!");
  closeCheckoutModal();
  $checkoutForm.reset();

  window.location.href = "../index.html";
}

if ($checkoutForm) {
  $checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const method =
      document.querySelector('input[name="paymentMethod"]:checked')?.value;

    if (method === "online") {
      alert("Pentru plata online apasă butonul PayPal.");
      return;
    }

    try {
      await saveOrder("Plată la livrare");
    } catch (err) {
      console.error(err);
      alert("Eroare la trimiterea comenzii!");
    }
  });
}

function totalInEUR() {
  const t = calcTotals();
  const rate = 19.5;
  return (t.total / rate).toFixed(2);
}

if (paypalBox && typeof paypal !== "undefined") {
  paypal.Buttons({
    createOrder: function(data, actions) {
      return actions.order.create({
  application_context: {
    shipping_preference: "NO_SHIPPING"
  },

  purchase_units: [{
    amount: {
      value: totalInEUR(),
      currency_code: "EUR"
    }
  }]
});
    },

    onApprove: function(data, actions) {
      return actions.order.capture().then(async function() {
        await saveOrder("Achitat online");
      });
    },

    onError: function(err) {
      console.error(err);
      alert("A apărut o eroare la plata online.");
    }
  }).render("#paypal-button-container");
}