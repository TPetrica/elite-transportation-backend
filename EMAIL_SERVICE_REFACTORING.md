# Email Service Refactoring Documentation

## Overview
The email service has been refactored to follow SOLID principles and improve maintainability. The previous monolithic `email.service.js` has been split into specialized services with clear responsibilities.

## New Structure

### Directory Layout
```
src/services/email/
├── emailService.js           # Main facade/coordinator
├── services/
│   ├── baseEmailService.js   # Base class with common functionality
│   ├── bookingEmailService.js # Booking-related emails
│   ├── invoiceEmailService.js # Invoice and payment emails
│   └── authEmailService.js    # Authentication emails
└── templates/
    └── booking/
        ├── index.js           # Template selector
        ├── baseTemplate.js    # Base HTML template
        ├── styles.js          # Shared email styles
        ├── fromAirportTemplate.js  # Airport pickup instructions
        ├── toAirportTemplate.js    # Airport drop-off instructions
        └── genericTemplate.js      # Generic service template
```

## Key Improvements

### 1. Service-Specific Email Templates
- **from-airport**: Shows detailed pickup instructions (baggage claim, elevators, doors)
- **to-airport**: Shows driver arrival instructions (be ready 5-10 mins early)
- **Other services**: Use generic template

### 2. SOLID Principles Implementation
- **Single Responsibility**: Each service handles one type of email
- **Open/Closed**: Easy to add new email types without modifying existing code
- **Dependency Inversion**: Services depend on abstractions (BaseEmailService)

### 3. DRY Principle
- Removed duplicate `getServiceName` function
- Centralized email styles in `styles.js`
- Shared base template for consistent layout

## Usage Examples

### Sending Booking Confirmation
```javascript
const emailService = require('../services/email/emailService');

// In booking controller or service
await emailService.sendBookingConfirmationEmail(
  customerEmail,
  bookingData
);
```

### Sending Invoice
```javascript
await emailService.sendInvoiceEmail(
  customerEmail,
  invoiceData,
  stripeSession,
  booking
);
```

### Sending Auth Emails
```javascript
// Password reset
await emailService.sendResetPasswordEmail(userEmail, resetToken);

// Email verification
await emailService.sendVerificationEmail(userEmail, verificationToken);
```

## Adding New Email Types

1. Create a new service in `services/` extending `BaseEmailService`
2. Add methods for your specific email types
3. Add the service to `emailService.js` facade
4. Create templates if needed in `templates/`

Example:
```javascript
// services/marketingEmailService.js
class MarketingEmailService extends BaseEmailService {
  async sendPromotionalEmail(to, promoData) {
    // Implementation
  }
}

// In emailService.js
this.marketingService = new MarketingEmailService();

async sendPromotionalEmail(to, promoData) {
  return this.marketingService.sendPromotionalEmail(to, promoData);
}
```

## Template Customization

### Adding New Service Types
Edit `templates/booking/index.js`:
```javascript
case 'new-service-type':
  return getNewServiceTemplate(bookingData);
```

### Modifying Styles
Edit `templates/booking/styles.js` to update email styling globally.

## Migration Notes

### Import Changes
Old:
```javascript
const { emailService } = require('../services');
```

New:
```javascript
const emailService = require('../services/email/emailService');
```

### Method Names
All method names remain the same for backward compatibility.

## Benefits

1. **Maintainability**: Each email type is isolated
2. **Testability**: Can test each service independently
3. **Scalability**: Easy to add new email types
4. **Clarity**: Clear separation of concerns
5. **Reusability**: Shared base functionality

## Testing

Each service can be tested independently:
```javascript
const BookingEmailService = require('./services/bookingEmailService');
const service = new BookingEmailService();
// Test specific methods
```

## Environment Variables
No changes to environment variables. Still uses:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `EMAIL_FROM`
