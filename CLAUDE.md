# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the backend service for a luxury transportation web application - a Node.js/Express RESTful API server with MongoDB database that manages bookings, services, users, payments, blogs, and affiliates for a luxury transportation company.

## Development Commands

```bash
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server with nodemon
yarn dev

# Start production server with PM2
yarn start

# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run test coverage
yarn coverage

# Run a single test file
yarn test path/to/test.file.js

# Run tests matching a pattern
yarn test --testNamePattern="should create user"

# Run ESLint
yarn lint

# Fix ESLint errors
yarn lint:fix

# Check prettier formatting
yarn prettier

# Fix prettier formatting
yarn prettier:fix

# Run in Docker (development)
yarn docker:dev

# Run in Docker (production)
yarn docker:prod

# Run tests in Docker
yarn docker:test
```

## Project Architecture

The backend follows a layered architecture pattern:

```
src/
├── config/         # Environment variables and configuration
│   ├── config.js   # Main configuration (loads from .env)
│   ├── logger.js   # Winston logger setup
│   ├── passport.js # JWT authentication strategy
│   ├── roles.js    # Role-based permissions
│   └── tokens.js   # Token type definitions
├── controllers/    # Route controllers (handle HTTP requests/responses)
├── docs/          # Swagger API documentation
├── middlewares/   # Custom Express middlewares
│   ├── auth.js    # Authentication/authorization middleware
│   ├── error.js   # Global error handler
│   ├── validate.js # Request validation middleware
│   └── rateLimiter.js # API rate limiting
├── models/        # Mongoose models (MongoDB schemas)
│   └── plugins/   # Reusable schema plugins
├── routes/        # API route definitions
│   └── v1/        # Version 1 API routes
├── services/      # Business logic layer
│   └── email/     # Email service architecture
│       ├── services/  # Specialized email services
│       └── templates/ # Email templates
├── utils/         # Utility functions
│   ├── ApiError.js    # Custom error class
│   ├── catchAsync.js  # Async error wrapper
│   └── priceCalculator.js # Price calculation logic
├── validations/   # Joi validation schemas
├── app.js         # Express app setup
└── index.js       # Server entry point
```

## Key Technologies & Patterns

1. **Database**: MongoDB with Mongoose ORM
2. **Authentication**: JWT with Passport.js (access & refresh tokens)
3. **Authorization**: Role-based access control (user, admin roles)
4. **Validation**: Joi schemas with validation middleware
5. **Documentation**: Swagger auto-generated at `/v1/docs`
6. **Error Handling**: Centralized with custom ApiError class
7. **Logging**: Winston (app logs) + Morgan (HTTP logs)
8. **Email Service**: Modular architecture with Handlebars templates
9. **Payment**: Stripe integration with webhook support
10. **SMS**: Twilio integration
11. **Security**: Helmet, CORS, XSS protection, rate limiting
12. **Testing**: Jest for unit and integration tests
13. **Code Quality**: ESLint (Airbnb config) + Prettier

## API Endpoints Structure

All endpoints are prefixed with `/v1/`:

- `/auth/*` - Authentication (login, register, refresh-token, forgot-password)
- `/users/*` - User management (CRUD operations)
- `/bookings/*` - Booking management with round-trip support
- `/services/*` - Transportation service configurations
- `/extras/*` - Additional service options (WiFi, child seats, etc.)
- `/availability/*` - Real-time availability checking
- `/payment/*` - Stripe payment processing
- `/blogs/*` - Blog content management
- `/affiliates/*` - Affiliate partner management
- `/manual-bookings/*` - Admin manual booking system
- `/date-exceptions/*` - Special date pricing/availability

## Request/Response Flow

1. **Route** → receives HTTP request
2. **Validation Middleware** → validates request data with Joi
3. **Auth Middleware** → checks JWT token and permissions
4. **Controller** → wrapped in catchAsync for error handling
5. **Service** → contains business logic, throws ApiError on failures
6. **Model** → database operations with Mongoose
7. **Response** → standardized format with proper HTTP status codes

## Authentication Pattern

```javascript
// Public route
router.post('/endpoint', validate(schema), controller.method);

// Protected route (requires authentication)
router.post('/endpoint', auth(), validate(schema), controller.method);

// Protected route with specific permission
router.post('/endpoint', auth('manageBookings'), validate(schema), controller.method);
```

## Error Handling Pattern

```javascript
// In services
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

if (!resource) {
  throw new ApiError(httpStatus.NOT_FOUND, 'Resource not found');
}

// In controllers (automatically handled by catchAsync)
const controller = catchAsync(async (req, res) => {
  const result = await service.method(req.body);
  res.status(httpStatus.CREATED).send(result);
});
```

## Email Service Architecture

The email service follows SOLID principles with specialized services:

```
emailService.js (Main facade)
├── BookingEmailService (Booking-related emails)
├── InvoiceEmailService (Payment/invoice emails)
└── AuthEmailService (Authentication emails)
```

Each service extends BaseEmailService for common functionality.

## Testing Guidelines

```bash
# Run specific test file
yarn test tests/unit/models/user.model.test.js

# Run tests with coverage for specific directory
yarn test tests/unit --coverage

# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand
```

Test structure:
- `tests/unit/` - Unit tests for models, utilities
- `tests/integration/` - API endpoint integration tests
- `tests/fixtures/` - Test data and mocks
- `tests/utils/` - Test utilities (setupTestDB.js)

## Environment Variables

Key environment variables (see .env.example for full list):
- `PORT` - Server port (default: 3000)
- `MONGODB_URL` - MongoDB connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `JWT_ACCESS_EXPIRATION_MINUTES` - Access token expiry (default: 30)
- `JWT_REFRESH_EXPIRATION_DAYS` - Refresh token expiry (default: 30)
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `TWILIO_*` - Twilio SMS configuration
- `SMTP_*` - Email service configuration

## Common Development Tasks

### Adding a New API Resource

1. Create model in `/src/models/`
2. Create validation schema in `/src/validations/`
3. Create service in `/src/services/`
4. Create controller in `/src/controllers/`
5. Create routes in `/src/routes/v1/`
6. Add route to `/src/routes/v1/index.js`
7. Write tests in `/tests/`

### Working with the Affiliate System

The affiliate system allows partners to offer custom pricing:

1. **Model**: `affiliate.model.js` contains `servicePricingList` for custom pricing
2. **Validation**: `affiliate.validation.js` validates pricing configurations
3. **API**: `POST /v1/affiliates/validate` validates affiliate codes
4. **Pricing**: Custom pricing stored per service type with base price and min passengers

### Database Operations

Models include two custom plugins:
- `toJSON` - Transforms MongoDB documents (removes __v, converts _id to id)
- `paginate` - Adds pagination support to queries

```javascript
// Pagination example
const options = {
  sortBy: 'createdAt:desc',
  limit: 10,
  page: 1
};
const result = await Model.paginate(filter, options);
```

## Deployment

- PM2 configuration in `ecosystem.config.json`
- Docker support with multiple compose files
- Health check endpoint at `/`
- Logs stored by PM2 in production