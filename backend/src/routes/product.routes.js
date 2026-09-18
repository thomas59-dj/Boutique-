const express = require('express');
const router = express.Router();
const { list, getById, create, update, remove } = require('../controllers/product.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const validate = require('../middleware/validate.middleware');
const { productWriteRules, productListRules } = require('../validators/product.validator');

router.get('/', productListRules, validate, list);
router.get('/:id', getById);
router.post('/', requireAuth, requireAdmin, productWriteRules, validate, create);
router.put('/:id', requireAuth, requireAdmin, productWriteRules, validate, update);
router.delete('/:id', requireAuth, requireAdmin, remove);

module.exports = router;
