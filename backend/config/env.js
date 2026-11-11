'use strict';

const path = require('path');
const crypto = require('crypto');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const bool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set in production.');
  }
  // Ephemeral development secret: sessions reset on restart, nothing is hardcoded.
  jwtSecret = crypto.randomBytes(48).toString('hex');
  console.warn('[config] JWT_SECRET not set — using an ephemeral development secret.');
}

const env = {
  NODE_ENV,
  isProduction,
  PORT: number(process.env.PORT, 5000),
  CLIENT_URL: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  MONGODB_URI: process.env.MONGODB_URI || '',
  ENABLE_MEMORY_DB: bool(process.env.ENABLE_MEMORY_DB, NODE_ENV !== 'production'),
  AUTO_SEED: bool(process.env.AUTO_SEED, NODE_ENV !== 'production' && NODE_ENV !== 'test'),
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_NAME: process.env.COOKIE_NAME || 'aurelis_token',
  TAX_RATE: number(process.env.TAX_RATE, 0.08),
  SHIPPING_FEE: number(process.env.SHIPPING_FEE, 12),
  FREE_SHIPPING_THRESHOLD: number(process.env.FREE_SHIPPING_THRESHOLD, 150),
  CURRENCY: (process.env.CURRENCY || 'usd').toLowerCase(),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: number(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'AURELIS <no-reply@aurelis.example>',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@aurelis.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@12345',
  DEMO_EMAIL: process.env.DEMO_EMAIL || 'demo@aurelis.com',
  DEMO_PASSWORD: process.env.DEMO_PASSWORD || 'Demo@12345',
  UPLOAD_DIR: path.resolve(__dirname, '..', 'uploads'),
  DB_PATH: path.resolve(__dirname, '..', '.data', 'db'),
};

env.paymentsEnabled = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY);
env.sandboxPayments = !env.paymentsEnabled;
env.cloudinaryEnabled = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

module.exports = env;
