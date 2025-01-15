const httpStatus = require('http-status');
const moment = require('moment');
const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const Vehicle = require('../models/vehicle.model');
const Extra = require('../models/extra.model');
const User = require('../models/user.model');
const availabilityService = require('./availability.service');
const emailService = require('./email.service');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { calculateTripPrice } = require('../utils/priceCalculator');

/**
 * Create a booking
 * @param {Object} bookingBody
 * @returns {Promise<Booking>}
 */
const createBooking = async (bookingBody) => {
  try {
    logger.info('Starting booking creation process');

    // Validate extras if any
    if (bookingBody.extras?.length) {
      const extraIds = bookingBody.extras.map((extra) => extra.item);
      const extras = await Extra.find({ _id: { $in: extraIds } });
      if (extras.length !== extraIds.length) {
        throw new ApiError(httpStatus.NOT_FOUND, 'One or more extras not found');
      }

      bookingBody.extras = bookingBody.extras.map((extra) => {
        const extraDoc = extras.find((e) => e._id.toString() === extra.item.toString());
        return {
          ...extra,
          price: extraDoc.price * extra.quantity,
        };
      });
    }

    // Validate user if provided
    if (bookingBody.user) {
      const user = await User.findById(bookingBody.user);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }
    }

    // Check time slot availability
    const isAvailable = await availabilityService.checkTimeSlotAvailability(
      bookingBody.pickup.date,
      bookingBody.pickup.time
    );

    if (!isAvailable) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Selected time slot is no longer available');
    }

    // Generate booking number
    const bookingNumber = await Booking.generateBookingNumber();

    // Create the booking
    const booking = await Booking.create({
      ...bookingBody,
      bookingNumber,
    });

    logger.info(`Booking created with ID: ${booking._id}`);

    // Send confirmation email
    try {
      const emailData = {
        bookingNumber: booking.bookingNumber,
        amount: booking.payment.amount,
        pickupDetails: {
          date: booking.pickup.date,
          time: booking.pickup.time,
          address: booking.pickup.address,
        },
        dropoffDetails: {
          address: booking.dropoff.address,
        },
        passengerDetails: booking.passengerDetails,
        service: booking.service,
        extras: booking.extras,
      };

      await emailService.sendBookingConfirmationEmail(booking.email, emailData);
    } catch (error) {
      logger.error('Failed to send confirmation email:', error);
    }

    return booking;
  } catch (error) {
    logger.error('Booking creation failed:', error);
    throw error;
  }
};

/**
 * Query for bookings
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryBookings = async (filter, options) => {
  try {
    const bookings = await Booking.paginate(filter, {
      ...options,
      populate: [
        { path: 'vehicle', select: 'name type capacity' },
        { path: 'extras.item', select: 'name price' },
        { path: 'user', select: 'name email phone' },
      ],
    });
    return bookings;
  } catch (error) {
    logger.error('Error querying bookings:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to query bookings');
  }
};

/**
 * Get booking by id
 * @param {ObjectId} id
 * @returns {Promise<Booking>}
 */
