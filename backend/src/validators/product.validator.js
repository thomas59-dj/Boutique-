const { body, query } = require('express-validator');

const productWriteRules = [
  body('name').trim().notEmpty().withMessage('Le nom est requis').isLength({ max: 150 }).escape(),
  body('description').trim().notEmpty().withMessage('La description est requise').isLength({ max: 3000 }).escape(),
  body('price').isFloat({ gt: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('oldPrice').optional({ nullable: true }).isFloat({ gt: 0 }).withMessage('Ancien prix invalide'),
  body('stock').isInt({ min: 0 }).withMessage('Le stock doit être un entier positif ou nul'),
  body('image').trim().notEmpty().withMessage("L'image est requise"),
  body('categoryId').trim().notEmpty().withMessage('La catégorie est requise'),
];

// Query params publics (GET /products) : on borne les valeurs pour éviter les abus
const productListRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'newest', 'popularity']),
  query('search').optional().trim().isLength({ max: 100 }).escape(),
];

module.exports = { productWriteRules, productListRules };
