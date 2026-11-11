'use strict';

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { totalsFor } = require('../config/constants');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const buildCartResponse = async (cart) => {
  await cart.populate({
    path: 'items.product',
    select: 'name slug price originalPrice images stock isActive colors sizes category',
    populate: { path: 'category', select: 'name slug' },
  });

  const invalid = cart.items.filter((item) => !item.product || !item.product.isActive);
  if (invalid.length) {
    cart.items = cart.items.filter((item) => item.product && item.product.isActive);
    await cart.save();
  }

  const items = cart.items.map((item) => ({
    _id: item._id,
    product: item.product,
    quantity: item.quantity,
    color: item.color,
    size: item.size,
    lineTotal: Number((item.product.price * item.quantity).toFixed(2)),
  }));

  const summary = totalsFor(
    items.map((item) => ({ price: item.product.price, quantity: item.quantity }))
  );
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: cart._id,
    items,
    summary: { ...summary, count },
    updatedAt: cart.updatedAt,
  };
};

const syncTotal = async (cart) => {
  await cart.populate('items.product');
  cart.totalPrice = Number(
    cart.items
      .filter((item) => item.product)
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      .toFixed(2)
  );
  await cart.save();
};

const validateSelection = (product, color, size) => {
  if (color) {
    if (!(product.colors || []).some((entry) => entry.name === color)) {
      throw new ApiError(422, 'That colour is not available for this product.');
    }
  }
  if (size) {
    if (!(product.sizes || []).includes(size)) {
      throw new ApiError(422, 'That option is not available for this product.');
    }
  }
};

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ success: true, data: await buildCartResponse(cart) });
});

const addItem = asyncHandler(async (req, res) => {
  const { productId, color = '', size = '' } = req.body;
  const quantity = req.body.quantity || 1;

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(404, 'Product not found.');
  if (product.stock < 1) throw new ApiError(409, 'This product is currently out of stock.');
  validateSelection(product, color, size);

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find(
    (item) =>
      String(item.product) === String(product._id) &&
      (item.color || '') === color &&
      (item.size || '') === size
  );

  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > 20) throw new ApiError(422, 'You can add up to 20 units of one item.');
  if (nextQuantity > product.stock) {
    throw new ApiError(409, `Only ${product.stock} unit(s) of ${product.name} are available.`);
  }

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    cart.items.push({ product: product._id, quantity, color, size });
  }

  await syncTotal(cart);
  res.status(201).json({ success: true, message: `${product.name} added to your bag.`, data: await buildCartResponse(cart) });
});

const updateItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'That item is no longer in your bag.');

  const product = await Product.findById(item.product);
  if (!product || !product.isActive) throw new ApiError(409, 'This product is no longer available.');
  if (req.body.quantity > product.stock) {
    throw new ApiError(409, `Only ${product.stock} unit(s) of ${product.name} are available.`);
  }

  item.quantity = req.body.quantity;
  await syncTotal(cart);
  res.json({ success: true, data: await buildCartResponse(cart) });
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'That item is no longer in your bag.');
  item.deleteOne();
  await syncTotal(cart);
  res.json({ success: true, message: 'Item removed.', data: await buildCartResponse(cart) });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();
  res.json({ success: true, message: 'Your bag is empty.', data: await buildCartResponse(cart) });
});

/** Merges a guest cart saved in the browser into the authenticated cart. */
const mergeCart = asyncHandler(async (req, res) => {
  const incoming = req.body.items || [];
  const cart = await getOrCreateCart(req.user._id);
  let merged = 0;

  for (const entry of incoming) {
    const product = await Product.findOne({ _id: entry.productId, isActive: true });
    if (!product || product.stock < 1) continue;

    const color = entry.color || '';
    const size = entry.size || '';
    try {
      validateSelection(product, color, size);
    } catch {
      continue;
    }

    const existing = cart.items.find(
      (item) =>
        String(item.product) === String(product._id) &&
        (item.color || '') === color &&
        (item.size || '') === size
    );
    const desired = Math.min(20, Math.max(1, Number(entry.quantity) || 1));
    const nextQuantity = Math.min(product.stock, Math.min(20, (existing?.quantity || 0) + desired));

    if (existing) existing.quantity = nextQuantity;
    else cart.items.push({ product: product._id, quantity: nextQuantity, color, size });
    merged += 1;
  }

  await syncTotal(cart);
  res.json({
    success: true,
    message: merged ? 'Your bag has been synced.' : 'Nothing new to sync.',
    data: await buildCartResponse(cart),
  });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, mergeCart };
