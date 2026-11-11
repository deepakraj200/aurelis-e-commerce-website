'use strict';

const express = require('express');
const controller = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimits');
const schemas = require('../validators/schemas');

const router = express.Router();

router.post('/', protect, writeLimiter, validate(schemas.reviewSchema), controller.createReview);
router.delete('/:id', protect, controller.deleteOwnReview);

module.exports = router;
