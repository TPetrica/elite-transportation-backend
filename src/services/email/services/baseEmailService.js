const nodemailer = require('nodemailer');
const config = require('../../../config/config');
const logger = require('../../../config/logger');
const path = require('path');

class BaseEmailService {
  constructor() {
    this.transport = this.createTransport();
    this.defaultAttachments = [
      {
        filename: 'logo.jpeg',
        path: path.join(__dirname, '../../../assets/logo.jpeg'),
        cid: 'companyLogo',
      },
    ];
  }

  createTransport() {
    if (
      config.email?.smtp?.host &&
      config.email?.smtp?.port &&
      config.email?.smtp?.auth?.user &&
      config.email?.smtp?.auth?.pass
    ) {
      const transport = nodemailer.createTransport(config.email.smtp);

      transport
        .verify()
        .then(() => logger.info('Connected to email server'))
        .catch((err) => logger.warn('Unable to connect to email server:', err.message));

      return transport;
    }

    logger.warn('Email service not configured properly');
    return null;
  }

  async sendEmail(to, subject, text, html, attachments = []) {
    if (!this.transport) {
      logger.warn(`Email not sent to ${to} - SMTP not configured`);
      return;
    }

    try {
      const msg = {
        from: config.email.from,
        to,
        subject,
        text,
        html,
        attachments: [...this.defaultAttachments, ...attachments],
      };

      await this.transport.sendMail(msg);
      logger.info(`Email sent successfully to ${to}`);
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  async sendToMultipleRecipients(recipients, subject, text, html, attachments = []) {
    const results = await Promise.allSettled(
      recipients.map(recipient => this.sendEmail(recipient, subject, text, html, attachments))
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      logger.warn(`Failed to send email to ${failed.length} recipients`);
    }

    return results;
  }
}

module.exports = BaseEmailService;
