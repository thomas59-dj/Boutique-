// Vérifie le flux de commande complet : panier -> adresse -> commande,
// la décrémentation du stock, et le refus en cas de stock insuffisant.
const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDatabase, seedTestProduct } = require('./setup');

let token;
let product;
let addressId;

beforeAll(async () => {
  await resetDatabase();
  ({ product } = await seedTestProduct({ stock: 2, price: 10 }));

  const registerRes = await request(app).post('/api/auth/register').send({
    firstName: 'Order',
    lastName: 'Tester',
    email: 'order.tester@test.com',
    password: 'Password123!',
  });
  token = registerRes.body.data.token;

  await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: product.id, quantity: 2 });

  const addressRes = await request(app)
    .post('/api/users/me/addresses')
    .set('Authorization', `Bearer ${token}`)
    .send({
      fullName: 'Order Tester',
      address: '12 rue de Test',
      city: 'Yaoundé',
      zipCode: '00000',
      country: 'Cameroun',
      phone: '+237600000000',
    });
  addressId = addressRes.body.data.id;
});
afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe('POST /api/orders', () => {
  it('refuse un moyen de paiement invalide (400)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'ESPECES' });
    expect(res.status).toBe(400);
  });

  it('crée la commande, calcule le total côté serveur et décrémente le stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'CREDIT_CARD_DEMO' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PAID');
    expect(res.body.data.subtotal).toBe(20); // 2 x 10€, jamais fait confiance au client
    expect(res.body.data.total).toBeCloseTo(20 + 3.99);

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct.stock).toBe(0); // 2 en stock - 2 commandés

    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(cart.body.data.items).toEqual([]); // panier vidé après la commande
  });

  it('refuse une nouvelle commande si le stock est insuffisant (409)', async () => {
    // Remet un article au panier alors que le stock est déjà à 0
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, quantity: 1 });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'CREDIT_CARD_DEMO' });

    expect(res.status).toBe(409);
  });

  it('refuse une commande avec un panier vide (400)', async () => {
    // Vide le panier restant
    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    for (const item of cart.body.data.items) {
      await request(app).delete(`/api/cart/items/${item.id}`).set('Authorization', `Bearer ${token}`);
    }

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'CREDIT_CARD_DEMO' });
    expect(res.status).toBe(400);
  });
});
