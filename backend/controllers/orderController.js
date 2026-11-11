'use strict';

const Order = require('../models/Order');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const orderService = require('../services/orderService');
const { CUSTOMER_CANCELLABLE, TIMELINE_STAGES, STATUS_LABELS } = require('../config/constants');

const presentOrder = async (order, userId) => {
  const reviewed = await Review.find({ user: userId, product: { $in: order.items.map((item) => item.product) } })
    .select('product')
    .lean();
  return {
    ...order.toJSON(),
    statusLabel: STATUS_LABELS[order.orderStatus] || order.orderStatus,
    canCancel: CUSTOMER_CANCELLABLE.includes(order.orderStatus),
    timeline: TIMELINE_STAGES,
    reviewedProductIds: reviewed.map((entry) => String(entry.product)),
  };
};

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrderFromCart(req.user, req.body);
  res.status(201).json({
    success: true,
    message:
      order.paymentMethod === 'cod'
        ? 'Order placed. Pay in cash when your order arrives.'
        : 'Order reserved. Complete payment to confirm.',
    data: await presentOrder(order, req.user._id),
  });
});

const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit, 10) || 8));
  const filter = { user: req.user._id };
  if (req.query.status && req.query.status !== 'all') {
    if (req.query.status === 'active') {
      filter.orderStatus = { $nin: ['delivered', 'cancelled'] };
    } else {
      filter.orderStatus = req.query.status;
    }
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders.map((order) => ({
      ...order.toJSON(),
      statusLabel: STATUS_LABELS[order.orderStatus] || order.orderStatus,
      canCancel: CUSTOMER_CANCELLABLE.includes(order.orderStatus),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    })),
    meta: { page, pages: Math.ceil(total / limit), total, limit },
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  if (String(order.user) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have access to this order.');
  }
  res.json({ success: true, data: await presentOrder(order, req.user._id) });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  if (String(order.user) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have access to this order.');
  }

  const cancelled = await orderService.cancelOrder({
    order,
    actor: 'user',
    reason: req.body?.reason || 'Cancelled by customer.',
  });

  res.json({
    success: true,
    message: 'Your order has been cancelled and the payment refunded where applicable.',
    data: await presentOrder(cancelled, req.user._id),
  });
});

module.exports = { createOrder, listOrders, getOrder, cancelOrder };
