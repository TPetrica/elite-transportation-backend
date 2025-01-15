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
 * Initialize default schedule based on requirements
 */
scheduleSchema.statics.initializeDefaultSchedule = async function () {
  const defaultSchedule = [
    // Sunday (0)
    {
      dayOfWeek: 0,
      timeRanges: [{ start: '00:00', end: '23:59' }],
    },
    // Monday to Wednesday (1-3)
    {
      dayOfWeek: 1,
      timeRanges: [
        { start: '00:00', end: '12:00' },
        { start: '20:00', end: '23:59' },
      ],
    },
    {
      dayOfWeek: 2,
      timeRanges: [
        { start: '00:00', end: '12:00' },
        { start: '20:00', end: '23:59' },
      ],
    },
    {
      dayOfWeek: 3,
      timeRanges: [
        { start: '00:00', end: '12:00' },
        { start: '20:00', end: '23:59' },
      ],
    },
    // Thursday and Friday (4-5)
    {
      dayOfWeek: 4,
      timeRanges: [
        { start: '00:00', end: '07:00' },
        { start: '17:00', end: '23:59' },
      ],
    },
    {
      dayOfWeek: 5,
      timeRanges: [
        { start: '00:00', end: '07:00' },
        { start: '17:00', end: '23:59' },
      ],
    },
    // Saturday (6)
    {
      dayOfWeek: 6,
      timeRanges: [{ start: '00:00', end: '23:59' }],
    },
  ];

  await this.deleteMany({}); // Clear existing schedule
  await this.insertMany(defaultSchedule);
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
