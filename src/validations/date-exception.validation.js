const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createDateException = {
  body: Joi.object().keys({
    date: Joi.date().required(),
    isEnabled: Joi.boolean().default(false),
    reason: Joi.string().allow(''),
    type: Joi.string().valid('closed', 'custom-hours', 'blocked-hours').default('closed'),
    timeRanges: Joi.when('type', {
      is: Joi.valid('custom-hours', 'blocked-hours'),
      then: Joi.array()
        .items(
          Joi.object().keys({
            start: Joi.string()
              .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
              .required(),
            end: Joi.string()
              .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
              .required(),
          })
        )
        .min(1)
        .required(),
      otherwise: Joi.array().default([]),
    }),
  }),
};

const getDateExceptions = {
  query: Joi.object().keys({
    startDate: Joi.date(),
    endDate: Joi.date().min(Joi.ref('startDate')),
    isEnabled: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getDateException = {
  params: Joi.object().keys({
    exceptionId: Joi.string().custom(objectId),
  }),
};

const updateDateException = {
  params: Joi.object().keys({
    exceptionId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      date: Joi.date(),
      isEnabled: Joi.boolean(),
      reason: Joi.string().allow(''),
      type: Joi.string().valid('closed', 'custom-hours', 'blocked-hours'),
      timeRanges: Joi.array().items(
        Joi.object().keys({
          start: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required(),
          end: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required(),
        })
      ),
    })
    .min(1),
};

const deleteDateException = {
  params: Joi.object().keys({
    exceptionId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createDateException,
  getDateExceptions,
  getDateException,
  updateDateException,
  deleteDateException,
};
