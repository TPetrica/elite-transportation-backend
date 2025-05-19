const mongoose = require('mongoose');
const config = require('../config/config');
const { Affiliate } = require('../models');
const affiliateSeed = require('./affiliateSeed');

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  console.log('Connected to MongoDB');
  seedAffiliates();
});

async function seedAffiliates() {
  try {
    // Clear existing affiliates
    await Affiliate.deleteMany({});
    console.log('Cleared existing affiliates');

    // Insert seed data
    const affiliates = await Affiliate.insertMany(affiliateSeed);
    console.log(`Inserted ${affiliates.length} affiliates`);

    console.log('Affiliate seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding affiliates:', error);
    process.exit(1);
  }
}