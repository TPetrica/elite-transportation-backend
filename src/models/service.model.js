const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const serviceSchema = mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      enum: ['to-airport', 'from-airport', 'round-trip', 'hourly', 'group'],
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    vehicle: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
serviceSchema.plugin(toJSON);

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
