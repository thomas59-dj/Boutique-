const { body } = require('express-validator');

const categoryWriteRules = [
  body('name').trim().notEmpty().withMessage('Le nom est requis').isLength({ max: 60 }).escape(),
];

module.exports = { categoryWriteRules };
