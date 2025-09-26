const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { bookingService } = require('../services');
const emailService = require('../services/email/emailService');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');
const logger = require('../config/logger');

/**
 * Create a new booking
 * @route POST /v1/bookings
 */
const createBooking = catchAsync(async (req, res) => {
  // Add user to booking if authenticated
  if (req.user) {
    req.body.user = req.user.id;
  }

  try {
    const booking = await bookingService.createBooking(req.body);

    // Send confirmation email
    const emailData = {
      bookingNumber: booking.bookingNumber,
      amount: booking.payment.amount,
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      distance: booking.distance,
      duration: booking.duration,
      service: booking.service,
      passengerDetails: {
        ...booking.passengerDetails,
        email: booking.email // Add email to passengerDetails for template compatibility
      },
      billingDetails: booking.billingDetails,
      payment: booking.payment,
      extras: booking.extras || [],
      affiliate: booking.affiliate,
    };

    await emailService.sendBookingConfirmationEmail(booking.email, emailData);

    res.status(httpStatus.CREATED).send(booking);
  } catch (error) {
    logger.error('Error in createBooking controller:', error);
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create booking');
    }
  }
});

/**
 * Get all bookings with pagination and filtering
 * @route GET /v1/bookings
 */
const getBookings = catchAsync(async (req, res) => {
  // Create filter object from query parameters
  const filter = { ...req.query };

  // Add user filter for non-admin users
  if (req.user && req.user.role !== 'admin') {
    filter.user = req.user.id;
  }

  // Extract pagination and sorting options
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Default sort by pickup date descending if not specified
  if (!options.sortBy) {
    options.sortBy = 'pickup.date:desc';
  }

  const result = await bookingService.queryBookings(filter, options);
  res.send(result);
});

/**
 * Get booking by ID
 * @route GET /v1/bookings/:bookingId
 */
const getBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  // Check if user has access to this booking
  if (req.user.role !== 'admin' && (!booking.user || booking.user.toString() !== req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  res.send(booking);
});

/**
 * Get booking by booking number
 * @route GET /v1/bookings/number/:bookingNumber
 */
const getBookingByNumber = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingByNumber(req.params.bookingNumber);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  res.send(booking);
});

/**
 * Update booking by ID
 * @route PATCH /v1/bookings/:bookingId
 */
const updateBooking = catchAsync(async (req, res) => {
  try {
    // Update the booking - email sending is handled in the service layer
    const booking = await bookingService.updateBookingById(req.params.bookingId, req.body);
    res.send(booking);
  } catch (error) {
    logger.error('Error in updateBooking controller:', error);
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update booking');
    }
  }
});

/**
 * Cancel booking by ID
 * @route POST /v1/bookings/:bookingId/cancel
 */
const cancelBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.cancelBookingById(req.params.bookingId);

  // Send cancellation email
  try {
    await emailService.sendBookingCancellationEmail(booking.email, booking.bookingNumber);
    logger.info(`Booking cancellation email sent to ${booking.email}`);
  } catch (error) {
    logger.error('Failed to send cancellation email:', error);
    // Continue with the response even if email fails
  }

  res.send(booking);
});

/**
 * Attach logged-in user to booking
 * @route POST /v1/bookings/attach/:bookingNumber
 */
const attachUserToBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.attachUserToBooking(req.params.bookingNumber, req.user.id);
  res.send(booking);
});

/**
 * Get bookings for logged-in user
 * @route GET /v1/bookings/user/bookings
 */
const getUserBookings = catchAsync(async (req, res) => {
  // Create a filter object from query params (excluding pagination)
  const filter = { ...req.query };
  delete filter.sortBy;
  delete filter.limit;
  delete filter.page;

  // Add user ID to filter
  filter.user = req.user.id;

  // Extract pagination options
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Default sort by pickup date descending if not specified
  if (!options.sortBy) {
    options.sortBy = 'pickup.date:desc';
  }

  const result = await bookingService.queryBookings(filter, options);
  res.send(result);
});

/**
 * Get booking statistics
 * @route GET /v1/bookings/stats
 */
