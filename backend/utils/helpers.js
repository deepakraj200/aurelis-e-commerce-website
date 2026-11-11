'use strict';

const crypto = require('crypto');

const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const generateOrderNumber = () => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const random = crypto.randomInt(100000, 999999);
  return `AUR-${stamp}-${random}`;
};

const pick = (object, keys) =>
  keys.reduce((acc, key) => {
    if (object[key] !== undefined) acc[key] = object[key];
    return acc;
  }, {});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

module.exports = {
  slugify,
  escapeRegex,
  randomToken,
  sha256,
  generateOrderNumber,
  pick,
  clamp,
};
