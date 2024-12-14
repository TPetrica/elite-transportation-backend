const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createVehicle = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().required(),
    type: Joi.string().valid('luxury', 'business', 'economy').required(),
    capacity: Joi.object().keys({
      passengers: Joi.number().integer().min(1).required(),
      luggage: Joi.number().integer().min(0).required(),
    }),
    features: Joi.array().items(Joi.string()),
    pricing: Joi.object().keys({
      basePrice: Joi.number().required(),
      currency: Joi.string().default('USD'),
      pricePerKm: Joi.number().required(),
    }),
    images: Joi.array().items(Joi.string()).required(),
    facilities: Joi.object().keys({
      meetAndGreet: Joi.boolean().default(true),
      freeCancellation: Joi.boolean().default(true),
      freeWaiting: Joi.boolean().default(true),
      safeTravel: Joi.boolean().default(true),
    }),
    isAvailable: Joi.boolean().default(true),
  }),
};

const getVehicles = {
  query: Joi.object().keys({
    type: Joi.string().valid('luxury', 'business', 'economy'),
    isAvailable: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getVehicle = {
  params: Joi.object().keys({
    vehicleId: Joi.string().custom(objectId),
  }),
};

const updateVehicle = {
  params: Joi.object().keys({
    vehicleId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      description: Joi.string(),
      type: Joi.string().valid('luxury', 'business', 'economy'),
      capacity: Joi.object().keys({
        passengers: Joi.number().integer().min(1),
        luggage: Joi.number().integer().min(0),
      }),
      features: Joi.array().items(Joi.string()),
      pricing: Joi.object().keys({
        basePrice: Joi.number(),
        currency: Joi.string(),
        pricePerKm: Joi.number(),
      }),
      images: Joi.array().items(Joi.string()),
      facilities: Joi.object().keys({
        meetAndGreet: Joi.boolean(),
        freeCancellation: Joi.boolean(),
        freeWaiting: Joi.boolean(),
        safeTravel: Joi.boolean(),
      }),
      isAvailable: Joi.boolean(),
    })
    .min(1),
};

const deleteVehicle = {
  params: Joi.object().keys({
    vehicleId: Joi.string().custom(objectId),
  }),
};

const calculatePrice = {
  params: Joi.object().keys({
    vehicleId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    distance: Joi.number().required(),
  }),
};

module.exports = {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  calculatePrice,
};
