/**
 * Extra Model
 * Defines the schema for extra services/items in MongoDB
 */
const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const extraSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    type: {
      type: String,
      enum: ['quantity', 'selection'],
      required: true,
    },
    category: {
      type: String,
      enum: ['childSeat', 'drink', 'service', 'amenity'],
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    maxQuantity: {
      type: Number,
      default: 10,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugin that converts mongoose to json
extraSchema.plugin(toJSON);

/**
 * @typedef Extra
 */
const Extra = mongoose.model('Extra', extraSchema);

module.exports = Extra;
