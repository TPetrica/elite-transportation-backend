const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { bookingService, emailService } = require('../services');
const ApiError = require('../utils/ApiError');

const createBooking = catchAsync(async (req, res) => {
  // Add user to booking if authenticated
  if (req.user) {
    req.body.user = req.user.id;
  }
  const booking = await bookingService.createBooking(req.body);

  // Send confirmation email
  await emailService.sendBookingConfirmationEmail(booking.email, booking.bookingNumber, booking.passengerDetails);

  res.status(httpStatus.CREATED).send(booking);
});

const getBookings = catchAsync(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  const result = await bookingService.queryBookings(filter, options);
  res.send(result);
});

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

const getBookingByNumber = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingByNumber(req.params.bookingNumber);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  res.send(booking);
});

const updateBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.updateBookingById(req.params.bookingId, req.body);
  res.send(booking);
});

const cancelBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.cancelBookingById(req.params.bookingId);

  // Send cancellation email
  await emailService.sendBookingCancellationEmail(booking.email, booking.bookingNumber);

  res.send(booking);
});

const attachUserToBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.attachUserToBooking(req.params.bookingNumber, req.user.id);
  res.send(booking);
});

const getUserBookings = catchAsync(async (req, res) => {
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  const bookings = await bookingService.getUserBookings(req.user.id, options);
  res.send(bookings);
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
};
