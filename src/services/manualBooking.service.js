const httpStatus = require('http-status');
const { ManualBooking } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a manual booking
 * @param {Object} manualBookingBody
 * @param {ObjectId} userId
 * @returns {Promise<ManualBooking>}
 */
const createManualBooking = async (manualBookingBody, userId) => {
  // Check for time conflicts
  const hasConflict = await ManualBooking.hasTimeConflict(
    manualBookingBody.date,
    manualBookingBody.startTime,
    manualBookingBody.endTime
  );

  if (hasConflict) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Time slot conflicts with existing booking');
  }

  // Validate time range
  const startTime = manualBookingBody.startTime.split(':');
  const endTime = manualBookingBody.endTime.split(':');
  const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
  const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);

  if (startMinutes >= endMinutes) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'End time must be after start time');
  }

  return ManualBooking.create({
    ...manualBookingBody,
    createdBy: userId,
  });
};

/**
 * Query for manual bookings
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryManualBookings = async (filter, options) => {
  // Handle date range filtering
  if (filter.startDate || filter.endDate) {
    filter.date = {};
    if (filter.startDate) {
      filter.date.$gte = new Date(filter.startDate);
      delete filter.startDate;
    }
    if (filter.endDate) {
      filter.date.$lte = new Date(filter.endDate);
      delete filter.endDate;
    }
  }

  // Handle search functionality
  if (filter.search) {
    filter.$or = [
      { title: { $regex: filter.search, $options: 'i' } },
      { description: { $regex: filter.search, $options: 'i' } },
      { clientName: { $regex: filter.search, $options: 'i' } },
      { pickupLocation: { $regex: filter.search, $options: 'i' } },
      { dropoffLocation: { $regex: filter.search, $options: 'i' } },
    ];
    delete filter.search;
  }

  const manualBookings = await ManualBooking.paginate(filter, {
    ...options,
    populate: [
      { path: 'createdBy', select: 'name email' },
    ],
  });

  return manualBookings;
};

/**
 * Get manual booking by id
 * @param {ObjectId} id
 * @returns {Promise<ManualBooking>}
 */
const getManualBookingById = async (id) => {
  const manualBooking = await ManualBooking.findById(id)
    .populate('createdBy', 'name email');
  
  if (!manualBooking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Manual booking not found');
  }
  
  return manualBooking;
};

/**
 * Update manual booking by id
 * @param {ObjectId} manualBookingId
 * @param {Object} updateBody
 * @returns {Promise<ManualBooking>}
 */
const updateManualBookingById = async (manualBookingId, updateBody) => {
  const manualBooking = await getManualBookingById(manualBookingId);

  // If time is being updated, check for conflicts
  if (updateBody.date || updateBody.startTime || updateBody.endTime) {
    const date = updateBody.date || manualBooking.date;
    const startTime = updateBody.startTime || manualBooking.startTime;
    const endTime = updateBody.endTime || manualBooking.endTime;

    const hasConflict = await ManualBooking.hasTimeConflict(
      date,
      startTime,
      endTime,
      manualBookingId
    );

    if (hasConflict) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Time slot conflicts with existing booking');
    }

    // Validate time range
    const startTimeArr = startTime.split(':');
    const endTimeArr = endTime.split(':');
    const startMinutes = parseInt(startTimeArr[0]) * 60 + parseInt(startTimeArr[1]);
    const endMinutes = parseInt(endTimeArr[0]) * 60 + parseInt(endTimeArr[1]);

    if (startMinutes >= endMinutes) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'End time must be after start time');
    }
  }

  Object.assign(manualBooking, updateBody);
  await manualBooking.save();
  return manualBooking;
};

/**
 * Delete manual booking by id
 * @param {ObjectId} manualBookingId
 * @returns {Promise<ManualBooking>}
 */
const deleteManualBookingById = async (manualBookingId) => {
  const manualBooking = await getManualBookingById(manualBookingId);
  await manualBooking.remove();
  return manualBooking;
};

/**
 * Check if time slot has conflicts
 * @param {Date} date
 * @param {string} startTime
 * @param {string} endTime
 * @param {ObjectId} [excludeBookingId]
 * @returns {Promise<boolean>}
 */
const checkTimeConflict = async (date, startTime, endTime, excludeBookingId) => {
  return ManualBooking.hasTimeConflict(date, startTime, endTime, excludeBookingId);
};

/**
 * Get blocked time slots for a date
 * @param {Date} date
 * @returns {Promise<Array>}
 */
const getBlockedTimeSlots = async (date) => {
  return ManualBooking.getBlockedTimeSlots(date);
};

module.exports = {
  createManualBooking,
  queryManualBookings,
  getManualBookingById,
  updateManualBookingById,
  deleteManualBookingById,
  checkTimeConflict,
  getBlockedTimeSlots,
};