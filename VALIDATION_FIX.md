# Payment Validation Fix

## Issue
The backend validation was rejecting the new fields we added:
- `flightNumber` and `flightTime` in pickup/dropoff objects
- `flightNumber` and `flightTime` in passengerDetails
- `extras` array
- `selectedExtras` (duplicate field)

## Solution

### 1. Updated Payment Validation Schema
```javascript
// Updated pickup object validation
pickup: Joi.object({
  // ... existing fields
  flightNumber: Joi.string().allow('', null).optional(),
  flightTime: Joi.string().allow('', null).optional(),
}),

// Updated dropoff object validation  
dropoff: Joi.object({
  // ... existing fields
  flightNumber: Joi.string().allow('', null).optional(),
  flightTime: Joi.string().allow('', null).optional(),
}),

// Updated passengerDetails validation
passengerDetails: Joi.object({
  // ... existing fields
  flightNumber: Joi.string().allow('', null).optional(),
  flightTime: Joi.string().allow('', null).optional(),
}),

// Added extras validation
extras: Joi.array().items(
  Joi.object({
    item: Joi.string().required(),
    quantity: Joi.number().required(),
    price: Joi.number().required(),
    name: Joi.string().required(),
  })
).optional(),
```

### 2. Removed Duplicate Field
- Removed `selectedExtras` from frontend (was sending same data as `extras`)
- Removed `.unknown(false)` from pickup/dropoff objects to allow flexibility

### 3. Files Modified
- `/backend/src/validations/payment.validation.js` - Updated validation schema
- `/frontend/src/components/booking/PaymentStep.tsx` - Removed duplicate selectedExtras

## Testing
The payment should now work without validation errors. The backend will accept all the fields being sent from the frontend.