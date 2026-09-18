// Logique métier de l'authentification : inscription, connexion, hash des mots de passe.
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');

async function register({ firstName, lastName, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Un compte existe déjà avec cet email');
    err.statusCode = 409;
    throw err;
  }

  // Jamais de mot de passe en clair : hashage bcrypt (10 rounds = bon compromis sécurité/perf)
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { firstName, lastName, email, password: hashedPassword },
  });

  // Chaque nouvel utilisateur reçoit immédiatement un panier vide associé
  await prisma.cart.create({ data: { userId: user.id } });

  const token = generateToken({ id: user.id, role: user.role });
  return { token, user: sanitizeUser(user) };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Email ou mot de passe incorrect');
    err.statusCode = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const err = new Error('Email ou mot de passe incorrect');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken({ id: user.id, role: user.role });
  return { token, user: sanitizeUser(user) };
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 404;
    throw err;
  }
  return sanitizeUser(user);
}

// Ne jamais renvoyer le hash du mot de passe au frontend
function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

module.exports = { register, login, getProfile, sanitizeUser };
