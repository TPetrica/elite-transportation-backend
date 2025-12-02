const express = require('express');
const validate = require('../../middlewares/validate');
const contactValidation = require('../../validations/contact.validation');
const contactController = require('../../controllers/contact.controller');

const router = express.Router();

router.post('/', validate(contactValidation.submitContactForm), contactController.submitContactForm);

module.exports = router;
