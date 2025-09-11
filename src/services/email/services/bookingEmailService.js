const BaseEmailService = require('./baseEmailService');
const { getBookingConfirmationTemplate, getServiceName } = require('../templates/booking');
const moment = require('moment');
const logger = require('../../../config/logger');
const config = require('../../../config/config');

class BookingEmailService extends BaseEmailService {
  /**
   * Send booking confirmation email
   * @param {string} to - Recipient email
   * @param {object} bookingData - Booking data
   * @param {string} subjectPrefix - Optional subject prefix (e.g., 'Return Trip Reminder - ')
   * @returns {Promise}
   */
  async sendBookingConfirmation(to, bookingData, subjectPrefix = '') {
    try {
      logger.debug('Sending booking confirmation with data:', {
        service: bookingData.service,
        bookingNumber: bookingData.bookingNumber,
      });

      if (!bookingData) throw new Error('Booking data is required');

      // Handle both string and Date object formats
      let dateObj;
      const dateInput = bookingData.pickup.date;
      
      if (dateInput instanceof Date) {
        // Already a Date object, use it directly
        dateObj = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
      } else if (typeof dateInput === 'string') {
        // String format like '2025-09-25'
        const [year, month, day] = dateInput.split('-');
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        throw new Error(`Invalid date format: ${dateInput} (type: ${typeof dateInput})`);
      }
      
      // Helper function for ordinal suffix
      const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
        }
      };
      
