'use strict';

const asyncHandler = require('../utils/asyncHandler');
const orderService = require('../services/orderService');
const Order = require('../models/Order');
const { STATUS_LABELS } = require('../config/constants');
const ApiError = require('../utils/ApiError');

const createIntent = asyncHandler(async (req, res) => {
  const intent = await orderService.createPaymentIntentForOrder(req.body.orderId, req.user._id);

  // For Stripe the intent id is the confirmation reference; for sandbox the single-use token is.
  const confirmationRef = intent.provider === 'sandbox' ? intent.clientSecret : intent.clientSecret.split('_secret_')[0];

  res.status(201).json({ success: true, data: { ...intent, confirmationRef } });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const order = await orderService.confirmPaymentForOrder({
    orderId: req.body.orderId,
    userId: req.user._id,
    paymentIntentId: req.body.paymentIntentId,
  });

  res.json({
    success: true,
    message: 'Payment verified. Your order is confirmed.',
    data: { ...order.toJSON(), statusLabel: STATUS_LABELS[order.orderStatus] },
  });
});

const getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found.');
  res.json({
    success: true,
    data: {
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    },
  });
});

module.exports = { createIntent, confirmPayment, getPaymentStatus };
