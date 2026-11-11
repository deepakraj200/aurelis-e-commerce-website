'use strict';

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const orderService = require('../services/orderService');
const { STATUS_LABELS } = require('../config/constants');
const { escapeRegex } = require('../utils/helpers');

const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [revenueAgg, totalOrders, totalCustomers, totalProducts, recentOrders, bestSellers, lowStock, monthlyRaw, ordersByStatus, newCustomers] =
    await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email'),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            image: { $first: '$items.image' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            units: { $sum: '$items.quantity' },
          },
        },
        { $sort: { units: -1, revenue: -1 } },
        { $limit: 5 },
      ]),
      Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            orderStatus: { $ne: 'cancelled' },
            createdAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
      User.countDocuments({ role: 'user', createdAt: { $gte: thirtyDaysAgo } }),
    ]);

  const monthlyMap = new Map(monthlyRaw.map((entry) => [entry._id, entry]));
  const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
    const key = monthKey(date);
    const entry = monthlyMap.get(key);
    return {
      month: key,
      label: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      revenue: Number((entry?.revenue || 0).toFixed(2)),
      orders: entry?.orders || 0,
    };
  });

  const statusMap = {};
  ordersByStatus.forEach((entry) => {
    statusMap[entry._id] = entry.count;
  });

  res.json({
    success: true,
    data: {
      revenue: Number((revenueAgg[0]?.total || 0).toFixed(2)),
      totalOrders,
      totalCustomers,
      totalProducts,
      newCustomers,
      lowStock,
      monthlyRevenue,
      recentOrders,
      bestSellers,
      ordersByStatus: statusMap,
      averageOrderValue: totalOrders
        ? Number(((revenueAgg[0]?.total || 0) / Math.max(1, totalOrders)).toFixed(2))
        : 0,
    },
  });
});

const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.orderStatus = req.query.status;

  if (req.query.q) {
    const term = new RegExp(escapeRegex(String(req.query.q)), 'i');
    const users = await User.find({ $or: [{ name: term }, { email: term }] }).select('_id').limit(200);
    filter.$or = [{ orderNumber: term }, { user: { $in: users.map((user) => user._id) } }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders.map((order) => ({
      ...order.toJSON(),
      statusLabel: STATUS_LABELS[order.orderStatus],
    })),
    meta: { page, pages: Math.ceil(total / limit), total, limit },
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone addresses')
    .select('+paymentIntentId');
  if (!order) throw new ApiError(404, 'Order not found.');
  res.json({
    success: true,
    data: { ...order.toJSON(), statusLabel: STATUS_LABELS[order.orderStatus] },
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  const updated = await orderService.updateOrderStatus(order, req.body.status, req.body.note);
  res.json({ success: true, message: 'Order status updated.', data: updated });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  const cancelled = await orderService.cancelOrder({
    order,
    actor: 'admin',
    reason: req.body?.reason || 'Cancelled by AURELIS support.',
  });
  res.json({ success: true, message: 'Order cancelled and restocked.', data: cancelled });
});

const refundOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  const refunded = await orderService.refundOrder(order);
  res.json({ success: true, message: 'Refund processed.', data: refunded });
});

const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const filter = {};
  if (req.query.role && req.query.role !== 'all') filter.role = req.query.role;
  if (req.query.q) {
    const term = new RegExp(escapeRegex(String(req.query.q)), 'i');
    filter.$or = [{ name: term }, { email: term }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((user) => user._id) } } },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        spent: {
          $sum: { $cond: [{ $and: [{ $eq: ['$paymentStatus', 'paid'] }, { $ne: ['$orderStatus', 'cancelled'] }] }, '$totalAmount', 0] },
        },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ]);
  const statsMap = new Map(stats.map((entry) => [String(entry._id), entry]));

  res.json({
    success: true,
    data: users.map((user) => ({
      ...user.toJSON(),
      orderCount: statsMap.get(String(user._id))?.orderCount || 0,
      totalSpent: Number((statsMap.get(String(user._id))?.spent || 0).toFixed(2)),
      lastOrderAt: statsMap.get(String(user._id))?.lastOrderAt || null,
    })),
    meta: { page, pages: Math.ceil(total / limit), total, limit },
  });
});

const getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Customer not found.');
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(25);
  const stats = await Order.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.params.id) } },
    {
      $group: {
        _id: null,
        orderCount: { $sum: 1 },
        spent: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
      },
    },
  ]);
  res.json({
    success: true,
    data: {
      user,
      orders,
      stats: { orderCount: stats[0]?.orderCount || 0, spent: Number((stats[0]?.spent || 0).toFixed(2)) },
    },
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Customer not found.');
  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(422, 'You cannot change your own role or account status.');
  }

  if (req.body.role && req.body.role !== user.role) {
    if (user.role === 'admin' && req.body.role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) throw new ApiError(422, 'At least one active administrator is required.');
    }
    user.role = req.body.role;
  }

  if (req.body.isActive !== undefined) {
    user.isActive = req.body.isActive;
    if (!user.isActive) user.tokenVersion = (user.tokenVersion || 0) + 1;
  }

  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Customer account updated.', data: user });
});

const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const filter = {};
  if (req.query.q) {
    const term = new RegExp(escapeRegex(String(req.query.q)), 'i');
    filter.$or = [{ name: term }, { sku: term }];
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'archived') filter.isActive = false;
  if (req.query.status === 'low') filter.stock = { $lte: 5 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, data: products, meta: { page, pages: Math.ceil(total / limit), total, limit } });
});

module.exports = {
  dashboard,
  listOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  refundOrder,
  listUsers,
  getUserDetail,
  updateUser,
  listProducts,
};
