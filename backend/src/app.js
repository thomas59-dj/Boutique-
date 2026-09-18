// Configuration de l'application Express, séparée de server.js pour pouvoir
// être importée telle quelle par les tests (supertest) sans ouvrir de port.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { frontendUrl } = require('./config/env');
const routes = require('./routes');
const { googleMerchantFeed, sitemap } = require('./controllers/feed.controller');
const { errorMiddleware, notFoundMiddleware } = require('./middleware/error.middleware');

const app = express();

// --- Sécurité de base ---

// Content Security Policy : limite les origines autorisées pour scripts/styles/images
// afin de réduire l'impact d'une éventuelle faille XSS côté frontend.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // 'unsafe-inline' toléré ici : pas de framework CSS externe
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", frontendUrl],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

// Pas de protection CSRF classique (token/cookie) ici par choix délibéré :
// l'authentification se fait par JWT envoyé dans l'en-tête Authorization
// (stocké en localStorage côté frontend, jamais en cookie). Le CSRF exploite
// les identifiants "ambiants" automatiquement envoyés par le navigateur
// (cookies de session) — un en-tête Authorization doit être ajouté
// explicitement par le JS du site, donc un site tiers ne peut pas le forger.
// -> Si l'authentification passait un jour par cookie, ajouter alors
//    csurf ou un double-submit token.

app.use(cors({ origin: frontendUrl, credentials: true })); // CORS restreint au frontend
app.use(express.json({ limit: '100kb' })); // parsing JSON, taille bornée contre les payloads abusifs

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')); // logs des requêtes, coupés pendant les tests pour un output propre
}

// Limite générale sur toute l'API (anti-abus/anti-scraping basique)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Limite le nombre de tentatives de connexion/inscription pour freiner le brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Trop de tentatives, réessayez plus tard' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// --- Routes API ---
app.use('/api', routes);

// Route de vérification que le serveur tourne
app.get('/api/health', (req, res) => res.json({ success: true, message: 'API BOUTIQUE opérationnelle' }));

// --- Flux Google Merchant Center + sitemap (publics, générés en direct depuis la base) ---
app.get('/api/feed/google-merchant.xml', googleMerchantFeed);
app.get('/api/sitemap.xml', sitemap);

// --- Gestion des erreurs (toujours en dernier) ---
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
