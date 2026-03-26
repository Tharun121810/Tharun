/* ═══════════════════════════════════════════════
   Tharun Breakfast Center — Frontend App Logic
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── State ─────────────────────────────────────
  let menuItems = [];   // [{id, name, description, price, image_url, category}]
  let cart = {};        // { itemId: { item, qty } }

  // ─── DOM refs ──────────────────────────────────
  const menuGrid      = document.getElementById('menuGrid');
  const menuError     = document.getElementById('menuError');
  const cartBadge     = document.getElementById('cartBadge');
  const cartSidebar   = document.getElementById('cartSidebar');
  const cartOverlay   = document.getElementById('cartOverlay');
  const cartItemsEl   = document.getElementById('cartItems');
  const cartEmpty     = document.getElementById('cartEmpty');
  const cartFooter    = document.getElementById('cartFooter');
  const subtotalEl    = document.getElementById('subtotalAmt');
  const taxEl         = document.getElementById('taxAmt');
  const totalEl       = document.getElementById('totalAmt');
  const checkoutBtn   = document.getElementById('checkoutBtn');
  const customerName  = document.getElementById('customerName');
  const cartToggleBtn = document.getElementById('cartToggleBtn');
  const cartClose     = document.getElementById('cartClose');
  const modalOverlay  = document.getElementById('modalOverlay');
  const modalClose    = document.getElementById('modalClose');
  const modalOrderId  = document.getElementById('modalOrderId');
  const modalTotal    = document.getElementById('modalTotalAmount');
  const donePaidBtn   = document.getElementById('donePaidBtn');
  const filterTabs    = document.querySelectorAll('.filter-tab');
  const toastEl       = document.getElementById('toast');

  let activeFilter = 'all';

  // ════════════════════════════════════════════════
  //  1. FETCH MENU from API
  // ════════════════════════════════════════════════
  async function fetchMenu() {
    try {
      const res = await fetch('/api/menu');
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      menuItems = data.data || [];
      renderMenu(menuItems);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      menuGrid.innerHTML = '';
      menuError.classList.remove('hidden');
    }
  }

  // ════════════════════════════════════════════════
  //  2. RENDER MENU
  // ════════════════════════════════════════════════
  function renderMenu(items) {
    const filtered = activeFilter === 'all'
      ? items
      : items.filter(i => i.category === activeFilter);

    menuGrid.innerHTML = '';

    if (filtered.length === 0) {
      menuGrid.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem;grid-column:1/-1;">No items in this category.</p>';
      return;
    }

    filtered.forEach((item, idx) => {
      const inCart = cart[item.id];
      const qty = inCart ? inCart.qty : 0;

      const card = document.createElement('div');
      card.className = 'menu-card';
      card.style.animationDelay = `${idx * 0.06}s`;
      card.dataset.id = item.id;
      card.dataset.category = item.category;

      card.innerHTML = `
        <div class="card-img-wrap">
          <img src="${item.image_url}" alt="${item.name}" class="card-img" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80'"/>
          <span class="card-category-badge">${item.category}</span>
        </div>
        <div class="card-body">
          <div class="card-name">${item.name}</div>
          <div class="card-desc">${item.description}</div>
          <div class="card-footer">
            <div class="card-price">₹${Number(item.price).toFixed(0)} <span>/ serving</span></div>
            ${qty === 0
              ? `<button class="add-btn" onclick="App.addToCart(${item.id})">+ Add</button>`
              : `<div class="qty-control">
                  <button class="qty-btn" onclick="App.decreaseQty(${item.id})">−</button>
                  <span class="qty-num">${qty}</span>
                  <button class="qty-btn" onclick="App.addToCart(${item.id})">+</button>
                </div>`
            }
          </div>
        </div>
      `;
      menuGrid.appendChild(card);
    });
  }

  // ════════════════════════════════════════════════
  //  3. CART LOGIC
  // ════════════════════════════════════════════════
  function addToCart(itemId) {
    const item = menuItems.find(m => m.id === itemId);
    if (!item) return;

    if (cart[itemId]) {
      cart[itemId].qty += 1;
    } else {
      cart[itemId] = { item, qty: 1 };
    }

    refreshAll(item.name + ' added! 🎉');
    animateBadge();
  }

  function decreaseQty(itemId) {
    if (!cart[itemId]) return;
    cart[itemId].qty -= 1;
    if (cart[itemId].qty <= 0) {
      delete cart[itemId];
      showToast('Item removed from cart');
    }
    refreshAll();
  }

  function removeFromCart(itemId) {
    const name = cart[itemId] ? cart[itemId].item.name : '';
    delete cart[itemId];
    refreshAll(name ? name + ' removed' : '');
  }

  function refreshAll(toastMsg) {
    renderMenu(menuItems);
    renderCartSidebar();
    updateBadge();
    if (toastMsg) showToast(toastMsg);
  }

  // ─── Cart Badge ────────────────────────────────
  function updateBadge() {
    const total = Object.values(cart).reduce((s, v) => s + v.qty, 0);
    cartBadge.textContent = total;
  }

  function animateBadge() {
    cartBadge.classList.remove('bump');
    void cartBadge.offsetWidth;
    cartBadge.classList.add('bump');
  }

  // ─── Cart Sidebar Contents ─────────────────────
  function renderCartSidebar() {
    const cartEntries = Object.values(cart);
    const isEmpty = cartEntries.length === 0;

    cartEmpty.style.display = isEmpty ? 'flex' : 'none';
    cartFooter.style.display = isEmpty ? 'none' : 'block';

    // Clear prior items (keep empty placeholder)
    Array.from(cartItemsEl.querySelectorAll('.cart-item')).forEach(el => el.remove());

    if (!isEmpty) {
      cartEntries.forEach(({ item, qty }) => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <img src="${item.image_url}" alt="${item.name}" class="cart-item-img"
               onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&q=80'"/>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${Number(item.price).toFixed(0)} × ${qty}</div>
          </div>
          <div class="cart-item-controls">
            <button class="ci-qty-btn" onclick="App.decreaseQty(${item.id})">−</button>
            <span class="ci-qty">${qty}</span>
            <button class="ci-qty-btn" onclick="App.addToCart(${item.id})">+</button>
          </div>
          <div class="cart-item-total">₹${(Number(item.price) * qty).toFixed(0)}</div>
          <button class="cart-item-remove" onclick="App.removeFromCart(${item.id})" title="Remove">✕</button>
        `;
        cartItemsEl.appendChild(row);
      });
    }

    // Update totals
    const subtotal = cartEntries.reduce((s, { item, qty }) => s + Number(item.price) * qty, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    subtotalEl.textContent = '₹' + subtotal.toFixed(2);
    taxEl.textContent      = '₹' + tax.toFixed(2);
    totalEl.textContent    = '₹' + total.toFixed(2);
  }

  // ════════════════════════════════════════════════
  //  4. CHECKOUT (POST to API → show QR)
  // ════════════════════════════════════════════════
  async function checkout() {
    const cartEntries = Object.values(cart);
    if (cartEntries.length === 0) {
      showToast('⚠️ Cart is empty!');
      return;
    }

    const subtotal = cartEntries.reduce((s, { item, qty }) => s + Number(item.price) * qty, 0);
    const total    = (subtotal * 1.05).toFixed(2);
    const name     = customerName.value.trim() || 'Guest';

    const payload = {
      customer_name: name,
      items: cartEntries.map(({ item, qty }) => ({
        menu_item_id: item.id,
        quantity:     qty,
        unit_price:   Number(item.price)
      }))
    };

    checkoutBtn.textContent = 'Processing…';
    checkoutBtn.disabled = true;

    try {
      const res = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        // Show QR modal
        modalOrderId.textContent = data.order_id;
        modalTotal.textContent   = '₹' + Number(data.total_amount).toFixed(2);
        openModal();
        closeCart();
      } else {
        showToast('❌ ' + (data.message || 'Failed to place order'));
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast('❌ Network error. Please try again.');
    } finally {
      checkoutBtn.textContent = 'Pay Now  💳';
      checkoutBtn.disabled = false;
    }
  }

  // ─── After payment confirmed ───────────────────
  function onPaymentDone() {
    cart = {};
    refreshAll();
    customerName.value = '';
    closeModal();
    showToast('✅ Payment confirmed! Thank you 🙏');
  }

  // ════════════════════════════════════════════════
  //  5. MODAL / CART OPEN-CLOSE
  // ════════════════════════════════════════════════
  function openCart()  { cartSidebar.classList.add('open'); cartOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeCart() { cartSidebar.classList.remove('open'); cartOverlay.classList.remove('active'); document.body.style.overflow = ''; }
  function openModal() { modalOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeModal(){ modalOverlay.classList.remove('active'); document.body.style.overflow = ''; }

  // ════════════════════════════════════════════════
  //  6. TOAST
  // ════════════════════════════════════════════════
  let toastTimer;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  // ════════════════════════════════════════════════
  //  7. EVENT LISTENERS
  // ════════════════════════════════════════════════
  cartToggleBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  modalClose.addEventListener('click', closeModal);
  checkoutBtn.addEventListener('click', checkout);
  donePaidBtn.addEventListener('click', onPaymentDone);

  // Close modal on overlay click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.cat;
      renderMenu(menuItems);
    });
  });

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // ════════════════════════════════════════════════
  //  8. EXPOSE GLOBALLY (for inline onclick handlers)
  // ════════════════════════════════════════════════
  window.App = { addToCart, decreaseQty, removeFromCart };

  // ════════════════════════════════════════════════
  //  9. INIT
  // ════════════════════════════════════════════════
  fetchMenu();

})();
