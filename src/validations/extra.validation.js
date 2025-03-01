const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createExtra = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required(),
    currency: Joi.string().default('USD'),
    type: Joi.string().valid('quantity', 'selection').required(),
    category: Joi.string().valid('childSeat', 'drink', 'service', 'amenity').required(),
    isAvailable: Joi.boolean().default(true),
    maxQuantity: Joi.number().integer().min(1).default(10),
    image: Joi.string(),
  }),
};

const getExtras = {
  query: Joi.object().keys({
    category: Joi.string().valid('childSeat', 'drink', 'service', 'amenity'),
    type: Joi.string().valid('quantity', 'selection'),
    isAvailable: Joi.boolean(),
    sort: Joi.string(),
    // Add pagination parameters
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getExtra = {
  params: Joi.object().keys({
    extraId: Joi.string().custom(objectId),
  }),
};

const updateExtra = {
  params: Joi.object().keys({
    extraId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string(),
      price: Joi.number(),
      currency: Joi.string(),
      type: Joi.string().valid('quantity', 'selection'),
      category: Joi.string().valid('childSeat', 'drink', 'service', 'amenity'),
      isAvailable: Joi.boolean(),
      maxQuantity: Joi.number().integer().min(1),
      image: Joi.string(),
    })
    .min(1),
};

const deleteExtra = {
  params: Joi.object().keys({
    extraId: Joi.string().custom(objectId),
  }),
};

const calculateExtrasPrice = {
  body: Joi.object().keys({
    extras: Joi.array()
      .items(
        Joi.object().keys({
          item: Joi.string().custom(objectId).required(),
          quantity: Joi.number().integer().min(1).required(),
        })
      )
      .required(),
  }),
};

module.exports = {
  createExtra,
  getExtras,
  getExtra,
  updateExtra,
  deleteExtra,
  calculateExtrasPrice,
};
