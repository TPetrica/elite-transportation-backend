const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const dateExceptionController = require('../../controllers/date-exception.controller');
const dateExceptionValidation = require('../../validations/date-exception.validation');

const router = express.Router();

// Public routes - no authentication needed
router.get('/check', dateExceptionController.getDateExceptionByDate);
router.get('/upcoming', dateExceptionController.getUpcomingDateExceptions);

// Protected routes - authentication required
router
  .route('/')
  .post(
    auth('manageSchedule'),
    validate(dateExceptionValidation.createDateException),
    dateExceptionController.createDateException
  )
  .get(
    auth('manageSchedule'),
    validate(dateExceptionValidation.getDateExceptions),
    dateExceptionController.getDateExceptions
  );

router
  .route('/:exceptionId')
  .get(auth('manageSchedule'), validate(dateExceptionValidation.getDateException), dateExceptionController.getDateException)
  .patch(
    auth('manageSchedule'),
    validate(dateExceptionValidation.updateDateException),
    dateExceptionController.updateDateException
  )
  .delete(
    auth('manageSchedule'),
    validate(dateExceptionValidation.deleteDateException),
    dateExceptionController.deleteDateException
  );

module.exports = router;
