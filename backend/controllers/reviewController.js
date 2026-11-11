'use strict';

const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const refreshProductRating = async (productId) => {
  const summary = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const average = summary[0]?.average || 0;
  const count = summary[0]?.count || 0;
  await Product.updateOne(
    { _id: productId },
    { $set: { rating: Number(average.toFixed(2)), numReviews: count } }
  );
};

const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title = '', comment } = req.body;

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(404, 'Product not found.');

  const purchase = await Order.findOne({
    user: req.user._id,
    'items.product': product._id,
    paymentStatus: 'paid',
    orderStatus: { $in: ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'] },
  }).select('_id');

  if (!purchase) {
    throw new ApiError(403, 'Only verified purchasers can review this product.');
  }

  const existing = await Review.findOne({ user: req.user._id, product: product._id });
  if (existing) throw new ApiError(409, 'You have already reviewed this product.');

  let review;
  try {
    review = await Review.create({
      user: req.user._id,
      product: product._id,
      order: purchase._id,
      rating,
      title,
      comment,
    });
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'You have already reviewed this product.');
    throw error;
  }

  await refreshProductRating(product._id);
  const populated = await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, message: 'Thank you for your review.', data: populated });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 6));

  const [reviews, total, distribution] = await Promise.all([
    Review.find({ product: product._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments({ product: product._id }),
    Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((entry) => {
    counts[entry._id] = entry.count;
  });

  res.json({
    success: true,
    data: reviews,
    meta: {
      page,
      pages: Math.ceil(total / limit),
      total,
      limit,
      average: product.rating,
      distribution: counts,
    },
  });
});

const deleteOwnReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');
  if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You cannot remove this review.');
  }
  const productId = review.product;
  await review.deleteOne();
  await refreshProductRating(productId);
  res.json({ success: true, message: 'Review removed.' });
});

module.exports = { createReview, getProductReviews, deleteOwnReview };
