# Guide de déploiement — Images, Git, Vercel, Google Merchant

Ce document rassemble tout ce dont tu as besoin pour passer du projet en local
à un site en ligne, connecté à Google Merchant Center. Il répond à tes trois
questions : où mettre les images produits, quoi envoyer sur Git, et comment
tout s'articule avec Vercel.

## 1. Ce qui a changé dans la dernière livraison

Rien n'a été « remplacé » — tout s'**ajoute** au projet livré dans les 6 parties
précédentes (`boutique-projet-complet.zip`). Les fichiers ajoutés/modifiés pour
Google Merchant vivent au même endroit, dans le **même projet** :

- `backend/src/services/feed.service.js`, `sitemap.service.js`, `controllers/feed.controller.js`,
  `app.js` (nouvelles routes), `config/env.js` (nouvelles variables), `prisma/schema.prisma`
  (champs `gtin`/`mpn`)
- `frontend/robots.txt`, `about.html`, `contact.html`, `shipping-policy.html`,
  `return-policy.html`, `privacy-policy.html`, `js/products.js` (données structurées)

**Comment adapter** : si tu avais déjà décompressé `boutique-projet-complet.zip`
quelque part, décompresse `boutique-google-merchant.zip` **par-dessus le même
dossier** (il écrase juste les fichiers modifiés, sans rien casser). Le zip
final ci-dessous (`boutique-projet-complet-v2.zip`) fait déjà cette fusion pour
toi — c'est le seul que tu dois garder à partir de maintenant.

## 2. Images produits : le vrai problème à régler

Actuellement, `prisma/seed.js` remplit `product.image` avec des chemins comme
`assets/products/cotton-t-shirt.jpg` — mais **le dossier `frontend/assets/products/`
est vide** (juste un `.gitkeep`). Tes vraies images sont sur ta machine, ailleurs.
Il faut choisir une des deux options suivantes.

### Option A — Simple : images statiques dans le repo (recommandé pour démarrer)

1. Copie tes fichiers images dans `frontend/assets/products/` (renomme-les pour
   qu'ils correspondent aux noms utilisés dans `seed.js`, ou modifie `seed.js`
   pour utiliser tes vrais noms de fichiers).
2. Commit ces images dans Git (voir section 3) — Vercel les déploiera comme
   fichiers statiques, accessibles à `https://ton-site.vercel.app/assets/products/xxx.jpg`.
3. **C'est déjà géré techniquement** : le flux Google Merchant (`feed.service.js`)
   convertit maintenant automatiquement ces chemins relatifs en URLs absolues
   (`toAbsoluteUrl()`, corrigé dans cette session) — sans ça, Google aurait rejeté
   toutes les images du flux.

Limite de cette option : pour ajouter/changer une image plus tard, il faut
republier le code (nouveau commit + redeploy). Pas grave pour un catalogue
qui change peu.

### Option B — Plus robuste : stockage cloud (Cloudinary, S3, Vercel Blob)

Si tu comptes ajouter des produits régulièrement (via un futur panneau admin
par exemple), héberge les images à part :
1. Crée un compte sur un service d'images (Cloudinary a un plan gratuit simple).
2. Upload les images là-bas, récupère les URLs publiques.
3. Dans `seed.js` (ou ta future interface admin), utilise ces URLs complètes
   directement comme `image` — `toAbsoluteUrl()` les laissera telles quelles
   puisqu'elles commencent déjà par `https://`.

**Recommandation** : commence par l'option A (rien à configurer), migre vers
B seulement si la gestion des images devient pénible.

## 3. Git : un seul repo, les deux dossiers

Envoie **backend/ et frontend/ dans le même repo Git** (un monorepo), pas deux
projets séparés. Vercel et Render sauront chacun ne déployer que le dossier
qui les concerne via leur réglage "Root Directory".

