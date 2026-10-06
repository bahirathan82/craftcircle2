// ===== State =====
const API = '/api';
let state = {
  token: localStorage.getItem('cc_token') || null,
  user: JSON.parse(localStorage.getItem('cc_user') || 'null'),
  cart: { items: [] },
};

// ===== Helpers =====
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 2800);
}

async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && state.token) headers.Authorization = `Bearer ${state.token}`;

  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function setAuth(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem('cc_token', token || '');
  localStorage.setItem('cc_user', JSON.stringify(user || null));
  renderAuthArea();
}

function logout() {
  setAuth(null, null);
  state.cart = { items: [] };
  updateCartBadge();
  toast('Logged out');
  showView('home');
}

function renderAuthArea() {
  const area = document.getElementById('auth-area');
  const adminBtn = document.querySelector('.admin-only');
  if (state.user) {
    area.innerHTML = `
      <span style="color:#E7E8D1; font-size:0.88rem;">Hi, ${escapeHtml(state.user.name)}</span>
      <button class="btn-secondary" id="logout-btn">Log Out</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.querySelectorAll('.auth-required').forEach((el) => el.classList.remove('hidden'));
    adminBtn.classList.toggle('hidden', state.user.role !== 'admin');
  } else {
    area.innerHTML = `
      <button class="nav-btn" data-view="login">Log In</button>
      <button class="btn-primary" data-view="register">Sign Up</button>
    `;
    area.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
    document.querySelectorAll('.auth-required').forEach((el) => el.classList.add('hidden'));
    adminBtn.classList.add('hidden');
  }
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function requireLogin() {
  if (!state.user) {
    toast('Please log in first');
    showView('login');
    return false;
  }
  return true;
}

// ===== Routing =====
function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
  const el = document.getElementById('view-' + name);
  if (el) el.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (name === 'tutorials') loadTutorials();
  if (name === 'marketplace') loadProducts();
  if (name === 'cart') loadCart();
  if (name === 'orders') { if (requireLogin()) loadOrders(); }
  if (name === 'admin') { if (requireLogin()) loadAdmin(); }
}

document.querySelectorAll('[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// ===== Tutorials =====
async function loadTutorials() {
  const grid = document.getElementById('tutorials-grid');
  grid.innerHTML = '<p class="empty-state">Loading...</p>';
  const search = document.getElementById('tutorial-search').value.trim();
  const category = document.getElementById('tutorial-category').value;
  const qs = new URLSearchParams();
  if (search) qs.set('search', search);
  if (category) qs.set('category', category);

  try {
    const data = await api('/tutorials?' + qs.toString());
    if (!data.tutorials.length) {
      grid.innerHTML = '<p class="empty-state">No tutorials found. Be the first to upload one!</p>';
      return;
    }
    grid.innerHTML = data.tutorials.map(tutorialCard).join('');
    grid.querySelectorAll('[data-open-tutorial]').forEach((c) =>
      c.addEventListener('click', () => openTutorial(c.dataset.openTutorial))
    );
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

function tutorialCard(t) {
  return `
    <div class="card" data-open-tutorial="${t._id}" style="cursor:pointer">
      <span class="meta">${escapeHtml(t.category)} · ${escapeHtml(t.difficulty)}</span>
      <h3>${escapeHtml(t.title)}</h3>
      <p class="desc">${escapeHtml(t.description)}</p>
      <div class="stat-row">
        <span>❤️ ${t.likes?.length || 0}</span>
        <span>💬 ${t.comments?.length || 0}</span>
      </div>
      <div class="stat-row"><span>by ${escapeHtml(t.author?.name || 'Unknown')}</span></div>
    </div>
  `;
}

async function openTutorial(id) {
  showView('tutorial-detail');
  const container = document.getElementById('tutorial-detail-content');
  container.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const t = await api('/tutorials/' + id);
    const liked = state.user && t.likes.some((u) => (u._id || u) === state.user._id);
    container.innerHTML = `
      <span class="meta">${escapeHtml(t.category)} · ${escapeHtml(t.difficulty)}</span>
      <h2>${escapeHtml(t.title)}</h2>
      <p style="color:#6b5852">${escapeHtml(t.description)}</p>
      ${t.steps?.length ? '<ol>' + t.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('') + '</ol>' : ''}
      <p style="font-size:0.85rem;color:#8a7770">by ${escapeHtml(t.author?.name || 'Unknown')}</p>
      <button class="like-btn ${liked ? 'liked' : ''}" id="like-btn">❤️ ${t.likes.length} Likes</button>

      <h3 style="margin-top:1.5rem">Comments</h3>
      <div id="comments-list">
        ${t.comments.map((c) => `
          <div class="comment">
            <div class="author">${escapeHtml(c.user?.name || 'Anonymous')}</div>
            <div>${escapeHtml(c.text)}</div>
          </div>
        `).join('') || '<p class="empty-state">No comments yet.</p>'}
      </div>
      <form class="comment-form" id="comment-form">
        <input type="text" id="comment-text" placeholder="${state.user ? 'Add a comment...' : 'Log in to comment'}" ${state.user ? '' : 'disabled'} />
        <button type="submit" class="btn-primary" ${state.user ? '' : 'disabled'}>Post</button>
      </form>
    `;

    document.getElementById('like-btn').addEventListener('click', async () => {
      if (!requireLogin()) return;
      const r = await api(`/tutorials/${id}/like`, { method: 'PUT', auth: true });
      openTutorial(id); // refresh
    });

    document.getElementById('comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!requireLogin()) return;
      const text = document.getElementById('comment-text').value.trim();
      if (!text) return;
      await api(`/tutorials/${id}/comments`, { method: 'POST', auth: true, body: { text } });
      openTutorial(id);
    });
  } catch (err) {
    container.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

document.getElementById('tutorial-search').addEventListener('input', debounce(loadTutorials, 400));
document.getElementById('tutorial-category').addEventListener('change', loadTutorials);

document.getElementById('new-tutorial-btn').addEventListener('click', () => {
  if (!requireLogin()) return;
  document.getElementById('tutorial-form').classList.toggle('hidden');
});
document.getElementById('cancel-tutorial').addEventListener('click', () => {
  document.getElementById('tutorial-form').classList.add('hidden');
});
document.getElementById('tutorial-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/tutorials', {
      method: 'POST',
      auth: true,
      body: {
        title: document.getElementById('t-title').value,
        description: document.getElementById('t-description').value,
        category: document.getElementById('t-category').value,
        difficulty: document.getElementById('t-difficulty').value,
      },
    });
    toast('Tutorial published!');
    e.target.reset();
    document.getElementById('tutorial-form').classList.add('hidden');
    loadTutorials();
  } catch (err) {
    toast(err.message);
  }
});

// ===== Marketplace =====
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '<p class="empty-state">Loading...</p>';
  const search = document.getElementById('product-search').value.trim();
  const category = document.getElementById('product-category').value;
  const qs = new URLSearchParams();
  if (search) qs.set('search', search);
  if (category) qs.set('category', category);

  try {
    const data = await api('/products?' + qs.toString());
    if (!data.products.length) {
      grid.innerHTML = '<p class="empty-state">No products found. List the first one!</p>';
      return;
    }
    grid.innerHTML = data.products.map(productCard).join('');
    grid.querySelectorAll('[data-add-cart]').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(btn.dataset.addCart);
      })
    );
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

function productCard(p) {
  return `
    <div class="card">
      <span class="meta">${escapeHtml(p.category)}</span>
      <h3>${escapeHtml(p.name)}</h3>
      <p class="desc">${escapeHtml(p.description)}</p>
      <span class="price">$${Number(p.price).toFixed(2)}</span>
      <div class="stat-row"><span>by ${escapeHtml(p.seller?.name || 'Unknown')} · ${p.stock} in stock</span></div>
      <div class="card-actions">
        <button class="btn-primary" data-add-cart="${p._id}" ${p.stock < 1 ? 'disabled' : ''}>
          ${p.stock < 1 ? 'Out of stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  `;
}

document.getElementById('product-search').addEventListener('input', debounce(loadProducts, 400));
document.getElementById('product-category').addEventListener('change', loadProducts);

document.getElementById('new-product-btn').addEventListener('click', () => {
  if (!requireLogin()) return;
  document.getElementById('product-form').classList.toggle('hidden');
});
document.getElementById('cancel-product').addEventListener('click', () => {
  document.getElementById('product-form').classList.add('hidden');
});
document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/products', {
      method: 'POST',
      auth: true,
      body: {
        name: document.getElementById('p-name').value,
        description: document.getElementById('p-description').value,
        price: Number(document.getElementById('p-price').value),
        stock: Number(document.getElementById('p-stock').value) || 1,
        category: document.getElementById('p-category').value,
      },
    });
    toast('Product listed!');
    e.target.reset();
    document.getElementById('product-form').classList.add('hidden');
    loadProducts();
  } catch (err) {
    toast(err.message);
  }
});

