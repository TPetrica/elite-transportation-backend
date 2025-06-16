const { getBaseTemplate } = require('./baseTemplate');
const { 
  formatDate, 
  formatTime12Hour,
  getPricingBreakdownHTML, 
  getReturnTripHTML, 
  getNotesHTML,
  getExtrasListHTML 
} = require('./emailUtils');

const getServiceName = (service) => {
  switch (service) {
    case 'from-airport':
      return 'Airport Pickup Service';
    case 'to-airport':
      return 'Airport Drop-off Service';
    case 'canyons':
      return 'Cottonwood Canyons Transfer';
    case 'hourly':
      return 'Hourly Service';
    case 'per-person':
      return 'Per Person Service';
    case 'round-trip':
      return 'Round Trip Service';
    case 'group':
      return 'Group Transportation';
    default:
      return 'Transportation Service';
  }
};

const getGenericTemplate = (bookingData) => {
  const pickupDate = formatDate(bookingData.pickup.date);
  // Format time to 12-hour format with AM/PM
  const pickupTime = formatTime12Hour(bookingData.pickup.time);
  
  const content = `
    <div class="booking-header">
      <h3 class="booking-number">
        Booking Confirmation #${bookingData.bookingNumber} - ${getServiceName(bookingData.service)}
      </h3>
    </div>
    <div class="content-section">
      <h3 class="trip-header">
        Trip Information - ${pickupDate}
      </h3>
      <div class="trip-content">
        <div class="trip-details">
          <div class="time">${pickupTime}</div>
          <div class="address-section">
            <div class="address-label">Pickup Location</div>
            <div class="address">${bookingData.pickup.address}</div>
          </div>
          <div class="address-section">
            <div class="address-label">Drop-off Location</div>
            <div class="address">${bookingData.dropoff.address}</div>
          </div>
          <div class="trip-metadata">
            <div class="metadata-row">
              <span class="metadata-label">Distance</span>
              <span class="metadata-value">${bookingData.distance.miles} miles</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Duration</span>
              <span class="metadata-value">${bookingData.duration}</span>
            </div>
          </div>
        </div>
        <div class="passenger-info">
          <div class="info-row">
            <div class="info-label">Passenger Name</div>
            <div class="info-value">${bookingData.passengerDetails.firstName} ${bookingData.passengerDetails.lastName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Phone</div>
            <div class="info-value">${bookingData.passengerDetails.phone}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Passengers</div>
            <div class="info-value">${bookingData.passengerDetails.passengers}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Luggage</div>
            <div class="info-value">${bookingData.passengerDetails.luggage} pieces</div>
          </div>
          ${getExtrasListHTML(bookingData.extras)}
        </div>
      </div>
      
      ${getNotesHTML(bookingData.passengerDetails.notes)}
      
      ${getReturnTripHTML(bookingData.returnDetails)}
      
      ${getPricingBreakdownHTML(bookingData)}
    </div>
    <div class="footer">
      <strong>Need assistance?</strong><br>
      Call us anytime at (435) 901-9158<br><br>
      ELITE TRANSPORTATION<br>
      elitetransportationpc@gmail.com
    </div>
  `;
  
  return getBaseTemplate(content);
};

module.exports = { getGenericTemplate, getServiceName };
