console.log("favorites.js pornit");

const q = (id) => document.getElementById(id);

const favState = { items: [] };

function loadFav() {
  try {
    const arr = JSON.parse(localStorage.getItem("favorites") || "[]");
    favState.items = Array.isArray(arr) ? arr : [];
  } catch {
    favState.items = [];
  }
}

function saveFav() {
  localStorage.setItem("favorites", JSON.stringify(favState.items));
}

function openFavDrawer() {
  const d = document.querySelector(".fav-drawer");
  if (!d) return console.warn("Lipsește .fav-drawer din pagină");
  d.classList.add("open");
}

function closeFavDrawer() {
  const d = document.querySelector(".fav-drawer");
  if (!d) return;
  d.classList.remove("open");
}


function isFav(id) {
  loadFav();
  const sid = String(id);
  return favState.items.some((x) => String(x.id) === sid);
}

function toggleFav(product) {
  if (!product || !product.id) return;

  loadFav();

  const pid = String(product.id);
  const idx = favState.items.findIndex((x) => String(x.id) === pid);

  if (idx >= 0) {
    favState.items.splice(idx, 1);
  } else {
    favState.items.push({
      id: pid,
      name: product.name || "Produs",
      price: Number(product.price) || 0,
      currency: product.currency || "MDL",
      img: product.img || "",
    });
  }

  saveFav();
  renderFav();

  window.dispatchEvent(new CustomEvent("favorites:changed", { detail: { id: pid } }));
}

function removeFav(id) {
  loadFav();
  const sid = String(id);
  favState.items = favState.items.filter((x) => String(x.id) !== sid);
  saveFav();
  renderFav();

  window.dispatchEvent(new CustomEvent("favorites:changed", { detail: { id: sid } }));
}

function renderFav() {
  loadFav();

  const $favItems = q("favItems");
  const $favCount = q("favCount");

  if ($favCount) $favCount.textContent = String(favState.items.length);
  if (!$favItems) return; // dacă pagina nu are drawer, nu dăm crash

  if (!favState.items.length) {
    $favItems.innerHTML = `<p class="cart-empty">Nu ai favorite.</p>`;
    return;
  }

  $favItems.innerHTML = favState.items
    .map(
      (it) => `
      <div class="cart-line">
        <div style="display:flex; gap:10px; align-items:center;">
          <img src="${it.img || ""}" alt="" style="width:56px;height:56px;border-radius:10px;object-fit:cover;border:1px solid #e5e7eb;" />
          <div>
            <div class="line-name">${it.name || "Produs"}</div>
            <div class="muted">${(Number(it.price)||0).toLocaleString("ro-RO")} ${it.currency || "MDL"}</div>
          </div>
        </div>

        <div class="line-actions">
          <button class="remove" type="button" data-fav-remove="${it.id}">Șterge</button>
          ${
            typeof window.addToCart === "function"
              ? `<button class="pill" type="button" data-fav-addcart="${it.id}">În coș</button>`
              : ``
          }
        </div>
      </div>
    `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {

  const drawer = document.querySelector(".fav-drawer");

  if (drawer && drawer.parentElement !== document.body) {
    document.body.appendChild(drawer);
  }

  const $openFav = document.getElementById("openFav");
  const $closeFav = document.getElementById("closeFav");

  if ($openFav) {
    $openFav.type = "button";
    $openFav.addEventListener("click", (e) => {
      e.preventDefault();
      openFavDrawer();
    });
  }

  if ($closeFav) {
    $closeFav.type = "button";
    $closeFav.addEventListener("click", (e) => {
      e.preventDefault();
      closeFavDrawer();
    });
  }

});

document.addEventListener("DOMContentLoaded", () => {
  const $openFav = q("openFav");
  const $closeFav = q("closeFav");
  const $favItems = q("favItems");

  console.log("openFav:", !!$openFav, "favDrawer:", !!q("favDrawer"), "closeFav:", !!$closeFav);

  if ($openFav) {
    $openFav.setAttribute("type", "button");
    $openFav.addEventListener("click", (e) => {
      e.preventDefault();
      openFavDrawer();
    });
  }

  if ($closeFav) {
    $closeFav.setAttribute("type", "button");
    $closeFav.addEventListener("click", (e) => {
      e.preventDefault();
      closeFavDrawer();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFavDrawer();
  });

  if ($favItems) {
    $favItems.addEventListener("click", (e) => {
      const rem = e.target?.dataset?.favRemove;
      const add = e.target?.dataset?.favAddcart;

      if (rem) return removeFav(rem);

      if (add) {
        loadFav();
        const it = favState.items.find((x) => String(x.id) === String(add));
        if (!it) return;

        if (typeof window.addToCart === "function") {
          window.addToCart({
            id: it.id,
            name: it.name,
            price: it.price,
            currency: it.currency,
            img: it.img,
          });
          if (typeof window.openDrawer === "function") window.openDrawer();
        } else {
          alert("cart.js nu este încărcat pe pagina asta.");
        }
      }
    });
  }

  renderFav();
});



document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-fav");
  if (!btn) return;

  e.preventDefault();

  const id = btn.dataset.id;
  if (!id) return console.warn("Butonul .btn-fav nu are data-id");

  const card = btn.closest(".card-item") || btn.closest("[data-id]");

  const product = {
    id: String(id),
    name: card?.dataset?.name || btn.dataset.name || "Produs",
    price: card?.dataset?.price || btn.dataset.price || 0,
    currency: card?.dataset?.currency || btn.dataset.currency || "MDL",
    img: card?.dataset?.img || btn.dataset.img || "",
  };

  toggleFav(product);

  const active = isFav(id);
  btn.textContent = active ? "♥" : "♡";
  btn.style.color = active ? "#dc2626" : "";
});

window.addEventListener("favorites:changed", () => {
  document.querySelectorAll(".btn-fav[data-id]").forEach((btn) => {
    const id = btn.dataset.id;
    const active = isFav(id);
    btn.textContent = active ? "♥" : "♡";
    btn.style.color = active ? "#dc2626" : "";
  });
});

window.toggleFav = toggleFav;
window.openFavDrawer = openFavDrawer;
window.closeFavDrawer = closeFavDrawer;
window.renderFav = renderFav;
window.isFav = isFav;



