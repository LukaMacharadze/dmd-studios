(async function () {
  const user = await requireLoginOrRedirect();
  if (!user) return;

  const list = document.getElementById("summaryList");
  const totalEl = document.getElementById("summaryTotal");
  const form = document.getElementById("checkoutForm");

  const cart = getCartFor(user.login);

  if (!cart.length) {
    showToast("Cart is empty. Add items first.", "error");
    setTimeout(() => (location.href = "/catalog"), 400);
    return;
  }

  function total(items) {
    return items.reduce((s, x) => s + Number(x.price || 0) * Number(x.qty || 1), 0);
  }

  function itemRow(x) {
    return `
      <div style="display:flex; justify-content:space-between; gap:12px; border:1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.03); padding:10px 12px; border-radius:14px;">
        <div style="min-width:0;">
          <div style="font-weight:850; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${x.title || "Product"}</div>
          <div class="muted" style="font-size:13px;">Qty: ${Number(x.qty || 1)}</div>
        </div>
        <div style="font-weight:900; color: var(--accent);">
          $${(Number(x.price || 0) * Number(x.qty || 1)).toFixed(2)}
        </div>
      </div>
    `;
  }

  list.innerHTML = cart.map(itemRow).join("");
  totalEl.textContent = "$" + total(cart).toFixed(2);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const comment = document.getElementById("comment").value.trim();

    if (!fullName || !phone || !address) {
      showToast("Fill name / phone / address", "error");
      return;
    }

    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          address,
          comment,
          items: cart,
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Order error");

      // clear cart after success
      setCartFor(user.login, []);

      showToast(`Order #${data.orderId} placed ✅`, "success");
      setTimeout(() => (location.href = "/"), 700);
    } catch (err) {
      showToast(err.message || "Checkout failed", "error");
    }
  });
})();
