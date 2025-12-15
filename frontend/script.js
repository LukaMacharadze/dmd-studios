// === BURGER MENU ===
function toggleMenu() {
  const nav = document.getElementById("nav-menu");
  if (nav) nav.classList.toggle("show");
}

// === LIGHTBOX WITH DETAILS (safe) ===
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

if (items && items.length && lightbox) {
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

      lightbox.classList.add("show");
      document.body.style.overflow = "hidden";
    });
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove("show");
      document.body.style.overflow = "auto";
    }
  });
}

// === SCROLL ANIMATION & SUBTLE PARALLAX (safe) ===
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

// === USER DROPDOWN (API /api/me) ===
document.addEventListener("DOMContentLoaded", async () => {
  const userArea = document.getElementById("user-area");
  if (!userArea) return;

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

  const user = await getMe();

  if (!user) {
    userArea.innerHTML = `<a href="/login">Login</a>`;
    return;
  }

  const name = user.login || "User";
  const isAdmin = user.role === "admin";

  userArea.innerHTML = `
    <div class="user-menu">
      <button class="user-btn" id="userBtn">${name}</button>
      <div class="dropdown" id="userDropdown" style="display:none;">
        ${isAdmin ? `<a class="dropdown-link" href="/admin">Panel</a>` : ``}
        <button class="dropdown-item" id="logoutBtn">Logout</button>
      </div>
    </div>
  `;

  const userBtn = document.getElementById("userBtn");
  const dropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  userBtn.addEventListener("click", () => {
    dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-menu")) dropdown.style.display = "none";
  });

  logoutBtn.addEventListener("click", logout);
});