      const pickupDate = dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).replace(/(\d+)/, '$1' + getOrdinalSuffix(dateObj.getDate()));

      // Convert time from 24-hour to 12-hour format if needed
      const timeInput = bookingData.pickup.time;
      let pickupTime;
      
      if (timeInput.includes('AM') || timeInput.includes('PM')) {
        // Already in 12-hour format
        pickupTime = timeInput;
      } else {
        // Convert from 24-hour format like '03:30' to '3:30 AM'
        const [hours, minutes] = timeInput.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        pickupTime = `${displayHour}:${minutes} ${ampm}`;
      }

      // Generate appropriate template based on service type
      const html = getBookingConfirmationTemplate(bookingData.service, bookingData);

      // Short plain text summary
      const text = `Your booking (#${bookingData.bookingNumber}) for ${getServiceName(
        bookingData.service
      )} on ${pickupDate} at ${pickupTime} has been confirmed. Pickup: ${
        bookingData.pickup.address
      }. Thank you!`;

      const subject = `${subjectPrefix}Booking Confirmation - #${bookingData.bookingNumber}`;

      // Send to customer
      await this.sendEmail(to, subject, text, html);

      // Send copies to other recipients if needed
      const recipients = [];
      
      // Admin email
      if (config.email.from) {
        recipients.push(config.email.from);
      }

      // Affiliate email for PCH bookings
      if (bookingData.affiliate === true && bookingData.affiliateCode === 'PCH') {
        recipients.push('parkcityhostel@gmail.com');
      }

      if (recipients.length > 0) {
        await this.sendToMultipleRecipients(recipients, subject, text, html);
      }

      logger.info('Booking confirmation emails sent successfully:', {
        to,
        bookingNumber: bookingData.bookingNumber,
        additionalRecipients: recipients.length,
      });
    } catch (error) {
      logger.error('Error sending booking confirmation emails:', {
        error: error.message,
        to,
        bookingNumber: bookingData?.bookingNumber,
      });
      throw error;
    }
  }

  /**
   * Send booking update email
   * @param {string} to - Recipient email
   * @param {string} bookingNumber - Booking number
   * @param {object} passengerDetails - Passenger details
   * @param {object} updatedFields - Updated fields
   * @returns {Promise}
   */
  async sendBookingUpdate(to, bookingNumber, passengerDetails, updatedFields = {}) {
    try {
      const subject = `Booking Update - #${bookingNumber}`;

      let updateDescription = 'Your booking has been updated.';
      if (updatedFields.pickup?.date || updatedFields.pickup?.time) {
        updateDescription = 'Your booking date/time has been updated.';
      }

      let dateTimeInfo = '';
      if (updatedFields.pickup?.date) {
        const formattedDate = moment(updatedFields.pickup.date).format('MMMM Do YYYY');
        dateTimeInfo += `New Date: ${formattedDate}\n`;
      }
      if (updatedFields.pickup?.time) {
        const formattedTime = moment(updatedFields.pickup.time, 'HH:mm').format('h:mm A');
        dateTimeInfo += `New Time: ${formattedTime}\n`;
      }

      const text = `
Booking Update Notification - #${bookingNumber}

Dear ${passengerDetails.firstName || 'Customer'},

${updateDescription}

${dateTimeInfo}

If you did not request these changes, please contact us immediately.

Thank you for choosing Elite Transportation.
      `;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Booking Update Notification</h2>
          <p>Dear ${passengerDetails.firstName || 'Customer'},</p>
          <p>${updateDescription}</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Booking Details</h3>
            <p><strong>Booking Number:</strong> #${bookingNumber}</p>
            ${dateTimeInfo.split('\n').filter(line => line).map(line => `<p>${line}</p>`).join('')}
          </div>
          <p>If you did not request these changes, please contact us immediately.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666;">Thank you for choosing Elite Transportation.</p>
        </div>
      `;

      await this.sendEmail(to, subject, text, html);
      logger.info(`Booking update email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending booking update email:', error);
      throw error;
    }
  }

  /**
   * Send booking cancellation email
   * @param {string} to - Recipient email
   * @param {string} bookingNumber - Booking number
   * @returns {Promise}
   */
  async sendBookingCancellation(to, bookingNumber) {
    try {
      const subject = `Booking Cancellation - #${bookingNumber}`;
      const text = `Your booking #${bookingNumber} has been cancelled.`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Booking Cancellation</h2>
          <p>Your booking #${bookingNumber} has been cancelled.</p>
          <p>If you did not request this cancellation, please contact us immediately.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666;">Thank you for considering Elite Transportation.</p>
        </div>
      `;

      await this.sendEmail(to, subject, text, html);
      logger.info(`Booking cancellation email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending booking cancellation email:', error);
      throw error;
    }
  }

  /**
   * Send booking reminder email
   * @param {string} to - Recipient email
   * @param {object} bookingData - Booking data
   * @returns {Promise}
   */
  async sendBookingReminder(to, bookingData) {
    try {
      const pickupDate = moment(bookingData.pickupDetails.date).format('MMMM Do YYYY');
      const subject = `Reminder: Upcoming Trip - #${bookingData.bookingNumber}`;
      
      const text = `
Upcoming Trip Reminder - #${bookingData.bookingNumber}

Dear ${bookingData.passengerDetails.firstName} ${bookingData.passengerDetails.lastName},

This is a reminder about your upcoming trip.

Trip Details:
- Date: ${pickupDate}
- Time: ${bookingData.pickupDetails.time}
- Pickup Location: ${bookingData.pickupDetails.address}

Your driver will arrive at the specified time. Please be ready 5 minutes before the scheduled pickup time.
      `;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Upcoming Trip Reminder</h2>
          <p>Dear ${bookingData.passengerDetails.firstName} ${bookingData.passengerDetails.lastName},</p>
          <p>This is a reminder about your upcoming trip.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Trip Details</h3>
            <p><strong>Date:</strong> ${pickupDate}</p>
            <p><strong>Time:</strong> ${bookingData.pickupDetails.time}</p>
            <p><strong>Pickup Location:</strong> ${bookingData.pickupDetails.address}</p>
          </div>
          <p>Your driver will arrive at the specified time. Please be ready 5 minutes before the scheduled pickup time.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666;">If you need to make any changes, please contact us as soon as possible.</p>
        </div>
      `;

      await this.sendEmail(to, subject, text, html);
      logger.info(`Booking reminder email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending booking reminder email:', error);
      throw error;
    }
  }
}

module.exports = BookingEmailService;
