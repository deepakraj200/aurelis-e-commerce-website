'use strict';

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/token');
const { randomToken, sha256 } = require('../utils/helpers');
const mailer = require('../services/mailer');
const env = require('../config/env');

const publicUser = (user) => user.toJSON();

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const user = await User.create({ name, email, password });
  const token = signToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Welcome to AURELIS.',
    data: { user: publicUser(user), token },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +tokenVersion');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Email or password is incorrect.');
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been suspended. Please contact support.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user);
  setAuthCookie(res, token);

  res.json({
    success: true,
    message: 'Welcome back.',
    data: { user: publicUser(user), token },
  });
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'You have been signed out.' });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user) } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  let devResetUrl;

  if (user) {
    const rawToken = randomToken(32);
    user.resetPasswordToken = sha256(rawToken);
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.CLIENT_URL[0]}/reset-password?token=${rawToken}`;
    const delivery = await mailer.sendPasswordReset({ to: user.email, name: user.name, resetUrl });
    if (!delivery.delivered && !env.isProduction) devResetUrl = resetUrl;
  }

  res.json({
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
    ...(devResetUrl ? { devResetUrl } : {}),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const hashed = sha256(req.body.token);
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: new Date() },
  }).select('+password +resetPasswordToken +resetPasswordExpire +tokenVersion');

  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired.');

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  const token = signToken(user);
  setAuthCookie(res, token);

  res.json({
    success: true,
    message: 'Your password has been reset.',
    data: { user: publicUser(user), token },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'avatar'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  });
  await req.user.save();
  res.json({ success: true, message: 'Profile updated.', data: { user: publicUser(req.user) } });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  const matches = await user.comparePassword(req.body.currentPassword);
  if (!matches) throw new ApiError(401, 'Your current password is incorrect.');

  user.password = req.body.newPassword;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ success: true, message: 'Password updated.', data: { token } });
});

const normalizeDefault = (addresses, keepId) => {
  addresses.forEach((address) => {
    address.isDefault = String(address._id) === String(keepId);
  });
};

const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.addresses.length >= 8) throw new ApiError(422, 'You can save up to 8 addresses.');
  const shouldDefault = req.body.isDefault || user.addresses.length === 0;
  user.addresses.push({ ...req.body, isDefault: shouldDefault });
  const added = user.addresses[user.addresses.length - 1];
  if (shouldDefault) normalizeDefault(user.addresses, added._id);
  await user.save();
  res.status(201).json({ success: true, message: 'Address saved.', data: { addresses: user.addresses } });
});

const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found.');

  const fields = ['label', 'fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country', 'isDefault'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) address[field] = req.body[field];
  });
  if (address.isDefault) normalizeDefault(user.addresses, address._id);
  await user.save();
  res.json({ success: true, message: 'Address updated.', data: { addresses: user.addresses } });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found.');
  address.deleteOne();
  if (user.addresses.length && !user.addresses.some((item) => item.isDefault)) {
    user.addresses[0].isDefault = true;
  }
  await user.save();
  res.json({ success: true, message: 'Address removed.', data: { addresses: user.addresses } });
});

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
};
