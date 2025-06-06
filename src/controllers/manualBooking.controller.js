const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { manualBookingService } = require('../services');

const createManualBooking = catchAsync(async (req, res) => {
  const manualBooking = await manualBookingService.createManualBooking(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(manualBooking);
});

const getManualBookings = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'type', 'date', 'startDate', 'endDate', 'vehicleId', 'isActive', 'search']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options.sortBy = options.sortBy || 'date:desc,startTime:asc';
  const result = await manualBookingService.queryManualBookings(filter, options);
  res.send(result);
});

const getManualBooking = catchAsync(async (req, res) => {
  const manualBooking = await manualBookingService.getManualBookingById(req.params.manualBookingId);
  if (!manualBooking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Manual booking not found');
  }
  res.send(manualBooking);
});

const updateManualBooking = catchAsync(async (req, res) => {
  const manualBooking = await manualBookingService.updateManualBookingById(req.params.manualBookingId, req.body);
  res.send(manualBooking);
});

const deleteManualBooking = catchAsync(async (req, res) => {
  await manualBookingService.deleteManualBookingById(req.params.manualBookingId);
  res.status(httpStatus.NO_CONTENT).send();
});

const checkTimeConflict = catchAsync(async (req, res) => {
  const { date, startTime, endTime, excludeBookingId } = req.body;
  const hasConflict = await manualBookingService.checkTimeConflict(date, startTime, endTime, excludeBookingId);
  res.send({ hasConflict });
});

const getBlockedSlots = catchAsync(async (req, res) => {
  const { date } = req.query;
  const blockedSlots = await manualBookingService.getBlockedTimeSlots(new Date(date));
  res.send(blockedSlots);
});

module.exports = {
  createManualBooking,
  getManualBookings,
  getManualBooking,
  updateManualBooking,
  deleteManualBooking,
  checkTimeConflict,
  getBlockedSlots,
};