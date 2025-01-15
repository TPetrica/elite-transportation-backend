const mongoose = require('mongoose');
const config = require('./config/config');
const Schedule = require('./models/schedule.model');
const logger = require('./config/logger');

const initializeSchedule = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    logger.info('Connected to MongoDB');

    logger.info('Initializing default schedule...');
    await Schedule.initializeDefaultSchedule();
    logger.info('Successfully initialized default schedule');

    process.exit(0);
  } catch (error) {
    logger.error('Error initializing schedule:', error);
    process.exit(1);
  }
};

initializeSchedule();
