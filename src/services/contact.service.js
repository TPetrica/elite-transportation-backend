const ContactEmailService = require('./email/services/contactEmailService');
const logger = require('../config/logger');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const contactEmailService = new ContactEmailService();

/**
 * Verify Cloudflare Turnstile token
 * @param {string} token - Turnstile token from client
 * @returns {Promise<boolean>}
 */
const verifyTurnstileToken = async (token) => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If no secret key is configured, skip verification in development
  if (!secretKey) {
    logger.warn('Turnstile secret key not configured, skipping verification');
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      logger.warn('Turnstile verification failed:', data['error-codes']);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Turnstile verification error:', error);
    return false;
  }
};

/**
 * Process contact form submission
 * @param {Object} contactData - Contact form data
 * @returns {Promise<Object>}
 */
const processContactForm = async (contactData) => {
  const { name, email, phone, message, turnstileToken } = contactData;

  // Verify Turnstile token
  const isValid = await verifyTurnstileToken(turnstileToken);
  if (!isValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Security verification failed. Please try again.');
  }

  logger.info(`Processing contact form submission from ${email}`);

  // Send email to admin
  await contactEmailService.sendContactFormEmail({ name, email, phone, message });

  // Send auto-reply to the user
  await contactEmailService.sendContactAutoReply({ name, email });

  return {
    success: true,
    message: 'Contact form submitted successfully',
  };
};

module.exports = {
  processContactForm,
};
