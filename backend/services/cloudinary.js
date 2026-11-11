'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const extensionFor = (mimetype) => {
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };
  return map[mimetype] || '.jpg';
};

const uploadBuffer = async (buffer, mimetype) => {
  if (env.cloudinaryEnabled) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'aurelis/products', resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
        (error, result) => {
          if (error) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(buffer);
    });
  }

  await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extensionFor(mimetype)}`;
  await fs.writeFile(path.join(env.UPLOAD_DIR, filename), buffer);
  return { url: `/uploads/${filename}`, publicId: null };
};

const deleteAsset = async (publicId) => {
  if (env.cloudinaryEnabled && publicId) {
    await cloudinary.uploader.destroy(publicId);
  }
};

module.exports = { uploadBuffer, deleteAsset };
