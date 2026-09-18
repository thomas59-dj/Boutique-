# BOUTIQUE — Site e-commerce complet

Site e-commerce full-stack : backend **Node.js / Express / PostgreSQL / Prisma** et frontend **HTML / CSS / JavaScript vanilla** (aucun framework front).

## Sommaire

- [Structure du projet](#structure-du-projet)

- [Prérequis](#prérequis)

- [Installation](#installation)

- [Variables d'environnement](#variables-denvironnement)

- [Lancer le projet](#lancer-le-projet)

- [Comptes de démonstration](#comptes-de-démonstration)

- [Tests automatisés](#tests-automatisés)

- [Aperçu de l'API](#aperçu-de-lapi)

- [Sécurité](#sécurité)

- [Déploiement](#déploiement)

## Structure du projet

```
boutique/  
├── backend/  
│   ├── prisma/  
│   │   ├── schema.prisma        \# modèle de données (users, products, cart, orders…)  
│   │   └── seed.js              \# jeu de données de démonstration  
│   ├── src/  
│   │   ├── app.js               \# configuration Express (exportée, testable)  
│   │   ├── server.js            \# démarrage du serveur HTTP  
│   │   ├── config/              \# env, client Prisma  
│   │   ├── controllers/         \# logique des routes  
│   │   ├── services/            \# logique métier (auth, produits, panier, commandes)  
│   │   ├── middleware/          \# auth JWT, rôles, erreurs, validation  
│   │   ├── validators/          \# règles express-validator par domaine  
│   │   └── routes/              \# définition des endpoints  
│   └── tests/                   \# tests d'intégration (Jest + Supertest)  
└── frontend/  
    ├── index.html, shop.html, product.html, cart.html,  
    │   login.html, checkout.html, account.html  
    ├── css/                     \# style.css, components.css, responsive.css  
    └── js/                      \# api.js, auth.js, cart.js, products.js, checkout.js, main.js
```

## Prérequis

- Node.js 18+

- PostgreSQL 14+ (local ou distant)

- Un serveur statique simple pour le frontend (ex. l'extension VS Code "Live Server", ou `npx serve frontend`) — pas de build, ce sont des fichiers statiques.

## Installation

```
cd backend  
npm install  
cp .env.example .env  
\# éditer .env : renseigner DATABASE\_URL et JWT\_SECRET (voir ci-dessous)  
  
npx prisma migrate dev --name init   \# crée les tables en base  
npm run seed                          \# insère catégories/produits/compte admin de démo
```

## Variables d'environnement

Backend (`backend/.env`, voir `backend/.env.example`) :

| Variable | Rôle |
| - | - |
| `DATABASE\_URL` | Chaîne de connexion PostgreSQL (Prisma) |
| `JWT\_SECRET` | Secret de signature des tokens JWT — **à changer en production** |
| `JWT\_EXPIRES\_IN` | Durée de validité du token (ex. `7d`) |
| `PORT` | Port d'écoute du serveur (défaut `4000`) |
| `FRONTEND\_URL` | Origine autorisée en CORS (ex. `http://localhost:5500`) |


Tests (`backend/.env.test`, voir `backend/.env.test.example`) : même structure, mais avec un `DATABASE\_URL` pointant vers une **base PostgreSQL dédiée aux tests** (les tests nettoient les tables à chaque exécution — ne jamais réutiliser la base de développement).

Le frontend n'a pas de fichier d'environnement : l'URL de l'API est définie en dur dans `frontend/js/api.js` (`API\_BASE\_URL`) — à adapter si le backend tourne ailleurs qu'en local.

## Lancer le projet

**Backend** (depuis `backend/`) :

```
npm run dev      \# démarre avec rechargement automatique (nodemon), http://localhost:4000
```

**Frontend** (depuis `frontend/`), par exemple :

```
npx serve .       \# ou l'extension "Live Server" de VS Code
```

Ouvrir ensuite `http://localhost:PORT/index.html` (le port dépend de l'outil utilisé, souvent 3000 ou 5500 — vérifier que `FRONTEND\_URL` côté backend correspond).

## Comptes de démonstration

Créés par `npm run seed` :

| Rôle | Email | Mot de passe |
| - | - | - |
| Administrateur | `admin@boutique.test` | `Admin123!` |


Un compte client s'obtient simplement via "Create Account" sur `login.html`.

## Tests automatisés

```
cd backend  
cp .env.test.example .env.test   \# pointer vers une base de test dédiée  
npx prisma migrate deploy         \# applique le schéma sur la base de test  
npm test
```

Couverture actuelle (Jest + Supertest, sans mock — tests d'intégration réels sur la base de test) :

- **auth.test.js** : inscription, doublon d'email, validation, connexion, mauvais mot de passe

- **products.test.js** : liste, recherche, filtre, tri invalide, fiche produit, 404

- **cart.test.js** : accès protégé, ajout/mise à jour/suppression, quantité invalide

- **order.test.js** : commande complète, calcul du total côté serveur (jamais côté client), décrémentation du stock, refus si stock insuffisant, refus si panier vide

## Aperçu de l'API

Toutes les routes sont préfixées par `/api`.

| Méthode | Route | Auth | Description |
| - | - | - | - |
| POST | `/auth/register` | — | Créer un compte |
| POST | `/auth/login` | — | Se connecter |
| GET | `/auth/me` | bon | Profil de l'utilisateur connecté |
| GET | `/products` | — | Liste (recherche/filtre/tri/pagination) |
| GET | `/products/:id` | — | Détail d'un produit |
| POST/PUT/DELETE | `/products` |  admin | Gestion des produits |
| GET | `/categories` | — | Liste des catégories |
| GET | `/cart` | bon | Panier de l'utilisateur |
| POST | `/cart/items` | bon | Ajouter un article |
| PUT/DELETE | `/cart/items/:id` | bon | Modifier/retirer un article |
| POST | `/cart/merge` | bon | Fusionner le panier invité à la connexion |
| POST | `/orders` | bon | Passer commande (paiement DEMO) |
| GET | `/orders`, `/orders/:id` | bon | Historique des commandes |
| GET/PUT | `/users/me` | bon | Profil |
| PUT | `/users/me/password` | bon | Changer le mot de passe |
| GET/POST | `/users/me/addresses` | bon | Adresses de livraison |
| GET | `/health` | — | Vérifie que l'API répond |


Réponses au format uniforme `\{ success, message, data \}` (ou `errors` en cas de 400).

## Sécurité

- Mots de passe hashés (bcrypt), jamais stockés/renvoyés en clair

- Authentification par JWT (en-tête `Authorization: Bearer \<token\>`)

- Validation et assainissement de toutes les entrées (`express-validator`)

- En-têtes de sécurité (`helmet`) + Content-Security-Policy restrictive

- CORS limité à `FRONTEND\_URL`

- Rate limiting global + renforcé sur login/register/commandes

- Prix et totaux **toujours recalculés côté serveur**, jamais depuis ce que le client envoie

- Vérification du stock dans une transaction avant validation d'une commande (anti-survente)

- Pas de token CSRF : authentification par en-tête (jamais par cookie), donc pas d'identifiants "ambiants" exploitables par un site tiers — voir le commentaire dans `backend/src/app.js` pour le détail du raisonnement

## Déploiement

Ce projet est prêt pour un déploiement classique :

- **Backend** : n'importe quel hébergeur Node.js (Render, Railway, Fly.io, VPS…) + une base PostgreSQL managée. Penser à définir `NODE\_ENV=production`, un `JWT\_SECRET` fort et unique, et le bon `FRONTEND\_URL`.

- **Frontend** : fichiers 100 % statiques, déployables sur Netlify, Vercel, GitHub Pages ou tout hébergement statique. Mettre à jour `API\_BASE\_URL` dans `frontend/js/api.js` pour pointer vers le backend en production.

Pour un déploiement Vercel (frontend) + Render (backend) pas à pas, la gestion des images produits, la stratégie Git, et la connexion à Google Merchant Center, voir **`GUIDE-DEPLOIEMENT.md`** à la racine du projet.

