'use strict';

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateOrderNumber } = require('../utils/helpers');
const {
  totalsFor,
  STATUS_LABELS,
  ALLOWED_TRANSITIONS,
  CUSTOMER_CANCELLABLE,
} = require('../config/constants');
const env = require('../config/env');
const payments = require('./stripe');
const mailer = require('./mailer');

const PAYMENT_WINDOW_MINUTES = 60;

const paymentEnabled = () => env.paymentsEnabled;

const rollbackStock = async (reserved) => {
  await Promise.all(
    reserved.map(({ product, quantity }) =>
      Product.updateOne({ _id: product }, { $inc: { stock: quantity } })
    )
  );
};

const snapshotProduct = (product) => ({
  name: product.name,
  slug: product.slug,
  image: product.images?.[0] || '',
  price: product.price,
});

const validateVariants = (product, cartItem) => {
  if (cartItem.color) {
    const validColor = (product.colors || []).some((color) => color.name === cartItem.color);
    if (!validColor) throw new ApiError(422, `The selected colour for ${product.name} is no longer available.`);
  }
  if (cartItem.size) {
    const validSize = (product.sizes || []).includes(cartItem.size);
    if (!validSize) throw new ApiError(422, `The selected option for ${product.name} is no longer available.`);
  }
};

const expireStaleOrders = async () => {
  const cutoff = new Date(Date.now() - PAYMENT_WINDOW_MINUTES * 60 * 1000);
  const stale = await Order.find({ orderStatus: 'pending_payment', createdAt: { $lt: cutoff } }).select(
    '+paymentIntentId +paymentClientSecret'
  );

  for (const order of stale) {
    order.orderStatus = 'cancelled';
    order.cancelReason = 'Payment window expired.';
    order.cancelledAt = new Date();
    order.trackingHistory.push({
      status: 'cancelled',
      label: 'Cancelled',
      note: 'Payment was not completed within the reservation window.',
    });
    if (!order.stockRestored) {
      await rollbackStock(order.items.map((item) => ({ product: item.product, quantity: item.quantity })));
      order.stockRestored = true;
    }
    await order.save();
  }
  if (stale.length) console.log(`[orders] Released stock for ${stale.length} expired payment(s).`);
};

const createOrderFromCart = async (user, payload) => {
  if (payload.idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey: payload.idempotencyKey, user: user._id });
    if (existing) return existing;
  }

  const cart = await Cart.findOne({ user: user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new ApiError(422, 'Your bag is empty.');
  if (cart.items.length > 30) throw new ApiError(422, 'Your bag contains too many items.');

  const items = [];
  for (const cartItem of cart.items) {
    const product = cartItem.product;
    if (!product || !product.isActive) {
      throw new ApiError(422, 'One of the items in your bag is no longer available. Please remove it and try again.');
    }
    if (cartItem.quantity > product.stock) {
      throw new ApiError(409, `Only ${product.stock} of ${product.name} remain in stock.`);
    }
    validateVariants(product, cartItem);
    items.push({
      product: product._id,
      ...snapshotProduct(product),
      quantity: cartItem.quantity,
      color: cartItem.color || '',
      size: cartItem.size || '',
    });
  }

  const totals = totalsFor(items);
  const orderNumber = generateOrderNumber();
  const isCod = payload.paymentMethod === 'cod';

  const reserved = [];
  try {
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, isActive: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        throw new ApiError(409, `${item.name} just sold out. Please review your bag.`);
      }
      reserved.push({ product: item.product, quantity: item.quantity });
    }
  } catch (error) {
    await rollbackStock(reserved);
    throw error;
  }

  const trackingHistory = isCod
    ? [
        {
          status: 'placed',
          label: 'Order Placed',
          note: 'Cash on delivery selected. Your order is being prepared.',
        },
      ]
    : [
        {
          status: 'pending_payment',
          label: 'Awaiting Payment',
          note: 'Your items are reserved while you complete payment.',
        },
      ];

  let order;
  try {
    order = await Order.create({
      orderNumber,
      user: user._id,
      items,
      shippingAddress: payload.shippingAddress,
      paymentMethod: payload.paymentMethod,
      paymentProvider: 'none',
      paymentStatus: 'pending',
      orderStatus: isCod ? 'placed' : 'pending_payment',
      ...totals,
      trackingHistory,
      salesCounted: isCod,
      idempotencyKey: payload.idempotencyKey,
    });
  } catch (error) {
    await rollbackStock(reserved);
    if (error.code === 11000 && payload.idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey: payload.idempotencyKey, user: user._id });
      if (existing) return existing;
    }
    throw error;
  }

  if (isCod) {
    await Promise.all(
      items.map((item) =>
        Product.updateOne({ _id: item.product }, { $inc: { sold: item.quantity } })
      )
    );
    await clearOrderedItems(user._id, order);
    await mailer.sendOrderConfirmation({ to: user.email, name: user.name, order }).catch((error) =>
      console.error('[mail] order confirmation failed:', error.message)
    );
  }

  if (payload.saveAddress) {
    const exists = user.addresses.some(
      (address) =>
        address.line1.toLowerCase() === payload.shippingAddress.line1.toLowerCase() &&
        address.postalCode === payload.shippingAddress.postalCode
    );
    if (!exists && user.addresses.length < 8) {
      user.addresses.push({
        ...payload.shippingAddress,
        label: user.addresses.length === 0 ? 'Home' : 'Saved',
        isDefault: user.addresses.length === 0,
      });
      await user.save();
    }
  }

  return order;
};

