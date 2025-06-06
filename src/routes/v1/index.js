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

module.exports = router;
