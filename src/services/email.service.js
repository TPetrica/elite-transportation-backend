const nodemailer = require('nodemailer');
const moment = require('moment');
const config = require('../config/config');
const logger = require('../config/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Handlebars = require('handlebars');
const invoiceTemplate = require('./email/templates/invoiceTemplate');

let transport;

if (
  config.email?.smtp?.host &&
  config.email?.smtp?.port &&
  config.email?.smtp?.auth?.user &&
  config.email?.smtp?.auth?.pass
) {
  transport = nodemailer.createTransport(config.email.smtp);

  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch((err) => {
      logger.warn('Unable to connect to email server:', err.message);
      logger.warn('Please configure SMTP settings in .env:');
      logger.warn('SMTP_HOST=your-smtp-host');
      logger.warn('SMTP_PORT=587');
      logger.warn('SMTP_USERNAME=your-smtp-username');
      logger.warn('SMTP_PASSWORD=your-smtp-password');
      logger.warn('EMAIL_FROM=your-email@domain.com');
    });
} else {
  logger.warn('Email service not configured. Set the following in .env:');
  logger.warn('SMTP_HOST=your-smtp-host');
  logger.warn('SMTP_PORT=587');
  logger.warn('SMTP_USERNAME=your-smtp-username');
  logger.warn('SMTP_PASSWORD=your-smtp-password');
  logger.warn('EMAIL_FROM=your-email@domain.com');
}

const sendEmail = async (to, subject, text, html) => {
  if (!transport) {
    logger.warn(`Email not sent to ${to} - SMTP not configured`);
    logger.debug('Would have sent:', { to, subject, text });
    return; // Silent fail
  }

  try {
    const msg = {
      from: config.email.from,
      to,
      subject,
      text,
      html,
    };
    await transport.sendMail(msg);
    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    // Don't throw error, just log it
  }
};

/**
 * Send booking confirmation email
 * @param {string} to
 * @param {object} bookingData
 * @returns {Promise}
 */
const sendBookingConfirmationEmail = async (to, bookingData) => {
  try {
    logger.debug('Sending booking confirmation with data:', bookingData);

    if (!transport) {
      logger.warn(`Booking confirmation email not sent to ${to} - SMTP not configured`);
      return; // Silent fail
    }

    const pickupDate = moment(bookingData.pickupDetails.date).format('MMMM Do YYYY');
    const subject = `Booking Confirmation - #${bookingData.bookingNumber}`;

    const extras =
      bookingData.extras?.map((extra) => `${extra.item.name} x${extra.quantity} - $${extra.price.toFixed(2)}`).join('\n') ||
      'No extras added';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking Confirmation</h2>
        <p>Thank you for your booking!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #28a745;">Booking Details</h3>
          <p><strong>Booking Number:</strong> ${bookingData.bookingNumber}</p>
          <p><strong>Date:</strong> ${pickupDate}</p>
          <p><strong>Time:</strong> ${bookingData.pickupDetails.time}</p>
          <p><strong>Pickup:</strong> ${bookingData.pickupDetails.address}</p>
          <p><strong>Drop-off:</strong> ${bookingData.dropoffDetails.address}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #28a745;">Service Details</h3>
          <p><strong>Vehicle:</strong> ${bookingData.vehicle.name}</p>
          <p><strong>Extras:</strong></p>
          <pre style="margin: 10px 0;">${extras}</pre>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #28a745;">Payment Details</h3>
          <p><strong>Total Amount:</strong> $${bookingData.amount.toFixed(2)}</p>
        </div>

        <p style="color: #666; font-size: 14px;">
          You will receive a payment confirmation and invoice once the payment is processed.
        </p>
      </div>
    `;

    const text = `
      Booking Confirmation - #${bookingData.bookingNumber}

      Thank you for your booking!

      Booking Details:
      - Booking Number: ${bookingData.bookingNumber}
      - Date: ${pickupDate}
      - Time: ${bookingData.pickupDetails.time}
      - Pickup: ${bookingData.pickupDetails.address}
      - Drop-off: ${bookingData.dropoffDetails.address}

      Service Details:
      - Vehicle: ${bookingData.vehicle.name}
      
      Extras:
      ${extras}

      Payment Details:
      - Total Amount: $${bookingData.amount.toFixed(2)}

      You will receive a payment confirmation and invoice once the payment is processed.
    `;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    logger.error('Error sending booking confirmation email:', error);
    // Don't throw error, just log it
  }
};

/**
 * Send booking cancellation email
 * @param {string} to
 * @param {string} bookingNumber
 * @returns {Promise}
 */
const sendBookingCancellationEmail = async (to, bookingNumber) => {
  try {
    const subject = `Booking Cancellation - #${bookingNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Booking Cancellation</h2>
        <p>Dear Customer,</p>
        
        <p>Your booking #${bookingNumber} has been cancelled.</p>
        
        <p>If you did not request this cancellation or have any questions, please contact our support team immediately.</p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          Thank you for considering our service.
        </p>
      </div>
    `;

    const text = `
      Booking Cancellation - #${bookingNumber}

      Dear Customer,

      Your booking #${bookingNumber} has been cancelled.

      If you did not request this cancellation or have any questions, please contact our support team immediately.

      Thank you for considering our service.
    `;

    await sendEmail(to, subject, text, html);
    logger.info(`Booking cancellation email sent to ${to}`);
  } catch (error) {
    logger.error('Error sending booking cancellation email:', error);
    throw error;
  }
};

/**
 * Send payment success email
 * @param {string} to
 * @param {object} paymentData
 * @returns {Promise}
 */
const sendPaymentSuccessEmail = async (to, paymentData) => {
  try {
    const subject = `Payment Confirmation - #${paymentData.bookingNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Payment Successful</h2>
        <p>Dear ${paymentData.customerName},</p>
        
        <p>Your payment for booking #${paymentData.bookingNumber} has been successfully processed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #28a745;">Payment Details</h3>
          <p><strong>Amount Paid:</strong> $${paymentData.amount.toFixed(2)}</p>
          <p><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>
        </div>

        <p>A detailed invoice will be sent to you shortly.</p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          Thank you for your business.
        </p>
      </div>
    `;

    const text = `
      Payment Confirmation - #${paymentData.bookingNumber}

      Dear ${paymentData.customerName},

      Your payment for booking #${paymentData.bookingNumber} has been successfully processed.

      Payment Details:
      - Amount Paid: $${paymentData.amount.toFixed(2)}
      - Transaction ID: ${paymentData.transactionId}

      A detailed invoice will be sent to you shortly.

      Thank you for your business.
    `;

    await sendEmail(to, subject, text, html);
    logger.info(`Payment success email sent to ${to}`);
  } catch (error) {
    logger.error('Error sending payment success email:', error);
    throw error;
  }
};

const sendInvoiceEmail = async (to, invoiceData, session, booking) => {
  logger.debug('Attempting to send invoice email with:', {
    to,
    bookingNumber: booking?.bookingNumber,
    sessionId: session?.id,
  });

  try {
    // Validate required booking data
    if (!booking?.pickup?.address || !booking?.dropoff?.address) {
      throw new Error('Missing required booking address information');
    }

    if (!booking?.passengerDetails?.firstName || !booking?.passengerDetails?.lastName) {
      throw new Error('Missing required passenger details');
    }

    const amount = session.amount_total / 100;

    logger.debug('Preparing template data with:', {
      amount,
      bookingNumber: booking.bookingNumber,
      pickup: booking.pickup.address,
      dropoff: booking.dropoff.address,
    });

    const products = [
      {
        name: `Transportation Service (${booking.pickup.address} to ${booking.dropoff.address})`,
        price: amount,
        quantity: 1,
        vat: 0,
      },
    ];

    const totalNetAmount = amount;
    const totalVatAmount = 0;
    const totalAmount = totalNetAmount + totalVatAmount;

    const templateData = {
      invoiceDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      invoiceNumber: booking.bookingNumber,
      supplier: {
        name: 'LUXRIDE',
        number: '23456789',
        vat: '23456789',
        address: '6622 Abshire Mills',
        city: 'Port Orlofurt',
        postCode: '05820',
        country: 'United States',
        email: config.email.from,
        phone: '+1-202-555-0106',
      },
      customer: {
        name: `${booking.passengerDetails.firstName} ${booking.passengerDetails.lastName}`,
        address: booking.billingDetails?.address || '',
        city: booking.billingDetails?.city || '',
        postCode: booking.billingDetails?.zipCode || '',
        country: booking.billingDetails?.country || '',
      },
      products,
      currencySymbol: '$',
      totalNetAmount,
      totalVatAmount,
      totalAmount,
    };

    logger.debug('Generating HTML from template');
    const html = invoiceTemplate(templateData);

    if (!html) {
      throw new Error('Failed to generate invoice HTML');
    }

    logger.debug('Generated HTML length:', html?.length);

    // Create plain text version
    const text = `
      LUXRIDE Invoice #${booking.bookingNumber}

      Date: ${templateData.invoiceDate}
      From: ${booking.pickup.address}
      To: ${booking.dropoff.address}

      Amount: $${amount.toFixed(2)}
      VAT (0%): $${totalVatAmount.toFixed(2)}
      Total: $${totalAmount.toFixed(2)}

      Thank you for choosing LUXRIDE!
    `;

    const subject = `LUXRIDE Invoice #${booking.bookingNumber}`;

    // Use the existing sendEmail function
    await sendEmail(to, subject, text, html);

    logger.info('Invoice email sent successfully:', {
      to,
      bookingNumber: booking.bookingNumber,
      amount: totalAmount,
    });
  } catch (error) {
    logger.error('Error sending invoice email:', {
      error: error.message,
      stack: error.stack,
      to,
      bookingNumber: booking?.bookingNumber,
    });
    throw error; // Re-throw for webhook handler
  }
};

/**
 * Send booking reminder email
 * @param {string} to
 * @param {object} bookingData
 * @returns {Promise}
 */
const sendBookingReminderEmail = async (to, bookingData) => {
  try {
    const pickupDate = moment(bookingData.pickupDetails.date).format('MMMM Do YYYY');
    const subject = `Reminder: Upcoming Trip - #${bookingData.bookingNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Upcoming Trip Reminder</h2>
        <p>Dear ${bookingData.passengerDetails.firstName} ${bookingData.passengerDetails.lastName},</p>
        
        <p>This is a reminder about your upcoming trip.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #28a745;">Trip Details</h3>
          <p><strong>Date:</strong> ${pickupDate}</p>
          <p><strong>Time:</strong> ${bookingData.pickupDetails.time}</p>
          <p><strong>Pickup Location:</strong> ${bookingData.pickupDetails.address}</p>
        </div>

        <p style="color: #666; font-size: 14px;">
          Your driver will arrive at the specified time. Please be ready 5 minutes before the scheduled pickup time.
        </p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          If you need to make any changes, please contact our support team as soon as possible.
        </p>
      </div>
    `;

    const text = `
      Upcoming Trip Reminder - #${bookingData.bookingNumber}

      Dear ${bookingData.passengerDetails.firstName} ${bookingData.passengerDetails.lastName},

      This is a reminder about your upcoming trip.

      Trip Details:
      - Date: ${pickupDate}
      - Time: ${bookingData.pickupDetails.time}
      - Pickup Location: ${bookingData.pickupDetails.address}

      Your driver will arrive at the specified time. Please be ready 5 minutes before the scheduled pickup time.

      If you need to make any changes, please contact our support team as soon as possible.
    `;

    await sendEmail(to, subject, text, html);
    logger.info(`Booking reminder email sent to ${to}`);
  } catch (error) {
    logger.error('Error sending booking reminder email:', error);
    throw error;
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset Password';
  const resetPasswordUrl = `${config.clientUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Reset Password</h2>
      <p>Dear user,</p>
      
      <p>You have requested to reset your password.</p>
      
      <div style="margin: 30px 0;">
        <a href="${resetPasswordUrl}" 
           style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </div>

      <p>If you did not request this password reset, please ignore this email.</p>
      
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px;">
        This link will expire in 1 hour.
      </p>
    </div>
  `;

  const text = `
    Reset Password

    Dear user,

    You have requested to reset your password.

    Please click on this link to reset your password: ${resetPasswordUrl}

    If you did not request this password reset, please ignore this email.

    This link will expire in 1 hour.
  `;

  await sendEmail(to, subject, text, html);
  logger.info(`Reset password email sent to ${to}`);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `${config.clientUrl}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Verify Your Email</h2>
      <p>Dear user,</p>
      
      <p>Thank you for registering. Please verify your email to complete your registration.</p>
      
      <div style="margin: 30px 0;">
        <a href="${verificationEmailUrl}" 
           style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
      </div>

      <p>If you did not create an account, please ignore this email.</p>
      
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px;">
        This link will expire in 24 hours.
      </p>
    </div>
  `;

  const text = `
    Email Verification

    Dear user,

    Thank you for registering. Please verify your email to complete your registration.

    Please click on this link to verify your email: ${verificationEmailUrl}

    If you did not create an account, please ignore this email.

    This link will expire in 24 hours.
  `;

  await sendEmail(to, subject, text, html);
  logger.info(`Verification email sent to ${to}`);
};

/**
 * Send payment invoice (using Stripe)
 * @param {string} to
 * @param {object} session
 * @param {object} bookingData
 * @returns {Promise}
 */
const sendPaymentInvoice = async (to, session, bookingData) => {
  try {
    // Create invoice in Stripe
    const invoice = await stripe.invoices.create({
      customer: session.customer,
      auto_advance: true,
      collection_method: 'send_invoice',
      metadata: {
        bookingNumber: bookingData.bookingNumber,
      },
    });

    // Add line items to the invoice
    await stripe.invoiceItems.create({
      customer: session.customer,
      invoice: invoice.id,
      amount: session.amount_total,
      currency: session.currency,
      description: `Transportation Service - Booking #${bookingData.bookingNumber}`,
    });

    if (bookingData.extras?.length) {
      for (const extra of bookingData.extras) {
        await stripe.invoiceItems.create({
          customer: session.customer,
          invoice: invoice.id,
          amount: extra.price * 100, // Convert to cents
          currency: session.currency,
          description: `Extra Service - ${extra.item.name} x${extra.quantity}`,
        });
      }
    }

    // Finalize and send the invoice
    await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(invoice.id);

    logger.info(`Payment invoice sent to ${to} for booking ${bookingData.bookingNumber}`);
  } catch (error) {
    logger.error('Error sending payment invoice:', error);
    // Don't throw the error as this is a non-critical operation
  }
};

/**
 * Send driver assignment notification
 * @param {string} to
 * @param {object} bookingData
 * @param {object} driverData
 * @returns {Promise}
 */
const sendDriverAssignmentEmail = async (to, bookingData, driverData) => {
  try {
    const subject = `Driver Assigned - Booking #${bookingData.bookingNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Driver Assignment Notification</h2>
        <p>Dear ${bookingData.passengerDetails.firstName} ${bookingData.passengerDetails.lastName},</p>
        
        <p>A driver has been assigned to your booking.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #28a745;">Driver Details</h3>
          <p><strong>Name:</strong> ${driverData.name}</p>
          <p><strong>Phone:</strong> ${driverData.phone}</p>
          <p><strong>Vehicle:</strong> ${driverData.vehicleInfo}</p>
        </div>

        <p style="color: #666; font-size: 14px;">
          Your driver will contact you shortly before pickup.
        </p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          For any immediate concerns, please contact our support team.
        </p>
      </div>
    `;

    const text = `
      Driver Assignment Notification - Booking #${bookingData.bookingNumber}

      Dear ${bookingData.passengerDetails.firstName} ${bookingData.passengerDetails.lastName},

      A driver has been assigned to your booking.

      Driver Details:
      - Name: ${driverData.name}
      - Phone: ${driverData.phone}
      - Vehicle: ${driverData.vehicleInfo}

      Your driver will contact you shortly before pickup.

      For any immediate concerns, please contact our support team.
    `;

    await sendEmail(to, subject, text, html);
    logger.info(`Driver assignment email sent to ${to}`);
  } catch (error) {
    logger.error('Error sending driver assignment email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendPaymentSuccessEmail,
  sendInvoiceEmail,
  sendBookingReminderEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendPaymentInvoice,
  sendDriverAssignmentEmail,
  // Export transport for testing purposes
  transport,
};
