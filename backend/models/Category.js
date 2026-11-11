'use strict';

const mongoose = require('mongoose');
const { slugify } = require('../utils/helpers');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 400, default: '' },
    image: { type: String, trim: true, default: '' },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.pre('validate', async function generateSlug() {
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

module.exports = mongoose.model('Category', categorySchema);
