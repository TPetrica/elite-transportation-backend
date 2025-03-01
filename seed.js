/**
 * This script will delete all existing services and seed new ones with proper serviceType field
 *
 * Usage:
 * - Place this file in the scripts directory of your project
 * - Run with: node scripts/seedServices.js
 */

const mongoose = require('mongoose');
const config = require('./src/config/config');
const logger = require('./src/config/logger');
const Service = require('./src/models/service.model');

// Connect to MongoDB
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  seedServices()
    .then(() => {
      logger.info('Service data seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error seeding services:', error);
      process.exit(1);
    });
});

// Services to be seeded
const services = [
  {
    serviceType: 'from-airport',
    title: 'From Airport (1-4 Passengers)',
    description: 'Airport pickup with flight tracking - $120',
    maxPassengers: 4,
    basePrice: 120,
    requiresInquiry: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    serviceType: 'to-airport',
    title: 'To Airport (1-4 Passengers)',
    description: 'Airport dropoff service - $120',
    maxPassengers: 4,
    basePrice: 120,
    requiresInquiry: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    serviceType: 'canyons',
    title: 'Cottonwood Canyons Transfer (1-4 Passengers)',
    description: 'To/From Snowbird/Alta/Solitude/Brighton/Sundance - $150',
    maxPassengers: 4,
    basePrice: 150,
    requiresInquiry: false,
    isActive: true,
    sortOrder: 3,
  },
  {
    serviceType: 'hourly',
    title: 'Hourly Service',
    description: '$100 per hour',
    maxPassengers: 4,
    basePrice: 100,
    requiresInquiry: false,
    isActive: true,
    sortOrder: 4,
  },
  {
    serviceType: 'per-person',
    title: 'Per Person Service',
    description: '$65 per person (minimum 2 persons - $130)',
    maxPassengers: 4,
    basePrice: 65,
    requiresInquiry: false,
    isActive: true,
    sortOrder: 5,
  },
  {
    serviceType: 'group',
    title: 'Group Transportation (5+ passengers)',
    description: 'Group - please inquire for pricing and availability',
    maxPassengers: null,
    basePrice: 0,
    requiresInquiry: true,
    isActive: true,
    sortOrder: 6,
  },
  {
    serviceType: 'round-trip',
    title: 'Round Trip (1-4 Passengers)',
    description: 'Round trip service with discount - $200',
    maxPassengers: 4,
    basePrice: 200,
    requiresInquiry: false,
    isActive: true,
    sortOrder: 7,
  },
];

async function seedServices() {
  try {
    // Delete all existing services
    logger.info('Deleting all existing services...');
    await Service.deleteMany({});

    // Insert new services
    logger.info('Inserting new services with serviceType field...');
    await Service.insertMany(services);

    // Verify services were created correctly
    const count = await Service.countDocuments();
    logger.info(`Created ${count} services successfully`);

    // List all service types (for verification)
    const createdServices = await Service.find().select('serviceType title');
    logger.info('Created services:');
    createdServices.forEach((service) => {
      logger.info(`${service.title} (${service.serviceType})`);
    });
  } catch (error) {
    logger.error('Error in seedServices:', error);
    throw error;
  }
}
