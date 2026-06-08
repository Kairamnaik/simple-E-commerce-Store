const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
  ? (window.location.port === '5005' ? '/api' : 'http://localhost:5005/api')
  : (window.location.origin.includes('simple-e-commerce-store-ozcw.onrender.com') ? '/api' : 'https://simple-e-commerce-store-ozcw.onrender.com/api');

// Global Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Initialize Application
async function initApp() {
  updateCartCountBadge();
  await checkUserSession();
  
  // Basic routing based on HTML page pathname
  const path = window.location.pathname;
  
  if (path.endsWith('products.html')) {
    initCatalogPage();
  } else if (path.endsWith('product.html')) {
    initProductDetailsPage();
  } else if (path.endsWith('cart.html')) {
    initCartPage();
  } else if (path.endsWith('login.html')) {
    initLoginPage();
  } else if (path.endsWith('register.html')) {
    initRegisterPage();
  } else {
    // Default or index.html
    initHomePage();
  }
}

// ==========================================
// Authentication State Management
// ==========================================
let currentUser = null;

async function checkUserSession() {
  const token = localStorage.getItem('token');
  const authNav = document.getElementById('auth-nav-container');
  
  if (!token) {
    currentUser = null;
    updateAuthUI(false);
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      currentUser = await res.json();
      updateAuthUI(true);
    } else {
      // Token is invalid or expired
      localStorage.removeItem('token');
      currentUser = null;
      updateAuthUI(false);
    }
  } catch (error) {
    console.error('Session check failed:', error);
    updateAuthUI(false);
  }
}

function updateAuthUI(isLoggedIn) {
  const authNav = document.getElementById('auth-nav-container');
  if (!authNav) return;

  if (isLoggedIn && currentUser) {
    authNav.innerHTML = `
      <div class="user-profile-nav">
        <span class="nav-username">Hi, ${currentUser.username}</span>
        <button onclick="handleLogout()" class="btn-nav-logout">Log Out</button>
      </div>
    `;
  } else {
    authNav.innerHTML = `
      <button onclick="location.href='login.html'" class="btn-nav-login">Log In</button>
      <button onclick="location.href='register.html'" class="btn-nav-register">Sign Up</button>
    `;
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  currentUser = null;
  showToast('Logged out successfully.', 'success');
  updateAuthUI(false);
  
  // Redirect to home if current page requires login
  if (window.location.pathname.endsWith('cart.html')) {
    initCartPage(); // Re-render cart page to show login prompt
  } else {
    window.location.href = 'index.html';
  }
}

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);
  
  // Trigger animation after adding to DOM
  setTimeout(() => toast.classList.add('show'), 50);

  // Remove toast after delay
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// Cart State Hook
// ==========================================
function getCart() {
  const cartJson = localStorage.getItem('cart');
  return cartJson ? JSON.parse(cartJson) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCountBadge();
}

function addToCart(product, quantity = 1) {
  let cart = getCart();
  const existingItemIndex = cart.findIndex(item => item.product_id === product.id);

  if (existingItemIndex > -1) {
    // Verify we do not exceed stock limits
    if (cart[existingItemIndex].quantity + quantity > product.stock) {
      showToast(`Cannot add items. Only ${product.stock} units are available in stock.`, 'error');
      return false;
    }
    cart[existingItemIndex].quantity += quantity;
  } else {
    if (quantity > product.stock) {
      showToast(`Cannot add items. Only ${product.stock} units are available in stock.`, 'error');
      return false;
    }
    cart.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: quantity,
      stock: product.stock
    });
  }

  saveCart(cart);
  showToast(`Added ${product.name} to your cart.`, 'success');
  return true;
}

function updateCartCountBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;

  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = count;
}

// ==========================================
// Home Page Routing
// ==========================================
async function initHomePage() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (res.ok) {
      const allProducts = await res.json();
      // Render first 3 as featured products
      const featured = allProducts.slice(0, 3);
      renderProductsGrid(featured, 'featured-products-grid');
    }
  } catch (err) {
    console.error('Error loading featured products:', err);
  }

  // Render Order history if logged in
  if (currentUser) {
    const ordersSection = document.getElementById('user-orders-section');
    if (ordersSection) {
      ordersSection.style.display = 'block';
      loadOrderHistory();
    }
  }
}