// ===== Cart =====
async function addToCart(productId) {
  if (!requireLogin()) return;
  try {
    await api('/cart', { method: 'POST', auth: true, body: { productId, quantity: 1 } });
    toast('Added to cart');
    await refreshCartBadge();
  } catch (err) {
    toast(err.message);
  }
}

async function refreshCartBadge() {
  if (!state.user) return updateCartBadge();
  try {
    const cart = await api('/cart', { auth: true });
    state.cart = cart;
    updateCartBadge();
  } catch (_) {}
}

function updateCartBadge() {
  const count = (state.cart.items || []).reduce((s, i) => s + i.quantity, 0);
  document.getElementById('cart-count').textContent = count;
}

async function loadCart() {
  if (!requireLogin()) return;
  const container = document.getElementById('cart-content');
  container.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const cart = await api('/cart', { auth: true });
    state.cart = cart;
    updateCartBadge();

    if (!cart.items.length) {
      container.innerHTML = '<p class="empty-state">Your cart is empty.</p>';
      return;
    }

    let total = 0;
    const rows = cart.items.map((item) => {
      const p = item.product;
      const lineTotal = p.price * item.quantity;
      total += lineTotal;
      return `
        <div class="cart-row">
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <div style="font-size:0.85rem;color:#8a7770">$${p.price.toFixed(2)} each</div>
          </div>
          <div class="qty-controls">
            <button data-qty-down="${p._id}">−</button>
            <span>${item.quantity}</span>
            <button data-qty-up="${p._id}">+</button>
          </div>
          <div><strong>$${lineTotal.toFixed(2)}</strong></div>
          <button class="btn-secondary" data-remove="${p._id}">Remove</button>
        </div>
      `;
    }).join('');

    container.innerHTML = rows + `
      <div class="cart-summary">
        <span>Total: $${total.toFixed(2)}</span>
        <button class="btn-primary" id="checkout-btn">Checkout</button>
      </div>
    `;

    container.querySelectorAll('[data-qty-up]').forEach((b) =>
      b.addEventListener('click', () => changeQty(b.dataset.qtyUp, 1)));
    container.querySelectorAll('[data-qty-down]').forEach((b) =>
      b.addEventListener('click', () => changeQty(b.dataset.qtyDown, -1)));
    container.querySelectorAll('[data-remove]').forEach((b) =>
      b.addEventListener('click', () => removeItem(b.dataset.remove)));
    document.getElementById('checkout-btn').addEventListener('click', checkout);
  } catch (err) {
    container.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

async function changeQty(productId, delta) {
  const item = state.cart.items.find((i) => i.product._id === productId);
  if (!item) return;
  const newQty = item.quantity + delta;
  try {
    await api('/cart/' + productId, { method: 'PUT', auth: true, body: { quantity: newQty } });
    loadCart();
  } catch (err) {
    toast(err.message);
  }
}

async function removeItem(productId) {
  try {
    await api('/cart/' + productId, { method: 'DELETE', auth: true });
    loadCart();
  } catch (err) {
    toast(err.message);
  }
}

async function checkout() {
  try {
    await api('/orders', { method: 'POST', auth: true, body: { shippingAddress: {} } });
    toast('Order placed!');
    await refreshCartBadge();
    showView('orders');
  } catch (err) {
    toast(err.message);
  }
}

// ===== Orders =====
async function loadOrders() {
  const container = document.getElementById('orders-content');
  container.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const orders = await api('/orders', { auth: true });
    if (!orders.length) {
      container.innerHTML = '<p class="empty-state">No orders yet.</p>';
      return;
    }
    container.innerHTML = orders.map((o) => `
      <div class="order-card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">
          <strong>Order #${o._id.slice(-6).toUpperCase()}</strong>
          <span class="status-pill">${o.status}</span>
        </div>
        <p style="font-size:0.85rem;color:#8a7770;margin:0.4rem 0">
          ${o.items.map((i) => `${i.quantity}× ${escapeHtml(i.name)}`).join(', ')}
        </p>
        <strong>$${o.totalAmount.toFixed(2)}</strong>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

// ===== Admin =====
async function loadAdmin() {
  if (!state.user || state.user.role !== 'admin') {
    toast('Admin access required');
    showView('home');
    return;
  }
  try {
    const stats = await api('/admin/stats', { auth: true });
    document.getElementById('admin-stats').innerHTML = `
      <div class="stat-box"><div class="num">${stats.userCount}</div><div class="label">Users</div></div>
      <div class="stat-box"><div class="num">${stats.tutorialCount}</div><div class="label">Tutorials</div></div>
      <div class="stat-box"><div class="num">${stats.productCount}</div><div class="label">Products</div></div>
      <div class="stat-box"><div class="num">${stats.orderCount}</div><div class="label">Orders</div></div>
    `;

    const orders = await api('/admin/orders', { auth: true });
    document.getElementById('admin-orders').innerHTML = orders.map((o) => `
      <div class="admin-row">
        <span>#${o._id.slice(-6).toUpperCase()} — ${escapeHtml(o.user?.name || '—')} — $${o.totalAmount.toFixed(2)}</span>
        <select data-order-status="${o._id}">
          ${['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(
            (s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
    `).join('') || '<p class="empty-state">No orders yet.</p>';

    document.querySelectorAll('[data-order-status]').forEach((sel) =>
      sel.addEventListener('change', async () => {
        await api(`/admin/orders/${sel.dataset.orderStatus}/status`, {
          method: 'PUT', auth: true, body: { status: sel.value },
        });
        toast('Order status updated');
      })
    );

    const users = await api('/admin/users', { auth: true });
    document.getElementById('admin-users').innerHTML = users.map((u) => `
      <div class="admin-row">
        <span>${escapeHtml(u.name)} — ${escapeHtml(u.email)} — ${u.role}</span>
        <button class="btn-secondary" data-toggle-user="${u._id}" data-active="${u.isActive}">
          ${u.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    `).join('') || '<p class="empty-state">No users yet.</p>';

    document.querySelectorAll('[data-toggle-user]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const isActive = btn.dataset.active === 'true';
        await api(`/admin/users/${btn.dataset.toggleUser}/status`, {
          method: 'PUT', auth: true, body: { isActive: !isActive },
        });
        loadAdmin();
      })
    );
  } catch (err) {
    toast(err.message);
  }
}

// ===== Auth forms =====
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      },
    });
    const { token, ...user } = data;
    setAuth(user, token);
    toast(`Welcome back, ${user.name}!`);
    await refreshCartBadge();
    showView('home');
    e.target.reset();
  } catch (err) {
    toast(err.message);
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
      },
    });
    const { token, ...user } = data;
    setAuth(user, token);
    toast(`Welcome to CraftCircle, ${user.name}!`);
    showView('home');
    e.target.reset();
  } catch (err) {
    toast(err.message);
  }
});

// ===== Utils =====
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ===== Init =====
renderAuthArea();
if (state.user) refreshCartBadge();
showView('home');
