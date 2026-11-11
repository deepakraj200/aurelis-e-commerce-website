'use strict';

const ApiError = require('../utils/ApiError');

/**
 * validate({ body: schema, params: schema, query: schema })
 * Replaces the request section with the parsed, typed value.
 */
const validate = (schemas) => (req, res, next) => {
  const errors = [];

  Object.entries(schemas).forEach(([section, schema]) => {
    const result = schema.safeParse(req[section]);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push({
          field: [section === 'body' ? null : section, ...issue.path].filter(Boolean).join('.'),
          message: issue.message,
        });
      });
      return;
    }
    if (section === 'query') {
      Object.keys(req.query).forEach((key) => delete req.query[key]);
      Object.assign(req.query, result.data);
    } else {
      req[section] = result.data;
    }
  });

  if (errors.length) {
    return next(new ApiError(422, errors[0].message, errors));
  }
  next();
};

module.exports = validate;
