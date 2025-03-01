const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createService = {
  body: Joi.object().keys({
    serviceType: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    maxPassengers: Joi.number().allow(null),
    basePrice: Joi.number().required(),
    requiresInquiry: Joi.boolean(),
    isActive: Joi.boolean(),
    sortOrder: Joi.number(),
    vehicle: Joi.string().custom(objectId).allow(null),
  }),
};

const getServices = {
  query: Joi.object().keys({
    serviceType: Joi.string(),
    title: Joi.string(),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getService = {
  params: Joi.object().keys({
    serviceId: Joi.string().custom(objectId),
  }),
};

const updateService = {
  params: Joi.object().keys({
    serviceId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      description: Joi.string(),
      maxPassengers: Joi.number().allow(null),
      basePrice: Joi.number(),
      requiresInquiry: Joi.boolean(),
      isActive: Joi.boolean(),
      sortOrder: Joi.number(),
      vehicle: Joi.string().custom(objectId).allow(null),
      serviceType: Joi.string(),
    })
    .min(1),
};

const deleteService = {
  params: Joi.object().keys({
    serviceId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
};
