// Génère un sitemap.xml incluant les pages statiques et chaque fiche produit,
// pour que Google indexe correctement le site (utile aussi pour Merchant Center).
const prisma = require('../config/prisma');
const { siteUrl } = require('../config/env');

const staticPages = [
  '',
  'shop.html',
  'login.html',
  'about.html',
  'contact.html',
  'shipping-policy.html',
  'return-policy.html',
  'privacy-policy.html',
];

async function buildSitemap() {
  const products = await prisma.product.findMany({ select: { id: true, updatedAt: true } });

  const staticUrls = staticPages
    .map((page) => `
  <url>
    <loc>${siteUrl}/${page}</loc>
    <changefreq>weekly</changefreq>
  </url>`)
    .join('');

  const productUrls = products
    .map(
      (p) => `
  <url>
    <loc>${siteUrl}/product.html?id=${p.id}</loc>
    <lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${productUrls}
</urlset>`;
}

module.exports = { buildSitemap };
