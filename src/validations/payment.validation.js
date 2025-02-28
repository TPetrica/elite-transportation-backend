const Joi = require('joi');

const createCheckoutSession = {
  body: Joi.object().keys({
    amount: Joi.number().required(),
    billingDetails: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      company: Joi.string().allow(''),
      address: Joi.string().required(),
      city: Joi.string().required(),
      country: Joi.string().required(),
      zipCode: Joi.string().required(),
      email: Joi.string().allow(''),
      newsletter: Joi.boolean().optional(),
    }),
    bookingData: Joi.object({
      pickup: Joi.object({
        address: Joi.string().required(),
        coordinates: Joi.object({
          lat: Joi.number().required(),
          lng: Joi.number().required(),
        }),
        date: Joi.string().required(),
        time: Joi.string().required(),
        flightNumber: Joi.string().allow(''),
        flightTime: Joi.string().allow('', null),
        isCustom: Joi.boolean().optional(),
      }).unknown(false),
      dropoff: Joi.object({
        address: Joi.string().required(),
        coordinates: Joi.object({
          lat: Joi.number().required(),
          lng: Joi.number().required(),
        }),
        isCustom: Joi.boolean().optional(),
      }).unknown(false),
      distance: Joi.object({
        km: Joi.number().required(),
        miles: Joi.number().required(),
      }),
      duration: Joi.string().required(),
      service: Joi.string()
        .valid('to-airport', 'from-airport', 'round-trip', 'hourly', 'group', 'per-person', 'canyons')
        .required(),
      passengerDetails: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        passengers: Joi.string().required(),
        luggage: Joi.string().required(),
        notes: Joi.string().allow(''),
        specialRequirements: Joi.string().allow(''),
      }),
      email: Joi.string().email().required(),
      affiliate: Joi.boolean().optional(),
      affiliateCode: Joi.string().allow('').optional(), // Allow empty string
    }),
  }),
};

const getSession = {
  params: Joi.object().keys({
    sessionId: Joi.string().required(),
  }),
};

module.exports = {
  createCheckoutSession,
  getSession,
};
