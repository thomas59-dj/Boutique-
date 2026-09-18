/* =========================================================
   BOUTIQUE — main.js
   Point d'entrée commun à toutes les pages : interactions du
   header partagées, puis initialisation de la page courante
   (chaque fonction initXxxPage() se termine tôt si les
   éléments concernés ne sont pas présents sur la page).
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderInteractions();
  renderUserMenu();
  updateCartCountBadge();

  initHomePage();
  initShopPage();
  initProductPage();
  initCartPage();
  initLoginPage();
  initCheckoutPage();
  initAccountAuthForms();
  initAccountOrdersAndSettings();
});

/** Interactions génériques du header, présentes sur toutes les pages. */
function initHeaderInteractions() {
  // Menu hamburger (mobile)
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mainNav = document.getElementById('mainNav');
  hamburgerBtn?.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    hamburgerBtn.setAttribute('aria-expanded', isOpen);
  });

  // Dropdown du menu utilisateur
  const userMenuToggle = document.getElementById('userMenuToggle');
  const userMenuDropdown = document.getElementById('userMenuDropdown');
  userMenuToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = userMenuDropdown.classList.toggle('open');
    userMenuToggle.setAttribute('aria-expanded', isOpen);
  });
  document.addEventListener('click', (e) => {
    if (userMenuDropdown?.classList.contains('open') && !userMenuDropdown.contains(e.target)) {
      userMenuDropdown.classList.remove('open');
      userMenuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Barre de recherche repliable (icône loupe dans le header, hors shop.html)
  const searchToggle = document.getElementById('searchToggle');
  searchToggle?.addEventListener('click', () => {
    window.location.href = 'shop.html';
  });
}

/* ---------------------------------------------------------
   Page account.html : onglets + historique des commandes
   --------------------------------------------------------- */
function initAccountOrdersAndSettings() {
  const tabs = document.querySelectorAll('.tab-btn');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach((panel) => (panel.hidden = true));
      document.getElementById(`tab-${tab.dataset.tab}`).hidden = false;

      if (tab.dataset.tab === 'orders') loadOrders();
    });
  });

  // Ouvre directement l'onglet Commandes si l'URL contient #orders
  if (window.location.hash === '#orders') {
    document.querySelector('.tab-btn[data-tab="orders"]')?.click();
  }

  async function loadOrders() {
    const listEl = document.getElementById('ordersList');
    const emptyEl = document.getElementById('noOrders');
    const template = document.getElementById('orderCardTemplate');

    try {
      const orders = await api.get('/orders');
      listEl.innerHTML = '';
      emptyEl.hidden = orders.length > 0;

      orders.forEach((order) => {
        const node = template.content.cloneNode(true);
        node.querySelector('.order-id').textContent = `Commande #${order.id.slice(0, 8)}`;
        node.querySelector('.order-date').textContent = new Date(order.createdAt).toLocaleDateString('fr-FR');
        node.querySelector('.order-status').textContent = order.status;
        node.querySelector('.order-items').innerHTML = order.items
          .map((i) => `<div>${i.name} × ${i.quantity}</div>`)
          .join('');
        node.querySelector('.order-total').textContent = `Total : ${order.total.toFixed(2)} €`;
        listEl.appendChild(node);
      });
    } catch (err) {
      listEl.innerHTML = `<p class="empty-state">${err.message}</p>`;
    }
  }

  // Changement de mot de passe (onglet Paramètres)
  document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageEl = document.getElementById('settingsMessage');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
      await api.put('/users/me/password', { currentPassword, newPassword });
      messageEl.textContent = 'Mot de passe mis à jour.';
      messageEl.className = 'form-message success';
      e.target.reset();
    } catch (err) {
      messageEl.textContent = err.message;
      messageEl.className = 'form-message error';
    }
  });
}
