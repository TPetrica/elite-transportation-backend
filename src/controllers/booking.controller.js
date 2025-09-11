const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { bookingService } = require('../services');
const emailService = require('../services/email/emailService');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');
const logger = require('../config/logger');

/**
 * Create a new booking
 * @route POST /v1/bookings
 */
const createBooking = catchAsync(async (req, res) => {
  // Add user to booking if authenticated
  if (req.user) {
    req.body.user = req.user.id;
  }

  try {
    const booking = await bookingService.createBooking(req.body);

    // Send confirmation email
    const emailData = {
      bookingNumber: booking.bookingNumber,
      amount: booking.payment.amount,
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      distance: booking.distance,
      duration: booking.duration,
      service: booking.service,
      passengerDetails: booking.passengerDetails,
      billingDetails: booking.billingDetails,
      payment: booking.payment,
      extras: booking.extras || [],
      affiliate: booking.affiliate,
    };

    await emailService.sendBookingConfirmationEmail(booking.email, emailData);

    res.status(httpStatus.CREATED).send(booking);
  } catch (error) {
    logger.error('Error in createBooking controller:', error);
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create booking');
    }
  }
});

/**
 * Get all bookings with pagination and filtering
 * @route GET /v1/bookings
 */
const getBookings = catchAsync(async (req, res) => {
  // Create filter object from query parameters
  const filter = { ...req.query };

  // Add user filter for non-admin users
  if (req.user && req.user.role !== 'admin') {
    filter.user = req.user.id;
  }

  // Extract pagination and sorting options
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Default sort by pickup date descending if not specified
  if (!options.sortBy) {
    options.sortBy = 'pickup.date:desc';
  }

  const result = await bookingService.queryBookings(filter, options);
  res.send(result);
});

/**
 * Get booking by ID
 * @route GET /v1/bookings/:bookingId
 */
const getBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  // Check if user has access to this booking
  if (req.user.role !== 'admin' && (!booking.user || booking.user.toString() !== req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  res.send(booking);
});

/**
 * Get booking by booking number
 * @route GET /v1/bookings/number/:bookingNumber
 */
const getBookingByNumber = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingByNumber(req.params.bookingNumber);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  res.send(booking);
});

/**
 * Update booking by ID
 * @route PATCH /v1/bookings/:bookingId
 */
const updateBooking = catchAsync(async (req, res) => {
  try {
    // Update the booking - email sending is handled in the service layer
    const booking = await bookingService.updateBookingById(req.params.bookingId, req.body);
    res.send(booking);
  } catch (error) {
    logger.error('Error in updateBooking controller:', error);
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update booking');
    }
  }
});

/**
 * Cancel booking by ID
 * @route POST /v1/bookings/:bookingId/cancel
 */
const cancelBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.cancelBookingById(req.params.bookingId);

  // Send cancellation email
  try {
    await emailService.sendBookingCancellationEmail(booking.email, booking.bookingNumber);
    logger.info(`Booking cancellation email sent to ${booking.email}`);
  } catch (error) {
    logger.error('Failed to send cancellation email:', error);
    // Continue with the response even if email fails
  }

  res.send(booking);
});

/**
 * Attach logged-in user to booking
 * @route POST /v1/bookings/attach/:bookingNumber
 */
const attachUserToBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.attachUserToBooking(req.params.bookingNumber, req.user.id);
  res.send(booking);
});

/**
 * Get bookings for logged-in user
 * @route GET /v1/bookings/user/bookings
 */
const getUserBookings = catchAsync(async (req, res) => {
  // Create a filter object from query params (excluding pagination)
  const filter = { ...req.query };
  delete filter.sortBy;
  delete filter.limit;
  delete filter.page;

  // Add user ID to filter
  filter.user = req.user.id;

  // Extract pagination options
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Default sort by pickup date descending if not specified
  if (!options.sortBy) {
    options.sortBy = 'pickup.date:desc';
  }

  const result = await bookingService.queryBookings(filter, options);
  res.send(result);
});

/**
 * Get booking statistics
 * @route GET /v1/bookings/stats
 */
const getBookingStats = catchAsync(async (req, res) => {
  // Extract date range from query parameters if provided
  const { startDate, endDate } = req.query;
  const stats = await bookingService.getBookingStats(startDate, endDate);
  res.send(stats);
});

/**
 * Send booking reminder email
 * @route POST /v1/bookings/:bookingId/send-reminder
 */
const sendReminderEmail = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  const bookingData = {
    bookingNumber: booking.bookingNumber,
    pickupDetails: {
      date: booking.pickup.date,
      time: booking.pickup.time,
      address: booking.pickup.address,
    },
    passengerDetails: booking.passengerDetails,
  };

  await emailService.sendBookingReminderEmail(booking.email, bookingData);
  res.status(httpStatus.OK).send({ message: 'Reminder email sent successfully' });
});

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  getBookingByNumber,
  updateBooking,
  cancelBooking,
  attachUserToBooking,
  getUserBookings,
  getBookingStats,
  sendReminderEmail,
};
