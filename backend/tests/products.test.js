// Vérifie la liste des produits (recherche, filtre, pagination) et la fiche produit.
const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDatabase, seedTestProduct } = require('./setup');

let product;

beforeAll(async () => {
  await resetDatabase();
  ({ product } = await seedTestProduct());
});
afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe('GET /api/products', () => {
  it('renvoie la liste paginée des produits', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('filtre par recherche textuelle', async () => {
    const res = await request(app).get('/api/products?search=Test Product');
    expect(res.status).toBe(200);
    expect(res.body.data.items.some((p) => p.id === product.id)).toBe(true);
  });

  it('ne renvoie rien pour une recherche sans résultat', async () => {
    const res = await request(app).get('/api/products?search=xyz_introuvable_123');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(0);
  });

  it('rejette un paramètre de tri invalide (400)', async () => {
    const res = await request(app).get('/api/products?sort=n_importe_quoi');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/products/:id', () => {
  it('renvoie le produit demandé', async () => {
    const res = await request(app).get(`/api/products/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(product.id);
  });

  it('renvoie 404 pour un id inexistant', async () => {
    const res = await request(app).get('/api/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
