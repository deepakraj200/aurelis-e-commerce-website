'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const sanitize = require('./middleware/sanitize');
const { apiLimiter } = require('./middleware/rateLimits');
const { notFound, errorHandler } = require('./middleware/error');
const ApiError = require('./utils/ApiError');

const app = express();

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

const allowedOrigins = new Set(env.CLIENT_URL);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || !env.isProduction) return callback(null, true);
      return callback(new ApiError(403, 'This origin is not allowed to access the API.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(sanitize);

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d', fallthrough: true }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AURELIS API',
    version: '1.0.0',
    docs: 'See API_DOCUMENTATION.md in the repository.',
    health: '/api/health',
  });
});

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
