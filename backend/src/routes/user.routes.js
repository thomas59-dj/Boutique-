const express = require('express');
const router = express.Router();
const { getMe, updateMe, listAddresses, createAddress, changePassword } = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { updateProfileRules, changePasswordRules, addressRules } = require('../validators/user.validator');

router.use(requireAuth);
router.get('/me', getMe);
router.put('/me', updateProfileRules, validate, updateMe);
router.put('/me/password', changePasswordRules, validate, changePassword);
router.get('/me/addresses', listAddresses);
router.post('/me/addresses', addressRules, validate, createAddress);

module.exports = router;
