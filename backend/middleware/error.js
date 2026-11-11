'use strict';

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  let status = error.statusCode || 500;
  let message = error.message || 'Something went wrong.';
  let details = error.details;

  if (error.name === 'CastError') {
    status = 400;
    message = 'The requested resource could not be found.';
  } else if (error.name === 'ValidationError' && error.errors) {
    status = 422;
    details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
    message = details[0]?.message || 'Please check the submitted details.';
  } else if (error.code === 11000) {
    status = 409;
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    message =
      field === 'email'
        ? 'An account with this email already exists.'
        : `A record with this ${field} already exists.`;
    details = [{ field, message }];
  } else if (error.type === 'entity.too.large') {
    status = 413;
    message = 'The request payload is too large.';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'Images must be 5MB or smaller.';
  } else if (error.name === 'MulterError') {
    status = 400;
    message = 'The file upload could not be processed.';
  } else if (error.type === 'StripeInvalidRequestError') {
    status = 402;
    message = 'The payment provider rejected this request. Please try again.';
  }

  if (status >= 500) {
    console.error('[error]', req.method, req.originalUrl, error);
    if (env.isProduction) message = 'An unexpected server error occurred.';
  }

  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProduction ? {} : { stack: status >= 500 ? error.stack : undefined }),
  });
};

module.exports = { notFound, errorHandler };
