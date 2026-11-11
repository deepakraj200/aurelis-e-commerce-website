'use strict';

const express = require('express');
const controller = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', controller.listCategories);
router.post('/', protect, adminOnly, validate(schemas.categorySchema), controller.createCategory);
router.put('/:id', protect, adminOnly, validate(schemas.categoryUpdateSchema), controller.updateCategory);
router.delete('/:id', protect, adminOnly, controller.deleteCategory);

module.exports = router;
