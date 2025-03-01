const Joi = require('joi');
const { objectId } = require('./custom.validation');

/**
 * Validation schema for creating a booking
 */
const createBooking = {
  body: Joi.object().keys({
    user: Joi.string().custom(objectId).optional(),
    email: Joi.string().required().email(),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed').default('pending'),
    pickup: Joi.object()
      .keys({
        address: Joi.string().required(),
        date: Joi.date().required(),
        time: Joi.string().required(),
        flightNumber: Joi.string().allow('').optional(),
        flightTime: Joi.string().allow('').optional(),
        coordinates: Joi.object()
          .keys({
            lat: Joi.number().optional(),
            lng: Joi.number().optional(),
          })
          .optional(),
        isCustom: Joi.boolean().optional(),
      })
      .required(),
    dropoff: Joi.object()
      .keys({
        address: Joi.string().required(),
        coordinates: Joi.object()
          .keys({
            lat: Joi.number().optional(),
            lng: Joi.number().optional(),
          })
          .optional(),
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
    passengerDetails: Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        phone: Joi.string().required(),
        passengers: Joi.number().integer().min(1).required(),
        luggage: Joi.number().integer().min(0).required(),
        specialRequirements: Joi.string().allow('').optional(),
        notes: Joi.string().allow('').optional(),
      })
      .required(),
    extras: Joi.array()
      .items(
        Joi.object().keys({
          item: Joi.string().custom(objectId).required(),
          quantity: Joi.number().integer().min(1).default(1),
          price: Joi.number().optional(), // Will be calculated on server
        })
      )
      .optional(),
    payment: Joi.object()
      .keys({
        method: Joi.string().valid('credit_card', 'paypal').required(),
        status: Joi.string().valid('pending', 'completed', 'failed').default('pending'),
        amount: Joi.number().required(),
        currency: Joi.string().default('USD'),
        stripePaymentIntentId: Joi.string().allow('').optional(),
      })
      .required(),
    billingDetails: Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        company: Joi.string().allow('').optional(),
        address: Joi.string().required(),
        country: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
      })
      .required(),
    affiliate: Joi.boolean().default(false),
    affiliateCode: Joi.string().allow('').optional(),
  }),
};

/**
 * Validation schema for updating a booking
 */
const updateBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed'),
      pickup: Joi.object().keys({
        address: Joi.string(),
        date: Joi.date(),
        time: Joi.string(),
        flightNumber: Joi.string().allow(''),
        flightTime: Joi.string().allow(''),
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
      distance: Joi.object().keys({
        km: Joi.number(),
        miles: Joi.number(),
      }),
      duration: Joi.string(),
      passengerDetails: Joi.object().keys({
        firstName: Joi.string(),
        lastName: Joi.string(),
        phone: Joi.string(),
        passengers: Joi.number().integer().min(1),
        luggage: Joi.number().integer().min(0),
        specialRequirements: Joi.string().allow(''),
        notes: Joi.string().allow(''),
      }),
      extras: Joi.array().items(
        Joi.object().keys({
          item: Joi.string().custom(objectId).required(),
          quantity: Joi.number().integer().min(1).default(1),
          price: Joi.number(),
        })
      ),
      payment: Joi.object().keys({
        method: Joi.string().valid('credit_card', 'paypal'),
        status: Joi.string().valid('pending', 'completed', 'failed'),
        amount: Joi.number(),
        stripePaymentIntentId: Joi.string().allow(''),
      }),
      user: Joi.string().custom(objectId),
    })
    .min(1),
};

/**
 * Validation schema for getting a booking by ID
 */
const getBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
};

/**
 * Validation schema for getting a booking by booking number
 */
const getBookingByNumber = {
  params: Joi.object().keys({
    bookingNumber: Joi.string().required(),
  }),
};

/**
 * Validation schema for cancelling a booking
 */
const cancelBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
};

/**
 * Validation schema for attaching a user to a booking
 */
const attachUserToBooking = {
  params: Joi.object().keys({
    bookingNumber: Joi.string().required(),
  }),
};

/**
 * Validation schema for querying bookings
 */
const getBookings = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed'),
    user: Joi.string().custom(objectId),
    email: Joi.string().email(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    date: Joi.date(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    customerName: Joi.string(),
    phone: Joi.string(),
    bookingNumber: Joi.string(),
    affiliate: Joi.boolean(),
  }),
};

/**
 * Validation schema for getting user's bookings
 */
const getUserBookings = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    date: Joi.date(),
    startDate: Joi.date(),
    endDate: Joi.date(),
  }),
};

/**
 * Validation schema for getting booking statistics
 */
const getBookingStats = {
  query: Joi.object().keys({
    startDate: Joi.date(),
    endDate: Joi.date().min(Joi.ref('startDate')),
  }),
};

module.exports = {
  createBooking,
  getBooking,
  getBookings,
  updateBooking,
  cancelBooking,
  getBookingByNumber,
  attachUserToBooking,
  getUserBookings,
  getBookingStats,
};
