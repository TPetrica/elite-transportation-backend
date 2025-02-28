const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createBooking = {
  body: Joi.object().keys({
    pickup: Joi.object()
      .keys({
        address: Joi.string().required(),
        date: Joi.date().required(),
        time: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        flightNumber: Joi.string().allow('', null),
        coordinates: Joi.object()
          .keys({
            lat: Joi.number().required(),
            lng: Joi.number().required(),
          })
          .required(),
        isCustom: Joi.boolean().optional(),
      })
      .required(),
    dropoff: Joi.object()
      .keys({
        address: Joi.string().required(),
        coordinates: Joi.object()
          .keys({
            lat: Joi.number().required(),
            lng: Joi.number().required(),
          })
          .required(),
        isCustom: Joi.boolean().optional(),
      })
      .required(),
    distance: Joi.object()
      .keys({
        km: Joi.number().required(),
        miles: Joi.number().required(),
      })
      .required(),
    duration: Joi.string().required(),
    service: Joi.string()
      .valid('to-airport', 'from-airport', 'round-trip', 'hourly', 'group', 'per-person', 'canyons')
      .required(),
    extras: Joi.array().items(
      Joi.object().keys({
        item: Joi.string().custom(objectId).required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().required(),
      })
    ),
    email: Joi.string().email().required(),
    passengerDetails: Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        phone: Joi.string().required(),
        passengers: Joi.number().integer().min(1).required(),
        luggage: Joi.number().integer().min(0).required(),
        specialRequirements: Joi.string().allow('', null),
      })
      .required(),
    payment: Joi.object()
      .keys({
        method: Joi.string().valid('credit_card', 'paypal').required(),
        status: Joi.string().valid('pending', 'completed', 'failed').default('pending'),
        amount: Joi.number().required(),
        currency: Joi.string().default('USD'),
        stripePaymentIntentId: Joi.string().allow('', null),
      })
      .required(),
    billingDetails: Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        company: Joi.string().allow('', null),
        address: Joi.string().required(),
        country: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
      })
      .required(),
    user: Joi.string().custom(objectId).allow(null),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed').default('pending'),
    calendar: Joi.object().keys({
      eventId: Joi.string().allow('', null),
      link: Joi.string().allow('', null),
    }),
    affiliate: Joi.boolean().optional(),
    affiliateCode: Joi.string().allow('').optional(),
  }),
};

const updateBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      pickup: Joi.object().keys({
        address: Joi.string(),
        date: Joi.date(),
        time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        flightNumber: Joi.string().allow('', null),
        coordinates: Joi.object().keys({
          lat: Joi.number(),
          lng: Joi.number(),
        }),
      }),
      dropoff: Joi.object().keys({
        address: Joi.string(),
        coordinates: Joi.object().keys({
          lat: Joi.number(),
          lng: Joi.number(),
        }),
      }),
      status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed'),
      service: Joi.string().valid('to-airport', 'from-airport', 'round-trip', 'hourly', 'group', 'per-person', 'canyons'),
      passengerDetails: Joi.object().keys({
        firstName: Joi.string(),
        lastName: Joi.string(),
        phone: Joi.string(),
        passengers: Joi.number().integer().min(1),
        luggage: Joi.number().integer().min(0),
        specialRequirements: Joi.string().allow('', null),
      }),
      payment: Joi.object().keys({
        status: Joi.string().valid('pending', 'completed', 'failed'),
        stripePaymentIntentId: Joi.string().allow('', null),
      }),
      extras: Joi.array().items(
        Joi.object().keys({
          item: Joi.string().custom(objectId).required(),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number(),
        })
      ),
    })
    .min(1),
};

const getBookings = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed'),
    startDate: Joi.date(),
    endDate: Joi.date().min(Joi.ref('startDate')),
  }),
};

const getBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId),
  }),
};

const getBookingByNumber = {
  params: Joi.object().keys({
    bookingNumber: Joi.string().required(),
  }),
};

const cancelBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId),
  }),
};

const attachUserToBooking = {
  params: Joi.object().keys({
    bookingNumber: Joi.string().required(),
  }),
};

const getUserBookings = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed'),
    startDate: Joi.date(),
    endDate: Joi.date().min(Joi.ref('startDate')),
  }),
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  getBookingByNumber,
  updateBooking,
  cancelBooking,
  attachUserToBooking,
  getUserBookings,
};
