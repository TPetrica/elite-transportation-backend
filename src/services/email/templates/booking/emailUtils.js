const moment = require('moment-timezone');

// Set timezone to Mountain Time (Utah)
const TIMEZONE = 'America/Denver';
const NIGHT_FEE_PER_TRIP = 30;

/**
 * Format date with timezone - ensuring correct date without shifting
 */
const formatDate = (date) => {
  // Parse the date as a simple date string without timezone conversion
  const dateObj = new Date(date);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const day = dateObj.getUTCDate();
  const month = months[dateObj.getUTCMonth()];
  const year = dateObj.getUTCFullYear();
  
  // Add ordinal suffix
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = day % 100;
  const ordinal = suffix[(v - 20) % 10] || suffix[v] || suffix[0];
  
  return `${month} ${day}${ordinal} ${year}`;
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

module.exports = {
  formatDate,
  formatPrice,
  formatTime12Hour,
  getExtrasListHTML,
  getPricingBreakdownHTML,
  getReturnTripHTML,
  getNotesHTML,
  TIMEZONE
};