```bash
cd boutique                     # dossier contenant backend/ et frontend/
git init
cat > .gitignore << 'GITIGNORE'
node_modules/
.env
.env.test
GITIGNORE
git add .
git commit -m "Initial commit"
git remote add origin <URL_DE_TON_REPO>
git push -u origin main
```

Ce qui part sur Git : tout le code (`backend/src`, `backend/prisma`, `frontend/*`),
les fichiers `.env.example`/`.env.test.example` (les modèles, pas les vrais secrets),
et maintenant tes vraies images produits. Ce qui **ne part jamais** : `node_modules/`,
`.env`, `.env.test` (déjà exclus par le `.gitignore` ci-dessus).

## 4. Déploiement

### Frontend sur Vercel
1. Sur vercel.com → "Add New Project" → importer ton repo Git.
2. **Root Directory** : `frontend`
3. Build Command : (aucune — fichiers statiques)
4. Output Directory : `.` (racine du dossier frontend)
5. Une fois déployé, note l'URL (ex. `https://boutique-thomas.vercel.app`).

### Backend sur Render (ou Railway/Fly.io)
1. "New Web Service" → importer le même repo Git.
2. **Root Directory** : `backend`
3. Build Command : `npm install && npx prisma generate`
4. Start Command : `npm start`
5. Variables d'environnement à définir (Render → Environment) :
   - `DATABASE_URL` (utilise une base Postgres managée, ex. Render Postgres ou Neon)
   - `JWT_SECRET` (génère-en un nouveau, différent de celui de dev)
   - `JWT_EXPIRES_IN=7d`
   - `FRONTEND_URL=https://boutique-thomas.vercel.app` (l'URL Vercel de l'étape précédente)
   - `SITE_URL=https://boutique-thomas.vercel.app`
   - `STORE_NAME`, `CURRENCY=EUR`
   - `NODE_ENV=production`
6. Une fois déployé, note l'URL backend (ex. `https://boutique-api.onrender.com`).

### Reconnecter les deux
- Dans `frontend/js/api.js`, remplace `API_BASE_URL` par l'URL Render (`https://boutique-api.onrender.com/api`), commit, redeploy le frontend.
- Dans `frontend/robots.txt`, remplace l'URL du sitemap par `https://boutique-api.onrender.com/api/sitemap.xml`.
- Lance les migrations sur la base de prod : `npx prisma migrate deploy` (depuis Render, en "Shell", ou en local en pointant `DATABASE_URL` vers la base de prod) puis `npm run seed` si tu veux les données de démo (à éviter en vraie prod — préfère créer tes vrais produits).

## 5. Connecter Google Merchant Center

1. Va sur [merchants.google.com](https://merchants.google.com), crée/configure ton compte.
2. Vérifie la propriété de ton domaine Vercel (balise meta HTML ou Google Search Console).
3. "Produits" → "Flux" → "Ajouter un flux" → type "Récupération planifiée" →
   URL : `https://boutique-api.onrender.com/api/feed/google-merchant.xml`
4. Choisis une fréquence (quotidienne suffit largement).
5. Vérifie que les pages `about.html`, `contact.html`, `shipping-policy.html`,
   `return-policy.html` sont bien remplies avec tes vraies infos (les `<!-- TODO -->`
   laissés dans le code) — Merchant Center les contrôle avant d'approuver le flux.

## 6. Récapitulatif de ce qui existe déjà

| Partie | Contenu |
|---|---|
| 1 | Backend Express/Prisma/PostgreSQL complet |
| 2 | 7 pages HTML frontend |
| 3 | CSS (style, composants, responsive) |
| 4 | JavaScript frontend complet |
| 5 | Validation + sécurité (express-validator, CSP, rate limiting, anti-survente) |
| 6 | Tests Jest/Supertest + README.md |
| + | Flux Google Merchant, sitemap, robots.txt, données structurées, pages légales |

Tout est dans **un seul projet**, pas plusieurs versions différentes — les zips
successifs étaient des livraisons progressives du même code.