const getBookingById = async (id) => {
  try {
    const booking = await Booking.findById(id)
      .populate('vehicle')
      .populate('extras.item')
      .populate('user', 'name email phone');

    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }
    return booking;
  } catch (error) {
    logger.error(`Error getting booking by ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get booking by booking number
 * @param {string} bookingNumber
 * @returns {Promise<Booking>}
 */
const getBookingByNumber = async (bookingNumber) => {
  try {
    const booking = await Booking.findOne({ bookingNumber })
      .populate('vehicle')
      .populate('extras.item')
      .populate('user', 'name email phone');

    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }
    return booking;
  } catch (error) {
    logger.error(`Error getting booking by number ${bookingNumber}:`, error);
    throw error;
  }
};

/**
 * Update booking by id
 * @param {ObjectId} bookingId
 * @param {Object} updateBody
 * @returns {Promise<Booking>}
 */
const updateBookingById = async (bookingId, updateBody) => {
  try {
    const booking = await getBookingById(bookingId);

    if (booking.status === 'completed') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update completed booking');
    }

    // If updating extras
    if (updateBody.extras) {
      const extraIds = updateBody.extras.map((extra) => extra.item);
      const extras = await Extra.find({ _id: { $in: extraIds } });
      if (extras.length !== extraIds.length) {
        throw new ApiError(httpStatus.NOT_FOUND, 'One or more extras not found');
      }

      updateBody.extras = updateBody.extras.map((extra) => {
        const extraDoc = extras.find((e) => e._id.toString() === extra.item.toString());
        return {
          ...extra,
          price: extraDoc.price * extra.quantity,
        };
      });
    }

    // If updating time/date
    if (updateBody.pickup?.date || updateBody.pickup?.time) {
      const newDate = updateBody.pickup?.date || booking.pickup.date;
      const newTime = updateBody.pickup?.time || booking.pickup.time;

      const isAvailable = await availabilityService.checkTimeSlotAvailability(newDate, newTime);
      if (!isAvailable) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Selected time slot is not available');
      }
    }

    Object.assign(booking, updateBody);
    await booking.save();

    // Send update email
    try {
      await emailService.sendBookingUpdateEmail(booking.email, booking.bookingNumber, booking.passengerDetails);
    } catch (error) {
      logger.error('Failed to send update email:', error);
    }

    return booking;
  } catch (error) {
    logger.error(`Error updating booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Cancel booking by id
 * @param {ObjectId} bookingId
 * @returns {Promise<Booking>}
 */
const cancelBookingById = async (bookingId) => {
  try {
    const booking = await getBookingById(bookingId);

    if (booking.status === 'completed') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel completed booking');
    }

    if (booking.status === 'cancelled') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is already cancelled');
    }

    // Release the time slot
    await availabilityService.releaseTimeSlot(bookingId);

    booking.status = 'cancelled';
    await booking.save();

    // Send cancellation email
    try {
      await emailService.sendBookingCancellationEmail(booking.email, booking.bookingNumber);
    } catch (error) {
      logger.error('Failed to send cancellation email:', error);
    }

    return booking;
  } catch (error) {
    logger.error(`Error cancelling booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Attach user to guest booking
 * @param {string} bookingNumber
 * @param {ObjectId} userId
 * @returns {Promise<Booking>}
 */
const attachUserToBooking = async (bookingNumber, userId) => {
  try {
    const booking = await getBookingByNumber(bookingNumber);

    if (booking.user) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking already has a user attached');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    booking.user = userId;
    await booking.save();

    return booking;
  } catch (error) {
    logger.error(`Error attaching user ${userId} to booking ${bookingNumber}:`, error);
    throw error;
  }
};

/**
 * Get user bookings
 * @param {ObjectId} userId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getUserBookings = async (userId, options) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return queryBookings(
      { user: userId },
      {
        ...options,
        sortBy: options.sortBy || 'pickup.date:desc',
      }
    );
  } catch (error) {
    logger.error(`Error getting bookings for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get bookings statistics
 * @returns {Promise<Object>}
 */
const getBookingStats = async () => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$payment.amount' },
        },
      },
    ]);

    const today = moment().startOf('day');
    const upcomingBookings = await Booking.countDocuments({
      'pickup.date': { $gte: today.toDate() },
      status: { $in: ['pending', 'confirmed'] },
    });

    return {
      statusBreakdown: stats,
      upcomingBookings,
    };
  } catch (error) {
    logger.error('Error getting booking stats:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get booking statistics');
  }
};

module.exports = {
  createBooking,
  queryBookings,
  getBookingById,
  getBookingByNumber,
  updateBookingById,
  cancelBookingById,
  attachUserToBooking,
  getUserBookings,
  getBookingStats,
};