async function loadOrderHistory() {
  const token = localStorage.getItem('token');
  const historyList = document.getElementById('orders-history-list');
  if (!historyList) return;

  try {
    const res = await fetch(`${API_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const orders = await res.json();
      if (orders.length === 0) {
        historyList.innerHTML = `<p style="color: var(--text-muted);">You have not placed any orders yet.</p>`;
        return;
      }

      historyList.innerHTML = orders.map(order => {
        const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const itemsHtml = order.items.map(item => `
          <div class="order-history-item">
            <div class="order-item-qty-name">
              <span class="order-item-qty">${item.quantity}x</span>
              <span>${item.product_name}</span>
            </div>
            <span class="order-item-price-sub">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('');

        return `
          <div class="order-history-card">
            <div class="order-history-header">
              <div>Order ID: <span class="order-id">#${order.id}</span></div>
              <div class="order-date">${orderDate}</div>
              <div>Status: <span style="font-weight:700; color:var(--success);">${order.status}</span></div>
              <div>Total: <span class="order-total">$${order.total_amount.toFixed(2)}</span></div>
            </div>
            <div class="order-history-items">
              ${itemsHtml}
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    historyList.innerHTML = `<p style="color: var(--error);">Error loading your order history.</p>`;
  }
}

// ==========================================
// Catalog Page Routing (products.html)
// ==========================================
let dbProducts = [];

async function initCatalogPage() {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const sortSelect = document.getElementById('sort-select');

  try {
    const res = await fetch(`${API_URL}/products`);
    if (res.ok) {
      dbProducts = await res.json();
      filterAndRenderProducts();
    }
  } catch (err) {
    console.error('Error loading catalog products:', err);
    document.getElementById('catalog-products-grid').innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--error);">Error downloading products from API.</p>`;
  }

  // Add event listeners for sorting and filtering
  if (searchInput) {
    searchInput.addEventListener('input', filterAndRenderProducts);
  }

  if (categoryFilter) {
    categoryFilter.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        categoryFilter.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        filterAndRenderProducts();
      });
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', filterAndRenderProducts);
  }
}

function filterAndRenderProducts() {
  let filtered = [...dbProducts];

  // Apply Search
  const searchVal = document.getElementById('search-input')?.value.toLowerCase().trim();
  if (searchVal) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchVal) || 
      p.description.toLowerCase().includes(searchVal)
    );
  }

  // Apply Category
  const activeCategoryEl = document.querySelector('#category-filter .category-item.active');
  const activeCategory = activeCategoryEl?.getAttribute('data-category');
  if (activeCategory && activeCategory !== 'all') {
    filtered = filtered.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
  }

  // Apply Sorting
  const sortVal = document.getElementById('sort-select')?.value;
  if (sortVal === 'price-low-high') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortVal === 'price-high-low') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortVal === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  renderProductsGrid(filtered, 'catalog-products-grid');
}

function renderProductsGrid(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem 2rem;">No items found matching your filters.</p>`;
    return;
  }

  container.innerHTML = products.map(product => {
    const isOutOfStock = product.stock <= 0;
    const footerActionHtml = isOutOfStock
      ? `<span class="product-out-of-stock">Out of stock</span>`
      : `
        <button onclick="handleAddToCartClick('${product.id}')" class="btn-card-add" aria-label="Add ${product.name} to Cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      `;

    return `
      <article class="product-card">
        <span class="product-badge">${product.category}</span>
        <div class="product-image-wrapper">
          <a href="product.html?id=${product.id}">
            <img src="${product.image_url}" alt="${product.name}" class="product-card-img" onerror="this.src='https://placehold.co/400x400/1e293b/fff?text=Apex+Gear'">
          </a>
        </div>
        <div class="product-card-body">
          <h3 class="product-card-title"><a href="product.html?id=${product.id}">${product.name}</a></h3>
          <p class="product-card-desc">${product.description}</p>
          <div class="product-card-footer">
            <span class="product-card-price">$${product.price.toFixed(2)}</span>
            ${footerActionHtml}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Global hook for card add click
window.handleAddToCartClick = async function(productId) {
  try {
    const res = await fetch(`${API_URL}/products/${productId}`);
    if (res.ok) {
      const product = await res.json();
      addToCart(product, 1);
    }
  } catch (error) {
    console.error('Error adding card to cart:', error);
  }
};

// ==========================================
// Product Details Routing (product.html)
// ==========================================
let activeDetailProduct = null;

async function initProductDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const content = document.getElementById('product-details-content');
  if (!content) return;

  if (!productId) {
    content.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--error); padding: 4rem;">Product ID is missing in request.</p>`;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/products/${productId}`);
    if (res.ok) {
      activeDetailProduct = await res.json();
      renderProductDetails(activeDetailProduct);
    } else {
      content.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--error); padding: 4rem;">Product not found or has been removed.</p>`;
    }
  } catch (err) {
    console.error('Error fetching detail product:', err);
    content.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--error); padding: 4rem;">Database error downloading product details.</p>`;
  }
}

