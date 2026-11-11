'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const skipInTests = () => env.NODE_ENV === 'test';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: 'Too many requests. Please slow down and try again shortly.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipInTests,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: 'Too many actions. Please wait a moment.' },
});

module.exports = { apiLimiter, authLimiter, writeLimiter };
