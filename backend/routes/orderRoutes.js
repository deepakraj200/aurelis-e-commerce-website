'use strict';

const express = require('express');
const controller = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimits');
const schemas = require('../validators/schemas');

const router = express.Router();
router.use(protect);

router.post('/', writeLimiter, validate(schemas.orderSchema), controller.createOrder);
router.get('/', controller.listOrders);
router.get('/:id', controller.getOrder);
router.put('/:id/cancel', validate(schemas.cancelSchema), controller.cancelOrder);

module.exports = router;
