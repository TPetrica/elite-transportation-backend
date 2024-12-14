const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createCheckoutSession = {
  body: Joi.object().keys({
    amount: Joi.number().required(),
    billingDetails: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      company: Joi.string().allow(''),
      address: Joi.string().required(),
      country: Joi.string().required(),
      city: Joi.string().required(),
      zipCode: Joi.string().required(),
      email: Joi.string().email().allow('', null),
      newsletter: Joi.boolean().allow(null),
    }).required(),
    bookingData: Joi.object({
      pickup: Joi.object({
        address: Joi.string().required(),
        date: Joi.string().required(),
        time: Joi.string().required(),
        flightNumber: Joi.string().allow(''),
        coordinates: Joi.object({
          lat: Joi.number().required(),
          lng: Joi.number().required(),
        }).required(),
      }).required(),
      dropoff: Joi.object({
        address: Joi.string().required(),
        coordinates: Joi.object({
          lat: Joi.number().required(),
          lng: Joi.number().required(),
        }).required(),
      }).required(),
      distance: Joi.object({
        km: Joi.number().required(),
        miles: Joi.number().required(),
      }).required(),
      duration: Joi.string().required(),
      vehicle: Joi.string().custom(objectId).required(),
      email: Joi.string().email().required(),
      passengerDetails: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        phone: Joi.string().required(),
        passengers: Joi.string().required(),
        luggage: Joi.string().required(),
        email: Joi.string().email().allow('', null),
        notes: Joi.string().allow(''),
        specialRequirements: Joi.string().allow(''),
      }).required(),
    }).required(),
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
