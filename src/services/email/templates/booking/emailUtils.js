const moment = require('moment-timezone');
const { formatLongDateWithOrdinal } = require('../../../../utils/dateOnly');

// Set timezone to Mountain Time (Utah)
const TIMEZONE = 'America/Denver';
const NIGHT_FEE_PER_TRIP = 30;
const POLICY_EFFECTIVE_DATE = 'March 27, 2026';

/**
 * Format date with timezone - ensuring correct date without shifting
 */
const formatDate = (date) => {
  return formatLongDateWithOrdinal(date);
};

/**
 * Format price
 */
const formatPrice = (amount) => {
  return `$${Number(amount).toFixed(2)}`;
};

/**
 * Format time to 12-hour format with AM/PM
 */
const formatTime12Hour = (time24) => {
  if (!time24) return '';
  
  // Handle if time already has AM/PM
  if (time24.includes('AM') || time24.includes('PM')) {
    return time24;
  }
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Get extras list for trip information
 */
const getExtrasListHTML = (extras) => {
  if (!extras || extras.length === 0) return '';
  
  // Filter out extras with 0 price or show all
  const extrasToShow = extras.filter(extra => extra.name);
  
  if (extrasToShow.length === 0) return '';
  
  const extrasHtml = extrasToShow.map(extra => 
    `<li>${extra.name}${extra.quantity > 1 ? ` (x${extra.quantity})` : ''}</li>`
  ).join('');
  
  return `
    <div class="extras-list">
      <div class="info-row">
        <div class="info-label">Extras</div>
        <div class="info-value">
          <ul style="margin: 0; padding-left: 20px;">
            ${extrasHtml}
          </ul>
        </div>
      </div>
    </div>
  `;
};

/**
 * Get pricing breakdown HTML
 */
const getPricingBreakdownHTML = (bookingData) => {
  const pricing = bookingData.pricing || {};
  const hasExtras = bookingData.extras && bookingData.extras.length > 0;
  const hasNightFee = pricing.nightFee > 0;
  const hasGratuity = pricing.gratuity > 0;
  const nightFeeCount = hasNightFee ? Math.round(pricing.nightFee / NIGHT_FEE_PER_TRIP) : 0;
  
  // Don't show pricing if no pricing data
  if (!pricing.basePrice && !hasExtras && !hasNightFee && !hasGratuity) {
    return '';
  }
  
  return `
    <div class="pricing-breakdown">
      <h4>Pricing Details</h4>
      <div class="price-item">
        <span>Base Fare</span>
        <span>${formatPrice(pricing.basePrice || 0)}</span>
      </div>
      ${hasExtras ? bookingData.extras.map(extra => {
        // Only show extras with price > 0
        if (extra.price > 0) {
          return `
            <div class="price-item">
              <span>${extra.name || 'Extra Service'} (x${extra.quantity || 1})</span>
              <span>${formatPrice(extra.price * (extra.quantity || 1))}</span>
            </div>
          `;
        }
        return '';
      }).join('') : ''}
      ${hasNightFee ? `
        <div class="price-item">
          <span>Night Service Fee${bookingData.isRoundTrip && nightFeeCount > 1 ? ` (x${nightFeeCount})` : ''}</span>
          <span>${formatPrice(pricing.nightFee)}</span>
        </div>
      ` : ''}
      ${hasGratuity ? `
        <div class="price-item">
          <span>Gratuity (${pricing.selectedTipPercentage || 15}%)</span>
          <span>${formatPrice(pricing.gratuity)}</span>
        </div>
      ` : ''}
    </div>
  `;
};

/**
 * Get return trip details HTML
 */
const getReturnTripHTML = (returnDetails) => {
  if (!returnDetails || !returnDetails.date) return '';
  
  const returnDate = formatDate(returnDetails.date);
  const returnTime = formatTime12Hour(returnDetails.time);
  
  return `
    <div class="return-trip-section">
      <h3 class="trip-header">
        Return Trip - ${returnDate}
      </h3>
      <div class="trip-content">
        <div class="trip-details">
          <div class="time">${returnTime}</div>
          <div class="address-section">
            <div class="address-label">Pickup Location</div>
            <div class="address">${returnDetails.pickupAddress}</div>
          </div>
          <div class="address-section">
            <div class="address-label">Drop-off Location</div>
            <div class="address">${returnDetails.dropoffAddress}</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

/**
 * Get passenger notes HTML
 */
const getNotesHTML = (notes) => {
  if (!notes) return '';
  
  return `
    <div class="notes-section">
      <h4>Special Instructions</h4>
      <p>${notes}</p>
    </div>
  `;
};

const getBookingPolicyHTML = () => `
  <div class="policy-section">
    <h4>Cancellation Policy</h4>
    <p class="policy-effective-date"><strong>Effective Date:</strong> ${POLICY_EFFECTIVE_DATE}</p>
    <ul>
      <li>Cancellations made more than 96 hours before the trip qualify for a full refund.</li>
      <li>Cancellations made between 48 and 96 hours before the trip qualify for a 50% refund.</li>
      <li>Cancellations made within 48 hours of the trip are non-refundable.</li>
      <li>Same-day reservations are subject to a 100% cancellation fee.</li>
    </ul>
    <h4>Change Policy</h4>
    <ul>
      <li>Changes to a reservation are allowed up to 48 hours in advance of the scheduled pick-up time.</li>
      <li>Changes requested within 48 hours of the trip require a new reservation.</li>
    </ul>
  </div>
`;

const getBookingPolicyText = () => `
Cancellation Policy
Effective Date: ${POLICY_EFFECTIVE_DATE}
- Cancellations made more than 96 hours before the trip qualify for a full refund.
- Cancellations made between 48 and 96 hours before the trip qualify for a 50% refund.
- Cancellations made within 48 hours of the trip are non-refundable.
- Same-day reservations are subject to a 100% cancellation fee.

Change Policy
- Changes to a reservation are allowed up to 48 hours in advance of the scheduled pick-up time.
- Changes requested within 48 hours of the trip require a new reservation.
`;

module.exports = {
  formatDate,
  formatPrice,
  formatTime12Hour,
  getExtrasListHTML,
  getPricingBreakdownHTML,
  getReturnTripHTML,
  getNotesHTML,
  getBookingPolicyHTML,
  getBookingPolicyText,
  POLICY_EFFECTIVE_DATE,
  TIMEZONE
};
