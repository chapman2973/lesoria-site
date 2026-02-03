(() => {
  "use strict";

  // ================= Helpers =================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // ================= Active nav =================
  (function setActiveNav() {
    const links = $$('[data-navlink="true"]');
    if (!links.length) return;

    const path =
      (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

    links.forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      const isActive = href === path;
      a.classList.toggle("navlink-active", isActive);
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  })();

  // ================= Mobile menu =================
  const menuBtn = $("#menuBtn");
  const mobileMenu = $("#mobileMenu");
  const overlay = $("#overlay");
  const closeMenuBtns = $$(".js-close-menu");

  function setMenuOpen(isOpen) {
    if (!menuBtn || !mobileMenu || !overlay) return;
    mobileMenu.classList.toggle("hidden", !isOpen);
    overlay.classList.toggle("hidden", !isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    document.documentElement.classList.toggle("overflow-hidden", isOpen);
  }

  menuBtn?.addEventListener("click", () => {
    const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  });

  overlay?.addEventListener("click", () => setMenuOpen(false));
  closeMenuBtns.forEach((b) =>
    b.addEventListener("click", () => setMenuOpen(false))
  );

  // ================= Back to top =================
  const toTop = $("#toTop");
  if (toTop) {
    window.addEventListener("scroll", () => {
      const show = window.scrollY > 600;
      toTop.classList.toggle("opacity-0", !show);
      toTop.classList.toggle("pointer-events-none", !show);
    });
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
    );
  }

  // ================= Page transition =================
  const transition = $("#pageTransition");

  document.body.classList.remove("is-ready");
  window.addEventListener("load", () => {
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  });

  $$("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("http") ||
      link.hasAttribute("target")
    )
      return;

    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (!transition || prefersReducedMotion) {
        window.location.href = href;
        return;
      }
      transition.classList.remove("opacity-0");
      setTimeout(() => (window.location.href = href), 180);
    });
  });

  // ================= Scroll reveal =================
  (function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    items.forEach((el) => io.observe(el));
  })();

  // ================= Cart =================
  const cartBtn = $("#cartBtn");
  const cartDrawer = $("#cartDrawer");
  const cartOverlay = $("#cartOverlay");
  const cartItems = $("#cartItems");
  const cartTotal = $("#cartTotal");
  const cartCount = $("#cartCount");
  const cartEmpty = $("#cartEmpty");
  const cartClear = $("#cartClear");

  let cart = JSON.parse(localStorage.getItem("lesoria-cart") || "[]");

  function saveCart() {
    localStorage.setItem("lesoria-cart", JSON.stringify(cart));
  }

  function updateCartUI() {
    if (!cartItems || !cartTotal || !cartCount) return;

    cartItems.innerHTML = "";
    let total = 0;
    let count = 0;

    cart.forEach((item) => {
      total += item.price * item.qty;
      count += item.qty;

      const row = document.createElement("div");
      row.className =
        "flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2";
      row.innerHTML = `
        <div>
          <div class="text-sm font-medium">${item.name}</div>
          <div class="text-xs text-ink/60">${item.price} ₽ × ${item.qty}</div>
        </div>
        <div class="flex gap-1">
          <button class="btn js-dec">−</button>
          <button class="btn js-inc">+</button>
        </div>
      `;

      row.querySelector(".js-inc").onclick = () => {
        item.qty++;
        saveCart();
        updateCartUI();
      };
      row.querySelector(".js-dec").onclick = () => {
        item.qty--;
        if (item.qty <= 0) cart = cart.filter((i) => i !== item);
        saveCart();
        updateCartUI();
      };

      cartItems.appendChild(row);
    });

    cartTotal.textContent = total;
    cartCount.textContent = count;
    cartCount.classList.toggle("hidden", count === 0);
    cartEmpty?.classList.toggle("hidden", count !== 0);
  }

  updateCartUI();

  $$(".js-add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-item]");
      if (!card) return;

      const id = card.dataset.id;
      const name = card.dataset.name;
      const price = Number(card.dataset.price);

      const found = cart.find((i) => i.id === id);
      if (found) found.qty++;
      else cart.push({ id, name, price, qty: 1 });

      saveCart();
      updateCartUI();
      openCart();
    });
  });

  function openCart() {
    cartDrawer?.classList.remove("hidden");
    cartOverlay?.classList.remove("hidden");
    document.documentElement.classList.add("overflow-hidden");
  }

  function closeCart() {
    cartDrawer?.classList.add("hidden");
    cartOverlay?.classList.add("hidden");
    document.documentElement.classList.remove("overflow-hidden");
  }

  cartBtn?.addEventListener("click", openCart);
  cartOverlay?.addEventListener("click", closeCart);
  $$(".js-close-cart").forEach((b) =>
    b.addEventListener("click", closeCart)
  );

  cartClear?.addEventListener("click", () => {
    cart = [];
    saveCart();
    updateCartUI();
  });
})();
