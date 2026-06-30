require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const initScheduler = require('./scheduler');

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize background scheduler
    initScheduler();

    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
