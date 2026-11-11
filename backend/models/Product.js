'use strict';

const mongoose = require('mongoose');
const { slugify } = require('../utils/helpers');

const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    value: { type: String, required: true, trim: true, maxlength: 160 },
  },
  { _id: false }
);

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    hex: { type: String, trim: true, default: '#8E8E93' },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    sku: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    shortDescription: { type: String, trim: true, maxlength: 220, default: '' },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    brand: { type: String, trim: true, default: 'AURELIS' },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
      validate: { validator: Number.isFinite, message: 'Price must be a finite number' },
    },
    originalPrice: {
      type: Number,
      min: 0,
      validate: {
        validator(value) {
          if (value === undefined || value === null) return true;
          let price = typeof this.price === 'number' ? this.price : undefined;
          if (price === undefined && typeof this.getUpdate === 'function') {
            const update = this.getUpdate() || {};
            price = update.$set?.price ?? update.price;
          }
          if (price === undefined) return true;
          return value >= price;
        },
        message: 'Original price must be greater than or equal to the sale price',
      },
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images: {
      type: [String],
      default: [],
      validate: { validator: (value) => value.length <= 8, message: 'A product can have up to 8 images' },
    },
    stock: { type: Number, required: true, min: 0, default: 0, validate: { validator: Number.isInteger, message: 'Stock must be a whole number' } },
    specifications: { type: [specSchema], default: [] },
    colors: { type: [colorSchema], default: [] },
    sizes: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre('validate', async function generateSlug() {
  if (this.slug && !this.isModified('name')) return;
  const base = slugify(this.name);
  let candidate = base;
  let suffix = 2;
  while (await this.constructor.exists({ slug: candidate, _id: { $ne: this._id } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  this.slug = candidate;
});

productSchema.virtual('discountPercent').get(function discount() {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ featured: 1, isActive: 1 });
productSchema.index({ stock: 1 });

module.exports = mongoose.model('Product', productSchema);
