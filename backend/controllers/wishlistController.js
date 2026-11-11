'use strict';

const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getOrCreate = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
};

const present = async (wishlist) => {
  await wishlist.populate({
    path: 'products',
    select: 'name slug price originalPrice images stock rating numReviews isActive category',
    populate: { path: 'category', select: 'name slug' },
  });
  return wishlist.products;
};

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreate(req.user._id);
  res.json({ success: true, data: await present(wishlist) });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.body.productId, isActive: true });
  if (!product) throw new ApiError(404, 'Product not found.');

  const wishlist = await getOrCreate(req.user._id);
  if (!wishlist.products.some((id) => String(id) === String(product._id))) {
    wishlist.products.push(product._id);
    await wishlist.save();
  }
  res.status(201).json({
    success: true,
    message: `${product.name} added to your wishlist.`,
    data: await present(wishlist),
  });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreate(req.user._id);
  wishlist.products = wishlist.products.filter((id) => String(id) !== req.params.productId);
  await wishlist.save();
  res.json({ success: true, message: 'Removed from wishlist.', data: await present(wishlist) });
});

const mergeWishlist = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.productIds) ? req.body.productIds.slice(0, 60) : [];
  const valid = await Product.find({ _id: { $in: ids }, isActive: true }).select('_id');
  const wishlist = await getOrCreate(req.user._id);
  valid.forEach((product) => {
    if (!wishlist.products.some((id) => String(id) === String(product._id))) {
      wishlist.products.push(product._id);
    }
  });
  await wishlist.save();
  res.json({ success: true, message: 'Wishlist synced.', data: await present(wishlist) });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist, mergeWishlist };