const clearOrderedItems = async (userId, order) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return;

  order.items.forEach((ordered) => {
    const match = cart.items.find(
      (item) =>
        String(item.product) === String(ordered.product) &&
        (item.color || '') === (ordered.color || '') &&
        (item.size || '') === (ordered.size || '')
    );
    if (!match) return;
    match.quantity -= ordered.quantity;
    if (match.quantity <= 0) {
      cart.items = cart.items.filter((item) => String(item._id) !== String(match._id));
    }
  });

  const populated = await cart.populate('items.product');
  cart.totalPrice = Number(
    populated.items
      .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)
      .toFixed(2)
  );
  await cart.save();
};

const createPaymentIntentForOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId }).select(
    '+paymentIntentId +paymentClientSecret'
  );
  if (!order) throw new ApiError(404, 'Order not found.');
  if (order.orderStatus === 'cancelled') throw new ApiError(422, 'This order has been cancelled.');
  if (order.paymentStatus === 'paid') throw new ApiError(409, 'This order is already paid.');
  if (order.paymentMethod !== 'card') throw new ApiError(422, 'This order does not require card payment.');

  const intent = await payments.createIntent(order);
  order.paymentProvider = intent.provider;
  order.paymentIntentId = intent.paymentIntentId;
  order.paymentClientSecret = intent.clientSecret;
  await order.save();

  return {
    provider: intent.provider,
    clientSecret: intent.clientSecret,
    publishableKey: intent.publishableKey,
    testMode: intent.testMode,
    amount: order.totalAmount,
    currency: env.CURRENCY,
    orderNumber: order.orderNumber,
  };
};

const confirmPaymentForOrder = async ({ orderId, userId, paymentIntentId }) => {
  const order = await Order.findById(orderId).select('+paymentIntentId +paymentClientSecret');
  if (!order) throw new ApiError(404, 'Order not found.');
  if (String(order.user) !== String(userId)) throw new ApiError(403, 'You cannot access this order.');
  if (order.paymentStatus === 'paid') return order;
  if (order.orderStatus === 'cancelled') throw new ApiError(409, 'This order has been cancelled.');
  if (!order.paymentProvider || order.paymentProvider === 'none') {
    throw new ApiError(422, 'Start a secure payment before confirming.');
  }

  const verified = await payments.verifyPayment(order, {
    provider: order.paymentProvider,
    clientSecretStored: order.paymentClientSecret,
    intentId: paymentIntentId,
    currency: env.CURRENCY,
  });
  if (!verified) throw new ApiError(402, 'Payment could not be verified. No charge was captured for this order.');

  const update = {
    paymentStatus: 'paid',
    paidAt: new Date(),
    stockRestored: false,
  };
  if (order.orderStatus === 'pending_payment') update.orderStatus = 'placed';

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $ne: 'paid' }, orderStatus: { $ne: 'cancelled' } },
    {
      $set: update,
      $push: {
        trackingHistory: {
          status: 'placed',
          label: 'Order Placed',
          note: 'Payment verified successfully.',
          at: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!claimed) {
    const fresh = await Order.findById(orderId);
    if (fresh?.paymentStatus === 'paid') return fresh;
    throw new ApiError(409, 'This order can no longer be paid.');
  }

  await Promise.all(
    claimed.items.map((item) =>
      Product.updateOne({ _id: item.product }, { $inc: { sold: item.quantity } })
    )
  );
  if (!claimed.salesCounted) {
    claimed.salesCounted = true;
    await claimed.save();
  }
  await clearOrderedItems(order.user, claimed);
  const customer = await User.findById(order.user).select('name email');
  if (customer) {
    await mailer
      .sendOrderConfirmation({ to: customer.email, name: customer.name, order: claimed })
      .catch(() => {});
  }

  return claimed;
};

const restoreInventory = async (order) => {
  if (!order.stockRestored) {
    await Promise.all(
      order.items.map((item) =>
        Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
      )
    );
    order.stockRestored = true;
  }
  if (order.salesCounted) {
    await Promise.all(
      order.items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { sold: -item.quantity } }))
    );
    order.salesCounted = false;
  }
};

