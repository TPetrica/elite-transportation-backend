# Frontend-Backend Data Alignment & Email Template Updates

## Summary of Changes Made

### 1. Frontend Data Structure Cleanup

**Fixed duplicate fields in booking.ts:**
- Removed `contactInfo` interface - now everything is in `passengerDetails`
- Removed duplicate fields: `passengers`, `luggage`, `passengerCount`, `luggageCount`
- Removed standalone `notes` and `specialRequirements` - now in `passengerDetails`
- Single source of truth: `passengerDetails` object contains all passenger information

**Updated BookingData interface:**
```typescript
interface BookingData {
  // ... other fields
  
  // SINGLE SOURCE OF TRUTH for passenger info
  passengerDetails: {
    firstName: string
    lastName: string
    email: string
    phone: string
    passengers: number
    luggage: number
    skiBags?: number
    notes?: string
    specialRequirements?: string
    company?: string
    flightNumber?: string
    flightTime?: string
  }
  
  // Removed: contactInfo, passengers, luggage, notes, specialRequirements
}
```

### 2. Frontend Component Updates

**PaymentStep.tsx:**
- Added time conversion to AM/PM format before sending to backend
- Updated to use `passengerDetails` instead of `contactInfo`
- Now properly sends extras array with all fields (item, quantity, price, name)
- Fixed flight info to check multiple sources (pickupDetails, dropoffDetails, passengerDetails)

**BillingForm.tsx:**
- Updated to use `passengerDetails` instead of `contactInfo`
- Pulls company name from passengerDetails

**PassengerDetails.tsx:**
- Updated to use `updatePassengerDetailsAtom` for cleaner state updates
- Removed duplicate updates to `passengers` and `luggage` fields

### 3. Backend Email Template Updates

**Email Template Selection Logic (index.js):**
- Now checks if pickup or dropoff address contains "airport" or "slc"
- Selects template based on airport involvement, not just service type
- Works for all service types including per-person service

**Time Format Handling:**
- Frontend now sends time in AM/PM format (e.g., "10:30 AM")
- Backend templates updated to use the time directly without conversion
- Removed moment.js time parsing in email templates

### 4. Data Flow Improvements

**What gets sent to backend now:**
```javascript
{
  pickup: {
    address: string,
    coordinates: { lat, lng },
    date: string,
    time: "10:30 AM", // AM/PM format
    flightNumber: string,
    flightTime: string,
    isCustom: boolean
  },
  dropoff: {
    address: string,
    coordinates: { lat, lng },
    flightNumber: string,
    flightTime: string,
    isCustom: boolean
  },
  passengerDetails: {
    firstName: string,
    lastName: string,
    phone: string,
    passengers: string,
    luggage: string,
    email: string,
    notes: string,
    specialRequirements: string,
    company: string,
    flightNumber: string,
    flightTime: string
  },
  extras: [
    {
      item: string,
      quantity: number,
      price: number,
      name: string
    }
  ],
  // ... other fields
}
```

### 5. Email Template Logic

**When from-airport template is used:**
- Pickup address contains "airport" or "slc"
- Shows detailed pickup instructions (elevators, baggage claim, etc.)

**When to-airport template is used:**
- Dropoff address contains "airport" or "slc"
- Shows driver arrival instructions (be ready 5-10 mins early)

**When generic template is used:**
- Neither pickup nor dropoff involves an airport
- Standard booking confirmation

### 6. Benefits Achieved

1. **Data Consistency**: Single source of truth eliminates confusion
2. **Proper Data Transmission**: All fields (notes, flight info, extras) now sent correctly
3. **Better Email Selection**: Templates selected based on actual airport involvement
4. **Time Format**: Consistent AM/PM format throughout the system
5. **Cleaner Code**: Removed duplicate fields and redundant updates

### 7. Testing Recommendations

1. Test booking with from-airport service
2. Test booking with to-airport service
3. Test booking with per-person service (both with and without airport)
4. Verify notes, flight info, and extras appear in emails
5. Check time displays correctly in AM/PM format
6. Test affiliate bookings (PCH) to ensure they work correctly

### 8. Next Steps

1. You may want to update FAQ section on frontend as mentioned
2. Consider adding more specific airport detection (other airports besides SLC)
3. Add validation for flight number format if needed
4. Consider adding more email template variations for different scenarios

The system is now properly aligned between frontend and backend with clean data flow!