const Joi = require('joi');

const submitContactForm = {
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(100).messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().required().email().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    phone: Joi.string().allow('', null).optional(),
    message: Joi.string().required().min(10).max(5000).messages({
      'string.min': 'Message must be at least 10 characters',
      'string.max': 'Message must not exceed 5000 characters',
      'any.required': 'Message is required',
    }),
    turnstileToken: Joi.string().required().messages({
      'any.required': 'Security verification is required',
    }),
  }),
};

module.exports = {
  submitContactForm,
};
