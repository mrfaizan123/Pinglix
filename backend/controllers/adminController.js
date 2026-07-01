const Website = require('../models/Website');
const User = require('../models/User');
const PingLog = require('../models/PingLog');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const jwt = require('jsonwebtoken');

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check against env variables
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return next(new AppError('Invalid admin credentials', 401));
  }

  // Create JWT with admin role
  const token = jwt.sign({ id: 'admin', role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h'
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const options = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    httpOnly: true,
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    maxAge: 24 * 60 * 60 * 1000,
  };

  res.status(200).cookie('token', token, options).json({
    success: true,
    token,
    user: { id: 'admin', email: process.env.ADMIN_EMAIL, role: 'admin' }
  });
});

// @desc    Admin logout
// @route   GET /api/admin/logout
// @access  Private (Admin)
exports.adminLogout = asyncHandler(async (req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get global stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getAdminStats = asyncHandler(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalWebsites = await Website.countDocuments();
  const onlineWebsites = await Website.countDocuments({ status: 'up' });
  const offlineWebsites = await Website.countDocuments({ status: 'down' });
  const totalPingLogs = await PingLog.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalWebsites,
      onlineWebsites,
      offlineWebsites,
      totalPingLogs
    }
  });
});

// @desc    Get all websites
// @route   GET /api/admin/websites
// @access  Private (Admin)
exports.getAllWebsites = asyncHandler(async (req, res, next) => {
  const websites = await Website.find().populate('userId', 'name email').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: websites.length,
    data: websites
  });
});

// @desc    Delete website
// @route   DELETE /api/admin/websites/:id
// @access  Private (Admin)
exports.deleteWebsiteAdmin = asyncHandler(async (req, res, next) => {
  const website = await Website.findById(req.params.id);

  if (!website) {
    return next(new AppError('Website not found', 404));
  }

  // Delete all associated ping logs
  await PingLog.deleteMany({ websiteId: website._id });
  await website.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
