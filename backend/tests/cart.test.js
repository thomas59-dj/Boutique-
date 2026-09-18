// Vérifie le panier serveur (ajout, mise à jour, suppression) pour un utilisateur connecté.
const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDatabase, seedTestProduct } = require('./setup');

let token;
let product;

beforeAll(async () => {
  await resetDatabase();
  ({ product } = await seedTestProduct({ stock: 10 }));

  const registerRes = await request(app).post('/api/auth/register').send({
    firstName: 'Cart',
    lastName: 'Tester',
    email: 'cart.tester@test.com',
    password: 'Password123!',
  });
  token = registerRes.body.data.token;
});
afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe('Panier (authentifié)', () => {
  it('refuse l\'accès sans token (401)', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('renvoie un panier vide au départ', async () => {
    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  it('ajoute un article au panier', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(2);
  });

  it('rejette une quantité invalide (400)', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, quantity: 0 });
    expect(res.status).toBe(400);
  });

  it('met à jour la quantité d\'un article', async () => {
    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    const itemId = cart.body.data.items[0].id;

    const res = await request(app)
      .put(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].quantity).toBe(5);
  });

  it('supprime un article du panier', async () => {
    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    const itemId = cart.body.data.items[0].id;

    const res = await request(app)
      .delete(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });
});
