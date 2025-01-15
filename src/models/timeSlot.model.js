const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const moment = require('moment');

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
    dayOfWeek: {
      type: Number, // 0-6 (Sunday-Saturday)
      required: true,
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
 * Get schedule configuration for each day of the week
 * @returns {Object}
 */
timeSlotSchema.statics.getScheduleConfig = function () {
  return {
    // Sunday (0)
    0: [{ start: '00:00', end: '23:59' }], // 24/7
    // Monday (1) to Wednesday (3)
    1: [
      { start: '00:00', end: '12:00' }, // 12 AM to 12 PM
      { start: '20:00', end: '23:59' }, // 8 PM to 11:59 PM
    ],
    2: [
      { start: '00:00', end: '12:00' },
      { start: '20:00', end: '23:59' },
    ],
    3: [
      { start: '00:00', end: '12:00' },
      { start: '20:00', end: '23:59' },
    ],
    // Thursday (4) and Friday (5)
    4: [
      { start: '00:00', end: '07:00' }, // 12 AM to 7 AM
      { start: '17:00', end: '23:59' }, // 5 PM to 11:59 PM
    ],
    5: [
      { start: '00:00', end: '07:00' },
      { start: '17:00', end: '23:59' },
    ],
    // Saturday (6)
    6: [{ start: '00:00', end: '23:59' }], // 24/7
  };
};

/**
 * Convert time string to minutes for comparison
 * @param {String} time - Time in HH:mm format
 * @returns {Number} - Minutes since start of day
 */
timeSlotSchema.statics.timeToMinutes = function (time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Check if time is within allowed ranges
 * @param {String} time - Time to check in HH:mm format
 * @param {Array} ranges - Array of time ranges
 * @returns {Boolean}
 */
timeSlotSchema.statics.isTimeInRange = function (time, ranges) {
  const timeMinutes = this.timeToMinutes(time);
  return ranges.some((range) => {
    const startMinutes = this.timeToMinutes(range.start);
    const endMinutes = this.timeToMinutes(range.end);
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  });
};

/**
 * Generate time slots for a specific date
 * @param {Date} date
 * @returns {Array}
 */
timeSlotSchema.statics.generateTimeSlotsForDate = async function (date) {
  const dayOfWeek = moment(date).day();
  const schedule = this.getScheduleConfig();
  const daySchedule = schedule[dayOfWeek];
  const slots = [];

  // Generate slots every 30 minutes for the entire day
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      // Only add slot if it falls within allowed time ranges for this day
      if (this.isTimeInRange(time, daySchedule)) {
        slots.push({
          date,
          time,
          isBooked: false,
          dayOfWeek,
        });
      }
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
  const dayOfWeek = moment(date).day();
  const schedule = this.getScheduleConfig();
  const daySchedule = schedule[dayOfWeek];

  // First check if the time is within allowed ranges for this day
  if (!this.isTimeInRange(time, daySchedule)) {
    return false;
  }

  // Then check if the slot exists and is not booked
  const slot = await this.findOne({
    date,
    time,
    isBooked: false,
  });

  return !!slot;
};

/**
 * Create initial time slots for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise}
 */
timeSlotSchema.statics.createInitialTimeSlots = async function (startDate, endDate) {
  const slots = [];
  for (let date = moment(startDate); date.isBefore(endDate); date.add(1, 'day')) {
    const dateSlots = await this.generateTimeSlotsForDate(date.toDate());
    slots.push(...dateSlots);
  }

  if (slots.length > 0) {
    await this.insertMany(slots);
  }
};

const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

module.exports = TimeSlot;
