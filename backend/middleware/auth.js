const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const User = require('../models/User');

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Fallback if needed, though we rely on cookies
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }
    
    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route', 401));
  }
});
