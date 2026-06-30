const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  validateRequest,
  login
);

router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
