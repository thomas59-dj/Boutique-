const { body } = require('express-validator');

const createOrderRules = [
  body('addressId').trim().notEmpty().withMessage("L'adresse de livraison est requise"),
  body('paymentMethod')
    .isIn(['CREDIT_CARD_DEMO', 'PAYPAL_DEMO'])
    .withMessage('Moyen de paiement invalide'),
];

module.exports = { createOrderRules };
