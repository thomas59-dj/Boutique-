/* =========================================================
   BOUTIQUE — api.js
   Petite couche d'accès à l'API backend : construit les
   requêtes, ajoute le token JWT, uniformise la gestion
   des erreurs. Tous les autres fichiers JS passent par ici.
   ========================================================= */

// Adresse du backend en développement local (à adapter en production)
const API_BASE_URL = 'http://localhost:4000/api';
const TOKEN_KEY = 'boutique_token';
const USER_KEY = 'boutique_user';

// --- Gestion du token JWT (stocké en localStorage) ---
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// --- Utilisateur mis en cache localement pour un affichage instantané ---
function getCachedUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setCachedUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Effectue une requête vers l'API et renvoie directement `data`.
 * Lève une Error avec un message lisible en cas d'échec.
 */
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  } catch (networkError) {
    throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion ou réessayez plus tard.");
  }

  let body = null;
  try {
    body = await response.json();
  } catch (parseError) {
    // Réponse sans corps JSON (rare, ex: 204) : on l'ignore.
  }

  if (!response.ok) {
    const message = body?.message || `Erreur ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.errors = body?.errors || null;
    throw error;
  }

  return body?.data;
}

// Raccourcis pratiques pour chaque verbe HTTP
const api = {
  get: (endpoint) => apiFetch(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),
};
