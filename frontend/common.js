// ===== Burger menu (safe) =====
function toggleMenu() {
  const nav = document.getElementById("nav-menu");
  if (nav) nav.classList.toggle("show");
}

// ===== Toast (no alert) =====
let toastTimer = null;
function showToast(message, type = "info") {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    t.innerHTML = `<div class="toast-inner"></div>`;
    document.body.appendChild(t);
  }

  const inner = t.querySelector(".toast-inner");
  inner.textContent = message;

  t.classList.remove("show", "success", "error", "info");
  t.classList.add("show", type);

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

// ===== AUTH helper =====
async function getMe() {
  try {
    const r = await fetch("/api/me", { credentials: "include" });
    const data = await r.json();
    return data.user || null;
  } catch {
    return null;
  }
}

async function requireLoginOrRedirect() {
  const user = await getMe();
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname);
    location.href = `/login?return=${returnUrl}`;
    return null;
  }
  return user;
}

// ===== Cart storage (per user) =====
function cartKey(login) {
  return `cart:${login || "guest"}`;
}

function getCartFor(login) {
  try {
    return JSON.parse(localStorage.getItem(cartKey(login)) || "[]");
  } catch {
    return [];
  }
}

function setCartFor(login, items) {
  localStorage.setItem(cartKey(login), JSON.stringify(items));
}

function addToCartInternal(login, product, qty = 1) {
  const cart = getCartFor(login);
  const id = Number(product.id);

  const found = cart.find((x) => Number(x.id) === id);
  if (found) found.qty = Number(found.qty || 1) + Number(qty || 1);
  else {
    cart.push({
      id: id,
      title: product.title || "Product",
      price: Number(product.price || 0),
      image: product.image || "",
      qty: Number(qty || 1),
    });
  }

  setCartFor(login, cart);
}


async function addToCart(product) {
  const user = await requireLoginOrRedirect();
  if (!user) return;

  addToCartInternal(user.login, product, 1);
  showToast("Added to cart ✅", "success");
}


async function buyNow(product) {
  const user = await requireLoginOrRedirect();
  if (!user) return;

  addToCartInternal(user.login, product, 1);
  showToast("Going to checkout…", "info");
  setTimeout(() => (location.href = "/checkout"), 250);
}

// ===== Product modal =====
function normalizeImageSrc(img) {
  if (!img) return "";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("./")) img = img.slice(1);
  if (!img.startsWith("/")) img = "/" + img;
  return img;
}

function money(n) {
  const x = Number(n || 0);
  return "$" + x.toFixed(2);
}

function openModal(product) {
  const modal = document.getElementById("productModal");
  if (!modal) return;

  const img = document.getElementById("modalImg");
  const title = document.getElementById("modalTitle");
  const cat = document.getElementById("modalCategory");
  const price = document.getElementById("modalPrice");
  const desc = document.getElementById("modalDesc");

  if (img) {
    img.src = normalizeImageSrc(product.image);
    img.onerror = () => {
      img.onerror = null;
      img.src =
        "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1200&q=60";
    };
  }
  if (title) title.textContent = product.title || "Product";
  if (cat) cat.textContent = product.category || "-";
  if (price) price.textContent = money(product.price);
  if (desc) desc.textContent = product.description || "";

  const btnAdd = document.getElementById("modalAdd");
  const btnBuy = document.getElementById("modalBuy");
  if (btnAdd) btnAdd.onclick = () => addToCart(product);
  if (btnBuy) btnBuy.onclick = () => buyNow(product);

  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("productModal");
  if (!modal) return;
  modal.classList.remove("show");
  document.body.style.overflow = "auto";
}

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "modalClose") closeModal();
  const modal = document.getElementById("productModal");
  if (modal && e.target === modal) closeModal();
});

// ===== User dropdown =====
document.addEventListener("DOMContentLoaded", async () => {
  const userArea = document.getElementById("user-area");
  if (!userArea) return;

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {}
    location.href = "/";
  }

  const user = await getMe();

  if (!user) {
    userArea.innerHTML = `<a href="/login" class="nav-login">Login</a>`;
    return;
  }

  const name = user.login || "User";
  const isAdmin = user.role === "admin";

  userArea.innerHTML = `
    <div class="user-menu">
      <button class="user-btn" id="userBtn" type="button">${name}</button>
      <div class="dropdown" id="userDropdown" style="display:none;">
        <a class="dropdown-link" href="/cart">Cart</a>
        <a class="dropdown-link" href="/checkout">Checkout</a>
        ${isAdmin ? `<a class="dropdown-link" href="/admin">Panel</a>` : ``}
        <button class="dropdown-item" id="logoutBtn" type="button">Logout</button>
      </div>
    </div>
  `;

  const userBtn = document.getElementById("userBtn");
  const dropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  userBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
  });

  document.addEventListener("click", () => (dropdown.style.display = "none"));
  logoutBtn.addEventListener("click", logout);
});
