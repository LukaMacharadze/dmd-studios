// frontend/catalog.js

const catalogGrid = document.getElementById("catalogGrid");   // catalog.html
const mainGrid = document.getElementById("mainProducts");     // main.html

function safeMoney(v) {
  const n = Number(v || 0);
  return `$${n.toFixed(2)}`;
}

function safeNormalizeImageSrc(src) {
  
  if (typeof normalizeImageSrc === "function") return normalizeImageSrc(src);
  return (src || "").trim();
}

function cardHTML(p) {
  const img = safeNormalizeImageSrc(p.image);
  return `
    <article class="product-card" data-id="${p.id}">
      <img class="product-img" src="${img}" alt="${p.title || "Product"}"
        onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1200&q=60';"
      />
      <div class="product-body">
        <div class="product-row">
          <div>
            <div class="product-title">${p.title || "Untitled"}</div>
            <div class="product-cat">${p.category || ""}</div>
          </div>
          <div class="price">${typeof money === "function" ? money(p.price) : safeMoney(p.price)}</div>
        </div>
        <div class="product-desc">${p.description || ""}</div>
        <div class="product-actions">
          <button class="btn-outline" data-action="view">View</button>
          <button class="btn" data-action="add">Add</button>
        </div>
      </div>
    </article>
  `;
}

async function fetchProducts() {
  const r = await fetch("/api/products");
  return await r.json();
}

async function render() {
  
  if (!catalogGrid && !mainGrid) return;

  const items = await fetchProducts();

  
  if (catalogGrid) {
    catalogGrid.innerHTML = items.map(cardHTML).join("");
  }


  if (mainGrid) {
    const top5 = items.slice(0, 8);
    mainGrid.innerHTML = top5.map(cardHTML).join("");
  }
}


document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const card = e.target.closest(".product-card");
  if (!card) return;

  const id = Number(card.dataset.id);
  if (!id) return;

  const action = btn.dataset.action;

  const product = await fetch(`/api/products/${id}`).then((r) => r.json());

  if (action === "view") {
    if (typeof openModal === "function") openModal(product);
    else alert("Modal not connected on this page.");
  }

  if (action === "add") {
    if (typeof addToCart === "function") addToCart(product);
    else alert("Added to cart (demo)");
  }
});

render();
