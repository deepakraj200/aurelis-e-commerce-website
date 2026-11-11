'use strict';

const express = require('express');
const controller = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimits');
const schemas = require('../validators/schemas');

const router = express.Router();
router.use(protect);

router.get('/', controller.getCart);
router.post('/', writeLimiter, validate(schemas.cartAddSchema), controller.addItem);
router.post('/merge', writeLimiter, validate(schemas.cartMergeSchema), controller.mergeCart);
router.delete('/', controller.clearCart);
router.put('/:itemId', validate(schemas.cartUpdateSchema), controller.updateItem);
router.delete('/:itemId', controller.removeItem);

module.exports = router;
