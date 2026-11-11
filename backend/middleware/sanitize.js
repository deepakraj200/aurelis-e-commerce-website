'use strict';

const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const clean = {};
    Object.entries(value).forEach(([key, nested]) => {
      // Prevent Mongo operator injection ($gt, $where...) and prototype pollution.
      if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor') return;
      clean[key] = sanitizeValue(nested);
    });
    return clean;
  }
  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
  if (req.params && typeof req.params === 'object') req.params = sanitizeValue(req.params);
  next();
};

module.exports = sanitizeRequest;
