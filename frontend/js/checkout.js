/* =========================================================
   BOUTIQUE — checkout.js
   Tunnel de commande en 3 étapes : Shipping -> Payment ->
   Review & Place Order. Page protégée (connexion requise).
   ========================================================= */

async function initCheckoutPage() {
  const stepsEl = document.getElementById('checkoutSteps');
  if (!stepsEl) return;

  // Page protégée : redirige vers le login si l'utilisateur n'est pas connecté
  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=checkout';
    return;
  }

  const panels = {
    1: document.getElementById('stepShipping'),
    2: document.getElementById('stepPayment'),
    3: document.getElementById('stepReview'),
    confirmed: document.getElementById('stepConfirmed'),
  };
  const stepEls = stepsEl.querySelectorAll('.step');

  const checkoutState = {
    addressId: null,
    address: null,
    paymentMethod: 'CREDIT_CARD_DEMO',
    cartItems: [],
  };

  function goToStep(step) {
    Object.values(panels).forEach((p) => (p.hidden = true));
    panels[step].hidden = false;
    stepEls.forEach((el) => {
      const n = Number(el.dataset.step);
      el.classList.toggle('active', n === step);
      el.classList.toggle('done', n < step);
    });
  }

  // --- Résumé de commande affiché en permanence dans la colonne de droite ---
  async function renderSummary() {
    const { items } = await getCart();
    checkoutState.cartItems = items;

    if (!items.length) {
      // Rien à commander : retour au panier
      window.location.href = 'cart.html';
      return;
    }

    document.getElementById('checkoutItems').innerHTML = items
      .map((item) => `<div class="summary-line"><span>${item.name} × ${item.quantity}</span><span>${(item.price * item.quantity).toFixed(2)} €</span></div>`)
      .join('');

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = SHIPPING_COST;
    document.getElementById('checkoutSubtotal').textContent = `${subtotal.toFixed(2)} €`;
    document.getElementById('checkoutShipping').textContent = `${shipping.toFixed(2)} €`;
    document.getElementById('checkoutTotal').textContent = `${(subtotal + shipping).toFixed(2)} €`;
  }

  // --- Étape 1 : adresse de livraison ---
  // Pré-remplit avec une adresse existante si l'utilisateur en a déjà une
  try {
    const addresses = await api.get('/users/me/addresses');
    if (addresses.length) {
      const a = addresses[0];
      document.getElementById('fullName').value = a.fullName;
      document.getElementById('address').value = a.address;
      document.getElementById('city').value = a.city;
      document.getElementById('zipCode').value = a.zipCode;
      document.getElementById('country').value = a.country;
      document.getElementById('phone').value = a.phone;
      checkoutState.addressId = a.id;
      checkoutState.address = a;
    }
  } catch (err) {
    // Pas grave si ça échoue : le formulaire reste vide
  }

  document.getElementById('shippingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      fullName: document.getElementById('fullName').value.trim(),
      address: document.getElementById('address').value.trim(),
      city: document.getElementById('city').value.trim(),
      zipCode: document.getElementById('zipCode').value.trim(),
      country: document.getElementById('country').value.trim(),
      phone: document.getElementById('phone').value.trim(),
    };
    try {
      // On enregistre toujours une nouvelle adresse pour rester simple et fiable
      const address = await api.post('/users/me/addresses', payload);
      checkoutState.addressId = address.id;
      checkoutState.address = address;
      goToStep(2);
    } catch (err) {
      alert(err.message);
    }
  });

  // --- Étape 2 : moyen de paiement ---
  document.getElementById('backToShipping').addEventListener('click', () => goToStep(1));
  document.getElementById('paymentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    checkoutState.paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    renderReview();
    goToStep(3);
  });

  // --- Étape 3 : vérification et validation ---
  function renderReview() {
    document.getElementById('reviewItems').innerHTML = checkoutState.cartItems
      .map((item) => `<div class="summary-line"><span>${item.name} × ${item.quantity}</span><span>${(item.price * item.quantity).toFixed(2)} €</span></div>`)
      .join('');
    const a = checkoutState.address;
    document.getElementById('reviewAddress').textContent = `${a.fullName}, ${a.address}, ${a.city} ${a.zipCode}, ${a.country} — ${a.phone}`;
    document.getElementById('reviewPayment').textContent =
      checkoutState.paymentMethod === 'CREDIT_CARD_DEMO' ? 'Credit Card (demo)' : 'PayPal (demo)';
  }

  document.getElementById('backToPayment').addEventListener('click', () => goToStep(2));
  document.getElementById('placeOrderBtn').addEventListener('click', async () => {
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.textContent = 'Traitement…';
    try {
      const order = await api.post('/orders', {
        addressId: checkoutState.addressId,
        paymentMethod: checkoutState.paymentMethod,
      });

      document.getElementById('confirmOrderId').textContent = order.id;
      document.getElementById('confirmDate').textContent = new Date(order.createdAt).toLocaleDateString('fr-FR');
      document.getElementById('confirmTotal').textContent = `${order.total.toFixed(2)} €`;
      document.getElementById('confirmAddress').textContent = `${order.address.city}, ${order.address.country}`;
      document.getElementById('confirmStatus').textContent = order.status;

      await updateCartCountBadge();
      goToStep('confirmed');
    } catch (err) {
      alert(err.message);
      btn.disabled = false;
      btn.textContent = 'PLACE ORDER';
    }
  });

  await renderSummary();
  goToStep(1);
}
