const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('./config/morgan');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const logger = require('./config/logger');
const axios = require('axios');

const app = express();

// Morgan logging middleware
if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Health check cron job
const healthCheck = async () => {
  try {
    // Check the backend API
    await axios.get(`${process.env.SERVER_URL}/health`);
    logger.info('Backend health check: OK');

    // Check the frontend
    await axios.get(config.clientUrl);
    logger.info('Frontend health check: OK');
  } catch (error) {
    logger.error('Health check failed:', error.message);
  }
};

// Run health check every 30 seconds
setInterval(healthCheck, 30000);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    environment: config.env,
    service: 'Elite Transportation API',
    serverUrl: process.env.SERVER_URL,
    clientUrl: config.clientUrl,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Elite Transportation API',
    environment: config.env,
    version: '1.0.0',
    serverUrl: process.env.SERVER_URL,
    clientUrl: config.clientUrl,
  });
});

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://checkout.stripe.com',
    'https://elitetransportationpc.com',
    /\.stripe\.com$/,
    config.clientUrl,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature', 'Origin', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

// IMPORTANT: Stripe webhook route must come BEFORE other middleware
app.post('/v1/payment/webhook', express.raw({ type: '*/*' }), require('./controllers/payment.controller').handleWebhook);

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Passport and authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// Rate limiting
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// Routes
app.use('/v1', routes);

// 404 Error for unknown API requests
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Error handling
app.use(errorConverter);
app.use(errorHandler);

// Start health check immediately
healthCheck();

module.exports = app;
