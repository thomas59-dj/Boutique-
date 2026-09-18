const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return success(res, result, 'Compte créé avec succès', 201);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return success(res, result, 'Connexion réussie');
});

const logout = asyncHandler(async (req, res) => {
  // Avec un JWT stateless, la déconnexion se fait côté client (suppression du token).
  return success(res, null, 'Déconnexion réussie');
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return success(res, user);
});

module.exports = { register, login, logout, me };
