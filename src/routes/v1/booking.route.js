const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const bookingValidation = require('../../validations/booking.validation');
const bookingController = require('../../controllers/booking.controller');

const router = express.Router();

// Public routes
router.post('/', validate(bookingValidation.createBooking), bookingController.createBooking);
router.get('/number/:bookingNumber', validate(bookingValidation.getBookingByNumber), bookingController.getBookingByNumber);

// Protected routes - require authentication
router.route('/').get(auth(), validate(bookingValidation.getBookings), bookingController.getBookings);

// Booking statistics - admin only
router.get('/stats', auth('manageBookings'), validate(bookingValidation.getBookingStats), bookingController.getBookingStats);

// Individual booking routes
router
  .route('/:bookingId')
  .get(auth(), validate(bookingValidation.getBooking), bookingController.getBooking)
  .patch(auth(), validate(bookingValidation.updateBooking), bookingController.updateBooking);

// Cancel booking
router.post('/:bookingId/cancel', auth(), validate(bookingValidation.cancelBooking), bookingController.cancelBooking);

// Send reminder email
router.post(
  '/:bookingId/send-reminder',
  auth('manageBookings'),
  validate(bookingValidation.getBooking),
  bookingController.sendReminderEmail
);

// Attach user to booking
router.post(
  '/attach/:bookingNumber',
  auth(),
  validate(bookingValidation.attachUserToBooking),
  bookingController.attachUserToBooking
);

// Get bookings for authenticated user
router.get('/user/bookings', auth(), validate(bookingValidation.getUserBookings), bookingController.getUserBookings);

module.exports = router;
