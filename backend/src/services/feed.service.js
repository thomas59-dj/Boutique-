// Génère le flux produits au format Google Merchant Center (RSS 2.0 + espace
// de noms <g:>). Référence : https://support.google.com/merchants/answer/7052112
const prisma = require('../config/prisma');
const { siteUrl, storeName, currency } = require('../config/env');

// Échappe les caractères spéciaux XML (obligatoire : titres/descriptions viennent de la base)
function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Google Merchant EXIGE une URL absolue (https://...) pour g:image_link — un chemin
// relatif comme "assets/products/xyz.jpg" (tel que stocké en base) est rejeté.
// On le préfixe donc avec siteUrl si ce n'est pas déjà une URL complète.
function toAbsoluteUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}/${path.replace(/^\//, '')}`;
}

async function buildGoogleMerchantFeed() {
  const products = await prisma.product.findMany({ include: { category: true } });

  const items = products
    .map((p) => {
      const availability = p.stock > 0 ? 'in_stock' : 'out_of_stock';
      const link = `${siteUrl}/product.html?id=${p.id}`;
      const identifierExists = p.gtin || p.mpn ? 'yes' : 'no';

      return `
    <item>
      <g:id>${p.id}</g:id>
      <title>${escapeXml(p.name)}</title>
      <description>${escapeXml(p.description)}</description>
      <link>${link}</link>
      <g:image_link>${escapeXml(toAbsoluteUrl(p.image))}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${p.price.toFixed(2)} ${currency}</g:price>
      ${p.oldPrice ? `<g:sale_price>${p.price.toFixed(2)} ${currency}</g:sale_price>` : ''}
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(p.brand || storeName)}</g:brand>
      ${p.gtin ? `<g:gtin>${escapeXml(p.gtin)}</g:gtin>` : ''}
      ${p.mpn ? `<g:mpn>${escapeXml(p.mpn)}</g:mpn>` : ''}
      <g:identifier_exists>${identifierExists}</g:identifier_exists>
      <g:product_type>${escapeXml(p.category.name)}</g:product_type>
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(storeName)}</title>
    <link>${siteUrl}</link>
    <description>Flux produits ${escapeXml(storeName)} pour Google Merchant Center</description>
    ${items}
  </channel>
</rss>`;
}

module.exports = { buildGoogleMerchantFeed };
