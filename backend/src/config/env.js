require('dotenv').config();
module.exports = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5500',
  // Utilisées pour générer des URLs absolues dans le flux Google Merchant et le sitemap
  siteUrl: process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5500',
  storeName: process.env.STORE_NAME || 'Boutique',
  currency: process.env.CURRENCY || 'EUR',
};
