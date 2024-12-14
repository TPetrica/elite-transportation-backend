const httpStatus = require('http-status');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/payment.model');
const Booking = require('../models/booking.model');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const createPayment = async (paymentData) => {
  try {
    logger.debug('Creating payment record:', JSON.stringify(paymentData));

    // Create payment record
    const payment = await Payment.create({
      amount: paymentData.amount,
      stripeSessionId: paymentData.stripeSessionId,
      billingDetails: paymentData.billingDetails,
      booking: paymentData.bookingId,
      status: 'pending',
      metadata: paymentData.metadata || {},
    });

    // Update booking if exists
    if (paymentData.bookingId) {
      await Booking.findByIdAndUpdate(paymentData.bookingId, {
        'payment.status': 'pending',
        'payment.sessionId': paymentData.stripeSessionId,
        'payment.amount': paymentData.amount,
      });
    }

    logger.info('Payment created successfully:', { paymentId: payment._id });
    return payment;
  } catch (error) {
    logger.error('Payment creation failed:', {
      error: error.message,
      stack: error.stack,
      data: paymentData,
    });
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create payment record');
  }
};

const getSessionById = async (sessionId) => {
  try {
    logger.debug('Retrieving session:', sessionId);

    const [stripeSession, payment] = await Promise.all([
      stripe.checkout.sessions.retrieve(sessionId),
      Payment.findOne({ stripeSessionId: sessionId }).populate({
        path: 'booking',
        populate: {
          path: 'vehicle',
          select: 'name class image',
        },
      }),
    ]);

    if (!payment) {
      logger.warn('Payment not found for session:', sessionId);
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    return {
      amount: stripeSession.amount_total / 100,
      status: payment.status,
      email: stripeSession.customer_email,
      billingDetails: payment.billingDetails,
      bookingDetails: payment.booking
        ? {
            bookingNumber: payment.booking.bookingNumber,
            pickupAddress: payment.booking.pickup.address,
            dropoffAddress: payment.booking.dropoff.address,
            pickupDate: payment.booking.pickup.date,
            pickupTime: payment.booking.pickup.time,
            distance: payment.booking.distance
              ? `${payment.booking.distance.km} km / ${payment.booking.distance.miles} miles`
              : null,
            duration: payment.booking.duration,
            vehicle: payment.booking.vehicle,
            passengerDetails: payment.booking.passengerDetails,
          }
        : {},
      metadata: payment.metadata || {},
    };
  } catch (error) {
    logger.error('Session retrieval failed:', {
      error: error.message,
      stack: error.stack,
      sessionId,
    });
    throw error.isApiError
      ? error
      : new ApiError(error.statusCode === 404 ? httpStatus.NOT_FOUND : httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const handleSuccessfulPayment = async (session) => {
  try {
    logger.info('Processing successful payment:', { sessionId: session.id });

    const payment = await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        status: 'completed',
        stripePaymentId: session.payment_intent,
        'metadata.completedAt': new Date(),
      },
      { new: true }
    );

    if (!payment) {
      throw new Error(`Payment record not found for session: ${session.id}`);
    }

    if (payment.booking) {
      await Booking.findByIdAndUpdate(payment.booking, {
        'payment.status': 'completed',
        'payment.stripePaymentIntentId': session.payment_intent,
        'payment.completedAt': new Date(),
        status: 'confirmed',
      });
    }

    return payment;
  } catch (error) {
    logger.error('Payment processing failed:', {
      error: error.message,
      stack: error.stack,
      sessionId: session.id,
    });
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to process payment');
  }
};

const handleFailedPayment = async (session) => {
  try {
    logger.info('Processing failed payment:', { sessionId: session.id });

    const payment = await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        status: 'failed',
        'metadata.failedAt': new Date(),
        'metadata.failureReason': session.last_payment_error?.message || 'Unknown error',
      },
      { new: true }
    );

    if (!payment) {
      throw new Error(`Payment record not found for session: ${session.id}`);
    }

    if (payment.booking) {
      await Booking.findByIdAndUpdate(payment.booking, {
        'payment.status': 'failed',
        status: 'cancelled',
        'metadata.cancellationReason': 'payment_failed',
      });
    }

    return payment;
  } catch (error) {
    logger.error('Failed payment processing error:', {
      error: error.message,
      stack: error.stack,
      sessionId: session.id,
    });
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to process payment failure');
  }
};

const getPaymentById = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }
  return payment;
};

const updatePaymentBySessionId = async (sessionId, updateData) => {
  const payment = await Payment.findOneAndUpdate({ stripeSessionId: sessionId }, updateData, { new: true });
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }
  return payment;
};

module.exports = {
  createPayment,
  getSessionById,
  handleSuccessfulPayment,
  handleFailedPayment,
  getPaymentById,
  updatePaymentBySessionId,
};
