const config = require('./config');

const calendarConfig = {
  credentials: {
    type: 'service_account',
    project_id: 'luxury-transportation-444520',
    private_key: config.google.privateKey?.replace(/\\n/g, '\n'),
    client_email: config.google.clientEmail,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  },
  calendar: {
    id: config.google.calendarId,
    timeZone: 'UTC',
    eventDuration: 30, // minutes
  },
};

module.exports = calendarConfig;
