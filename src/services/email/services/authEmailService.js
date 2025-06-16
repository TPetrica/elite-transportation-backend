const BaseEmailService = require('./baseEmailService');
const logger = require('../../../config/logger');
const config = require('../../../config/config');

class AuthEmailService extends BaseEmailService {
  /**
   * Send reset password email
   * @param {string} to - Recipient email
   * @param {string} token - Reset token
   * @returns {Promise}
   */
  async sendResetPassword(to, token) {
    try {
      const subject = 'Reset Password';
      const resetPasswordUrl = `${config.clientUrl}/reset-password?token=${token}`;

      const text = `
Reset Password

Dear user,

You have requested to reset your password.

Please click on this link to reset your password: ${resetPasswordUrl}

If you did not request this password reset, please ignore this email.

This link will expire in 1 hour.
      `;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Password</h2>
          <p>Dear user,</p>
          <p>You have requested to reset your password.</p>
          <div style="margin: 30px 0;">
            <a href="${resetPasswordUrl}" 
               style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If you did not request this password reset, please ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
        </div>
      `;

      await this.sendEmail(to, subject, text, html, []);
      logger.info(`Reset password email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending reset password email:', error);
      throw error;
    }
  }

  /**
   * Send verification email
   * @param {string} to - Recipient email
   * @param {string} token - Verification token
   * @returns {Promise}
   */
  async sendVerificationEmail(to, token) {
    try {
      const subject = 'Email Verification';
      const verificationEmailUrl = `${config.clientUrl}/verify-email?token=${token}`;

      const text = `
Email Verification

Dear user,

Thank you for registering. Please verify your email to complete your registration.

Please click on this link to verify your email: ${verificationEmailUrl}

If you did not create an account, please ignore this email.

This link will expire in 24 hours.
      `;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p>Dear user,</p>
          <p>Thank you for registering. Please verify your email to complete your registration.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationEmailUrl}" 
               style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>If you did not create an account, please ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
        </div>
      `;

      await this.sendEmail(to, subject, text, html, []);
      logger.info(`Verification email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending verification email:', error);
      throw error;
    }
  }
}

module.exports = AuthEmailService;
