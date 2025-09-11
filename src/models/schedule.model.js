const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const timeRangeSchema = mongoose.Schema({
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
});

const scheduleSchema = mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      unique: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    timeRanges: {
      type: [timeRangeSchema],
      default: [{ start: '09:00', end: '17:00' }],
    },
  },
  {
    timestamps: true,
  }
);

// Special date exception schema for specific dates
const dateExceptionSchema = mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      trim: true,
    },
    timeRanges: {
      type: [timeRangeSchema],
      default: [],
    },
    // Type of exception: 'closed', 'custom-hours', or 'blocked-hours'
    type: {
      type: String,
      enum: ['closed', 'custom-hours', 'blocked-hours'],
      default: 'closed',
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.plugin(toJSON);
dateExceptionSchema.plugin(toJSON);

const Schedule = mongoose.model('Schedule', scheduleSchema);
const DateException = mongoose.model('DateException', dateExceptionSchema);

module.exports = {
  Schedule,
  DateException,
};
