'use strict';

const express = require('express');
const controller = require('../controllers/uploadController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', protect, adminOnly, upload.array('images', 6), controller.uploadImages);

module.exports = router;
