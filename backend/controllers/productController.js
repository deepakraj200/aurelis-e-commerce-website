'use strict';

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, slugify } = require('../utils/helpers');

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1, numReviews: -1 },
  popular: { sold: -1, createdAt: -1 },
};

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  return { page, limit, skip: (page - 1) * limit };
};

const resolveCategoryId = async (value) => {
  if (!value) return null;
  if (mongoose.isValidObjectId(value)) return value;
  const category = await Category.findOne({ slug: String(value).toLowerCase() });
  return category ? category._id : null;
};

const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { isActive: true };

  if (req.query.q) {
    const term = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
    filter.$or = [{ name: term }, { shortDescription: term }, { description: term }, { tags: term }];
  }
  if (req.query.category) {
    const categoryId = await resolveCategoryId(req.query.category);
    if (!categoryId) {
      return res.json({ success: true, data: [], meta: { page, pages: 0, total: 0, limit } });
    }
    filter.category = categoryId;
  }
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice !== undefined && req.query.minPrice !== '') {
      filter.price.$gte = Math.max(0, Number(req.query.minPrice) || 0);
    }
    if (req.query.maxPrice !== undefined && req.query.maxPrice !== '') {
      filter.price.$lte = Math.max(0, Number(req.query.maxPrice) || 0);
    }
  }
  if (req.query.rating) filter.rating = { $gte: Math.min(5, Number(req.query.rating) || 0) };
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.inStock === 'true') filter.stock = { $gt: 0 };
  if (req.query.onSale === 'true') filter.$expr = { $gt: ['$originalPrice', '$price'] };
  if (req.query.tag) filter.tags = String(req.query.tag).toLowerCase();

  const sort = SORTS[req.query.sort] || SORTS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: products,
    meta: { page, pages: Math.ceil(total / limit), total, limit },
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };
  const product = await Product.findOne({ ...query, isActive: true }).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found.');

  const reviewSummary = await Review.aggregate([
    { $match: { product: product._id } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  res.json({ success: true, data: { product, reviewSummary } });
});

const getRelated = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .limit(4)
    .sort({ rating: -1 });
  res.json({ success: true, data: related });
});

const createProduct = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) throw new ApiError(422, 'Choose a valid category.');

  const product = await Product.create({ ...req.body, category: category._id });
  const populated = await product.populate('category', 'name slug');
  res.status(201).json({ success: true, message: 'Product created.', data: populated });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');

  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) throw new ApiError(422, 'Choose a valid category.');
  }

  const fields = [
    'name',
    'sku',
    'shortDescription',
    'description',
    'brand',
    'price',
    'originalPrice',
    'category',
    'images',
    'stock',
    'specifications',
    'colors',
    'sizes',
    'featured',
    'isActive',
    'tags',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  if (product.originalPrice && product.originalPrice < product.price) {
    throw new ApiError(422, 'Original price must be greater than or equal to the sale price.');
  }

  await product.save();
  const populated = await product.populate('category', 'name slug');
  res.json({ success: true, message: 'Product updated.', data: populated });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');

  const orderCount = await Order.countDocuments({ 'items.product': product._id });
  if (orderCount > 0) {
    throw new ApiError(
      409,
      'This product appears in customer orders. Archive it instead of deleting it to preserve order history.'
    );
  }

  await Review.deleteMany({ product: product._id });
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted.' });
});

const getFilters = asyncHandler(async (req, res) => {
  const [categories, priceRange] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      categories,
      priceRange: priceRange[0]
        ? { min: Math.floor(priceRange[0].min), max: Math.ceil(priceRange[0].max) }
        : { min: 0, max: 0 },
    },
  });
});

module.exports = { listProducts, getProduct, getRelated, createProduct, updateProduct, deleteProduct, getFilters, slugify };
