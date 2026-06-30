const express = require('express');
const {
  adminLogin,
  adminLogout,
  getAdminStats,
  getAllWebsites,
  deleteWebsiteAdmin
} = require('../controllers/adminController');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Middleware to protect admin routes
const protectAdmin = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token || token === 'none') {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return next(new AppError('Not authorized, admin only', 403));
    }
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError('Not authorized, token failed', 401));
  }
});

// Public admin routes
router.post('/login', adminLogin);

// Protected admin routes
router.use(protectAdmin);
router.get('/logout', adminLogout);
router.get('/stats', getAdminStats);
router.get('/websites', getAllWebsites);
router.delete('/websites/:id', deleteWebsiteAdmin);

module.exports = router;
