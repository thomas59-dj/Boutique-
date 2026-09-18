// Vérifie le flux d'inscription/connexion : cas nominal et cas d'erreur
// (email dupliqué, mauvais mot de passe, champs invalides).
const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDatabase } = require('./setup');

beforeAll(resetDatabase);
afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

const validUser = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@test.com',
  password: 'Password123!',
};

describe('POST /api/auth/register', () => {
  it('crée un compte et renvoie un token', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined(); // jamais renvoyé
  });

  it('refuse un email déjà utilisé (409)', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(409);
  });

  it('refuse un email invalide (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'pas-un-email' });
    expect(res.status).toBe(400);
  });

  it('refuse un mot de passe trop court (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'autre@test.com', password: '123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('connecte avec les bons identifiants', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('refuse un mauvais mot de passe (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'mauvais_mdp' });
    expect(res.status).toBe(401);
  });

  it('refuse un email inconnu (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inconnu@test.com', password: 'peu importe' });
    expect(res.status).toBe(401);
  });
});
