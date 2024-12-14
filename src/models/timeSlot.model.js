const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const timeSlotSchema = mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    bookingId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for date and time
timeSlotSchema.index({ date: 1, time: 1 }, { unique: true });

// Add plugins
timeSlotSchema.plugin(toJSON);
timeSlotSchema.plugin(paginate);

/**
 * Generate time slots for a specific date
 * @param {Date} date
 * @returns {Array}
 */
timeSlotSchema.statics.generateTimeSlotsForDate = async function (date) {
  const startTime = 17; // 5 PM
  const endTime = 22; // 10 PM
  const interval = 30; // 30 minutes

  const slots = [];
  for (let hour = startTime; hour < endTime; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push({
        date,
        time,
        isBooked: false,
      });
    }
  }

  return slots;
};

/**
 * Check if time slot is available
 * @param {Date} date
 * @param {String} time
 * @returns {Promise<boolean>}
 */
timeSlotSchema.statics.isTimeSlotAvailable = async function (date, time) {
  const slot = await this.findOne({
    date,
    time,
    isBooked: false,
  });
  return !!slot;
};

const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

module.exports = TimeSlot;
