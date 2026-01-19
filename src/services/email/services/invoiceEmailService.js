const BaseEmailService = require('./baseEmailService');
const invoiceTemplate = require('../templates/invoiceTemplate');
const logger = require('../../../config/logger');
const config = require('../../../config/config');

class InvoiceEmailService extends BaseEmailService {
  /**
   * Send invoice email
   * @param {string} to - Customer email
   * @param {object} invoiceData - Invoice data
   * @param {object} session - Stripe session
   * @param {object} booking - Booking data
   * @returns {Promise}
   */
  async sendInvoice(to, invoiceData, session, booking) {
    try {
      logger.debug('Sending invoice email:', {
        to,
        bookingNumber: booking?.bookingNumber,
        sessionId: session?.id,
      });

      if (!booking || !session) {
        throw new Error('Booking and session data are required');
      }

      if (!booking.pickup?.address || !booking.dropoff?.address) {
        throw new Error('Missing required booking address information');
      }

      if (!booking.passengerDetails?.firstName || !booking.passengerDetails?.lastName) {
        throw new Error('Missing required passenger details');
      }

      const amount = session.amount_total / 100;
      
      // Build products array with base service
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
        // Calculate number of night fees based on the total night fee amount
        const nightFeePerTrip = 30; // Night fee is $30 per trip
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
      
      // Add return trip info if applicable
      const returnInfo = booking.isRoundTrip && booking.returnDetails ? 
        `\n\nReturn Trip: ${new Date(booking.returnDetails.date).toLocaleDateString('en-US')} at ${booking.returnDetails.time}` : 
        '';

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
        throw new Error('Failed to generate invoice HTML');
      }

      const text = `
ELITE TRANSPORTATION Invoice #${booking.bookingNumber}

Date: ${templateData.invoiceDate}
From: ${booking.pickup.address}
To: ${booking.dropoff.address}${returnInfo}

Service Details:
${products.map(p => `- ${p.name}: $${(p.price * (p.quantity || 1)).toFixed(2)}`).join('\n')}

Subtotal: $${(amount - (booking.pricing?.gratuity || 0)).toFixed(2)}
Gratuity: $${(booking.pricing?.gratuity || 0).toFixed(2)}
Total Amount: $${amount.toFixed(2)}

Customer Details:
- Name: ${booking.passengerDetails.firstName} ${booking.passengerDetails.lastName}
- Phone: ${booking.passengerDetails.phone}

${booking.passengerDetails.notes ? `Special Instructions: ${booking.passengerDetails.notes}\n` : ''}

Thank you for choosing ELITE TRANSPORTATION!
      `;

      const customerSubject = `ELITE TRANSPORTATION Invoice #${booking.bookingNumber}`;
      const ownerSubject = `Invoice Copy - Booking #${booking.bookingNumber}`;

      // Send to customer
      await this.sendEmail(to, customerSubject, text, html);

      // Send copy to business owner
      await this.sendEmail(config.email.from, ownerSubject, text, html);

      logger.info('Invoice emails sent successfully:', {
        to,
        owner: config.email.from,
        bookingNumber: booking.bookingNumber,
        amount,
      });
    } catch (error) {
      logger.error('Error sending invoice email:', {
        error: error.message,
        to,
        bookingNumber: booking?.bookingNumber,
      });
      throw error;
    }
  }

  /**
   * Send payment success email
   * @param {string} to - Customer email
   * @param {object} paymentData - Payment data
   * @returns {Promise}
   */
  async sendPaymentSuccess(to, paymentData) {
    try {
      const subject = `Payment Confirmation - #${paymentData.bookingNumber}`;

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

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Payment Successful</h2>
          <p>Dear ${paymentData.customerName},</p>
          <p>Your payment for booking #${paymentData.bookingNumber} has been successfully processed.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Payment Details</h3>
            <p><strong>Amount Paid:</strong> $${paymentData.amount.toFixed(2)}</p>
            <p><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>
          </div>
          <p>A detailed invoice will be sent to you shortly.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666;">Thank you for your business.</p>
        </div>
      `;

      await this.sendEmail(to, subject, text, html);
      logger.info(`Payment success email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending payment success email:', error);
      throw error;
    }
  }
}

module.exports = InvoiceEmailService;
