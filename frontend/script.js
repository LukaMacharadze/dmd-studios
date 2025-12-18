function toggleMenu() {
  const nav = document.getElementById("nav-menu");
  if (nav) nav.classList.toggle("show");
}

/* =========================================================
   TOAST (NO ALERTS)
   ========================================================= */
let toastTimer = null;

function ensureToast() {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    t.innerHTML = `<div class="toast-inner" id="toastInner">...</div>`;
    document.body.appendChild(t);
  }
  return t;
}

function showToast(message, type = "info") {
  const t = ensureToast();
  const inner = document.getElementById("toastInner");

  t.classList.remove("success", "error", "info");
  t.classList.add(type);

  if (inner) inner.textContent = message;

  t.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
  }, 1800);
}

/* =========================================================
   LIGHTBOX (MAIN PAGE) — твой старый (image-grid-item)
   ========================================================= */
const lightbox = document.getElementById("lightbox");
const items = document.querySelectorAll(".image-grid-item img");

const furnitureData = [
  {
    src: "https://images.squarespace-cdn.com/content/v1/63dde481bbabc6724d988548/12b13683-b8d6-45cf-9584-fda56589d9f9/_436977a2-39a5-408b-a99d-842c3fd42c79.jpeg",
    title: "Graphite Sofa",
    description: "Soft, stylish, and made to fit any modern space.",
    dimensions: "200x90x85 cm",
    materials: "Fabric, Wood",
    price: "$2,990",
  },
  {
    src: "https://s3.amazonaws.com/ideas-after/fe24d9fe-2dbd-4b40-93ed-8eceec10cfc2.jpeg",
    title: "Oak Dining Set",
    description: "Natural oak with minimalist lines and solid build quality.",
    dimensions: "180x90x75 cm",
    materials: "Oak wood",
    price: "$1,790",
  },
  {
    src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80",
    title: "Noir Armchair",
    description: "Comfort and style — perfect for your home or office.",
    dimensions: "85x80x90 cm",
    materials: "Leather, Wood",
    price: "$1,190",
  },
  {
    src: "https://img.freepik.com/premium-photo/timeless-design-dark-wood-wardrobe-generative-ai_724548-15164.jpg",
    title: "Eclipse Bed",
    description: "Luxury and minimalism meet in perfect harmony.",
    dimensions: "210x180x100 cm",
    materials: "Wood, Fabric",
    price: "$2,490",
  },
];

function closeAnyLightbox() {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  lb.classList.remove("show");
  lb.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "auto";
}

function openAnyLightbox() {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  lb.classList.add("show");
  lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function setupMainLightboxIfExists() {
  if (!lightbox) return;

  // main.html uses .item-title etc
  const hasMainMarkup = !!lightbox.querySelector(".item-title");
  if (!hasMainMarkup) return;

  if (items && items.length) {
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const data = furnitureData.find((f) => f.src === item.src);
        if (!data) return;

        const img = lightbox.querySelector(".lightbox-content img");
        if (img) img.src = data.src;

        const t = lightbox.querySelector(".item-title");
        const d = lightbox.querySelector(".item-description");
        const dim = lightbox.querySelector(".item-dimensions");
        const mat = lightbox.querySelector(".item-materials");
        const p = lightbox.querySelector(".item-price");

        if (t) t.textContent = data.title;
        if (d) d.textContent = data.description;
        if (dim) dim.textContent = `Dimensions: ${data.dimensions}`;
        if (mat) mat.textContent = `Materials: ${data.materials}`;
        if (p) p.textContent = data.price;

        openAnyLightbox();
      });
    });
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeAnyLightbox();
  });
}

/* =========================================================
   CATALOG LIGHTBOX (catalog.html) — new modal fields
   ========================================================= */
const lbClose = document.getElementById("modalClose") || document.getElementById("lbClose");
const lbImg = document.getElementById("modalImg") || document.getElementById("lbImg");
const lbTitle = document.getElementById("modalTitle") || document.getElementById("lbTitle");
const lbDesc = document.getElementById("modalDesc") || document.getElementById("lbDesc");
const lbMetaCategory = document.getElementById("modalCategory") || document.getElementById("lbMeta");
const lbMetaPrice = document.getElementById("modalPrice") || document.getElementById("lbPrice");
const lbAdd = document.getElementById("modalAdd") || document.getElementById("lbAdd");
const lbBuy = document.getElementById("modalBuy") || document.getElementById("lbBuy");

function hasCatalogLightboxMarkup() {
  // catalog.html uses modal ids, but we support both old/new ids above
  return !!(lightbox && lbImg && lbTitle && lbDesc && (lbMetaPrice || lbMetaCategory));
}

function openCatalogLightbox(p) {
  if (!hasCatalogLightboxMarkup()) return;

  const img = (p.image || "").trim();
  lbImg.src = img;
  lbTitle.textContent = p.title || "";
  lbDesc.textContent = p.description || "";

  // different markup variants:
  if (lbMetaCategory && lbMetaCategory.id === "modalCategory") {
    lbMetaCategory.textContent = p.category || "";
  } else if (lbMetaCategory) {
    lbMetaCategory.textContent = (p.category || "").trim();
  }

  const priceText = `$${Number(p.price || 0).toFixed(2)}`;
  if (lbMetaPrice && lbMetaPrice.id === "modalPrice") {
    lbMetaPrice.textContent = priceText;
  } else if (lbMetaPrice) {
    lbMetaPrice.textContent = priceText;
  }

  if (lbAdd) {
    lbAdd.onclick = () => showToast("Added to cart (demo)", "success");
  }
  if (lbBuy) {
    lbBuy.onclick = () => showToast("Checkout (demo)", "info");
  }

  openAnyLightbox();
}

