'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { uploadBuffer } = require('../services/cloudinary');

const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) throw new ApiError(400, 'Select at least one image to upload.');
  if (files.length > 6) throw new ApiError(400, 'Upload up to 6 images at a time.');

  const uploaded = [];
  for (const file of files) {
    // Sequential uploads keep provider rate limits predictable.
    // eslint-disable-next-line no-await-in-loop
    const result = await uploadBuffer(file.buffer, file.mimetype);
    uploaded.push(result);
  }

  res.status(201).json({
    success: true,
    message: `${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded.`,
    data: uploaded,
  });
});

module.exports = { uploadImages };
