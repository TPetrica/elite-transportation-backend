const Joi = require('joi');

const timeRangeSchema = Joi.object().keys({
  start: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
  end: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
});

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

const updateSchedule = {
  body: Joi.object().keys({
    dayOfWeek: Joi.number().min(0).max(6).required(),
    timeRanges: Joi.array().items(timeRangeSchema).min(1).required(),
    isEnabled: Joi.boolean(),
  }),
};

module.exports = {
  getTimeSlots,
  checkAvailability,
  updateSchedule,
};
