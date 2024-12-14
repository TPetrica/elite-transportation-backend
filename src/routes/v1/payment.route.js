const express = require('express');
const router = express.Router();
const validate = require('../../middlewares/validate');
const paymentValidation = require('../../validations/payment.validation');
const paymentController = require('../../controllers/payment.controller');

// Public routes
router.post(
  '/create-checkout-session',
  validate(paymentValidation.createCheckoutSession),
  paymentController.createCheckoutSession
);

router.post('/webhook', express.raw({ type: '*/*' }), paymentController.handleWebhook);

router.get('/session/:sessionId', validate(paymentValidation.getSession), paymentController.getSession);

module.exports = router;
