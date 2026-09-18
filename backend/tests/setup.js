// Utilitaires partagés par toutes les suites de tests.
// IMPORTANT : nécessite un DATABASE_URL de test (voir .env.test.example),
// jamais la base de développement — les tables pertinentes sont nettoyées
// avant chaque suite.
require('dotenv').config({ path: '.env.test' });

const prisma = require('../src/config/prisma');
const slugify = require('slugify');

async function resetDatabase() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

/** Crée une catégorie + un produit de test, renvoie les deux enregistrements. */
async function seedTestProduct(overrides = {}) {
  const category = await prisma.category.create({
    data: { name: 'Test Category', slug: 'test-category' },
  });
  const product = await prisma.product.create({
    data: {
      name: 'Test Product',
      slug: slugify(`test-product-${Date.now()}-${Math.random()}`, { lower: true }),
      description: 'Produit utilisé uniquement pour les tests automatisés.',
      price: 19.99,
      stock: 5,
      image: 'assets/products/test.jpg',
      categoryId: category.id,
      ...overrides,
    },
  });
  return { category, product };
}

module.exports = { prisma, resetDatabase, seedTestProduct };
