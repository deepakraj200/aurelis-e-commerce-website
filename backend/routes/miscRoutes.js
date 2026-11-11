'use strict';

const express = require('express');
const controller = require('../controllers/miscController');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/health', controller.health);
router.get('/config', controller.getConfig);
router.post('/newsletter', validate(schemas.newsletterSchema), controller.subscribe);
router.post('/contact', validate(schemas.contactSchema), controller.contact);

module.exports = router;
