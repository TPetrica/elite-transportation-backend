const express = require('express');
const router = express.Router();
const optionalAuth = require('../../middlewares/optionalAuth');
const validate = require('../../middlewares/validate');
const paymentValidation = require('../../validations/payment.validation');
const paymentController = require('../../controllers/payment.controller');

// Public routes
router.post(
  '/create-checkout-session',
  validate(paymentValidation.createCheckoutSession),
  paymentController.createCheckoutSession
);

router.get(
  '/session/:sessionId',
  optionalAuth(),
  validate(paymentValidation.getSession),
  paymentController.getSession
);

module.exports = router;
