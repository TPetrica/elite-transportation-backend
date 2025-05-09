const mongoose = require('mongoose');
const config = require('../config/config');
const logger = require('../config/logger');
const { Blog } = require('../models');
const blogs = require('./blogSeed');

const seedBlogs = async () => {
  try {
    // Connect to the database
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    logger.info('Connected to MongoDB');

    // Get the count of existing blogs
    const existingCount = await Blog.countDocuments();
    logger.info(`Found ${existingCount} existing blogs`);

    // Don't insert if blogs already exist
    if (existingCount > 0) {
      logger.info('Blogs already exist, skipping seeding');
      return;
    }

    // Insert blogs
    logger.info('Seeding blogs...');
    const result = await Blog.insertMany(blogs);
    logger.info(`Successfully seeded ${result.length} blogs`);

  } catch (error) {
    logger.error(`Error seeding blogs: ${error.message}`);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
};

// If this script is run directly
if (require.main === module) {
  seedBlogs();
}

module.exports = seedBlogs;
