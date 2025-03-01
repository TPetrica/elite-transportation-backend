const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const availabilityValidation = require('../../validations/availability.validation');
const availabilityController = require('../../controllers/availability.controller');
const dateExceptionRoutes = require('./date-exception.route');

const router = express.Router();

// Include date exception routes
router.use('/exceptions', dateExceptionRoutes);

// Public routes - no authentication required
router.get('/time-slots', validate(availabilityValidation.getTimeSlots), availabilityController.getAvailableTimeSlots);
router.post('/check', validate(availabilityValidation.checkAvailability), availabilityController.checkAvailability);
router.get('/check', validate(availabilityValidation.checkAvailability), availabilityController.checkAvailabilityGet);

// Admin routes - authentication required
router
  .route('/schedule')
  .get(auth('manageSchedule'), availabilityController.getSchedule)
  .put(auth('manageSchedule'), validate(availabilityValidation.updateSchedule), availabilityController.updateSchedule);

module.exports = router;
