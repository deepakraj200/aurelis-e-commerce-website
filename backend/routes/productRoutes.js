'use strict';

const express = require('express');
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', productController.listProducts);
router.get('/filters', productController.getFilters);
router.get('/:id/related', productController.getRelated);
router.get('/:id/reviews', reviewController.getProductReviews);

router.post('/', protect, adminOnly, validate(schemas.productSchema), productController.createProduct);
router.get('/:id', productController.getProduct);
router.put('/:id', protect, adminOnly, validate(schemas.productUpdateSchema), productController.updateProduct);
router.delete('/:id', protect, adminOnly, productController.deleteProduct);

module.exports = router;
