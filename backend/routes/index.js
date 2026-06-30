const express = require('express');
const authRoutes = require('./authRoutes');
const websiteRoutes = require('./websiteRoutes');
const adminRoutes = require('./adminRoutes');
const { getDashboardStats } = require('../controllers/websiteController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/websites', websiteRoutes);
router.use('/admin', adminRoutes);
router.get('/dashboard', protect, getDashboardStats);

module.exports = router;
