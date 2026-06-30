const express = require('express');
const {
  getWebsites,
  addWebsite,
  updateWebsite,
  deleteWebsite,
  toggleWebsite,
  getWebsiteLogs,
  getWebsiteUptime,
  getWebsiteBadge,
  manualPingWebsite
} = require('../controllers/websiteController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Public routes (No auth required)
router.get('/:id/badge', getWebsiteBadge);

// Protected routes (Auth required)
router.use(protect);

router.route('/')
  .get(getWebsites)
  .post(
    [
      body('websiteName', 'Website name is required').not().isEmpty(),
      body('url', 'Valid URL is required').isURL(),
      body('pingInterval', 'Ping interval must be between 1 and 10 minutes').optional().isInt({ min: 1, max: 10 })
    ],
    validateRequest,
    addWebsite
  );

router.route('/:id')
  .patch(updateWebsite)
  .delete(deleteWebsite);

router.patch('/:id/toggle', toggleWebsite);
router.get('/:id/logs', getWebsiteLogs);
router.get('/:id/uptime', getWebsiteUptime);
router.post('/:id/ping', manualPingWebsite);

module.exports = router;