const getBookingStats = catchAsync(async (req, res) => {
  // Extract date range from query parameters if provided
  const { startDate, endDate } = req.query;
  const stats = await bookingService.getBookingStats(startDate, endDate);
  res.send(stats);
});

/**
 * Send booking reminder email
 * @route POST /v1/bookings/:bookingId/send-reminder
 */
const sendReminderEmail = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  const bookingData = {
    bookingNumber: booking.bookingNumber,
    pickupDetails: {
      date: booking.pickup.date,
      time: booking.pickup.time,
      address: booking.pickup.address,
    },
    passengerDetails: booking.passengerDetails,
  };

  await emailService.sendBookingReminderEmail(booking.email, bookingData);
  res.status(httpStatus.OK).send({ message: 'Reminder email sent successfully' });
});

const resendBookingEmails = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  const customerEmail = booking.email || booking.passengerDetails?.email;
  logger.info('Resending booking confirmation emails for:', {
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    customerEmail: customerEmail
  });

  // Prepare email data
  const emailData = {
    bookingNumber: booking.bookingNumber,
    amount: booking.payment?.amount || booking.pricing?.totalPrice,
    pickup: booking.pickup,
    dropoff: booking.dropoff,
    distance: booking.distance,
    duration: booking.duration,
    service: booking.service,
    passengerDetails: {
      ...booking.passengerDetails,
      email: customerEmail // Add email to passengerDetails for template compatibility
    },
    billingDetails: booking.billingDetails,
    payment: booking.payment,
    pricing: booking.pricing,
    extras: booking.extras || [],
    affiliate: booking.affiliate,
    affiliateCode: booking.affiliateCode,
    returnDetails: booking.returnDetails,
    tripType: booking.tripType,
    isRoundTrip: booking.isRoundTrip
  };

  const results = {
    customer: { sent: false, error: null },
    admin: { sent: false, error: null },
    affiliate: { sent: false, error: null }
  };

  // Send email asynchronously (don't wait for completion)
  if (customerEmail) {
    // Send email in background - don't await
    emailService.sendBookingConfirmationEmail(customerEmail, emailData)
      .then(() => {
        logger.info('Customer confirmation email resent successfully');
      })
      .catch(error => {
        logger.error('Failed to resend customer email:', error);
      });
    
    results.customer.sent = true; // Optimistically mark as sent
  } else {
    results.customer.error = 'No customer email found';
  }

  // Return response immediately
  res.status(httpStatus.OK).json({
    message: 'Booking confirmation email resend initiated',
    bookingNumber: booking.bookingNumber,
    customerEmail: customerEmail,
    results: results
  });
});

