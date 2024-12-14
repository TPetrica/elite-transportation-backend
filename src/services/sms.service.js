const twilio = require('twilio');
const logger = require('../config/logger');
const config = require('../config/config');

class SmsService {
  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    this.twilioPhoneNumber = config.twilio.phoneNumber;
  }

  async sendMessage(to, message) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: to,
      });

      logger.info('SMS sent successfully:', {
        messageId: result.sid,
        to: to,
        status: result.status,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      logger.error('Failed to send SMS:', {
        error: error.message,
        to: to,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendBookingConfirmation(booking, payment) {
    const message = `
Thank you for booking with LUXRIDE!

Booking Details:
Reference: ${booking.bookingNumber}
Date: ${new Date(booking.pickup.date).toLocaleDateString()}
Time: ${booking.pickup.time}
From: ${booking.pickup.address}
To: ${booking.dropoff.address}
Amount: $${payment.amount}

Your driver will contact you before pickup.
Questions? Call us at ${config.supportPhone}

Safe travels!
    `.trim();

    return this.sendMessage(booking.passengerDetails.phone, message);
  }

  async sendPaymentFailedNotification(booking, error) {
    const message = `
Elite Transportation Payment Failed

We were unable to process your payment for booking ${booking.bookingNumber}.
Please contact our support team at ${config.supportPhone} for assistance.
    `.trim();

    return this.sendMessage(booking.passengerDetails.phone, message);
  }
}

module.exports = new SmsService();
