const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/apiResponse');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentification requise', 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyToken(token); // { id, role }
    next();
  } catch (err) {
    return error(res, 'Token invalide ou expiré', 401);
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(authHeader.split(' ')[1]);
    } catch (err) {
      // token invalide : utilisateur traité comme anonyme
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
