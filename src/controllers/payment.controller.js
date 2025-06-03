const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { paymentService, bookingService, smsService, calendarService } = require('../services');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { sendInvoiceEmail } = require('../services/email.service');
const { Payment } = require('../models');

const createCheckoutSession = catchAsync(async (req, res) => {
  const { amount, billingDetails, bookingData } = req.body;

  try {
    // Create Stripe Customer first
    const customer = await stripe.customers.create({
      email: bookingData.email,
      name: `${billingDetails.firstName} ${billingDetails.lastName}`,
      address: {
        line1: billingDetails.address,
        city: billingDetails.city,
        country: billingDetails.country,
        postal_code: billingDetails.zipCode,
      },
      description: `Customer for transportation service`,
    });

    logger.info('Stripe customer created:', {
      customerId: customer.id,
      email: customer.email,
    });

    // Map the incoming vehicle field to service
    const modifiedBookingData = {
      ...bookingData,
    };

    // Create temporary payment record to store booking data
    const tempPayment = await paymentService.createPayment({
      amount,
      stripeCustomerId: customer.id,
      billingDetails,
      status: 'pending',
      metadata: {
        bookingData: JSON.stringify({
          ...modifiedBookingData,
          billingDetails,
          payment: {
            method: 'credit_card',
            amount: amount,
            status: 'pending',
          },
        }),
        customerEmail: bookingData.email,
      },
    });

    // Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Transportation Service',
              description: `From ${bookingData.pickup.address} to ${bookingData.dropoff.address}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/booking-received?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/booking-payment`,
      payment_intent_data: {
        metadata: {
          paymentId: tempPayment._id.toString(),
        },
      },
      metadata: {
        paymentId: tempPayment._id.toString(),
      },
    });

    logger.info('Stripe session created:', {
      sessionId: session.id,
      customerId: customer.id,
    });

    // Update payment record with session ID
    await Payment.findByIdAndUpdate(tempPayment._id, {
      stripeSessionId: session.id,
    });

    return res.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    logger.error('Checkout session creation failed:', {
      error: error.message,
      stack: error.stack,
      amount,
    });

    throw new ApiError(
      error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to create checkout session'
    );
  }
});

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    if (!endpointSecret) {
      throw new Error('Webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    logger.info('Webhook event received:', {
      type: event.type,
      id: event.id,
    });

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;

        try {
          // Get payment record which contains booking data
          const payment = await Payment.findOne({ stripeSessionId: session.id });
          if (!payment) {
            throw new Error('Payment record not found');
          }

          const bookingData = JSON.parse(payment.metadata.bookingData);

          // Create the booking now that payment is completed
          const booking = await bookingService.createBooking({
            ...bookingData,
            payment: {
              method: 'credit_card',
              amount: session.amount_total / 100,
              status: 'completed',
              stripeSessionId: session.id,
              stripeCustomerId: session.customer,
              stripePaymentIntentId: session.payment_intent,
            },
          });

          logger.info('Booking created after successful payment:', {
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
          });

          // Update payment record with booking reference
          await Payment.findByIdAndUpdate(payment._id, {
            status: 'completed',
            booking: booking._id,
            'metadata.bookingNumber': booking.bookingNumber,
            stripePaymentIntentId: session.payment_intent,
          });

          // Create calendar event
          await calendarService.createEvent(booking);

          // Send notifications
          try {
            // Send invoice email
            await sendInvoiceEmail(session.customer_details.email, session.payment_intent, session, booking);

            // Send SMS if phone number exists
            if (booking.passengerDetails?.phone) {
              await smsService.sendBookingConfirmation(booking, {
                amount: session.amount_total / 100,
              });
            }
          } catch (notificationError) {
            // Log but don't fail the webhook
            logger.error('Notification sending failed:', {
              error: notificationError.message,
              bookingId: booking._id,
              sessionId: session.id,
            });
          }
        } catch (error) {
          logger.error('Failed to process successful payment:', {
            error: error.message,
            sessionId: session.id,
            customer: session.customer,
          });
          throw error;
        }
        break;

      case 'payment_intent.succeeded':
        logger.info('Payment intent succeeded:', {
          intentId: event.data.object.id,
          amount: event.data.object.amount,
        });
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        logger.error('Payment intent failed:', {
          intentId: failedIntent.id,
          error: failedIntent.last_payment_error,
        });

        try {
          const failedPayment = await paymentService.handleFailedPayment(failedIntent);

          // Send SMS for failed payment if we have the phone number
          if (failedPayment?.metadata?.bookingData) {
            const bookingData = JSON.parse(failedPayment.metadata.bookingData);
            if (bookingData.passengerDetails?.phone) {
              await smsService.sendPaymentFailedNotification(bookingData, failedIntent.last_payment_error);
            }
          }
        } catch (error) {
          logger.error('Failed to handle payment failure:', {
            error: error.message,
            intentId: failedIntent.id,
          });
        }
        break;

      case 'payment_intent.canceled':
        logger.info('Payment intent canceled:', {
          intentId: event.data.object.id,
          status: event.data.object.status,
        });
        await paymentService.handleFailedPayment(event.data.object);
        break;

      // Events we can safely ignore
      case 'charge.updated':
      case 'payment_intent.created':
      case 'customer.created':
      case 'customer.updated':
        logger.debug('Standard event received:', {
          type: event.type,
          id: event.data.object.id,
        });
        break;

      default:
        logger.info('Unhandled event type:', {
          type: event.type,
          id: event.data.object.id,
        });
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook processing failed:', {
      error: err.message,
      stack: err.stack,
      signature: sig ? 'present' : 'missing',
      raw: err,
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

const getSession = catchAsync(async (req, res) => {
  const session = await paymentService.getSessionById(req.params.sessionId);
  logger.debug('Retrieving session:', {
    sessionId: req.params.sessionId,
  });
  res.json(session);
});

module.exports = {
  createCheckoutSession,
  handleWebhook,
  getSession,
};
