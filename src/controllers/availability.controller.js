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

const checkTimeSlotAvailability = catchAsync(async (req, res) => {
  const { date, time } = req.query;
  if (!date || !time) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Date and time are required');
  }
  const isAvailable = await availabilityService.checkTimeSlotAvailability(date, time);
  res.send({ isAvailable });
});

const updateSchedule = catchAsync(async (req, res) => {
  const { dayOfWeek, timeRanges, isEnabled } = req.body;
  const schedule = await availabilityService.updateSchedule(dayOfWeek, timeRanges, isEnabled);
  res.send(schedule);
});

const getFullSchedule = catchAsync(async (req, res) => {
  const schedule = await availabilityService.getFullSchedule();
  res.send(schedule);
});

module.exports = {
  getAvailableTimeSlots,
  checkTimeSlotAvailability,
  updateSchedule,
  getFullSchedule,
};