const cancelOrder = async ({ order, actor, reason }) => {
  const fresh = await Order.findById(order._id).select('+paymentIntentId');
  if (!fresh) throw new ApiError(404, 'Order not found.');
  if (fresh.orderStatus === 'cancelled') throw new ApiError(409, 'This order is already cancelled.');
  if (fresh.orderStatus === 'delivered') throw new ApiError(422, 'Delivered orders cannot be cancelled. Please request a refund.');

  if (actor === 'user' && !CUSTOMER_CANCELLABLE.includes(fresh.orderStatus)) {
    throw new ApiError(422, 'This order has already shipped and can no longer be cancelled.');
  }

  if (fresh.paymentStatus === 'paid') {
    await payments.refundPayment(fresh);
    fresh.paymentStatus = 'refunded';
  }

  await restoreInventory(fresh);
  fresh.orderStatus = 'cancelled';
  fresh.cancelReason = reason || (actor === 'admin' ? 'Cancelled by AURELIS support.' : 'Cancelled by customer.');
  fresh.cancelledAt = new Date();
  fresh.trackingHistory.push({
    status: 'cancelled',
    label: 'Cancelled',
    note: fresh.cancelReason,
  });
  await fresh.save();
  return fresh;
};

const updateOrderStatus = async (order, nextStatus, note) => {
  if (order.orderStatus === 'cancelled') throw new ApiError(409, 'Cancelled orders cannot be updated.');
  if (order.orderStatus === nextStatus) return order;
  const allowed = ALLOWED_TRANSITIONS[order.orderStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(422, `Cannot move an order from "${STATUS_LABELS[order.orderStatus]}" to "${STATUS_LABELS[nextStatus]}".`);
  }
  if (order.paymentStatus !== 'paid' && order.orderStatus === 'pending_payment') {
    throw new ApiError(422, 'Payment must be completed before this order can progress.');
  }

  if (nextStatus === 'cancelled') {
    return cancelOrder({ order, actor: 'admin', reason: note });
  }

  order.orderStatus = nextStatus;
  order.trackingHistory.push({
    status: nextStatus,
    label: STATUS_LABELS[nextStatus] || nextStatus,
    note: note || '',
  });
  if (nextStatus === 'delivered') {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
    }
  }
  await order.save();
  return order;
};

const refundOrder = async (order) => {
  if (order.paymentStatus === 'refunded') throw new ApiError(409, 'This order has already been refunded.');
  await payments.refundPayment(order);
  order.paymentStatus = 'refunded';
  order.trackingHistory.push({
    status: order.orderStatus,
    label: 'Refund Issued',
    note: 'The payment has been refunded to the original method.',
  });
  await order.save();
  return order;
};

module.exports = {
  createOrderFromCart,
  createPaymentIntentForOrder,
  confirmPaymentForOrder,
  cancelOrder,
  updateOrderStatus,
  refundOrder,
  expireStaleOrders,
  clearOrderedItems,
  paymentEnabled,
  isValidObjectId: mongoose.isValidObjectId,
};
