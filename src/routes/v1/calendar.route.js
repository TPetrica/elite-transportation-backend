const express = require('express');
const { availabilityController } = require('../../controllers');

const router = express.Router();

router.get('/time-slots', availabilityController.getAvailableTimeSlots);
// router.get('/test', availabilityController.testCalendarConnection);

module.exports = router;
