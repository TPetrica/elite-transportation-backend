const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const affiliateSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    companyEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    commissionPercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    trackingUrl: {
      type: String,
      trim: true,
    },
    redirectPath: {
      type: String,
      default: '/booking-time',
      trim: true,
    },
    // Location configuration
    defaultPickupLocation: {
      address: {
        type: String,
        trim: true,
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      isCustom: {
        type: Boolean,
        default: false,
      },
      isCottonwood: {
        type: Boolean,
        default: false,
      },
    },
    defaultDropoffLocation: {
      address: {
        type: String,
        trim: true,
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      isCustom: {
        type: Boolean,
        default: false,
      },
      isCottonwood: {
        type: Boolean,
        default: false,
      },
    },
    preferredService: {
      type: String,
      enum: ['from-airport', 'to-airport', 'hourly', 'per-person', 'canyons', 'round-trip', 'group'],
    },
    // Custom service pricing for affiliates (deprecated - kept for backward compatibility)
    servicePricing: {
      basePrice: {
        type: Number,
        min: 0,
      },
      minPassengers: {
        type: Number,
        min: 0,
        default: 0,
      },
      customDescription: {
        type: String,
        trim: true,
      },
    },
    // Multiple service pricing configurations for affiliates
    servicePricingList: [{
      serviceType: {
        type: String,
        required: true,
        enum: ['from-airport', 'to-airport', 'hourly', 'per-person', 'canyons', 'round-trip', 'group', 'one-way'],
      },
      basePrice: {
        type: Number,
        min: 0,
      },
      minPassengers: {
        type: Number,
        min: 0,
        default: 0,
      },
    }],
    trackingData: {
      visits: {
        type: Number,
        default: 0,
      },
      bookings: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
affiliateSchema.plugin(toJSON);
affiliateSchema.plugin(paginate);

/**
 * Check if affiliate code is already taken
 * @param {string} code - The affiliate code
 * @param {ObjectId} [excludeAffiliateId] - The id of the affiliate to be excluded
 * @returns {Promise<boolean>}
 */
affiliateSchema.statics.isCodeTaken = async function (code, excludeAffiliateId) {
  const affiliate = await this.findOne({ code, _id: { $ne: excludeAffiliateId } });
  return !!affiliate;
};

/**
 * @typedef Affiliate
 */
const Affiliate = mongoose.model('Affiliate', affiliateSchema);

module.exports = Affiliate;