const cron = require('node-cron');
const Website = require('../models/Website');
const PingService = require('../services/PingService');
const logger = require('../utils/logger');

const startScheduler = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    logger.info('Scheduler triggered, checking for websites to ping...');
    
    try {
      const now = new Date();
      
      // Find all active websites where nextPing is less than or equal to current time
      const websitesToPing = await Website.find({
        isActive: true,
        nextPing: { $lte: now }
      });

      if (websitesToPing.length === 0) {
        return;
      }

      logger.info(`Found ${websitesToPing.length} websites to ping.`);

      // We use Promise.allSettled so one failure doesn't stop the rest
      const pingPromises = websitesToPing.map(website => PingService.pingWebsite(website));
      await Promise.allSettled(pingPromises);
      
    } catch (error) {
      logger.error(`Scheduler Error: ${error.message}`);
    }
  });

  logger.info('Global scheduler initialized.');
};

module.exports = startScheduler;
