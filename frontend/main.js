const mainGrid = document.getElementById("mainProducts");

function cardHTML(p) {
  const img = normalizeImageSrc(p.image);
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
          <div class="price">${money(p.price)}</div>
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

async function loadMainProducts() {
  if (!mainGrid) return;

  const r = await fetch("/api/products");
  const items = await r.json();

  // ✅ вот тут количество: 5
  const top = items.slice(0, 8);

  mainGrid.innerHTML = top.map(cardHTML).join("");
}

mainGrid?.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const card = e.target.closest(".product-card");
  if (!card) return;

  const id = Number(card.dataset.id);
  if (!id) return;

  const action = btn.dataset.action;
  const product = await fetch(`/api/products/${id}`).then((r) => r.json());

  if (action === "view") openModal(product);
  if (action === "add") addToCart(product);
});

loadMainProducts();
