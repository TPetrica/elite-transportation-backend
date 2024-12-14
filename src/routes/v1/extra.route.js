const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const extraValidation = require('../../validations/extra.validation');
const extraController = require('../../controllers/extra.controller');

const router = express.Router();

// Public routes
router.route('/').get(validate(extraValidation.getExtras), extraController.getExtras);

router.route('/:extraId').get(validate(extraValidation.getExtra), extraController.getExtra);

router.post('/calculate-price', validate(extraValidation.calculateExtrasPrice), extraController.calculateExtrasPrice);

// Admin routes
router.route('/').post(auth('manageExtras'), validate(extraValidation.createExtra), extraController.createExtra);

router
  .route('/:extraId')
  .patch(auth('manageExtras'), validate(extraValidation.updateExtra), extraController.updateExtra)
  .delete(auth('manageExtras'), validate(extraValidation.deleteExtra), extraController.deleteExtra);

module.exports = router;
