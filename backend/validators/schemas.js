'use strict';

const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(160);
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .refine((value) => /[a-z]/.test(value), 'Password must include a lowercase letter')
  .refine((value) => /[A-Z]/.test(value), 'Password must include an uppercase letter')
  .refine((value) => /\d/.test(value), 'Password must include a number');
const phone = z.string().trim().min(6, 'Enter a valid phone number').max(30);
const imageUrl = z.string().trim().min(1, 'Image URL is required').max(800);
const optionalText = (max) => z.string().trim().max(max).optional();

const address = z.object({
  label: optionalText(40),
  fullName: z.string().trim().min(2, 'Full name is required').max(80),
  phone,
  line1: z.string().trim().min(3, 'Street address is required').max(160),
  line2: z.string().trim().max(160).optional().default(''),
  city: z.string().trim().min(2, 'City is required').max(80),
  state: z.string().trim().min(2, 'State is required').max(80),
  postalCode: z.string().trim().min(3, 'Postal code is required').max(20),
  country: z.string().trim().min(2, 'Country is required').max(80),
  isDefault: z.boolean().optional().default(false),
});

const registerSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
    email,
    password,
  }),
};

const loginSchema = {
  body: z.object({
    email,
    password: z.string().min(1, 'Password is required').max(72),
  }),
};

const forgotPasswordSchema = { body: z.object({ email }) };
const resetPasswordSchema = {
  body: z.object({ token: z.string().min(20, 'Reset token is invalid').max(128), password }),
};
const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required').max(72),
    newPassword: password,
  }),
};

const updateProfileSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    phone: z.string().trim().max(30).optional(),
    avatar: z.string().trim().max(800).optional(),
  }),
};

const addressBodySchema = { body: address };
const addressUpdateBodySchema = { body: address.partial() };

const categorySchema = {
  body: z.object({
    name: z.string().trim().min(2).max(60),
    description: optionalText(400).default(''),
    image: z.string().trim().max(800).optional().default(''),
    featured: z.boolean().optional().default(false),
    sortOrder: z.number().int().min(0).max(999).optional().default(0),
  }),
};

const categoryUpdateSchema = {
  body: categorySchema.body.partial(),
};

const productSchema = {
  body: z
    .object({
      name: z.string().trim().min(2).max(120),
      sku: z.string().trim().max(40).optional(),
      shortDescription: optionalText(220).default(''),
      description: z.string().trim().min(10, 'Description must be at least 10 characters').max(4000),
      brand: z.string().trim().max(60).optional().default('AURELIS'),
      price: z.coerce.number().min(0).max(1000000),
      originalPrice: z.coerce.number().min(0).max(1000000).nullable().optional(),
      category: objectId,
      images: z.array(imageUrl).min(1, 'Add at least one product image').max(8),
      stock: z.coerce.number().int().min(0).max(100000),
      specifications: z
        .array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(160) }))
        .max(30)
        .optional()
        .default([]),
      colors: z
        .array(z.object({ name: z.string().trim().min(1).max(40), hex: z.string().trim().regex(/^#[0-9a-f]{6}$/i, 'Use a hex colour').default('#8E8E93') }))
        .max(10)
        .optional()
        .default([]),
      sizes: z.array(z.string().trim().min(1).max(40)).max(15).optional().default([]),
      featured: z.boolean().optional().default(false),
      isActive: z.boolean().optional().default(true),
      tags: z.array(z.string().trim().max(30)).max(12).optional().default([]),
    })
    .refine((data) => !data.originalPrice || data.originalPrice >= data.price, {
      message: 'Original price must be greater than or equal to the sale price',
      path: ['originalPrice'],
    }),
};

const productUpdateSchema = { body: productSchema.body.innerType().partial() };

const cartAddSchema = {
  body: z.object({
    productId: objectId,
    quantity: z.coerce.number().int().min(1).max(20).optional().default(1),
    color: z.string().trim().max(40).optional().default(''),
    size: z.string().trim().max(40).optional().default(''),
  }),
};

const cartUpdateSchema = {
  body: z.object({ quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(20) }),
};
const cartMergeSchema = {
  body: z.object({
    items: z
      .array(
        z.object({
          productId: objectId,
          quantity: z.coerce.number().int().min(1).max(20).default(1),
          color: z.string().trim().max(40).optional().default(''),
          size: z.string().trim().max(40).optional().default(''),
        })
      )
      .max(50)
      .default([]),
  }),
};

const wishlistAddSchema = { body: z.object({ productId: objectId }) };
const wishlistMergeSchema = {
  body: z.object({ productIds: z.array(objectId).max(60).default([]) }),
};

const orderSchema = {
  body: z.object({
    shippingAddress: address.omit({ label: true, isDefault: true }).extend({
      line2: z.string().trim().max(160).optional().default(''),
      country: z.string().trim().min(2).max(80).default('United States'),
    }),
    paymentMethod: z.enum(['card', 'cod'], { errorMap: () => ({ message: 'Choose a valid payment method' }) }),
    saveAddress: z.boolean().optional().default(false),
    idempotencyKey: z.string().trim().min(8).max(80).optional(),
  }),
};

const paymentIntentSchema = { body: z.object({ orderId: objectId }) };
const paymentConfirmSchema = {
  body: z.object({ orderId: objectId, paymentIntentId: z.string().trim().min(8).max(300) }),
};

const cancelSchema = { body: z.object({ reason: z.string().trim().max(240).optional().default('') }) };

const reviewSchema = {
  body: z.object({
    productId: objectId,
    rating: z.coerce.number().int().min(1, 'Choose a rating').max(5),
    title: z.string().trim().max(90).optional().default(''),
    comment: z.string().trim().min(4, 'Share a little more detail').max(1200),
  }),
};

const statusSchema = {
  body: z.object({
    status: z.enum(['pending_payment', 'placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']),
    note: z.string().trim().max(240).optional().default(''),
  }),
};

const newsletterSchema = { body: z.object({ email, source: z.string().trim().max(30).optional().default('footer') }) };
const contactSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email,
    subject: z.string().trim().min(3).max(140),
    message: z.string().trim().min(10, 'Please add a little more detail').max(2000),
  }),
};

const adminUserSchema = {
  body: z
    .object({
      isActive: z.boolean().optional(),
      role: z.enum(['user', 'admin']).optional(),
    })
    .refine((data) => data.isActive !== undefined || data.role !== undefined, 'No changes supplied'),
};

module.exports = {
  objectId,
  address,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  addressBodySchema,
  addressUpdateBodySchema,
  cartMergeSchema,
  wishlistMergeSchema,
  categorySchema,
  categoryUpdateSchema,
  productSchema,
  productUpdateSchema,
  cartAddSchema,
  cartUpdateSchema,
  wishlistAddSchema,
  orderSchema,
  paymentIntentSchema,
  paymentConfirmSchema,
  cancelSchema,
  reviewSchema,
  statusSchema,
  newsletterSchema,
  contactSchema,
  adminUserSchema,
};
