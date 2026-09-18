const asyncHandler = require('../utils/asyncHandler');
const { buildGoogleMerchantFeed } = require('../services/feed.service');
const { buildSitemap } = require('../services/sitemap.service');

const googleMerchantFeed = asyncHandler(async (req, res) => {
  const xml = await buildGoogleMerchantFeed();
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

const sitemap = asyncHandler(async (req, res) => {
  const xml = await buildSitemap();
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

module.exports = { googleMerchantFeed, sitemap };
