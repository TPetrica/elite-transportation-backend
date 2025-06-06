const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const manualBookingSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'End time must be in HH:MM format'
      }
    },
    type: {
      type: String,
      enum: ['manual-booking', 'maintenance', 'personal', 'blocked'],
      default: 'manual-booking',
    },
    clientName: {
      type: String,
      trim: true,
    },
    clientPhone: {
      type: String,
      trim: true,
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    pickupLocation: {
      type: String,
      trim: true,
    },
    dropoffLocation: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
manualBookingSchema.plugin(toJSON);
manualBookingSchema.plugin(paginate);

/**
 * Check if the time slot conflicts with existing bookings
 * @param {Date} date - The booking date
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @param {ObjectId} [excludeBookingId] - The id of the booking to exclude from conflict check
 * @returns {Promise<boolean>}
 */
manualBookingSchema.statics.hasTimeConflict = async function (date, startTime, endTime, excludeBookingId) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const conflictingBookings = await this.find({
    _id: { $ne: excludeBookingId },
    date: {
      $gte: startDate,
      $lte: endDate,
    },
    isActive: true,
    $or: [
      // New booking starts during existing booking
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime },
      },
      // New booking ends during existing booking
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime },
      },
      // New booking completely contains existing booking
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime },
      },
    ],
  });

  return conflictingBookings.length > 0;
};

/**
 * Get blocked time slots for a specific date
 * @param {Date} date - The date to check
 * @returns {Promise<Array>}
 */
manualBookingSchema.statics.getBlockedTimeSlots = async function (date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    },
    isActive: true,
  }).select('startTime endTime title type');
};

/**
 * @typedef ManualBooking
 */
const ManualBooking = mongoose.model('ManualBooking', manualBookingSchema);

module.exports = ManualBooking;