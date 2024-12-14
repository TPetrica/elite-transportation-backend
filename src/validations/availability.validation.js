const Joi = require('joi');

const getTimeSlots = {
  query: Joi.object().keys({
    date: Joi.date().required(),
  }),
};

const checkAvailability = {
  query: Joi.object().keys({
    date: Joi.date().required(),
    time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
  }),
};

module.exports = {
  getTimeSlots,
  checkAvailability,
};
