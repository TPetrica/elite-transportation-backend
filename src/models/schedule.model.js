const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const timeRangeSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
    },
    end: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
    },
  },
  { _id: false }
);

const scheduleSchema = mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      unique: true,
    },
    timeRanges: {
      type: [timeRangeSchema],
      required: true,
      default: [],
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.plugin(toJSON);

/**
 * Initialize default schedule for 24/7 availability
 */
scheduleSchema.statics.initializeDefaultSchedule = async function () {
  const defaultSchedule = [];

  // Create 24/7 availability for all days
  for (let i = 0; i < 7; i++) {
    defaultSchedule.push({
      dayOfWeek: i,
      timeRanges: [{ start: '00:00', end: '23:59' }],
      isEnabled: true,
    });
  }

  await this.deleteMany({}); // Clear existing schedule
  await this.insertMany(defaultSchedule);
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