const resendInvoiceEmail = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  const customerEmail = booking.email || booking.passengerDetails?.email;
  
  if (!customerEmail) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No customer email found for this booking');
  }

  if (!booking.payment?.stripeSessionId && !booking.payment?.stripePaymentIntentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Stripe payment information found for this booking');
  }

  logger.info('Resending invoice email for booking:', {
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    customerEmail: customerEmail,
    hasStripeSessionId: !!booking.payment?.stripeSessionId,
    hasStripePaymentIntentId: !!booking.payment?.stripePaymentIntentId,
    stripeSessionId: booking.payment?.stripeSessionId,
    stripePaymentIntentId: booking.payment?.stripePaymentIntentId,
    paymentMethod: booking.payment?.method,
    paymentStatus: booking.payment?.status
  });

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    let session = null;
    let invoiceId = null;
    
    // Try to get session if we have session ID
    if (booking.payment.stripeSessionId) {
      try {
        session = await stripe.checkout.sessions.retrieve(booking.payment.stripeSessionId, {
          expand: ['customer', 'payment_intent']
        });
        invoiceId = session.invoice;
      } catch (sessionError) {
        logger.warn('Could not retrieve Stripe session, continuing with payment intent only:', sessionError.message);
      }
    }
    
    // If no session or session retrieval failed, create minimal session-like object
    if (!session && booking.payment.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.payment.stripePaymentIntentId);
        session = {
          id: booking.payment.stripeSessionId || `session_${booking.payment.stripePaymentIntentId}`,
          payment_intent: paymentIntent,
          customer_details: {
            email: customerEmail,
            name: `${booking.passengerDetails.firstName} ${booking.passengerDetails.lastName}`
          },
          amount_total: booking.payment.amount * 100, // Convert to cents
          currency: booking.payment.currency || 'usd'
        };
      } catch (paymentIntentError) {
        logger.error('Could not retrieve payment intent:', paymentIntentError.message);
        logger.info('Creating fallback session object for booking without Stripe data');
        
        // Create minimal session for bookings that can't access Stripe (e.g., test bookings, manual bookings)
        session = {
          id: `fallback_${booking._id}`,
          payment_intent: {
            id: booking.payment.stripePaymentIntentId || `pi_fallback_${booking._id}`,
            status: 'succeeded',
            amount: booking.payment.amount * 100,
            currency: booking.payment.currency || 'usd'
          },
          customer_details: {
            email: customerEmail,
            name: `${booking.passengerDetails.firstName} ${booking.passengerDetails.lastName}`
          },
          amount_total: booking.payment.amount * 100,
          currency: booking.payment.currency || 'usd'
        };
      }
    }
    
    // Send invoice email asynchronously (don't wait for completion)
    emailService.sendInvoiceEmail(
      customerEmail, 
      booking.payment.stripePaymentIntentId, 
      session, 
      booking,
      invoiceId
    ).then(() => {
      logger.info('Invoice email resent successfully');
    }).catch(error => {
      logger.error('Failed to resend invoice email:', error);
    });
    
    // Return response immediately
    res.status(httpStatus.OK).json({
      message: 'Invoice email resend initiated',
      bookingNumber: booking.bookingNumber,
      customerEmail: customerEmail
    });
  } catch (error) {
    logger.error('Failed to resend invoice email:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to resend invoice: ${error.message}`);
  }
});

/**
 * View the email invoice template (same as sent via email)
 * @route GET /v1/bookings/:bookingId/email-invoice
 */
