const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');
const moment = require('moment');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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

const sendEmail = async (to, subject, text, html, attachments = []) => {
  if (!transport) {
    logger.warn(`Email not sent to ${to} - SMTP not configured`);
    logger.debug('Would have sent:', { to, subject, text });
    return;
  }

  try {
    const msg = {
      from: config.email.from,
      to,
      subject,
      text,
      html,
      attachments,
    };
    await transport.sendMail(msg);
    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error; // Re-throw the error for handling by the caller
  }
};

/**
 * Send booking confirmation email
 * @param {string} to
 * @param {object} bookingData
 * @returns {Promise}
 */
const sendBookingConfirmationEmail = async (to, bookingData) => {
  console.log('to', to);
  console.log('bookingData', bookingData);

  try {
    logger.debug('Sending booking confirmation with data:', bookingData);

    if (!bookingData) throw new Error('Booking data is required');

    const getServiceName = (service) => {
      switch (service) {
        case 'from-airport':
          return 'Airport Pickup Service';
        case 'to-airport':
          return 'Airport Drop-off Service';
        case 'canyons':
          return 'Cottonwood Canyons Transfer';
        case 'hourly':
          return 'Hourly Service';
        case 'per-person':
          return 'Per Person Service';
        default:
          return 'Transportation Service';
      }
    };

    const pickupDate = moment(bookingData.pickup.date).format('MMMM Do YYYY');
    const pickupTime = moment(bookingData.pickup.time, 'HH:mm').format('h:mm A');

    const styles = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
        color: #333;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .main-content {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .header {
        background: #1a1a1a;
        color: white;
        padding: 30px;
        text-align: center;
      }
      .header img {
        height: 48px;
        margin-bottom: 15px;
      }
      .header h2 {
        margin: 0;
        color: white;
        font-size: 24px;
      }
      .header p {
        margin: 10px 0 0;
        color: rgba(255,255,255,0.8);
      }
      .booking-header {
        background: #f8f9fa;
        padding: 20px 30px;
        border-bottom: 1px solid #e1e1e1;
      }
      .booking-number {
        font-size: 20px;
        color: #1a1a1a;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .booking-number span {
        color: #666;
        font-size: 16px;
      }
      .content-section {
        padding: 30px;
      }
      .trip-header {
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 6px 6px 0 0;
        margin: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .trip-content {
        background: white;
        border: 1px solid #e1e1e1;
        border-top: none;
        border-radius: 0 0 6px 6px;
        padding: 20px;
        margin-bottom: 30px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
      }
      .trip-details .time {
        font-size: 24px;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 20px;
      }
      .address-section {
        margin-bottom: 20px;
      }
      .address-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
      }
      .address {
        color: #1a1a1a;
        font-weight: 500;
      }
      .passenger-info {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 6px;
      }
      .info-row {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #e1e1e1;
      }
      .info-row:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      .info-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
      }
      .info-value {
        color: #1a1a1a;
        font-weight: 500;
      }
      .trip-metadata {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e1e1e1;
      }
      .metadata-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .metadata-label {
        color: #666;
      }
      .metadata-value {
        color: #1a1a1a;
        font-weight: 500;
      }
      .airport-instructions {
        background: #f8f9fa;
        border: 1px solid #e1e1e1;
        border-radius: 6px;
        padding: 25px;
        margin-top: 30px;
      }
      .airport-instructions h4 {
        margin: 0 0 20px;
        color: #1a1a1a;
      }
      .step {
        margin-bottom: 20px;
        padding-left: 30px;
        position: relative;
      }
      .step:last-child {
        margin-bottom: 0;
      }
      .step:before {
        content: '';
        position: absolute;
        left: 0;
        top: 5px;
        width: 20px;
        height: 20px;
        background: #4CAF50;
        border-radius: 50%;
      }
      .step-title {
        font-weight: 600;
        margin-bottom: 5px;
        color: #1a1a1a;
      }
      .step p {
        margin: 0;
        color: #666;
      }
      .footer {
        text-align: center;
        padding: 30px;
        background: #f8f9fa;
        border-top: 1px solid #e1e1e1;
        color: #666;
      }
      @media (max-width: 768px) {
        .trip-content {
          grid-template-columns: 1fr;
        }
        .container {
          padding: 10px;
        }
        .content-section {
          padding: 20px;
        }
      }
    `;

    // Short plain text summary for the customer email
    const customerText = `Your booking (#${
      bookingData.bookingNumber || 'BK' + moment().format('YYYYMMDD')
    }) for ${getServiceName(bookingData.service)} on ${pickupDate} at ${pickupTime} has been confirmed. Pickup: ${
      bookingData.pickup.address
    }. Thank you!`;

    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${styles}</style>
      </head>
      <body>
        <div class="container">
          <div class="main-content">
            <div class="header">
              <img src="cid:companyLogo" alt="Elite Transportation">
              <h2>Your reservation is confirmed</h2>
            </div>
            <div class="booking-header">
              <h3 class="booking-number">
                Booking Confirmation ${bookingData.bookingNumber || 'BK' + moment().format('YYYYMMDD')} - ${getServiceName(
      bookingData.service
    )}
              </h3>
            </div>
            <div class="content-section">
              <h3 class="trip-header">
                Trip Information - ${pickupDate}
              </h3>
              <div class="trip-content">
                <div class="trip-details">
                  <div class="time">${pickupTime}</div>
                  <div class="address-section">
                    <div class="address-label">Pickup Location</div>
                    <div class="address">${bookingData.pickup.address}</div>
                  </div>
                  <div class="address-section">
                    <div class="address-label">Drop-off Location</div>
                    <div class="address">${bookingData.dropoff.address}</div>
                  </div>
                  <div class="trip-metadata">
                    <div class="metadata-row">
                      <span class="metadata-label">Distance - </span>
                      <span class="metadata-value">${bookingData.distance.miles} miles (${bookingData.distance.km} km)</span>
                    </div>
                    <div class="metadata-row">
                      <span class="metadata-label">Duration - </span>
                      <span class="metadata-value">${bookingData.duration}</span>
                    </div>
                    ${
                      bookingData.pickup.flightNumber
                        ? `
                      <div class="metadata-row">
                        <span class="metadata-label">Flight Number</span>
                        <span class="metadata-value">${bookingData.pickup.flightNumber}</span>
                      </div>
                    `
                        : ''
                    }
                  </div>
                </div>
                <div class="passenger-info">
                  <div class="info-row">
                    <div class="info-label">Passenger Name</div>
                    <div class="info-value">${bookingData.passengerDetails.firstName} ${
      bookingData.passengerDetails.lastName
    }</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${bookingData.passengerDetails.phone}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Email</div>
                    <div class="info-value">${to}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Passengers</div>
                    <div class="info-value">${bookingData.passengerDetails.passengers}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Luggage</div>
                    <div class="info-value">${bookingData.passengerDetails.luggage}</div>
                  </div>
                  ${
                    bookingData.passengerDetails.specialRequirements
                      ? `
                    <div class="info-row">
                      <div class="info-label">Special Requirements</div>
                      <div class="info-value">${bookingData.passengerDetails.specialRequirements}</div>
                    </div>
                  `
                      : ''
                  }
                </div>
              </div>
              <div class="airport-instructions">
                <h4>Welcome to Salt Lake City International Airport (SLC)!</h4>
                <div class="step">
                  <div class="step-title">Step 1: Deplane and Follow the Signs</div>
                  <p>Once you exit the plane, follow the signs for Arrivals and Baggage Claim. Look for overhead signage directing you to the baggage claim area.</p>
                </div>
                <div class="step">
                  <div class="step-title">Step 2: Proceed to Baggage Claim Area</div>
                  <p>Once you arrive at the baggage claim area, locate the carousel designated for your flight. Flight information will be displayed on monitors to help you find your assigned carousel. Wait for your bags to arrive. If your luggage does not appear after a reasonable amount of time, visit the baggage service desk for assistance.</p>
                </div>
                <div class="step">
                  <div class="step-title">Step 3: Exit the Baggage Claim Area</div>
                  <p>After collecting your luggage, exit the baggage claim area. Follow the "Ground Transportation" signs to reach the transportation options. The gate to exit on the ground transportation pick up area is located on the first floor.</p>
                </div>
                <div class="step">
                  <div class="step-title">Step 4: Ground Transportation Area</div>
                  <p>The Ground Transportation area is located just outside the terminal, on the first floor where you will find us. We will pick you up right outside the airport exit area (5A).</p>
                </div>
              </div>
            </div>
            <div class="footer">
              <strong>Need assistance?</strong><br>
              Call us anytime at (435) 901-9158<br><br>
              ELITE TRANSPORTATION<br>
              elitetransportationpc@gmail.com
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // const ownerHtml = `
    //   <!DOCTYPE html>
    //   <html>
    //   <head>
    //     <style>${styles}</style>
    //   </head>
    //   <body>
    //     <div class="container">
    //       <div class="main-content">
    //         <div class="header">
    //           <img src="cid:companyLogo" alt="Elite Transportation">
    //           <h2>New Booking Alert</h2>
    //         </div>
    //         <div class="booking-header">
    //           <h3 class="booking-number">
    //             Booking Confirmation ${bookingData.bookingNumber || 'BK' + moment().format('YYYYMMDD')} - ${getServiceName(
    //   bookingData.service
    // )}
    //           </h3>
    //         </div>
    //         <div class="content-section">
    //           <h3 class="trip-header">
    //             Trip Information - ${pickupDate}
    //           </h3>
    //           <div class="trip-content">
    //             <div class="trip-details">
    //               <div class="time">${pickupTime}</div>
    //               <div class="address-section">
    //                 <div class="address-label">Pickup Location</div>
    //                 <div class="address">${bookingData.pickup.address}</div>
    //               </div>
    //               <div class="address-section">
    //                 <div class="address-label">Drop-off Location</div>
    //                 <div class="address">${bookingData.dropoff.address}</div>
    //               </div>
    //               <div class="trip-metadata">
    //                 <div class="metadata-row">
    //                   <span class="metadata-label">Distance</span>
    //                   <span class="metadata-value">${bookingData.distance.miles} miles (${bookingData.distance.km} km)</span>
    //                 </div>
    //                 <div class="metadata-row">
    //                   <span class="metadata-label">Duration</span>
    //                   <span class="metadata-value">${bookingData.duration}</span>
    //                 </div>
    //                 ${
    //                   bookingData.pickup.flightNumber
    //                     ? `
    //                   <div class="metadata-row">
    //                     <span class="metadata-label">Flight Number</span>
    //                     <span class="metadata-value">${bookingData.pickup.flightNumber}</span>
    //                   </div>
    //                 `
    //                     : ''
    //                 }
    //               </div>
    //             </div>
    //             <div class="passenger-info">
    //               <div class="info-row">
    //                 <div class="info-label">Passenger Name</div>
    //                 <div class="info-value">${bookingData.passengerDetails.firstName} ${
    //   bookingData.passengerDetails.lastName
    // }</div>
    //               </div>
    //               <div class="info-row">
    //                 <div class="info-label">Phone</div>
    //                 <div class="info-value">${bookingData.passengerDetails.phone}</div>
    //               </div>
    //               <div class="info-row">
    //                 <div class="info-label">Email</div>
    //                 <div class="info-value">${to}</div>
    //               </div>
    //               <div class="info-row">
    //                 <div class="info-label">Passengers</div>
    //                 <div class="info-value">${bookingData.passengerDetails.passengers}</div>
    //               </div>
    //               <div class="info-row">
    //                 <div class="info-label">Luggage</div>
    //                 <div class="info-value">${bookingData.passengerDetails.luggage}</div>
    //               </div>
    //               ${
    //                 bookingData.passengerDetails.specialRequirements
    //                   ? `
    //                 <div class="info-row">
    //                   <div class="info-label">Special Requirements</div>
    //                   <div class="info-value">${bookingData.passengerDetails.specialRequirements}</div>
    //                 </div>
    //               `
    //                   : ''
    //               }
    //               <div class="info-row">
    //                 <div class="info-label">Billing Address</div>
    //                 <div class="info-value">
    //                   ${bookingData.billingDetails.address}<br>
    //                   ${bookingData.billingDetails.city}, ${bookingData.billingDetails.country}<br>
    //                   ${bookingData.billingDetails.zipCode}
    //                 </div>
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //         <div class="footer">
    //           <strong>ELITE TRANSPORTATION</strong><br>
    //           elitetransportationpc@gmail.com<br>
    //           (435) 901-9158
    //         </div>
    //       </div>
    //     </div>
    //   </body>
    //   </html>
    // `;

    const attachments = [
      {
        filename: 'logo.jpeg',
        path: path.join(__dirname, '../assets/logo.jpeg'),
        cid: 'companyLogo',
      },
    ];

    await sendEmail(
      to,
      `Booking Confirmation - #${bookingData.bookingNumber || 'BK' + moment().format('YYYYMMDD')}`,
      customerText,
      customerHtml,
      attachments
    );

    await sendEmail(
      'parkcityhostel@gmail.com',
      `Booking Confirmation - #${bookingData.bookingNumber || 'BK' + moment().format('YYYYMMDD')}`,
      customerText,
      customerHtml,
      attachments
    );

    await sendEmail(
      config.email.from,
      `New Booking Alert - #${bookingData.bookingNumber || 'BK' + moment().format('YYYYMMDD')}`,
      customerText,
      customerHtml,
      attachments
    );

    logger.info('Booking confirmation emails sent successfully:', {
      to,
      owner: config.email.from,
      bookingNumber: bookingData.bookingNumber,
    });
  } catch (error) {
    logger.error('Error sending booking confirmation emails:', {
      error: error.message,
      stack: error.stack,
      to,
      bookingNumber: bookingData?.bookingNumber,
    });
    throw error;
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

/**
 * Send invoice email to both customer and business owner
 * @param {string} to - Customer's email
 * @param {object} invoiceData
 * @param {object} session
 * @param {object} booking
 * @returns {Promise}
 */
const sendInvoiceEmail = async (to, invoiceData, session, booking) => {
  try {
    logger.debug('Attempting to send invoice emails with:', {
      to,
      bookingNumber: booking?.bookingNumber,
      sessionId: session?.id,
    });

    // Validate required booking data
    if (!booking) {
      throw new Error('Booking data is required');
    }

    if (!session) {
      throw new Error('Session data is required');
    }

    if (!booking.pickup?.address || !booking.dropoff?.address) {
      throw new Error('Missing required booking address information');
    }

    if (!booking.passengerDetails?.firstName || !booking.passengerDetails?.lastName) {
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
      },
    ];

    const templateData = {
      invoiceDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      invoiceNumber: booking.bookingNumber,
      supplier: {
        name: 'ELITE TRANSPORTATION',
        address: '4343 w Discovery Way',
        city: 'Park City, Utah',
        postCode: '84098',
        country: 'United States',
        email: config.email.from,
        phone: '+1 (435) 901-9158',
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
      totalAmount: amount,
    };

    // Add logo attachment
    const attachments = [
      {
        filename: 'logo.jpeg',
        path: path.join(__dirname, '../assets/logo.jpeg'),
        cid: 'companyLogo',
      },
    ];

    logger.debug('Generating HTML from template');
    const html = invoiceTemplate(templateData);

    if (!html) {
      throw new Error('Failed to generate invoice HTML');
    }

    logger.debug('Generated HTML length:', html?.length);

    // Create plain text version
    const text = `
      ELITE TRANSPORTATION Invoice #${booking.bookingNumber}

      Date: ${templateData.invoiceDate}
      From: ${booking.pickup.address}
      To: ${booking.dropoff.address}

      Service Details:
      - Transportation Service
      - From: ${booking.pickup.address}
      - To: ${booking.dropoff.address}
      
      Customer Details:
      - Name: ${booking.passengerDetails.firstName} ${booking.passengerDetails.lastName}
      - Phone: ${booking.passengerDetails.phone}

      Payment Details:
      Total Amount: $${amount.toFixed(2)}

      Thank you for choosing ELITE TRANSPORTATION!
    `;

    // Send invoice to customer
    const customerSubject = `ELITE TRANSPORTATION Invoice #${booking.bookingNumber}`;
    await sendEmail(to, customerSubject, text, html, attachments);

    logger.info('Invoice email sent to customer:', {
      to,
      bookingNumber: booking.bookingNumber,
      amount: amount,
    });

    // Send copy to business owner
    const ownerSubject = `Invoice Copy - Booking #${booking.bookingNumber}`;
    await sendEmail(config.email.from, ownerSubject, text, html, attachments);

    logger.info('Invoice copy sent to business owner:', {
      to: config.email.from,
      bookingNumber: booking.bookingNumber,
      amount: amount,
    });
  } catch (error) {
    logger.error('Error sending invoice email:', {
      error: error.message,
      stack: error.stack,
      to,
      bookingNumber: booking?.bookingNumber,
    });
    throw error;
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
