const BaseEmailService = require('./baseEmailService');
const config = require('../../../config/config');
const logger = require('../../../config/logger');

class ContactEmailService extends BaseEmailService {
  /**
   * Send contact form email to admin
   * @param {object} contactData - Contact form data
   * @returns {Promise}
   */
  async sendContactFormEmail(contactData) {
    try {
      const { name, email, phone, message } = contactData;

      const adminEmail = config.email.adminEmail || config.email.from;

      const subject = `New Contact Form Submission from ${name}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e95440; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
            .message-box { background: white; padding: 15px; border-left: 4px solid #e95440; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">New Contact Form Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              ${phone ? `
              <div class="field">
                <div class="label">Phone:</div>
                <div class="value"><a href="tel:${phone}">${phone}</a></div>
              </div>
              ` : ''}
              <div class="field">
                <div class="label">Message:</div>
                <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            <div class="footer">
              <p>This message was sent from the Elite Transportation Park City website contact form.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}

Message:
${message}

---
This message was sent from the Elite Transportation Park City website contact form.
      `.trim();

      await this.sendEmail(adminEmail, subject, text, html);

      logger.info(`Contact form email sent from ${email} to ${adminEmail}`);

      return { success: true };
    } catch (error) {
      logger.error('Error sending contact form email:', error);
      throw error;
    }
  }

  /**
   * Send auto-reply to the person who submitted the contact form
   * @param {object} contactData - Contact form data
   * @returns {Promise}
   */
  async sendContactAutoReply(contactData) {
    try {
      const { name, email } = contactData;

      const subject = 'Thank you for contacting Elite Transportation Park City';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e95440; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
            .cta { display: inline-block; background: #e95440; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Thank You for Reaching Out!</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Thank you for contacting Elite Transportation Park City. We have received your message and will get back to you as soon as possible, typically within 24 hours.</p>
              <p>If you need immediate assistance, please don't hesitate to call us at:</p>
              <p style="text-align: center; font-size: 20px; font-weight: bold;">
                <a href="tel:+14359019158" style="color: #e95440;">(435) 901-9158</a>
              </p>
              <p style="text-align: center;">
                <a href="https://elitetransportationparkcity.com/booking" class="cta">Book Online Now</a>
              </p>
              <p>Best regards,<br>Elite Transportation Park City Team</p>
            </div>
            <div class="footer">
              <p>Elite Transportation Park City | Premium Transportation Services</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
Dear ${name},

Thank you for contacting Elite Transportation Park City. We have received your message and will get back to you as soon as possible, typically within 24 hours.

If you need immediate assistance, please don't hesitate to call us at (435) 901-9158.

Best regards,
Elite Transportation Park City Team
      `.trim();

      await this.sendEmail(email, subject, text, html);

      logger.info(`Contact form auto-reply sent to ${email}`);

      return { success: true };
    } catch (error) {
      logger.error('Error sending contact form auto-reply:', error);
      // Don't throw - auto-reply failure shouldn't fail the whole request
    }
  }
}

module.exports = ContactEmailService;
