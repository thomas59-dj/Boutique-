const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { createOrder, listOrders, getOrder } = require('../controllers/order.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createOrderRules } = require('../validators/order.validator');

// Empêche un script de spammer des commandes (protection basique anti-abus)
const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Trop de commandes créées, réessayez plus tard' },
});

router.use(requireAuth);
router.post('/', orderLimiter, createOrderRules, validate, createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);

module.exports = router;
