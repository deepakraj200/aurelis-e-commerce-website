'use strict';

const TAX_RATE = require('./env').TAX_RATE;
const SHIPPING_FEE = require('./env').SHIPPING_FEE;
const FREE_SHIPPING_THRESHOLD = require('./env').FREE_SHIPPING_THRESHOLD;

const ORDER_FLOW = [
  'pending_payment',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

const STATUS_LABELS = {
  pending_payment: 'Awaiting Payment',
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// Customer-facing timeline stages (spec requirement).
const TIMELINE_STAGES = [
  { status: 'placed', label: 'Order Placed' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
];

const ALLOWED_TRANSITIONS = {
  pending_payment: ['placed', 'cancelled'],
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const CUSTOMER_CANCELLABLE = ['pending_payment', 'placed', 'confirmed', 'processing'];

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const shippingFor = (subtotal) => (subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE);

const totalsFor = (items) => {
  const subtotal = round2(
    items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
  );
  const shippingCost = shippingFor(subtotal);
  const tax = round2(subtotal * TAX_RATE);
  const totalAmount = round2(subtotal + shippingCost + tax);
  return { subtotal, shippingCost, tax, totalAmount };
};

module.exports = {
  TAX_RATE,
  SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
  ORDER_FLOW,
  STATUS_LABELS,
  TIMELINE_STAGES,
  ALLOWED_TRANSITIONS,
  CUSTOMER_CANCELLABLE,
  round2,
  shippingFor,
  totalsFor,
};
