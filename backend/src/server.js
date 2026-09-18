// Point d'entrée du serveur backend BOUTIQUE : démarre l'écoute HTTP.
// Toute la configuration Express vit dans app.js (réutilisable par les tests).
const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`✅ Serveur BOUTIQUE démarré sur http://localhost:${port}`);
});
