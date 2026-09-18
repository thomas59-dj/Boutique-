// Point d'entrée unique qui regroupe toutes les routes de l'API sous /api
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/products', require('./product.routes'));
router.use('/categories', require('./category.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/orders', require('./order.routes'));
router.use('/users', require('./user.routes'));

module.exports = router;
