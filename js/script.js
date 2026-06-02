// Swiper (dacă există pe pagină)
if (typeof Swiper !== "undefined" && document.querySelector(".mySwiper")) {
  var swiper = new Swiper(".mySwiper", {
    slidesPerView: 1,
    loop: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });
}




// SCROLL
window.addEventListener("scroll", () => {
  const scrollY = window.pageYOffset;

  // header active
  const header = document.querySelector("header");
  if (header) {
    if (scrollY > 5) header.classList.add("header-active");
    else header.classList.remove("header-active");
  }

  const scrollUpBtn = document.querySelector(".scrollUp-btn");
  if (scrollUpBtn) {
    if (scrollY > 250) scrollUpBtn.classList.add("scrollUpBtn-active");
    else scrollUpBtn.classList.remove("scrollUpBtn-active");
  }

  if (!navMenu) return;

  const sections = document.querySelectorAll("section[id]");
  sections.forEach((section) => {
    const sectionHeight = section.offsetHeight;
    const sectionTop = section.offsetTop - 100;

    const navId = document.querySelector(`.menu-content a[href='#${section.id}']`);
    if (!navId) return; if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) { navId.classList.add("active-navlink"); } else { navId.classList.remove("active-navlink"); } });});



const sr = ScrollReveal({
  origin: 'top',
  distance: '60px',
  duration: 2500,
  delay: 400,
})

sr.reveal(`.section-title, .section-subtitle, .section-description, .brand-image, .tesitmonial, .newsletter 
.logo-content, .newsletter-inputBox, .newsletter-mediaIcon, .footer-content, .footer-links`, { interval: 100, })


let slideIndex = 0;

function showSlide(index) {
  const slides = document.querySelectorAll('.slides img');
  if (index >= slides.length) {
    slideIndex = 0;
  } else if (index < 0) {
    slideIndex = slides.length - 1;
  }

  slides.forEach((slide, i) => {
    slide.classList.remove('active');
    if (i === slideIndex) {
      slide.classList.add('active');
    }
  });
}

function changeSlide(n) {
  slideIndex += n;
  showSlide(slideIndex);
}

showSlide(slideIndex);



window.initialValues = window.initialValues || {};

function saveInitialValues() {
  const elements = document.querySelectorAll(".filter input, .filter select");

  if (!elements.length) {
    console.warn("saveInitialValues: nu găsesc .filter input/select");
    return;
  }

  elements.forEach((element) => {
    if (!element.id) return;

    if (window.initialValues[element.id] === undefined) {
      window.initialValues[element.id] = element.value;
    }

    if (!element.dataset.boundFilter) {
      const eventName = element.tagName === "SELECT" ? "change" : "input";
      element.addEventListener(eventName, applyFilters);
      element.dataset.boundFilter = "1";
    }
  });

  updateSpans();
  console.log("Saved initialValues:", window.initialValues);
}

function updateSpans() {
  const mappings = [
    { inputId: "pret-min", spanId: "valoare-pret-min" },
    { inputId: "pret-max", spanId: "valoare-pret-max" },
  ];

  mappings.forEach(({ inputId, spanId }) => {
    const input = document.getElementById(inputId);
    const span = document.getElementById(spanId);
    if (input && span) span.textContent = input.value;
  });
}

function applyFilters() {
  const search = (document.getElementById("search")?.value || "").toLowerCase().trim();
  const size = (document.getElementById("size")?.value || "").toLowerCase().trim();
  const brand = (document.getElementById("brand")?.value || "").toLowerCase().trim();

  const type = (document.getElementById("type")?.value || "").toLowerCase().trim();
  const gender = (document.getElementById("gender")?.value || "").toLowerCase().trim();

  const pretMin = parseInt(document.getElementById("pret-min")?.value, 10) || 0;
  const pretMax = parseInt(document.getElementById("pret-max")?.value, 10) || 99000;

  updateSpans();

  const cards = document.querySelectorAll(".card-item");
  let visible = 0;

  cards.forEach((card) => {
    const ds = card.dataset;

    const brandCard = (ds.brand || "").toLowerCase().trim();

    const typeCard = (ds.type || "").toLowerCase().trim();
    const genderCard = (ds.gender || "").toLowerCase().trim();

    const sizeCardRaw = (ds.size || "").toLowerCase().trim();
    const price = parseInt(ds.price || "0", 10);

    const sizes = sizeCardRaw.includes(",")
      ? sizeCardRaw.split(",").map((s) => s.trim())
      : [sizeCardRaw];

    const searchAttr = (ds.search || "").toLowerCase();
    const titleText = (card.querySelector("h1, h2, h3")?.textContent || "").toLowerCase();
    const haystack = (searchAttr + " " + titleText).toLowerCase();

    const ok =
      (search === "" || haystack.includes(search)) &&
      (size === "" || sizes.includes(size)) &&
      (brand === "" || brandCard === brand) &&
      (type === "" || typeCard === type) &&
      (gender === "" || genderCard === gender) &&
      price >= pretMin &&
      price <= pretMax;

    if (ok) {
      card.style.display = "";
      visible++;
    } else {
      card.style.display = "none";
    }
  });

  const noRes = document.getElementById("no-results");
  if (noRes) noRes.style.display = visible === 0 ? "block" : "none";

  if (typeof checkSingleCard === "function") checkSingleCard();
}

