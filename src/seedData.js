const mongoose = require('mongoose');
const config = require('./config/config');
const Vehicle = require('./models/vehicle.model');
const Extra = require('./models/extra.model');

const vehicles = [
  {
    title: 'Mercedes-Benz E-Class',
    description:
      'Premium business sedan with exceptional comfort and style. Perfect for business travel and airport transfers.',
    type: 'business',
    capacity: {
      passengers: 4,
      luggage: 3,
    },
    features: [
      'Free waiting time (60 min for airport pickup)',
      'Free cancellation up to 24h before pickup',
      'Professional chauffeur',
      'Flight tracking',
      'All-inclusive pricing',
    ],
    pricing: {
      basePrice: 174.0,
      currency: 'USD',
      pricePerKm: 2.5,
    },
    images: ['/assets/imgs/page/homepage1/e-class.png'],
    facilities: {
      meetAndGreet: true,
      freeCancellation: true,
      freeWaiting: true,
      safeTravel: true,
    },
    isAvailable: true,
  },
  {
    title: 'Mercedes-Benz S-Class',
    description: 'Ultimate luxury sedan offering unparalleled comfort and sophistication. Ideal for VIP transportation.',
    type: 'luxury',
    capacity: {
      passengers: 3,
      luggage: 3,
    },
    features: [
      'Free waiting time (60 min for airport pickup)',
      'Free cancellation up to 24h before pickup',
      'Professional chauffeur',
      'Flight tracking',
      'All-inclusive pricing',
      'Premium onboard amenities',
    ],
    pricing: {
      basePrice: 249.0,
      currency: 'USD',
      pricePerKm: 3.5,
    },
    images: ['/assets/imgs/cars/s-class.png'],
    facilities: {
      meetAndGreet: true,
      freeCancellation: true,
      freeWaiting: true,
      safeTravel: true,
    },
    isAvailable: true,
  },
  {
    title: 'Mercedes-Benz V-Class',
    description: 'Spacious luxury van perfect for group travel and family trips. Combines comfort with practicality.',
    type: 'luxury',
    capacity: {
      passengers: 7,
      luggage: 7,
    },
    features: [
      'Spacious interior',
      'Free waiting time',
      'Free cancellation',
      'Professional chauffeur',
      'Perfect for groups',
    ],
    pricing: {
      basePrice: 299.0,
      currency: 'USD',
      pricePerKm: 4.0,
    },
    images: ['/assets/imgs/cars/v-class.png'],
    facilities: {
      meetAndGreet: true,
      freeCancellation: true,
      freeWaiting: true,
      safeTravel: true,
    },
    isAvailable: true,
  },
];

const extras = [
  {
    name: 'Child Seat',
    description: 'Suitable for toddlers weighing 0-18 kg (approx 0 to 4 years).',
    price: 12.0,
    currency: 'USD',
    type: 'quantity',
    category: 'childSeat',
    isAvailable: true,
    maxQuantity: 3,
    image: '/assets/imgs/extras/child-seat.png',
  },
  {
    name: 'Booster Seat',
    description: 'Suitable for children weighing 15-36 kg (approx 4 to 10 years).',
    price: 12.0,
    currency: 'USD',
    type: 'quantity',
    category: 'childSeat',
    isAvailable: true,
    maxQuantity: 3,
    image: '/assets/imgs/extras/booster-seat.png',
  },
  {
    name: 'Premium Champagne',
    description: 'Bottle of premium champagne',
    price: 75.0,
    currency: 'USD',
    type: 'quantity',
    category: 'drink',
    isAvailable: true,
    maxQuantity: 5,
    image: '/assets/imgs/extras/champagne.png',
  },
  {
    name: 'Bouquet of Flowers',
    description: 'A beautiful bouquet of seasonal flowers prepared by a local florist',
    price: 45.0,
    currency: 'USD',
    type: 'quantity',
    category: 'amenity',
    isAvailable: true,
    maxQuantity: 2,
    image: '/assets/imgs/extras/flowers.png',
  },
  {
    name: 'Airport Meet & Greet',
    description: 'Professional greeting service at the airport with name board',
    price: 50.0,
    currency: 'USD',
    type: 'selection',
    category: 'service',
    isAvailable: true,
    maxQuantity: 1,
    image: '/assets/imgs/extras/meet-greet.png',
  },
  {
    name: 'VIP Security Service',
    description: 'Professional security personnel for your journey',
    price: 200.0,
    currency: 'USD',
    type: 'selection',
    category: 'service',
    isAvailable: true,
    maxQuantity: 1,
    image: '/assets/imgs/extras/security.png',
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Vehicle.deleteMany({});
    await Extra.deleteMany({});
    console.log('Cleared existing data');

    // Insert vehicles
    const createdVehicles = await Vehicle.insertMany(vehicles);
    console.log('Inserted vehicles:', createdVehicles.length);

    // Insert extras
    const createdExtras = await Extra.insertMany(extras);
    console.log('Inserted extras:', createdExtras.length);

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedDatabase();
