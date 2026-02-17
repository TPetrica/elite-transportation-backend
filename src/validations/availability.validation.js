const Joi = require('joi');

const getTimeSlots = {
  query: Joi.object().keys({
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required(),
  }),
};

const checkAvailability = {
  query: Joi.object().keys({
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required(),
    time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
  }),
};

const updateSchedule = {
  body: Joi.object().keys({
    dayOfWeek: Joi.number().min(0).max(6).required(),
    timeRanges: Joi.array()
      .items(
        Joi.object({
          start: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required(),
          end: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required(),
        })
      )
      .required(),
    isEnabled: Joi.boolean().default(true),
  }),
};

module.exports = {
  getTimeSlots,
  checkAvailability,
  updateSchedule,
};
