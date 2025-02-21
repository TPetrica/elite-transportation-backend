const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const availabilityValidation = require('../../validations/availability.validation');
const availabilityController = require('../../controllers/availability.controller');

const router = express.Router();

// Public routes
router.get('/time-slots', validate(availabilityValidation.getTimeSlots), availabilityController.getAvailableTimeSlots);
router.get('/check', validate(availabilityValidation.checkAvailability), availabilityController.checkTimeSlotAvailability);

// Protected routes (require authentication)
router.get('/schedule', auth('manageSchedule'), availabilityController.getFullSchedule);
router.put(
  '/schedule',
  auth('manageSchedule'),
  validate(availabilityValidation.updateSchedule),
  availabilityController.updateSchedule
);

module.exports = router;
