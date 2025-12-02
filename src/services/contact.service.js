const ContactEmailService = require('./email/services/contactEmailService');
const logger = require('../config/logger');

const contactEmailService = new ContactEmailService();

/**
 * Process contact form submission
 * @param {Object} contactData - Contact form data
 * @returns {Promise<Object>}
 */
const processContactForm = async (contactData) => {
  const { name, email, phone, message } = contactData;

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
