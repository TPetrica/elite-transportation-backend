const Joi = require('joi');

const createCheckoutSession = {
  body: Joi.object().keys({
    amount: Joi.number().required(),
    billingDetails: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      company: Joi.string().allow(''),
      address: Joi.string().required(),
      city: Joi.string().required(),
      country: Joi.string().required(),
      zipCode: Joi.string().required(),
      email: Joi.string().allow(''),
      newsletter: Joi.boolean().optional(),
    }),
    bookingData: Joi.object({
      pickup: Joi.object({
        address: Joi.string().required(),
        coordinates: Joi.object({
          lat: Joi.number().required(),
          lng: Joi.number().required(),
        }),
        date: Joi.string().required(),
        time: Joi.string().required(),
        flightNumber: Joi.string().allow('', null).optional(),
        flightTime: Joi.string().allow('', null).optional(),
        isCustom: Joi.boolean().optional(),
      }),
      dropoff: Joi.object({
        address: Joi.string().required(),
        coordinates: Joi.object({
          lat: Joi.number().required(),
          lng: Joi.number().required(),
        }),
        flightNumber: Joi.string().allow('', null).optional(),
        flightTime: Joi.string().allow('', null).optional(),
        isCustom: Joi.boolean().optional(),
      }),
      distance: Joi.object({
        km: Joi.number().optional(),
        miles: Joi.number().optional(),
      }).optional(),
      duration: Joi.string().optional(),
      service: Joi.string()
        .valid('to-airport', 'from-airport', 'round-trip', 'hourly', 'group', 'per-person', 'canyons')
        .required(),
      passengerDetails: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        passengers: Joi.string().required(),
        luggage: Joi.string().required(),
        notes: Joi.string().allow('', null).optional(),
        specialRequirements: Joi.string().allow('', null).optional(),
        company: Joi.string().allow('', null).optional(),
        flightNumber: Joi.string().allow('', null).optional(),
        flightTime: Joi.string().allow('', null).optional(),
      }),
      email: Joi.string().email().required(),
      affiliate: Joi.boolean().optional(),
      affiliateCode: Joi.string().allow('').optional(),
      extras: Joi.array().items(
        Joi.object({
          item: Joi.string().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
          name: Joi.string().required(),
        })
      ).optional(),
      selectedExtras: Joi.array().items(
        Joi.object({
          item: Joi.string().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
          name: Joi.string().required(),
        })
      ).optional(),
      selectedExtras: Joi.array().items(
        Joi.object({
          item: Joi.string().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
          name: Joi.string().required(),
        })
      ).optional(),
      // Round trip fields
      isRoundTrip: Joi.boolean().optional(),
      tripType: Joi.string().valid('one-way', 'round-trip').optional(),
      returnDetails: Joi.object({
        date: Joi.string().required(),
        time: Joi.string().required(),
        pickupAddress: Joi.string().required(),
        pickupCoordinates: Joi.object({
          lat: Joi.number().required(),
          lng: Joi.number().required(),
        }).allow(null),
        dropoffAddress: Joi.string().required(),
        dropoffCoordinates: Joi.object({
          lat: Joi.number().required(),
          lng: Joi.number().required(),
        }).allow(null),
      }).optional().allow(null),
      // Pricing details
      pricing: Joi.object({
        basePrice: Joi.number().required(),
        extrasTotal: Joi.number().required(),
        gratuity: Joi.number().required(),
        nightFee: Joi.number().required(),
        selectedTipPercentage: Joi.number().optional(),
        totalPrice: Joi.number().required(),
      }).optional(),
    }),
  }),
};

const getSession = {
  params: Joi.object().keys({
    sessionId: Joi.string().required(),
  }),
};

module.exports = {
  createCheckoutSession,
  getSession,
};
