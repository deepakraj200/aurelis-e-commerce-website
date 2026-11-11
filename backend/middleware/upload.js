'use strict';

const multer = require('multer');
const ApiError = require('../utils/ApiError');

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, callback) => {
    if (!allowed.has(file.mimetype)) {
      return callback(new ApiError(400, 'Only JPEG, PNG, WebP or AVIF images are allowed.'));
    }
    callback(null, true);
  },
});

module.exports = upload;
