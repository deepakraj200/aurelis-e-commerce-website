'use strict';

const mongoose = require('mongoose');
const Newsletter = require('../models/Newsletter');
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { TAX_RATE, SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } = require('../config/constants');

const getConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      brand: 'AURELIS',
      currency: env.CURRENCY.toUpperCase(),
      taxRate: TAX_RATE,
      shippingFee: SHIPPING_FEE,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      payments: {
        stripeEnabled: env.paymentsEnabled,
        sandbox: env.sandboxPayments,
        publishableKey: env.STRIPE_PUBLISHABLE_KEY,
      },
      cloudinaryEnabled: env.cloudinaryEnabled,
    },
  });
});

const subscribe = asyncHandler(async (req, res) => {
  const existing = await Newsletter.findOne({ email: req.body.email });
  if (existing) {
    return res.json({ success: true, message: 'You are already on the AURELIS list.' });
  }
  await Newsletter.create({ email: req.body.email, source: req.body.source });
  res.status(201).json({ success: true, message: 'Welcome to AURELIS. Watch your inbox.' });
});

const contact = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Your message has been received. Our concierge team will reply within one business day.',
    data: { reference: message._id, createdAt: message.createdAt },
  });
});

const health = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      uptime: Math.round(process.uptime()),
      environment: env.NODE_ENV,
      time: new Date().toISOString(),
    },
  });
});

module.exports = { getConfig, subscribe, contact, health };
