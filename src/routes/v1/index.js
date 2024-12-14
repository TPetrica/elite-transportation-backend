const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const paymentRoute = require('./payment.route');
const bookingRoute = require('./booking.route');
const vehicleRoute = require('./vehicle.route');
const extraRoute = require('./extra.route');
const availabilityRoute = require('./availability.route');
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
    path: '/vehicles',
    route: vehicleRoute,
  },
  {
    path: '/extras',
    route: extraRoute,
  },
  {
    path: '/payment',
    route: paymentRoute,
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