/* =========================================================
   RENDER PRODUCTS CARDS (used by CATALOG + MAIN)
   ========================================================= */
function productCardHTML(p) {
  const img = (p.image || "").trim();
  const price = `$${Number(p.price || 0).toFixed(2)}`;

  return `
    <article class="product-card">
      <img class="product-img" src="${img}" alt="${p.title || "Product"}"
        onerror="this.style.opacity=.25; this.alt='Image not found';" />
      <div class="product-body">
        <div class="product-row">
          <div>
            <div class="product-title">${p.title || ""}</div>
            <div class="product-cat">${p.category || ""}</div>
          </div>
          <div class="price">${price}</div>
        </div>
        <div class="product-desc">${p.description || ""}</div>
        <div class="product-actions">
          <button class="btn-outline" data-view="${p.id}" type="button">View</button>
          <button class="btn" data-add="${p.id}" type="button">Add</button>
        </div>
      </div>
    </article>
  `;
}

async function fetchProducts() {
  const r = await fetch("/api/products", { credentials: "include" });
  return await r.json();
}

/* =========================================================
   CATALOG PAGE: render ALL
   ========================================================= */
async function loadCatalogPage() {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;

  const products = await fetchProducts();

  if (!products.length) {
    grid.innerHTML = `<div class="empty">No products yet.</div>`;
    return;
  }

  grid.innerHTML = products.map(productCardHTML).join("");

  // delegation
  grid.onclick = (e) => {
    const viewId = e.target?.getAttribute?.("data-view");
    const addId = e.target?.getAttribute?.("data-add");

    if (viewId) {
      const p = products.find((x) => String(x.id) === String(viewId));
      if (p) openCatalogLightbox(p);
    }
    if (addId) {
      showToast("Added to cart (demo)", "success");
    }
  };
}

/* =========================================================
   MAIN PAGE: render LAST 5
   ========================================================= */
async function loadMainProducts() {
  const grid = document.getElementById("mainProducts");
  if (!grid) return;

  const products = await fetchProducts();

  // ✅ показываем 5 последних
  const top = products.slice(0, 5);

  if (!top.length) {
    grid.innerHTML = `<div class="empty">No products yet.</div>`;
    return;
  }

  grid.innerHTML = top.map(productCardHTML).join("");

  // delegation
  grid.onclick = (e) => {
    const viewId = e.target?.getAttribute?.("data-view");
    const addId = e.target?.getAttribute?.("data-add");

    if (viewId) {
      const p = products.find((x) => String(x.id) === String(viewId));
      if (p) openCatalogLightbox(p); // можно тем же модалом
    }
    if (addId) {
      showToast("Added to cart (demo)", "success");
    }
  };
}

/* =========================================================
   SCROLL ANIMATION & PARALLAX (safe)
   ========================================================= */
const gridItems = document.querySelectorAll(".image-grid-item");
const hero = document.querySelector(".hero");

function onScroll() {
  const scrollY = window.scrollY;
  if (hero) hero.style.transform = `translateY(${scrollY * 0.1}px)`;

  const triggerBottom = window.innerHeight - 100;
  if (gridItems && gridItems.length) {
    gridItems.forEach((item) => {
      const itemTop = item.getBoundingClientRect().top;
      if (itemTop < triggerBottom) item.classList.add("visible");
      else item.classList.remove("visible");
    });
  }
}

window.addEventListener("scroll", onScroll);
window.addEventListener("load", onScroll);

/* =========================================================
   USER DROPDOWN (API /api/me)
   ========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  const userArea = document.getElementById("user-area");

  async function getMe() {
    try {
      const r = await fetch("/api/me", { credentials: "include" });
      const data = await r.json();
      return data.user || null;
    } catch {
      return null;
    }
  }

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {}
    location.href = "/";
  }

  if (userArea) {
    const user = await getMe();

    if (!user) {
      userArea.innerHTML = `<a href="/login">Login</a>`;
    } else {
      const name = user.login || "User";
      const isAdmin = user.role === "admin";

      userArea.innerHTML = `
        <div class="user-menu">
          <button class="user-btn" id="userBtn" type="button">${name}</button>
          <div class="dropdown" id="userDropdown" style="display:none;">
            ${isAdmin ? `<a class="dropdown-link" href="/admin">Panel</a>` : ``}
            <button class="dropdown-item" id="logoutBtn" type="button">Logout</button>
          </div>
        </div>
      `;

      const userBtn = document.getElementById("userBtn");
      const dropdown = document.getElementById("userDropdown");
      const logoutBtn = document.getElementById("logoutBtn");

      userBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
      });

      document.addEventListener("click", (e) => {
        if (!e.target.closest(".user-menu")) dropdown.style.display = "none";
      });

      logoutBtn.addEventListener("click", logout);
    }
  }

  // bind catalog modal close + background close + ESC
  if (hasCatalogLightboxMarkup()) {
    if (lbClose) lbClose.addEventListener("click", closeAnyLightbox);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeAnyLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox?.classList.contains("show")) {
        closeAnyLightbox();
      }
    });
  }

  // init main lightbox (old)
  setupMainLightboxIfExists();

  // init DB cards
  await loadCatalogPage();
  await loadMainProducts();
});
