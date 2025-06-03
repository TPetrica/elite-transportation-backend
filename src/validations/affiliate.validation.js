const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createAffiliate = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    code: Joi.string().required().uppercase(),
    description: Joi.string(),
    companyName: Joi.string(),
    companyEmail: Joi.string().email(),
    commissionPercentage: Joi.number().min(0).max(100).default(10),
    isActive: Joi.boolean().default(true),
    trackingUrl: Joi.string().uri(),
    redirectPath: Joi.string().default('/booking-time'),
    defaultPickupLocation: Joi.object({
      address: Joi.string().allow('').optional(),
      coordinates: Joi.object({
        lat: Joi.number(),
        lng: Joi.number(),
      }).allow(null).optional(),
      isCustom: Joi.boolean().optional(),
      isCottonwood: Joi.boolean().optional(),
    }).allow(null).optional(),
    defaultDropoffLocation: Joi.object({
      address: Joi.string().allow('').optional(),
      coordinates: Joi.object({
        lat: Joi.number(),
        lng: Joi.number(),
      }).allow(null).optional(),
      isCustom: Joi.boolean().optional(),
      isCottonwood: Joi.boolean().optional(),
    }).allow(null).optional(),
    preferredService: Joi.string().valid('from-airport', 'to-airport', 'hourly', 'per-person', 'canyons', 'round-trip', 'group', 'one-way'),
    servicePricing: Joi.object({
      basePrice: Joi.number().min(0),
      minPassengers: Joi.number().min(0).default(0),
      customDescription: Joi.string().trim(),
    }),
    servicePricingList: Joi.array().items(
      Joi.object({
        serviceType: Joi.string().required().valid('from-airport', 'to-airport', 'hourly', 'per-person', 'canyons', 'round-trip', 'group', 'one-way'),
        basePrice: Joi.number().min(0),
        minPassengers: Joi.number().min(0).default(0),
      })
    ),
  }),
};

const getAffiliates = {
  query: Joi.object().keys({
    name: Joi.string(),
    code: Joi.string(),
    isActive: Joi.boolean(),
    search: Joi.string().allow(''),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getAffiliate = {
  params: Joi.object().keys({
    affiliateId: Joi.string().custom(objectId),
  }),
};

const updateAffiliate = {
  params: Joi.object().keys({
    affiliateId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      code: Joi.string().uppercase(),
      description: Joi.string(),
      companyName: Joi.string(),
      companyEmail: Joi.string().email(),
      commissionPercentage: Joi.number().min(0).max(100),
      isActive: Joi.boolean(),
      trackingUrl: Joi.string().uri(),
      redirectPath: Joi.string(),
      defaultPickupLocation: Joi.object({
        address: Joi.string().allow('').optional(),
        coordinates: Joi.object({
          lat: Joi.number(),
          lng: Joi.number(),
        }).allow(null).optional(),
        isCustom: Joi.boolean().optional(),
        isCottonwood: Joi.boolean().optional(),
      }).allow(null).optional(),
      defaultDropoffLocation: Joi.object({
        address: Joi.string().allow('').optional(),
        coordinates: Joi.object({
          lat: Joi.number(),
          lng: Joi.number(),
        }).allow(null).optional(),
        isCustom: Joi.boolean().optional(),
        isCottonwood: Joi.boolean().optional(),
      }).allow(null).optional(),
      preferredService: Joi.string().valid('from-airport', 'to-airport', 'hourly', 'per-person', 'canyons', 'round-trip', 'group', 'one-way'),
      servicePricing: Joi.object({
        basePrice: Joi.number().min(0),
        minPassengers: Joi.number().min(0).default(0),
        customDescription: Joi.string().trim(),
      }),
      servicePricingList: Joi.array().items(
        Joi.object({
          serviceType: Joi.string().required().valid('from-airport', 'to-airport', 'hourly', 'per-person', 'canyons', 'round-trip', 'group', 'one-way'),
          basePrice: Joi.number().min(0),
          minPassengers: Joi.number().min(0).default(0),
        })
      ),
    })
    .min(1),
};

const deleteAffiliate = {
  params: Joi.object().keys({
    affiliateId: Joi.string().custom(objectId),
  }),
};

const trackVisit = {
  params: Joi.object().keys({
    code: Joi.string().required(),
  }),
};

const validateAffiliate = {
  params: Joi.object().keys({
    code: Joi.string().required(),
  }),
};

module.exports = {
  createAffiliate,
  getAffiliates,
  getAffiliate,
  updateAffiliate,
  deleteAffiliate,
  trackVisit,
  validateAffiliate,
};