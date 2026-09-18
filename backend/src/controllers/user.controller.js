const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const prisma = require('../config/prisma');
const { sanitizeUser } = require('../services/auth.service');

const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  return success(res, sanitizeUser(user));
});

const updateMe = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { firstName, lastName },
  });
  return success(res, sanitizeUser(user), 'Profil mis à jour');
});

// Adresses de livraison de l'utilisateur (utilisées au checkout)
const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });
  return success(res, addresses);
});

const createAddress = asyncHandler(async (req, res) => {
  const address = await prisma.address.create({ data: { ...req.body, userId: req.user.id } });
  return success(res, address, 'Adresse enregistrée', 201);
});

// Changement de mot de passe (onglet Paramètres) : exige l'ancien mot de passe
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return error(res, 'Le nouveau mot de passe doit contenir au moins 8 caractères', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isValid = await bcrypt.compare(currentPassword || '', user.password);
  if (!isValid) {
    return error(res, 'Mot de passe actuel incorrect', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });

  return success(res, null, 'Mot de passe mis à jour');
});

module.exports = { getMe, updateMe, listAddresses, createAddress, changePassword };
