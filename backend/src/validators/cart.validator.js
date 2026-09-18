const { body, param } = require('express-validator');

const addItemRules = [
  body('productId').trim().notEmpty().withMessage('productId est requis'),
  body('quantity').optional().isInt({ min: 1, max: 99 }).withMessage('Quantité invalide entre 1 et 99'),
];

const updateItemRules = [
  param('id').trim().notEmpty(),
  body('quantity').isInt({ min: 0, max: 99 }).withMessage('Quantité invalide entre 0 et 99'),
];

const mergeCartRules = [
  body('items').isArray().withMessage('items doit être un tableau'),
  body('items.*.productId').trim().notEmpty(),
  body('items.*.quantity').isInt({ min: 1, max: 99 }),
];

module.exports = { addItemRules, updateItemRules, mergeCartRules };
