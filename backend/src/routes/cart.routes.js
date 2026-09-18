const express = require('express');
const router = express.Router();
const { getCart, addItem, updateItem, removeItem, mergeCart } = require('../controllers/cart.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { addItemRules, updateItemRules, mergeCartRules } = require('../validators/cart.validator');

router.use(requireAuth);
router.get('/', getCart);
router.post('/items', addItemRules, validate, addItem);
router.put('/items/:id', updateItemRules, validate, updateItem);
router.delete('/items/:id', removeItem);
router.post('/merge', mergeCartRules, validate, mergeCart);

module.exports = router;
