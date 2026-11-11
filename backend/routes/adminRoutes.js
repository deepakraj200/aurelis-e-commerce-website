'use strict';

const express = require('express');
const controller = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();
router.use(protect, adminOnly);

router.get('/dashboard', controller.dashboard);

router.get('/orders', controller.listOrders);
router.get('/orders/:id', controller.getOrder);
router.put('/orders/:id/status', validate(schemas.statusSchema), controller.updateOrderStatus);
router.put('/orders/:id/cancel', validate(schemas.cancelSchema), controller.cancelOrder);
router.post('/orders/:id/refund', controller.refundOrder);

router.get('/users', controller.listUsers);
router.get('/users/:id', controller.getUserDetail);
router.patch('/users/:id', validate(schemas.adminUserSchema), controller.updateUser);

router.get('/products', controller.listProducts);

module.exports = router;
