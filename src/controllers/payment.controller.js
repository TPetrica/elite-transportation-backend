const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { paymentService, bookingService, calendarService } = require('../services');
const emailService = require('../services/email/emailService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { Payment, Booking } = require('../models');

const createCheckoutSession = catchAsync(async (req, res) => {
  const { amount, billingDetails, bookingData } = req.body;

  console.log('amount', amount)
  console.log('billingDetails', billingDetails)
  console.log('bookingData hereee', bookingData)
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

    // Calculate tax using Stripe Tax API
    let taxCalculation = null;
    let taxAmount = 0;
    
    try {
      // Create tax calculation
      taxCalculation = await stripe.tax.calculations.create({
        currency: 'usd',
        line_items: [
          {
            amount: Math.round(amount * 100),
            reference: 'transportation-service',
          },
        ],
        customer_details: {
          address: {
            line1: bookingData.dropoff.address,
            city: bookingData.dropoff.city,
            state: bookingData.dropoff.state,
            postal_code: bookingData.dropoff.zipCode,
            country: bookingData.dropoff.country || 'US',
          },
          address_source: 'shipping',
        },
      });
      
      taxAmount = taxCalculation.tax_amount_exclusive;
      
      logger.info('Tax calculation created:', {
        calculationId: taxCalculation.id,
        taxAmount,
        totalAmount: taxCalculation.amount_total,
      });
    } catch (taxError) {
      logger.warn('Tax calculation failed, proceeding without tax:', {
        error: taxError.message,
        billingDetails,
      });
    }
    
    // Create line items array
    const lineItems = [
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
    ];
    
    // Add tax as separate line item if calculated
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
            description: 'Sales Tax',
          },
          unit_amount: taxAmount,
        },
        quantity: 1,
      });
    }
    
    // Create Stripe Session with automatic invoice creation
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3001'}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3001'}/booking`,
      // Enable automatic invoice creation
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Transportation Service - ${bookingData.service}`,
          metadata: {
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
            tripType: bookingData.isRoundTrip ? 'round-trip' : 'one-way',
            affiliate: bookingData.affiliate ? 'true' : 'false',
            affiliateCode: bookingData.affiliateCode || '',
            notes: bookingData.passengerDetails?.notes || '',
            specialRequirements: bookingData.passengerDetails?.specialRequirements || '',
          },
        },
      },
      payment_intent_data: {
        metadata: {
          paymentId: tempPayment._id.toString(),
          taxCalculationId: taxCalculation?.id || '',
        },
      },
      metadata: {
        paymentId: tempPayment._id.toString(),
        taxCalculationId: taxCalculation?.id || '',
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
          
          // Check if booking already exists for this session (idempotency check)
          const existingBooking = await Booking.findOne({ 
            'payment.stripeSessionId': session.id 
          });
          
          if (existingBooking) {
            logger.info('Booking already exists for session, skipping duplicate processing:', {
              sessionId: session.id,
              bookingId: existingBooking._id,
              bookingNumber: existingBooking.bookingNumber
            });
            break; // Exit early, booking already processed
          }

          const bookingData = JSON.parse(payment.metadata.bookingData);

          // Debug logging for webhook booking data
          logger.info('=== STRIPE WEBHOOK DEBUG DATA ===');
          logger.info('Raw booking data from payment metadata:', bookingData);
          logger.info('Pickup date from webhook:', bookingData.pickup?.date);
          logger.info('Pickup time from webhook:', bookingData.pickup?.time);
          logger.info('Webhook date type:', typeof bookingData.pickup?.date);
          logger.info('Webhook time type:', typeof bookingData.pickup?.time);
          if (bookingData.pickup?.date) {
            logger.info('Webhook date as Date object:', new Date(bookingData.pickup.date));
            logger.info('Webhook date ISO:', new Date(bookingData.pickup.date).toISOString());
          }
          logger.info('==================================');

          // Create the booking now that payment is completed
          let booking;
          try {
            booking = await bookingService.createBooking({
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
          } catch (bookingError) {
            logger.error('Booking creation failed, but payment succeeded:', {
              error: bookingError.message,
              stack: bookingError.stack,
              sessionId: session.id,
              paymentId: payment._id,
            });
            
            // Update payment as completed even if booking failed
            await Payment.findByIdAndUpdate(payment._id, {
              status: 'completed',
              stripePaymentIntentId: session.payment_intent,
              'metadata.bookingCreationFailed': true,
              'metadata.bookingError': bookingError.message,
            });
            
            // Continue workflow - don't throw error
            booking = null;
          }

          // Get the automatically created invoice from the session
          let invoiceId = session.invoice;
          
          // Update invoice metadata with booking number if invoice exists and booking was created
          if (invoiceId && booking) {
            try {
              await stripe.invoices.update(invoiceId, {
                metadata: {
                  // Keep existing metadata and add booking number
                  ...session.invoice_creation?.invoice_data?.metadata,
                  bookingNumber: booking.bookingNumber,
                },
              });
              
              logger.info('Invoice updated with booking number:', {
                bookingId: booking._id,
                invoiceId: invoiceId,
                bookingNumber: booking.bookingNumber,
              });
            } catch (invoiceUpdateError) {
              logger.error('Failed to update invoice with booking number:', {
                error: invoiceUpdateError.message,
                invoiceId: invoiceId,
                bookingId: booking._id,
              });
              // Continue - don't let invoice update failure stop the workflow
            }
          }

          // Update payment record with booking reference and invoice ID
          if (booking) {
            try {
              await Payment.findByIdAndUpdate(payment._id, {
                status: 'completed',
                booking: booking._id,
                'metadata.bookingNumber': booking.bookingNumber,
                stripePaymentIntentId: session.payment_intent,
                stripeInvoiceId: invoiceId,
              });
            } catch (updateError) {
              logger.error('Payment update failed but continuing workflow:', {
                error: updateError.message,
                paymentId: payment._id,
              });
            }
          } else {
            // No booking created, just update payment status
            logger.info('Skipping invoice update - no booking was created');
          }

          // Create tax transaction if tax calculation exists
          if (session.metadata.taxCalculationId) {
            try {
              const taxTransaction = await stripe.tax.transactions.createFromCalculation({
                calculation: session.metadata.taxCalculationId,
                reference: session.payment_intent,
                expand: ['line_items'],
              });
              
              logger.info('Tax transaction created:', {
                transactionId: taxTransaction.id,
                calculationId: session.metadata.taxCalculationId,
                paymentIntent: session.payment_intent,
              });
            } catch (taxError) {
              logger.error('Tax transaction creation failed:', {
                error: taxError.message,
                calculationId: session.metadata.taxCalculationId,
                sessionId: session.id,
              });
            }
          }

          // Create calendar event (only if booking was created)
          if (booking) {
            try {
              await calendarService.createEvent(booking);
              logger.info('Calendar event created successfully:', {
                bookingId: booking._id,
              });
            } catch (calendarError) {
              logger.error('Calendar event creation failed but continuing workflow:', {
                error: calendarError.message,
                bookingId: booking._id,
              });
            }
          }

          // Send notifications (continue even if some fail)
          try {
            // Send invoice email with the automatically created invoice
            await emailService.sendInvoiceEmail(session.customer_details.email, session.payment_intent, session, booking, invoiceId);
            logger.info('Invoice email sent successfully:', {
              email: session.customer_details.email,
              invoiceId: invoiceId,
            });
          } catch (emailError) {
            logger.error('Invoice email failed but continuing workflow:', {
              error: emailError.message,
              email: session.customer_details.email,
            });
          }

          // SMS functionality removed
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

          // SMS functionality removed
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
