/**
 * Vehicle Model
 * Defines the schema for vehicles in MongoDB
 */
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const vehicleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['luxury', 'business', 'economy'],
      required: true,
    },
    capacity: {
      passengers: {
        type: Number,
        required: true,
      },
      luggage: {
        type: Number,
        required: true,
      },
    },
    features: [
      {
        type: String,
      },
    ],
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      pricePerKm: {
        type: Number,
        required: true,
      },
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    facilities: {
      meetAndGreet: { type: Boolean, default: true },
      freeCancellation: { type: Boolean, default: true },
      freeWaiting: { type: Boolean, default: true },
      safeTravel: { type: Boolean, default: true },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
vehicleSchema.plugin(toJSON);
vehicleSchema.plugin(paginate);

/**
 * @typedef Vehicle
 */
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
