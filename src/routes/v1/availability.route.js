const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { availabilityValidation } = require('../../validations');
const { availabilityController } = require('../../controllers');

const router = express.Router();

router.get('/time-slots', validate(availabilityValidation.getTimeSlots), availabilityController.getAvailableTimeSlots);

router.get('/check', validate(availabilityValidation.checkAvailability), availabilityController.checkTimeSlotAvailability);

module.exports = router;
