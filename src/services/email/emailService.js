const BookingEmailService = require('./services/bookingEmailService');
const InvoiceEmailService = require('./services/invoiceEmailService');
const AuthEmailService = require('./services/authEmailService');
const logger = require('../../config/logger');

/**
 * EmailService - Main facade for all email operations
 * Follows SOLID principles by delegating specific email types to dedicated services
 */
class EmailService {
  constructor() {
    this.bookingService = new BookingEmailService();
    this.invoiceService = new InvoiceEmailService();
    this.authService = new AuthEmailService();
  }

  // Booking-related emails
  async sendBookingConfirmationEmail(to, bookingData, subjectPrefix = '') {
    return this.bookingService.sendBookingConfirmation(to, bookingData, subjectPrefix);
  }

  async sendBookingUpdateEmail(to, bookingNumber, passengerDetails, updatedFields) {
    return this.bookingService.sendBookingUpdate(to, bookingNumber, passengerDetails, updatedFields);
  }

  async sendBookingCancellationEmail(to, bookingNumber) {
    return this.bookingService.sendBookingCancellation(to, bookingNumber);
  }

  async sendBookingReminderEmail(to, bookingData) {
    return this.bookingService.sendBookingReminder(to, bookingData);
  }

  // Invoice and payment emails
  async sendInvoiceEmail(to, invoiceData, session, booking) {
    return this.invoiceService.sendInvoice(to, invoiceData, session, booking);
  }

  async sendPaymentSuccessEmail(to, paymentData) {
    return this.invoiceService.sendPaymentSuccess(to, paymentData);
  }

  // Authentication emails
  async sendResetPasswordEmail(to, token) {
    return this.authService.sendResetPassword(to, token);
  }

  async sendVerificationEmail(to, token) {
    return this.authService.sendVerificationEmail(to, token);
  }
}

// Export singleton instance
const emailService = new EmailService();

module.exports = emailService;

// Also export the class for testing purposes
module.exports.EmailService = EmailService;
