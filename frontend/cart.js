(async function () {
  const user = await requireLoginOrRedirect();
  if (!user) return;

  const list = document.getElementById("cartList");
  const empty = document.getElementById("cartEmpty");
  const totalEl = document.getElementById("cartTotal");
  const btnClear = document.getElementById("clearCart");
  const btnGoCheckout = document.getElementById("goCheckout");

  function readCart() {
    return getCartFor(user.login);
  }

  function writeCart(items) {
    setCartFor(user.login, items);
  }

  function calcTotal(items) {
    return items.reduce((s, x) => s + Number(x.price || 0) * Number(x.qty || 1), 0);
  }

  function rowHTML(item) {
    const img = (item.image || "").trim() ||
      "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1200&q=60";

    return `
      <div class="product-row" style="display:grid; grid-template-columns: 90px 1fr auto; gap:12px; align-items:center;">
        <img src="${img}" alt="" style="width:90px;height:70px;object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,.10);" />
        <div style="text-align:left;">
          <div style="font-weight:850;">${item.title || "Product"}</div>
          <div class="muted" style="font-size:13px;">${money(item.price)} each</div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; justify-content:flex-end; flex-wrap:wrap;">
          <button class="btn-outline" data-dec="${item.id}" type="button" style="padding:8px 12px;">−</button>
          <div style="min-width:34px; text-align:center; font-weight:900;">${Number(item.qty || 1)}</div>
          <button class="btn-outline" data-inc="${item.id}" type="button" style="padding:8px 12px;">+</button>
          <button class="btn btn-danger btn-small" data-del="${item.id}" type="button">Remove</button>
        </div>
      </div>
    `;
  }

  function render() {
    const items = readCart();

    if (!items.length) {
      empty.style.display = "block";
      list.innerHTML = "";
      totalEl.textContent = "$0.00";
      return;
    }

    empty.style.display = "none";
    list.innerHTML = items.map(rowHTML).join("");
    totalEl.textContent = "$" + calcTotal(items).toFixed(2);
  }

  list.addEventListener("click", (e) => {
    const inc = e.target.getAttribute("data-inc");
    const dec = e.target.getAttribute("data-dec");
    const del = e.target.getAttribute("data-del");

    let items = readCart();

    if (inc) {
      items = items.map((x) =>
        String(x.id) === String(inc) ? { ...x, qty: Number(x.qty || 1) + 1 } : x
      );
      writeCart(items);
      render();
    }

    if (dec) {
      items = items.map((x) =>
        String(x.id) === String(dec) ? { ...x, qty: Math.max(1, Number(x.qty || 1) - 1) } : x
      );
      writeCart(items);
      render();
    }

    if (del) {
      items = items.filter((x) => String(x.id) !== String(del));
      writeCart(items);
      render();
      showToast("Removed", "info");
    }
  });

  btnClear.addEventListener("click", () => {
    writeCart([]);
    render();
    showToast("Cart cleared", "info");
  });

  btnGoCheckout.addEventListener("click", () => {
    const items = readCart();
    if (!items.length) return showToast("Cart is empty", "error");
    location.href = "/checkout";
  });

  render();
})();
