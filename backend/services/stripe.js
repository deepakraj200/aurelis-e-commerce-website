'use strict';

const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

let stripeClient = null;
const getStripe = () => {
  if (!env.paymentsEnabled) return null;
  if (!stripeClient) {
    stripeClient = require('stripe')(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

/**
 * Creates a payment intent for an order.
 * When Stripe keys are not configured the platform runs a sandbox processor:
 * the intent is a server-issued single-use token, clearly surfaced as test mode in the UI.
 * Card details are NEVER posted to our API in sandbox mode.
 */
const createIntent = async (order) => {
  const stripe = getStripe();

  if (stripe) {
    const intent = await stripe.paymentIntents.create(
      {
        amount: Math.round(order.totalAmount * 100),
        currency: env.CURRENCY,
        payment_method_types: ['card'],
        metadata: { orderId: String(order._id), orderNumber: order.orderNumber, userId: String(order.user) },
        description: `AURELIS order ${order.orderNumber}`,
      },
      { idempotencyKey: `aurelis-intent-${order._id}-${Math.floor(Date.now() / 300000)}` }
    );

    return {
      provider: 'stripe',
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
      testMode: env.STRIPE_SECRET_KEY.startsWith('sk_test_'),
    };
  }

  const token = `sbx_${crypto.randomBytes(24).toString('hex')}`;
  return {
    provider: 'sandbox',
    clientSecret: token,
    paymentIntentId: `sandbox_${crypto.randomBytes(10).toString('hex')}`,
    publishableKey: '',
    testMode: true,
  };
};

/** Verifies with the provider before any order is marked paid. */
const verifyPayment = async (order, { provider, clientSecretStored, intentId, currency }) => {
  if (order.paymentStatus === 'paid') return true;

  if (provider === 'sandbox') {
    if (!clientSecretStored || !intentId) return false;
    const expected = Buffer.from(clientSecretStored);
    const received = Buffer.from(String(intentId));
    if (expected.length !== received.length) return false;
    if (!crypto.timingSafeEqual(expected, received)) return false;
    return order.paymentProvider === 'sandbox';
  }

  if (provider === 'stripe') {
    const stripe = getStripe();
    if (!stripe) throw new ApiError(503, 'Card payments are not configured.');
    const intent = await stripe.paymentIntents.retrieve(intentId);
    if (intent.status !== 'succeeded') return false;
    if (String(intent.metadata?.orderId) !== String(order._id)) return false;
    if (intent.amount !== Math.round(order.totalAmount * 100)) return false;
    if (intent.currency !== (currency || env.CURRENCY)) return false;
    return true;
  }

  return false;
};

const refundPayment = async (order) => {
  if (order.paymentStatus !== 'paid') {
    throw new ApiError(422, 'Only paid orders can be refunded.');
  }
  if (order.paymentProvider === 'stripe') {
    const stripe = getStripe();
    if (!stripe) throw new ApiError(503, 'Card payments are not configured.');
    const intentId = order.paymentIntentId;
    if (!intentId) throw new ApiError(422, 'No payment reference is available for this order.');
    await stripe.refunds.create({ payment_intent: intentId });
  }
  return true;
};

module.exports = { createIntent, verifyPayment, refundPayment, isStripeEnabled: () => Boolean(getStripe()) };