function renderProductDetails(product) {
  const content = document.getElementById('product-details-content');
  if (!content) return;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  
  let stockBadgeHtml = `<span class="product-detail-stock">In Stock (${product.stock} left)</span>`;
  if (isOutOfStock) {
    stockBadgeHtml = `<span class="product-detail-stock out-of-stock">Out of Stock</span>`;
  } else if (isLowStock) {
    stockBadgeHtml = `<span class="product-detail-stock low-stock">Low Stock (Only ${product.stock} left)</span>`;
  }

  const actionsHtml = isOutOfStock
    ? `<p style="color:var(--error); font-weight:700; font-size:1.1rem; margin-top:1rem;">This product is currently sold out. Check back later!</p>`
    : `
      <div class="product-actions-block">
        <div class="quantity-selector">
          <button type="button" class="btn-qty" onclick="changeDetailQty(-1)" aria-label="Decrease quantity">-</button>
          <input type="text" id="detail-qty" class="qty-input" value="1" readonly>
          <button type="button" class="btn-qty" onclick="changeDetailQty(1)" aria-label="Increase quantity">+</button>
        </div>
        <button onclick="handleDetailAddToCart()" class="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          Add to Cart
        </button>
      </div>
    `;

  content.innerHTML = `
    <div class="product-detail-gallery">
      <img src="${product.image_url}" alt="${product.name}" class="product-detail-img" onerror="this.src='https://placehold.co/600x400/1e293b/fff?text=Apex+Gear'">
    </div>
    
    <div class="product-detail-info">
      <span class="product-detail-category">${product.category}</span>
      <h1 class="product-detail-title">${product.name}</h1>
      <div class="product-detail-price">
        $${product.price.toFixed(2)}
        ${stockBadgeHtml}
      </div>
      <p class="product-detail-desc">${product.description}</p>
      
      ${actionsHtml}
    </div>
  `;
}

window.changeDetailQty = function(amount) {
  const qtyInput = document.getElementById('detail-qty');
  if (!qtyInput || !activeDetailProduct) return;

  let val = parseInt(qtyInput.value) + amount;
  if (val < 1) val = 1;
  if (val > activeDetailProduct.stock) {
    showToast(`Only ${activeDetailProduct.stock} items in stock.`, 'error');
    val = activeDetailProduct.stock;
  }
  qtyInput.value = val;
};

window.handleDetailAddToCart = function() {
  const qtyInput = document.getElementById('detail-qty');
  if (!qtyInput || !activeDetailProduct) return;

  const qty = parseInt(qtyInput.value);
  addToCart(activeDetailProduct, qty);
};

// ==========================================
// Shopping Cart Routing (cart.html)
// ==========================================
function initCartPage() {
  const cartItemsList = document.getElementById('cart-items-list');
  const checkoutForm = document.getElementById('checkout-form');
  const authPrompt = document.getElementById('checkout-auth-prompt');

  if (!cartItemsList) return;

  const cart = getCart();

  // Handle display of checkout form vs auth prompts
  if (currentUser) {
    if (checkoutForm) checkoutForm.style.display = 'block';
    if (authPrompt) authPrompt.style.display = 'none';
  } else {
    if (checkoutForm) checkoutForm.style.display = 'none';
    if (authPrompt) authPrompt.style.display = 'block';
  }

  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div class="cart-empty-message">
        <div class="cart-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </div>
        <h2>Your cart is currently empty</h2>
        <p>Before you check out, you must add some products to your shopping cart.</p>
        <a href="products.html" class="btn-primary">Start Shopping</a>
      </div>
    `;
    
    // Set summary to zero
    document.getElementById('summary-subtotal').textContent = '$0.00';
    document.getElementById('summary-shipping').textContent = '$0.00';
    document.getElementById('summary-tax').textContent = '$0.00';
    document.getElementById('summary-total').textContent = '$0.00';
    
    if (checkoutForm) checkoutForm.style.display = 'none'; // Hide checkout if empty
    return;
  }

  // Render items
  cartItemsList.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <img src="${item.image_url}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://placehold.co/100x100/1e293b/fff?text=Apex+Gear'">
      <div class="cart-item-details">
        <h3 class="cart-item-name"><a href="product.html?id=${item.product_id}">${item.name}</a></h3>
        <span class="cart-item-price">$${item.price.toFixed(2)}</span>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-selector">
          <button class="btn-qty" onclick="changeCartItemQty(${idx}, -1)" aria-label="Decrease quantity">-</button>
          <span class="qty-input" style="line-height:40px;">${item.quantity}</span>
          <button class="btn-qty" onclick="changeCartItemQty(${idx}, 1)" aria-label="Increase quantity">+</button>
        </div>
        <button class="btn-item-delete" onclick="removeCartItem(${idx})" aria-label="Remove item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
      </div>
    </div>
  `).join('');

  calculateCartSummary(cart);

  // Form submit handler
  if (checkoutForm) {
    checkoutForm.onsubmit = handleOrderCheckout;
  }
}

