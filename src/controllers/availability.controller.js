const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { availabilityService } = require('../services');
const ApiError = require('../utils/ApiError');

const getAvailableTimeSlots = catchAsync(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Date is required');
  }
  const result = await availabilityService.getAvailableTimeSlots(date);
  res.send(result);
});

const checkAvailability = catchAsync(async (req, res) => {
  const { date, time } = req.body;
  if (!date || !time) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Date and time are required');
  }
  const isAvailable = await availabilityService.checkTimeSlotAvailability(date, time);
  res.send({ isAvailable });
});

const checkAvailabilityGet = catchAsync(async (req, res) => {
  const { date, time } = req.query;
  if (!date || !time) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Date and time are required');
  }
  const isAvailable = await availabilityService.checkTimeSlotAvailability(date, time);
  res.send({ isAvailable });
});

const updateSchedule = catchAsync(async (req, res) => {
  const { dayOfWeek } = req.body;
  const updateData = {
    timeRanges: req.body.timeRanges,
    isEnabled: req.body.isEnabled,
  };

  const schedule = await availabilityService.updateSchedule(dayOfWeek, updateData);
  res.send(schedule);
});

const getSchedule = catchAsync(async (req, res) => {
  const schedule = await availabilityService.getSchedule();
  res.send(schedule);
});

module.exports = {
  getAvailableTimeSlots,
  checkAvailability,
  checkAvailabilityGet,
  updateSchedule,
  getSchedule,
};
