const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const paymentRoute = require('./payment.route');
const bookingRoute = require('./booking.route');
const extraRoute = require('./extra.route');
const serviceRoute = require('./service.route');
const availabilityRoute = require('./availability.route');
const blogRoute = require('./blog.route');
const affiliateRoute = require('./affiliate.route');
const manualBookingRoute = require('./manualBooking.route');
const contactRoute = require('./contact.route');
const docsRoute = require('./docs.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/bookings',
    route: bookingRoute,
  },
  {
    path: '/availability',
    route: availabilityRoute,
  },
  {
    path: '/extras',
    route: extraRoute,
  },
  {
    path: '/services',
    route: serviceRoute,
  },
  {
    path: '/payment',
    route: paymentRoute,
  },
  {
    path: '/blogs',
    route: blogRoute,
  },
  {
    path: '/affiliates',
    route: affiliateRoute,
  },
  {
    path: '/manual-bookings',
    route: manualBookingRoute,
  },
  {
    path: '/contact',
    route: contactRoute,
  },
];

const devRoutes = [
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

router.get('/status', (req, res) => res.send('OK'));

// Check environment variables endpoint
router.get('/env-check', (req, res) => {
  res.json({
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USERNAME: process.env.SMTP_USERNAME,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NODE_ENV: process.env.NODE_ENV,
    hasPassword: !!process.env.SMTP_PASSWORD
  });
});

// Test email endpoint (for debugging SMTP issues)
router.post('/test-email', async (req, res) => {
  try {
    const emailService = require('../../services/email/emailService');
    const testEmail = req.body.email || 'elitetransportationpc@gmail.com';
    
    const testBookingData = {
      bookingNumber: 'TEST-' + Date.now(),
      service: 'from-airport',
      pickup: {
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        address: 'Salt Lake City International Airport'
      },
      dropoff: {
        address: 'Park City, UT'
      },
      passengerDetails: {
        firstName: 'Test',
        lastName: 'User',
        phone: '555-0123',
        passengers: 1
      },
      pricing: {
        totalPrice: 100
      }
    };
    
    await emailService.sendBookingConfirmationEmail(testEmail, testBookingData);
    
    res.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      smtpHost: process.env.SMTP_HOST
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      smtpHost: process.env.SMTP_HOST
    });
  }
});

module.exports = router;