window.changeCartItemQty = function(itemIndex, amount) {
  let cart = getCart();
  if (!cart[itemIndex]) return;

  let newQty = cart[itemIndex].quantity + amount;
  if (newQty < 1) return;

  if (newQty > cart[itemIndex].stock) {
    showToast(`Only ${cart[itemIndex].stock} units are in stock.`, 'error');
    newQty = cart[itemIndex].stock;
  }

  cart[itemIndex].quantity = newQty;
  saveCart(cart);
  initCartPage(); // Re-render
};

window.removeCartItem = function(itemIndex) {
  let cart = getCart();
  const deletedItemName = cart[itemIndex]?.name;
  cart.splice(itemIndex, 1);
  saveCart(cart);
  initCartPage(); // Re-render
  showToast(`Removed ${deletedItemName} from cart.`, 'success');
};

function calculateCartSummary(cart) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Free shipping over $100, else $10.00
  const shipping = subtotal > 100 ? 0.00 : 10.00;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
  document.getElementById('summary-tax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;
}

async function handleOrderCheckout(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const errorBanner = document.getElementById('checkout-error-banner');
  
  if (errorBanner) errorBanner.style.display = 'none';

  if (!token) {
    showToast('Session expired. Please log in again.', 'error');
    window.location.href = 'login.html';
    return;
  }

  const cart = getCart();
  const orderItems = cart.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price
  }));

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items: orderItems })
    });

    const data = await res.json();

    if (res.ok) {
      // Clear Cart
      localStorage.removeItem('cart');
      updateCartCountBadge();
      
      // Success Redirect with feedback
      showToast('Order processed successfully! Thank you.', 'success');
      
      // Render confirmation details instead of form
      const cartPageLayout = document.getElementById('cart-page-layout');
      if (cartPageLayout) {
        cartPageLayout.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; background: var(--bg-surface-glass); border: 1px solid var(--border-color); border-radius: var(--radius-lg); display:flex; flex-direction:column; align-items:center; gap: 1.5rem;">
            <div style="width:72px; height:72px; border-radius:50%; background:rgba(16, 185, 129, 0.1); color:var(--success); border:1px solid rgba(16, 185, 129, 0.2); display:flex; align-items:center; justify-content:center; font-size: 2rem;">✓</div>
            <h2>Order Confirmed!</h2>
            <p>Your order (ID: #${data.orderId}) has been registered and is being processed.</p>
            <p style="color:var(--text-muted); max-width:450px;">A receipt has been sent to your registered profile email. You can check order statuses in your profile history.</p>
            <div style="display:flex; gap:1rem;">
              <a href="index.html" class="btn-primary">Go to Homepage</a>
              <a href="products.html" class="btn-secondary">Keep Shopping</a>
            </div>
          </div>
        `;
      }
    } else {
      if (errorBanner) {
        errorBanner.textContent = data.message || 'Checkout failed. Please try again.';
        errorBanner.style.display = 'block';
        errorBanner.scrollIntoView({ behavior: 'smooth' });
      } else {
        showToast(data.message || 'Checkout failed.', 'error');
      }
    }
  } catch (error) {
    console.error('Checkout error:', error);
    showToast('Failed to connect to checkout API. Try again.', 'error');
  }
}

// ==========================================
// Login Page Routing (login.html)
// ==========================================
function initLoginPage() {
  const form = document.getElementById('login-form');
  const alertEl = document.getElementById('login-error-alert');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (alertEl) alertEl.style.display = 'none';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        showToast(`Welcome back, ${data.user.username}!`, 'success');
        
        // Redirect to cart if they had items, otherwise home
        const cart = getCart();
        setTimeout(() => {
          if (cart.length > 0) {
            window.location.href = 'cart.html';
          } else {
            window.location.href = 'index.html';
          }
        }, 1000);
      } else {
        if (alertEl) {
          alertEl.textContent = data.message || 'Invalid email or password.';
          alertEl.style.display = 'block';
        } else {
          showToast(data.message || 'Login failed.', 'error');
        }
      }
    } catch (err) {
      console.error('Login request failed:', err);
      showToast('Network error during authentication.', 'error');
    }
  };
}

// ==========================================
// Register Page Routing (register.html)
// ==========================================
function initRegisterPage() {
  const form = document.getElementById('register-form');
  const alertEl = document.getElementById('register-error-alert');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (alertEl) alertEl.style.display = 'none';

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        showToast('Registration successful! Profile active.', 'success');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        if (alertEl) {
          alertEl.textContent = data.message || 'Registration failed.';
          alertEl.style.display = 'block';
        } else {
          showToast(data.message || 'Registration failed.', 'error');
        }
      }
    } catch (err) {
      console.error('Registration failed:', err);
      showToast('Network error during registration.', 'error');
    }
  };
}
