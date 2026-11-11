'use strict';

const express = require('express');
const controller = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter, writeLimiter } = require('../middleware/rateLimits');
const schemas = require('../validators/schemas');

const router = express.Router();

router.post('/register', authLimiter, validate(schemas.registerSchema), controller.register);
router.post('/login', authLimiter, validate(schemas.loginSchema), controller.login);
router.post('/logout', controller.logout);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(schemas.resetPasswordSchema), controller.resetPassword);

router.get('/me', protect, controller.me);
router.put('/profile', protect, writeLimiter, validate(schemas.updateProfileSchema), controller.updateProfile);
router.put('/password', protect, authLimiter, validate(schemas.changePasswordSchema), controller.changePassword);

router.post('/addresses', protect, validate(schemas.addressBodySchema), controller.addAddress);
router.put('/addresses/:addressId', protect, validate(schemas.addressUpdateBodySchema), controller.updateAddress);
router.delete('/addresses/:addressId', protect, controller.deleteAddress);

module.exports = router;
