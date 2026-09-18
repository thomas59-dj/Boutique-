// Middleware générique qui déclenche les règles express-validator posées sur
// une route et renvoie une 400 uniforme si l'une d'elles échoue.
const { validationResult } = require('express-validator');
const { error } = require('../utils/apiResponse');

function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    // Regroupe les erreurs par champ pour un affichage facile côté frontend
    const errors = {};
    result.array().forEach((e) => {
      if (!errors[e.path]) errors[e.path] = e.msg;
    });
    return error(res, 'Certains champs sont invalides', 400, errors);
  }
  next();
}

module.exports = validate;
