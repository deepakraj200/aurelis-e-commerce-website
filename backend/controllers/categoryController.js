'use strict';

const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 }, stock: { $sum: '$stock' } } },
  ]);
  const countMap = new Map(counts.map((entry) => [String(entry._id), entry]));

  res.json({
    success: true,
    data: categories.map((category) => ({
      ...category,
      productCount: countMap.get(String(category._id))?.count || 0,
    })),
  });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, message: 'Category created.', data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  ['name', 'description', 'image', 'featured', 'sortOrder'].forEach((field) => {
    if (req.body[field] !== undefined) category[field] = req.body[field];
  });
  await category.save();
  res.json({ success: true, message: 'Category updated.', data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    throw new ApiError(409, `Move or archive the ${productCount} product(s) in this category first.`);
  }
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted.' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
