'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const extractToken = (req) => {
  if (req.cookies && req.cookies[env.COOKIE_NAME]) return req.cookies[env.COOKIE_NAME];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
};

const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, 'Please sign in to continue.');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { issuer: 'aurelis-api' });
  } catch (error) {
    throw new ApiError(401, error.name === 'TokenExpiredError' ? 'Your session has expired. Please sign in again.' : 'Invalid authentication token.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'This account no longer exists.');
  if (!user.isActive) throw new ApiError(403, 'This account has been suspended. Please contact support.');
  if ((user.tokenVersion || 0) !== (payload.tv || 0)) {
    throw new ApiError(401, 'Your session is no longer valid. Please sign in again.');
  }

  req.user = user;
  next();
});

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Administrator access is required.'));
  }
  next();
};

module.exports = { protect, adminOnly, extractToken };
