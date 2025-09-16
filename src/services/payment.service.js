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

    logger.info('Payment data:', paymentData);
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
      Payment.findOne({ stripeSessionId: sessionId }).populate('booking'),
    ]);

    if (!payment) {
      logger.warn('Payment not found for session:', sessionId);
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
    }

    // Parse the bookingData from metadata if booking is not yet created
    let bookingDetails = {};
    if (payment.metadata?.bookingData) {
      try {
        const parsedBookingData = JSON.parse(payment.metadata.bookingData);
        bookingDetails = {
          service: parsedBookingData.service,
          pickupAddress: parsedBookingData.pickup.address,
          dropoffAddress: parsedBookingData.dropoff.address,
          pickupDate: parsedBookingData.pickup.date,
          pickupTime: parsedBookingData.pickup.time,
          distance: parsedBookingData.distance
            ? `${parsedBookingData.distance.km} km / ${parsedBookingData.distance.miles} miles`
            : null,
          duration: parsedBookingData.duration,
          passengerDetails: parsedBookingData.passengerDetails,
          isRoundTrip: parsedBookingData.isRoundTrip || false,
          returnDetails: parsedBookingData.returnDetails || null,
        };
      } catch (error) {
        logger.error('Error parsing booking data from metadata:', error);
      }
    }

    // If booking exists, use that data instead
    if (payment.booking) {
      bookingDetails = {
        bookingNumber: payment.booking.bookingNumber,
        service: payment.booking.service,
        pickupAddress: payment.booking.pickup.address,
        dropoffAddress: payment.booking.dropoff.address,
        pickupDate: payment.booking.pickup.date,
        pickupTime: payment.booking.pickup.time,
        distance: payment.booking.distance
          ? `${payment.booking.distance.km} km / ${payment.booking.distance.miles} miles`
          : null,
        duration: payment.booking.duration,
        passengerDetails: payment.booking.passengerDetails,
        isRoundTrip: payment.booking.isRoundTrip || false,
        returnDetails: payment.booking.returnDetails || null,
      };
    }

    return {
      amount: stripeSession.amount_total / 100,
      status: payment.status,
      email: stripeSession.customer_details?.email || payment.metadata?.customerEmail,
      billingDetails: payment.billingDetails,
      bookingDetails,
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

const createInvoice = async (customerId, bookingData, amount) => {
  try {
    logger.debug('Creating Stripe invoice:', { customerId, amount });

    // Create the invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      metadata: {
        bookingNumber: bookingData.bookingNumber || 'Pending',
        service: bookingData.service,
        pickupDate: bookingData.pickup?.date || '',
        pickupTime: bookingData.pickup?.time || '',
        pickupAddress: bookingData.pickup?.address || '',
        dropoffAddress: bookingData.dropoff?.address || '',
        passengerName: `${bookingData.passengerDetails?.firstName || ''} ${bookingData.passengerDetails?.lastName || ''}`.trim(),
        passengerPhone: bookingData.passengerDetails?.phone || '',
        passengerEmail: bookingData.passengerDetails?.email || bookingData.email || '',
        passengers: bookingData.passengerDetails?.passengers || '',
        luggage: bookingData.passengerDetails?.luggage || '',
        flightNumber: bookingData.pickup?.flightNumber || bookingData.passengerDetails?.flightNumber || '',
        flightTime: bookingData.pickup?.flightTime || bookingData.passengerDetails?.flightTime || '',
        distance: bookingData.distance ? `${bookingData.distance.miles || 0} miles / ${bookingData.distance.km || 0} km` : '',
        duration: bookingData.duration || '',
        isRoundTrip: bookingData.isRoundTrip ? 'true' : 'false',
        affiliate: bookingData.affiliate ? 'true' : 'false',
        affiliateCode: bookingData.affiliateCode || '',
        notes: bookingData.passengerDetails?.notes || '',
        specialRequirements: bookingData.passengerDetails?.specialRequirements || '',
      },
    });

    // Create detailed description for main service
    const serviceDescription = [
      `Transportation Service - ${bookingData.service}`,
      `From: ${bookingData.pickup?.address || 'N/A'}`,
      `To: ${bookingData.dropoff?.address || 'N/A'}`,
      `Date: ${bookingData.pickup?.date || 'N/A'} at ${bookingData.pickup?.time || 'N/A'}`,
      `Passengers: ${bookingData.passengerDetails?.passengers || 'N/A'}`,
      bookingData.pickup?.flightNumber ? `Flight: ${bookingData.pickup.flightNumber}` : '',
    ].filter(Boolean).join(' | ');

    // Add invoice items
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: Math.round((bookingData.pricing?.basePrice || amount) * 100),
      currency: 'usd',
      description: serviceDescription,
      metadata: {
        type: 'base_service',
        service: bookingData.service,
        pickup: bookingData.pickup?.address || '',
        dropoff: bookingData.dropoff?.address || '',
        date: bookingData.pickup?.date || '',
        time: bookingData.pickup?.time || '',
        passengers: bookingData.passengerDetails?.passengers || '',
        flightNumber: bookingData.pickup?.flightNumber || '',
      },
    });

    // Add pricing breakdown items if available
    if (bookingData.pricing) {
      // Add gratuity/tip as separate line item
      if (bookingData.pricing.gratuity > 0) {
        await stripe.invoiceItems.create({
          customer: customerId,
          invoice: invoice.id,
          amount: Math.round(bookingData.pricing.gratuity * 100),
          currency: 'usd',
          description: `Gratuity (${bookingData.pricing.selectedTipPercentage || 0}%)`,
          metadata: {
            type: 'gratuity',
            percentage: bookingData.pricing.selectedTipPercentage?.toString() || '0',
          },
        });
      }

      // Add night fee if applicable
      if (bookingData.pricing.nightFee > 0) {
        await stripe.invoiceItems.create({
          customer: customerId,
          invoice: invoice.id,
          amount: Math.round(bookingData.pricing.nightFee * 100),
          currency: 'usd',
          description: 'Night Fee (Late/Early Hours)',
          metadata: {
            type: 'night_fee',
          },
        });
      }
    }

    // Add extra items if present
    if (bookingData.extras && bookingData.extras.length > 0) {
      for (const extra of bookingData.extras) {
        await stripe.invoiceItems.create({
          customer: customerId,
          invoice: invoice.id,
          amount: Math.round(extra.price * 100),
          currency: 'usd',
          description: `Extra: ${extra.name}`,
          quantity: extra.quantity || 1,
        });
      }
    }

    // Finalize the invoice to make it ready for payment/sending
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    logger.info('Stripe invoice created successfully:', {
      invoiceId: finalizedInvoice.id,
      customerId,
      amount,
      status: finalizedInvoice.status,
    });

    return finalizedInvoice;
  } catch (error) {
    logger.error('Invoice creation failed:', {
      error: error.message,
      stack: error.stack,
      customerId,
      amount,
    });
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create invoice');
  }
};

module.exports = {
  createPayment,
  getSessionById,
  handleSuccessfulPayment,
  handleFailedPayment,
  getPaymentById,
  updatePaymentBySessionId,
  createInvoice,
};
