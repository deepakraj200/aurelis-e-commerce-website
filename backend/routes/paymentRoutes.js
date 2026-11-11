'use strict';

const express = require('express');
const controller = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimits');
const schemas = require('../validators/schemas');

const router = express.Router();
router.use(protect);

router.post('/intent', writeLimiter, validate(schemas.paymentIntentSchema), controller.createIntent);
router.post('/confirm', writeLimiter, validate(schemas.paymentConfirmSchema), controller.confirmPayment);
router.get('/status/:orderId', controller.getPaymentStatus);

module.exports = router;
