// Règles de validation/assainissement pour l'inscription et la connexion.
// .trim()/.escape() neutralisent les espaces superflus et les caractères
// HTML dangereux (protection XSS de base sur les champs texte libres).
const { body } = require('express-validator');

const registerRules = [
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis').isLength({ max: 60 }).escape(),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis').isLength({ max: 60 }).escape(),
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

module.exports = { registerRules, loginRules };
