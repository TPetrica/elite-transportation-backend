const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { availabilityService } = require('../services');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

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

module.exports = {
  getAvailableTimeSlots,
  checkTimeSlotAvailability,
};
