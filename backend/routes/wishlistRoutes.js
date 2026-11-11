'use strict';

const express = require('express');
const controller = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();
router.use(protect);

router.get('/', controller.getWishlist);
router.post('/', validate(schemas.wishlistAddSchema), controller.addToWishlist);
router.post('/merge', validate(schemas.wishlistMergeSchema), controller.mergeWishlist);
router.delete('/:productId', controller.removeFromWishlist);

module.exports = router;
