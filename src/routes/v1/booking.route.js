const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const bookingValidation = require('../../validations/booking.validation');
const bookingController = require('../../controllers/booking.controller');

const router = express.Router();

// Public routes
router.post('/', validate(bookingValidation.createBooking), bookingController.createBooking);
router.get('/number/:bookingNumber', validate(bookingValidation.getBookingByNumber), bookingController.getBookingByNumber);

// Protected routes
router.route('/').get(auth(), validate(bookingValidation.getBookings), bookingController.getBookings);

router
  .route('/:bookingId')
  .get(auth(), validate(bookingValidation.getBooking), bookingController.getBooking)
  .patch(auth(), validate(bookingValidation.updateBooking), bookingController.updateBooking);

router.post('/:bookingId/cancel', auth(), validate(bookingValidation.cancelBooking), bookingController.cancelBooking);

router.post(
  '/attach/:bookingNumber',
  auth(),
  validate(bookingValidation.attachUserToBooking),
  bookingController.attachUserToBooking
);

router.get('/user/bookings', auth(), validate(bookingValidation.getUserBookings), bookingController.getUserBookings);

module.exports = router;
