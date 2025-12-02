const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const { initializeCronJobs } = require('./jobs/returnTripReminder');

let server;

// Debug: Log MongoDB URL (masked)
const mongoUrl = config.mongoose.url || '';
const maskedUrl = mongoUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log('MongoDB URL (masked):', maskedUrl);
console.log('MongoDB URL length:', mongoUrl.length);
console.log('First 20 chars:', mongoUrl.substring(0, 20));

// Connect to MongoDB
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`);
    
    // Initialize cron jobs
    initializeCronJobs();
  });
});

// Error handling for unexpected errors
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});

module.exports = server;
