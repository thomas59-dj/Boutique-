/* =========================================================
   BOUTIQUE — auth.js
   Inscription, connexion, déconnexion, profil, et mise à
   jour du menu utilisateur affiché dans le header sur
   toutes les pages.
   ========================================================= */

/**
 * Met à jour le contenu du dropdown "compte" dans le header
 * selon que l'utilisateur est connecté ou non.
 */
function renderUserMenu() {
  const dropdown = document.getElementById('userMenuDropdown');
  if (!dropdown) return;

  const user = getCachedUser();

  if (user) {
    dropdown.innerHTML = `
      <p style="padding:0.6rem 0.75rem 0.2rem;font-weight:600;">${user.firstName} ${user.lastName}</p>
      <a href="account.html">Mon compte</a>
      <a href="account.html#orders">Mes commandes</a>
      <button type="button" id="dropdownLogoutBtn">Se déconnecter</button>
    `;
    document.getElementById('dropdownLogoutBtn')?.addEventListener('click', handleLogout);
  } else {
    dropdown.innerHTML = `
      <a href="login.html">Login</a>
      <a href="create.html">Create Account</a>
    `;
  }
}

async function handleLogout() {
  try {
    await api.post('/auth/logout', {});
  } catch (err) {
    // La déconnexion est de toute façon effective côté client (suppression du token)
  }
  clearToken();
  renderUserMenu();
  if (typeof updateCartCountBadge === 'function') updateCartCountBadge();
  window.location.href = 'index.html';
}

/**
 * Après une connexion réussie : stocke le token/l'utilisateur,
 * fusionne le panier local (invité) avec le panier serveur,
 * puis redirige vers la page demandée (ou la boutique par défaut).
 */
async function onAuthSuccess({ token, user }) {
  setToken(token);
  setCachedUser(user);

  if (typeof mergeCartOnLogin === 'function') {
    await mergeCartOnLogin();
  }

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  window.location.href = redirect ? `${redirect}.html` : 'shop.html';
}

/* ---------------------------------------------------------
   Page login.html : formulaires Login / Create Account
   --------------------------------------------------------- */
function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (!loginForm && !registerForm) return;

  // Bascule visibilité des mots de passe
  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageEl = document.getElementById('loginMessage');
    messageEl.textContent = '';
    messageEl.className = 'form-message';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const result = await api.post('/auth/login', { email, password });
      messageEl.textContent = 'Connexion réussie, redirection…';
      messageEl.className = 'form-message success';
      await onAuthSuccess(result);
    } catch (err) {
      messageEl.textContent = err.message;
      messageEl.className = 'form-message error';
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageEl = document.getElementById('registerMessage');
    messageEl.textContent = '';
    messageEl.className = 'form-message';

    const payload = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('registerEmail').value.trim(),
      password: document.getElementById('registerPassword').value,
    };

    if (payload.password.length < 8) {
      messageEl.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
      messageEl.className = 'form-message error';
      return;
    }

    try {
      const result = await api.post('/auth/register', payload);
      messageEl.textContent = 'Compte créé, redirection…';
      messageEl.className = 'form-message success';
      await onAuthSuccess(result);
    } catch (err) {
      messageEl.textContent = err.message;
      messageEl.className = 'form-message error';
    }
  });
}

/* ---------------------------------------------------------
   Page account.html : profil + paramètres
   --------------------------------------------------------- */
function initAccountAuthForms() {
  const profileForm = document.getElementById('profileForm');
  if (!profileForm) return;

  // Page protégée : redirige vers le login si non connecté
  if (!getToken()) {
    window.location.href = 'login.html?redirect=account';
    return;
  }

  const user = getCachedUser();
  if (user) {
    document.getElementById('accFirstName').value = user.firstName || '';
    document.getElementById('accLastName').value = user.lastName || '';
    document.getElementById('accEmail').value = user.email || '';
  }

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageEl = document.getElementById('profileMessage');
    try {
      const updated = await api.put('/users/me', {
        firstName: document.getElementById('accFirstName').value.trim(),
        lastName: document.getElementById('accLastName').value.trim(),
      });
      setCachedUser(updated);
      renderUserMenu();
      messageEl.textContent = 'Profil mis à jour.';
      messageEl.className = 'form-message success';
    } catch (err) {
      messageEl.textContent = err.message;
      messageEl.className = 'form-message error';
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}
