const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createManualBooking = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().allow(''),
    date: Joi.date().required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    type: Joi.string().valid('manual-booking', 'maintenance', 'personal', 'blocked').default('manual-booking'),
    clientName: Joi.string().allow(''),
    clientPhone: Joi.string().allow(''),
    clientEmail: Joi.string().email().allow(''),
    pickupLocation: Joi.string().allow(''),
    dropoffLocation: Joi.string().allow(''),
    price: Joi.number().min(0),
    notes: Joi.string().allow(''),
    isActive: Joi.boolean().default(true),
  }),
};

const getManualBookings = {
  query: Joi.object().keys({
    title: Joi.string(),
    type: Joi.string().valid('manual-booking', 'maintenance', 'personal', 'blocked'),
    date: Joi.date(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    isActive: Joi.boolean(),
    search: Joi.string().allow(''),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getManualBooking = {
  params: Joi.object().keys({
    manualBookingId: Joi.string().custom(objectId),
  }),
};

const updateManualBooking = {
  params: Joi.object().keys({
    manualBookingId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      description: Joi.string().allow(''),
      date: Joi.date(),
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      type: Joi.string().valid('manual-booking', 'maintenance', 'personal', 'blocked'),
        clientName: Joi.string().allow(''),
      clientPhone: Joi.string().allow(''),
      clientEmail: Joi.string().email().allow(''),
      pickupLocation: Joi.string().allow(''),
      dropoffLocation: Joi.string().allow(''),
      price: Joi.number().min(0),
      notes: Joi.string().allow(''),
      isActive: Joi.boolean(),
    })
    .min(1),
};

const deleteManualBooking = {
  params: Joi.object().keys({
    manualBookingId: Joi.string().custom(objectId),
  }),
};

const checkTimeConflict = {
  body: Joi.object().keys({
    date: Joi.date().required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    excludeBookingId: Joi.string().custom(objectId),
  }),
};

const getBlockedSlots = {
  query: Joi.object().keys({
    date: Joi.date().required(),
  }),
};

module.exports = {
  createManualBooking,
  getManualBookings,
  getManualBooking,
  updateManualBooking,
  deleteManualBooking,
  checkTimeConflict,
  getBlockedSlots,
};