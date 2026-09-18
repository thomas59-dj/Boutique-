/* =========================================================
   BOUTIQUE — cart.js
   Gestion du panier. Utilisateur connecté -> panier stocké
   en base (API /cart). Utilisateur invité -> panier stocké
   en localStorage, fusionné avec le panier serveur à la
   connexion (voir auth.js -> mergeCartOnLogin).
   ========================================================= */

const LOCAL_CART_KEY = 'boutique_local_cart';
const SHIPPING_COST = 3.99;

function isLoggedIn() {
  return Boolean(getToken());
}

// --- Panier local (invité) : tableau de {productId, name, price, image, quantity} ---
function getLocalCart() {
  const raw = localStorage.getItem(LOCAL_CART_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveLocalCart(items) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
}

/**
 * Renvoie le panier sous une forme unifiée :
 * { items: [{ id, productId, name, price, image, quantity }], source: 'server' | 'local' }
 * `id` est l'id de la ligne côté serveur, ou l'id produit côté local (pour identifier la ligne dans le DOM).
 */
async function getCart() {
  if (isLoggedIn()) {
    const cart = await api.get('/cart');
    return {
      source: 'server',
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        quantity: item.quantity,
      })),
    };
  }

  return { source: 'local', items: getLocalCart() };
}

async function addToCart(product, quantity = 1) {
  if (isLoggedIn()) {
    await api.post('/cart/items', { productId: product.id, quantity });
    return;
  }

  const items = getLocalCart();
  const existing = items.find((item) => item.productId === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    });
  }
  saveLocalCart(items);
}

async function updateCartItemQuantity(itemOrProductId, quantity) {
  if (isLoggedIn()) {
    await api.put(`/cart/items/${itemOrProductId}`, { quantity });
    return;
  }

  const items = getLocalCart();
  const item = items.find((i) => i.productId === itemOrProductId);
  if (!item) return;
  if (quantity <= 0) {
    saveLocalCart(items.filter((i) => i.productId !== itemOrProductId));
  } else {
    item.quantity = quantity;
    saveLocalCart(items);
  }
}

async function removeCartItem(itemOrProductId) {
  if (isLoggedIn()) {
    await api.delete(`/cart/items/${itemOrProductId}`);
    return;
  }
  const items = getLocalCart().filter((i) => i.productId !== itemOrProductId);
  saveLocalCart(items);
}

/**
 * Appelée juste après une connexion réussie : envoie le panier local
 * au serveur pour fusion, puis vide le panier local.
 */
async function mergeCartOnLogin() {
  const localItems = getLocalCart();
  if (!localItems.length) return;

  try {
    await api.post('/cart/merge', {
      items: localItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
    saveLocalCart([]);
  } catch (err) {
    console.error('Échec de la fusion du panier :', err);
  }
}

/** Met à jour le badge numérique sur l'icône panier du header, sur toutes les pages. */
async function updateCartCountBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  try {
    const { items } = await getCart();
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  } catch (err) {
    // Si l'utilisateur a un token expiré, on l'ignore silencieusement ici
  }
}

/* ---------------------------------------------------------
   Page cart.html
   --------------------------------------------------------- */
async function initCartPage() {
  const container = document.getElementById('cartItems');
  if (!container) return;

  const template = document.getElementById('cartItemTemplate');
  const emptyEl = document.getElementById('emptyCart');
  const checkoutBtn = document.getElementById('checkoutBtn');

  async function render() {
    const { items } = await getCart();
    container.innerHTML = '';

    if (!items.length) {
      emptyEl.hidden = false;
      checkoutBtn.setAttribute('aria-disabled', 'true');
      checkoutBtn.classList.add('btn-disabled');
      updateSummary([]);
      return;
    }
    emptyEl.hidden = true;
    checkoutBtn.removeAttribute('aria-disabled');

    items.forEach((item) => {
      const node = template.content.cloneNode(true);
      node.querySelector('.cart-item-image').src = item.image;
      node.querySelector('.cart-item-image').alt = item.name;
      node.querySelector('.cart-item-name').textContent = item.name;
      node.querySelector('.cart-item-qty').textContent = item.quantity;
      node.querySelector('.cart-item-price').textContent = `${(item.price * item.quantity).toFixed(2)} €`;

      const rowId = item.id ?? item.productId; // id serveur si connecté, sinon productId
      const identifier = isLoggedIn() ? item.id : item.productId;

      node.querySelector('.decrease-qty').addEventListener('click', async () => {
        await updateCartItemQuantity(identifier, item.quantity - 1);
        await render();
        await updateCartCountBadge();
      });
      node.querySelector('.increase-qty').addEventListener('click', async () => {
        await updateCartItemQuantity(identifier, item.quantity + 1);
        await render();
        await updateCartCountBadge();
      });
      node.querySelector('.remove-item-btn').addEventListener('click', async () => {
        await removeCartItem(identifier);
        await render();
        await updateCartCountBadge();
      });

      container.appendChild(node);
    });

    updateSummary(items);
  }

  function updateSummary(items) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = items.length ? SHIPPING_COST : 0;
    document.getElementById('summarySubtotal').textContent = `${subtotal.toFixed(2)} €`;
    document.getElementById('summaryShipping').textContent = `${shipping.toFixed(2)} €`;
    document.getElementById('summaryTotal').textContent = `${(subtotal + shipping).toFixed(2)} €`;
  }

  await render();
}
