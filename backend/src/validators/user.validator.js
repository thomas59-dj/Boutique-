const { body } = require('express-validator');

const updateProfileRules = [
  body('firstName').optional().trim().isLength({ max: 60 }).escape(),
  body('lastName').optional().trim().isLength({ max: 60 }).escape(),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est requis'),
  body('newPassword').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères'),
];

const addressRules = [
  body('fullName').trim().notEmpty().isLength({ max: 100 }).escape(),
  body('address').trim().notEmpty().isLength({ max: 200 }).escape(),
  body('city').trim().notEmpty().isLength({ max: 100 }).escape(),
  body('zipCode').trim().notEmpty().isLength({ max: 20 }).escape(),
  body('country').trim().notEmpty().isLength({ max: 100 }).escape(),
  body('phone').trim().notEmpty().isLength({ max: 30 }).escape(),
];

module.exports = { updateProfileRules, changePasswordRules, addressRules };
