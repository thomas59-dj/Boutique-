const { error } = require('../utils/apiResponse');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return error(res, "Accès réservé à l'administrateur", 403);
  }
  next();
}

module.exports = { requireAdmin };
