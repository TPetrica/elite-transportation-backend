# Availability and Webhook Fixes

## Issues Fixed

### 1. Availability Check Error - "Time 1:30 AM is outside of allowed schedule"

**Problem**: The availability service expects time in 24-hour format ("01:30") but was receiving 12-hour format with AM/PM ("1:30 AM").

**Solution**:
- Created a time format conversion utility (`/backend/src/utils/timeFormat.js`)
- Updated booking service to convert AM/PM time to 24-hour format before:
  - Checking availability
  - Storing in database
- The conversion happens transparently in the backend

**Example**:
```javascript
// Frontend sends: "1:30 AM"
// Backend converts to: "01:30" for processing
// Emails still show: "1:30 AM" for user readability
```

### 2. Webhook Duplicate Processing

**Problem**: Stripe webhooks were being processed multiple times, causing duplicate booking attempts.

**Solution**:
- Added idempotency check in webhook handler
- Before creating a booking, check if one already exists for the Stripe session ID
- If booking exists, skip processing and log the duplicate attempt

**Code added**:
```javascript
// Check if booking already exists for this session
const existingBooking = await Booking.findOne({ 
  'payment.stripeSessionId': session.id 
});

if (existingBooking) {
  logger.info('Booking already exists, skipping duplicate');
  break; // Exit early
}
```

## Files Modified

1. **Created**: `/backend/src/utils/timeFormat.js`
   - Utility functions to convert between 12-hour and 24-hour formats

2. **Updated**: `/backend/src/services/booking.service.js`
   - Import time conversion utility
   - Convert pickup time before availability check
   - Convert times before storing in database

3. **Updated**: `/backend/src/controllers/payment.controller.js`
   - Import Booking model
   - Add idempotency check for duplicate webhook processing

## Testing

1. **Availability**: Bookings at any time (including 1:30 AM) should now work if within schedule
2. **Webhooks**: Multiple webhook calls for same payment won't create duplicate bookings
3. **Time Display**: Users still see AM/PM format in emails and frontend

## Note on Schedule Configuration

If bookings are still being rejected, check the schedule configuration in the database:
- Day 3 (Wednesday) schedule might have restricted hours
- Use admin panel to set 24/7 availability if needed
- Or update the Schedule collection directly in MongoDB