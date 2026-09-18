const { error } = require('../utils/apiResponse');

function errorMiddleware(err, req, res, next) {
  console.error(err);

  if (err.code === 'P2002') {
    return error(res, `La valeur du champ "${err.meta?.target}" existe déjà`, 409);
  }
  if (err.code === 'P2025') {
    return error(res, 'Ressource introuvable', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur serveur interne';
  return error(res, message, statusCode, err.errors || null);
}

function notFoundMiddleware(req, res) {
  return error(res, `Route ${req.originalUrl} introuvable`, 404);
}

module.exports = { errorMiddleware, notFoundMiddleware };