const viewEmailInvoice = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  const customerEmail = booking.email || booking.passengerDetails?.email;
  if (!customerEmail) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No customer email found for this booking');
  }

  if (!booking.payment?.stripePaymentIntentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No payment information found for this booking');
  }

  try {
    const invoiceTemplate = require('../services/email/templates/invoiceTemplate');
    const config = require('../config/config');

    // Create the same session-like object used in resendInvoiceEmail
    const session = {
      id: booking.payment.stripeSessionId || `session_${booking.payment.stripePaymentIntentId}`,
      amount_total: booking.payment.amount * 100, // Convert to cents
      currency: booking.payment.currency || 'usd'
    };

    const amount = session.amount_total / 100;
    
    // Build products array with base service (same logic as invoiceEmailService.js)
    const products = [];
    
    // Add base service with detailed description
    const basePrice = booking.pricing?.basePrice || amount;
    
    // For round trips, split the base price
    if (booking.isRoundTrip) {
      const singleTripPrice = basePrice / 2;
      
      // Outbound trip
      products.push({
        name: `Transportation ${booking.pickup.address.includes('Airport') ? 'from Airport to ' + booking.dropoff.address : 'to ' + booking.dropoff.address}`,
        description: `${booking.pickup.address} → ${booking.dropoff.address}`,
        price: singleTripPrice,
        quantity: 1,
      });
      
      // Return trip
      if (booking.returnDetails) {
        products.push({
          name: `Transportation ${booking.returnDetails.dropoffAddress.includes('Airport') ? 'to Airport' : 'from ' + booking.returnDetails.pickupAddress} (Return)`,
          description: `${booking.returnDetails.pickupAddress} → ${booking.returnDetails.dropoffAddress}`,
          price: singleTripPrice,
          quantity: 1,
        });
      }
    } else {
      // One-way trip
      products.push({
        name: `Transportation ${booking.service === 'from-airport' ? 'from Airport' : booking.service === 'to-airport' ? 'to Airport' : ''}`,
        description: `${booking.pickup.address} → ${booking.dropoff.address}`,
        price: basePrice,
        quantity: 1,
      });
    }
    
    // Add extras with their actual names
    if (booking.extras && booking.extras.length > 0) {
      // Populate extras if needed
      const populatedExtras = booking.extras.map(extra => {
        if (extra.item && extra.item.name) {
          return { ...extra, name: extra.item.name };
        }
        return extra;
      });
      
      populatedExtras.forEach(extra => {
        if (extra.price > 0) {
          products.push({
            name: extra.name || 'Extra Service',
            price: extra.price,
            quantity: extra.quantity || 1,
          });
        }
      });
    }
    
    // Add night fee if applicable
    if (booking.pricing?.nightFee > 0) {
      const nightFeePerTrip = 20; // Night fee is $20 per trip
      const nightFeeCount = booking.pricing.nightFee / nightFeePerTrip;
      
      if (nightFeeCount === 1) {
        products.push({
          name: 'Night Service Fee',
          price: nightFeePerTrip,
          quantity: 1,
        });
      } else {
        products.push({
          name: 'Night Service Fee',
          description: `${nightFeeCount} trips @ $${nightFeePerTrip.toFixed(2)} each`,
          price: nightFeePerTrip,
          quantity: nightFeeCount,
        });
      }
    }
    
    // Add gratuity
    if (booking.pricing?.gratuity > 0) {
      products.push({
        name: `Gratuity (${booking.pricing.selectedTipPercentage || 15}%)`,
        price: booking.pricing.gratuity,
        quantity: 1,
      });
    }

    const templateData = {
      invoiceDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      invoiceNumber: booking.bookingNumber,
      supplier: {
        name: 'ELITE TRANSPORTATION',
        address: '4343 W Discovery Way',
        city: 'Park City, Utah',
        postCode: '84098',
        country: 'United States',
        email: config.email.from,
        phone: '+1 (435) 901-9158',
      },
      customer: {
        name: `${booking.passengerDetails.firstName} ${booking.passengerDetails.lastName}`,
        company: booking.billingDetails?.company || booking.passengerDetails?.company || '',
        address: booking.billingDetails?.address || '',
        city: booking.billingDetails?.city || '',
        postCode: booking.billingDetails?.zipCode || '',
        country: booking.billingDetails?.country || '',
      },
      products,
      currencySymbol: '$',
      totalAmount: amount,
    };

    const html = invoiceTemplate(templateData);

    if (!html) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate invoice HTML');
    }

    // Return the HTML directly so browser displays it
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Failed to generate email invoice view:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to generate invoice: ${error.message}`);
  }
});

/**
 * Get invoice by booking number (public route)
 * @route GET /v1/bookings/invoice/:bookingNumber
 */
const getInvoiceByBookingNumber = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingByNumber(req.params.bookingNumber);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  const customerEmail = booking.email || booking.passengerDetails?.email;
  if (!booking.payment?.stripePaymentIntentId) {
    // Return basic invoice data even without payment
    return res.json({
      booking: {
        bookingNumber: booking.bookingNumber,
        passengerDetails: booking.passengerDetails,
        pickup: booking.pickup,
        dropoff: booking.dropoff,
        service: booking.service,
        pricing: booking.pricing,
        payment: booking.payment,
        status: booking.status,
        isRoundTrip: booking.isRoundTrip,
        returnDetails: booking.returnDetails,
        extras: booking.extras
      },
      invoiceHtml: null,
      hasPayment: false
    });
  }

  try {
    const invoiceTemplate = require('../services/email/templates/invoiceTemplate');
    const config = require('../config/config');

    // Create the same session-like object used in resendInvoiceEmail
    const session = {
      id: booking.payment.stripeSessionId || `session_${booking.payment.stripePaymentIntentId}`,
      amount_total: booking.payment.amount * 100, // Convert to cents
      currency: booking.payment.currency || 'usd'
    };

    const amount = session.amount_total / 100;
    
    // Build products array with base service (same logic as invoiceEmailService.js)
    const products = [];
    
    // Add base service with detailed description
    const basePrice = booking.pricing?.basePrice || amount;
    
    // For round trips, split the base price
    if (booking.isRoundTrip) {
      const singleTripPrice = basePrice / 2;
      
      // Outbound trip
      products.push({
        name: `Transportation ${booking.pickup.address.includes('Airport') ? 'from Airport to ' + booking.dropoff.address : 'to ' + booking.dropoff.address}`,
        description: `${booking.pickup.address} → ${booking.dropoff.address}`,
        price: singleTripPrice,
        quantity: 1,
      });
      
      // Return trip
      if (booking.returnDetails) {
        products.push({
          name: `Transportation ${booking.returnDetails.dropoffAddress.includes('Airport') ? 'to Airport' : 'from ' + booking.returnDetails.pickupAddress} (Return)`,
          description: `${booking.returnDetails.pickupAddress} → ${booking.returnDetails.dropoffAddress}`,
          price: singleTripPrice,
          quantity: 1,
        });
      }
    } else {
      // One-way trip
      products.push({
        name: `Transportation ${booking.service === 'from-airport' ? 'from Airport' : booking.service === 'to-airport' ? 'to Airport' : ''}`,
        description: `${booking.pickup.address} → ${booking.dropoff.address}`,
        price: basePrice,
        quantity: 1,
      });
    }
    
    // Add extras with their actual names
    if (booking.extras && booking.extras.length > 0) {
      const populatedExtras = booking.extras.map(extra => {
        if (extra.item && extra.item.name) {
          return { ...extra, name: extra.item.name };
        }
        return extra;
      });
      
      populatedExtras.forEach(extra => {
        if (extra.price > 0) {
          products.push({
            name: extra.name || 'Extra Service',
            price: extra.price,
            quantity: extra.quantity || 1,
          });
        }
      });
    }
    
    // Add night fee if applicable
    if (booking.pricing?.nightFee > 0) {
      const nightFeePerTrip = 20;
      const nightFeeCount = booking.pricing.nightFee / nightFeePerTrip;
      
      if (nightFeeCount === 1) {
        products.push({
          name: 'Night Service Fee',
          price: nightFeePerTrip,
          quantity: 1,
        });
      } else {
        products.push({
          name: 'Night Service Fee',
          description: `${nightFeeCount} trips @ $${nightFeePerTrip.toFixed(2)} each`,
          price: nightFeePerTrip,
          quantity: nightFeeCount,
        });
      }
    }
    
    // Add gratuity
    if (booking.pricing?.gratuity > 0) {
      products.push({
        name: `Gratuity (${booking.pricing.selectedTipPercentage || 15}%)`,
        price: booking.pricing.gratuity,
        quantity: 1,
      });
    }

    const templateData = {
      invoiceDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      invoiceNumber: booking.bookingNumber,
      supplier: {
        name: 'ELITE TRANSPORTATION',
        address: '4343 W Discovery Way',
        city: 'Park City, Utah',
        postCode: '84098',
        country: 'United States',
        email: config.email.from,
        phone: '+1 (435) 901-9158',
      },
      customer: {
        name: `${booking.passengerDetails.firstName} ${booking.passengerDetails.lastName}`,
        company: booking.billingDetails?.company || booking.passengerDetails?.company || '',
        address: booking.billingDetails?.address || '',
        city: booking.billingDetails?.city || '',
        postCode: booking.billingDetails?.zipCode || '',
        country: booking.billingDetails?.country || '',
      },
      products,
      currencySymbol: '$',
      totalAmount: amount,
    };

    const html = invoiceTemplate(templateData);

    if (!html) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate invoice HTML');
    }

    // Return both booking data and invoice HTML
    res.json({
      booking: {
        bookingNumber: booking.bookingNumber,
        passengerDetails: booking.passengerDetails,
        pickup: booking.pickup,
        dropoff: booking.dropoff,
        service: booking.service,
        pricing: booking.pricing,
        payment: booking.payment,
        status: booking.status,
        isRoundTrip: booking.isRoundTrip,
        returnDetails: booking.returnDetails,
        extras: booking.extras,
        id: booking._id
      },
      invoiceHtml: html,
      hasPayment: true,
      customerEmail
    });
  } catch (error) {
    logger.error('Failed to generate invoice:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to generate invoice: ${error.message}`);
  }
});

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  getBookingByNumber,
  updateBooking,
  cancelBooking,
  attachUserToBooking,
  getUserBookings,
  getBookingStats,
  sendReminderEmail,
  resendBookingEmails,
  resendInvoiceEmail,
  viewEmailInvoice,
  getInvoiceByBookingNumber,
};
