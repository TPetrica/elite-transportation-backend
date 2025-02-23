const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const bookingSchema = mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: false, // Optional for guest bookings
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    // Trip Details
    pickup: {
      address: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      time: {
        type: String,
        required: true,
      },
      flightNumber: {
        type: String,
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    dropoff: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    distance: {
      km: {
        type: Number,
        required: true,
      },
      miles: {
        type: Number,
        required: true,
      },
    },
    duration: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      enum: ['to-airport', 'from-airport', 'round-trip', 'hourly', 'group'],
      required: true,
    },
    // Passenger Details
    passengerDetails: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      passengers: {
        type: Number,
        required: true,
      },
      luggage: {
        type: Number,
        required: true,
      },
      specialRequirements: {
        type: String,
      },
    },
    // Extra Options
    extras: [
      {
        item: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'Extra',
        },
        quantity: {
          type: Number,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    // Payment Details
    payment: {
      method: {
        type: String,
        enum: ['credit_card', 'paypal'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
      },
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      stripePaymentIntentId: {
        type: String,
      },
    },
    // Billing Details
    billingDetails: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      company: {
        type: String,
      },
      address: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
    },
    // Calendar Integration
    calendar: {
      eventId: {
        type: String,
      },
      link: {
        type: String,
      },
    },
    affiliate: { type: Boolean, default: false },
    affiliateCode: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Add plugins
bookingSchema.plugin(toJSON);
bookingSchema.plugin(paginate);

/**
 * Generate booking number
 * @returns {String}
 */
bookingSchema.statics.generateBookingNumber = async function () {
  const count = await this.countDocuments();
  const date = new Date();
  return `BK${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(count + 1).padStart(4, '0')}`;
};

/**
 * Check if booking time is available
 * @param {Date} date
 * @param {String} time
 * @returns {Promise<boolean>}
 */
bookingSchema.statics.isTimeSlotAvailable = async function (date, time) {
  const existingBooking = await this.findOne({
    'pickup.date': date,
    'pickup.time': time,
    status: { $nin: ['cancelled'] },
  });
  return !existingBooking;
};

/**
 * Calculate trip duration in minutes
 */
bookingSchema.methods.getTripDurationMinutes = function () {
  return parseInt(this.duration.split(' ')[0]);
};

/**
 * Check if booking can be cancelled
 */
bookingSchema.methods.canBeCancelled = function () {
  return ['pending', 'confirmed'].includes(this.status);
};

/**
 * Check if booking is upcoming
 */
bookingSchema.methods.isUpcoming = function () {
  const bookingTime = new Date(`${this.pickup.date}T${this.pickup.time}`);
  return bookingTime > new Date();
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