function resetFilters() {
  if (!Object.keys(window.initialValues).length) {
    saveInitialValues();
  }

  Object.keys(window.initialValues).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = window.initialValues[id];
  });

  updateSpans();
  applyFilters();
}

window.applyFilters = applyFilters;
window.resetFilters = resetFilters;

document.addEventListener("DOMContentLoaded", () => {
  saveInitialValues();
  applyFilters();
});

window.onProductsRendered = function () {
  saveInitialValues();
  applyFilters();
};












// ===== SINGLE CONTROLLER: MENU + FILTERS (NO FREEZE, NO FIXED BODY) =====
(function () {
  // NAV
  const openBtn   = document.getElementById("navBurger") || document.querySelector(".navOpen-btn");
  const navMenu   = document.getElementById("navMenu")   || document.querySelector(".nav-center");
  const navOverlay= document.getElementById("navOverlay")|| document.querySelector(".nav-overlay");

  // FILTERS
  const filtersBtn    = document.getElementById("mobileFiltersBtn");
  const filtersOverlay= document.getElementById("filtersOverlay");
  const filtersPanel  = document.querySelector(".filter");

  // ✅ reset hard dacă a rămas blocat din teste anterioare
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  const closeMenu = () => document.body.classList.remove("menu-open");
  const openMenu = () => {
    document.body.classList.remove("filters-open"); // nu suprapune
    document.body.classList.add("menu-open");
  };
  const toggleMenu = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    document.body.classList.contains("menu-open") ? closeMenu() : openMenu();
  };

  const closeFilters = () => document.body.classList.remove("filters-open");
  const openFilters = () => {
    document.body.classList.remove("menu-open"); // nu suprapune
    document.body.classList.add("filters-open");
  };
  const toggleFilters = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    document.body.classList.contains("filters-open") ? closeFilters() : openFilters();
  };

  // NAV listeners
  if (openBtn) openBtn.addEventListener("click", toggleMenu);
  if (navOverlay) navOverlay.addEventListener("click", (e) => { e.preventDefault(); closeMenu(); });

  // ✅ X merge sigur (iconul tău <i class="... navClose-btn">)
  document.addEventListener("click", (e) => {
    if (e.target.closest(".navClose-btn")) {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
      return;
    }
    // închide și la click pe link
    const link = e.target.closest("#navMenu a.nav-link, .nav-center a.nav-link");
    if (link) closeMenu();
  });

  // FILTERS listeners
  if (filtersBtn && filtersOverlay && filtersPanel) {
    filtersBtn.addEventListener("click", toggleFilters);
    filtersOverlay.addEventListener("click", (e) => { e.preventDefault(); closeFilters(); });
  }

  // ESC închide tot
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
      closeFilters();
    }
  });
})();

(function(){
  const modalOverlay = document.getElementById("checkoutModal");
  const openBtn = document.getElementById("checkoutBtn");
  const closeBtn = document.getElementById("closeCheckout");

  if(!modalOverlay || !openBtn || !closeBtn) return;

  const openModal = () => {
    modalOverlay.classList.add("is-open");
    modalOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    modalOverlay.classList.remove("is-open");
    modalOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);

  // click pe fundal închide
  modalOverlay.addEventListener("click", (e) => {
    if(e.target === modalOverlay) closeModal();
  });

  // ESC închide
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeModal();
  });
})();




document.addEventListener("admin-ready", () => {
  const addProductNav = document.getElementById("addProductNav");

  if (addProductNav) {
    addProductNav.style.display = window.isAdmin ? "block" : "none";
  }

  document.querySelectorAll(".btn-del").forEach((btn) => {
    btn.style.display = window.isAdmin ? "inline-flex" : "none";
  });
});


import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  const loginNav = document.getElementById("loginNav");
  const userNav = document.getElementById("userNav");

  if (!loginNav || !userNav) return;

  if (user) {
    // LOGAT
    loginNav.style.display = "none";
    userNav.style.display = "block";
  } else {
    // NELOGAT
    loginNav.style.display = "block";
    userNav.style.display = "none";
  }
});

// LOGOUT
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});

