const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/category.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const validate = require('../middleware/validate.middleware');
const { categoryWriteRules } = require('../validators/category.validator');

router.get('/', getAll);
router.post('/', requireAuth, requireAdmin, categoryWriteRules, validate, create);
router.put('/:id', requireAuth, requireAdmin, categoryWriteRules, validate, update);
router.delete('/:id', requireAuth, requireAdmin, remove);

module.exports = router;
