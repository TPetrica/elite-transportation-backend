const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const paymentSchema = mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    stripeSessionId: {
      type: String,
    },
    stripePaymentId: {
      type: String,
    },
    method: {
      type: String,
      enum: ['card', 'paypal'],
      default: 'card',
    },
    billingDetails: {
      firstName: String,
      lastName: String,
      company: String,
      address: String,
      city: String,
      country: String,
      zipCode: String,
      email: String,
    },
    booking: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Booking',
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.plugin(toJSON);

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
