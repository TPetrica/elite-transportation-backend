const { getBaseTemplate } = require('./baseTemplate');
const { 
  formatDate, 
  formatTime12Hour,
  getPricingBreakdownHTML, 
  getReturnTripHTML, 
  getNotesHTML,
  getExtrasListHTML 
} = require('./emailUtils');

const getToAirportInstructions = () => `
<div class="airport-instructions">
  <h4>🚗 Your Elite Transportation Airport Departure Details</h4>
  
  <div class="step">
    <div class="step-icon">🚗</div>
    <div class="step-content">
      <div class="step-title">Your driver will arrive on time</div>
      <p>In a black SUV, clearly marked with Elite Transportation. We recommend being ready at the front entrance or lobby 5–10 minutes before your scheduled pickup.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-icon">🧳</div>
    <div class="step-content">
      <div class="step-title">Please have all luggage prepared and easily accessible</div>
      <p>Your chauffeur will assist with loading.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-icon">📱</div>
    <div class="step-content">
      <div class="step-title">Need help locating your vehicle or have a last-minute update?</div>
      <p>Simply contact us at <a href="tel:4359019158">(435) 901-9158</a></p>
    </div>
  </div>
</div>
`;

const getToAirportTemplate = (bookingData) => {
  const pickupDate = formatDate(bookingData.pickup.date);
  // Format time to 12-hour format with AM/PM
  const pickupTime = formatTime12Hour(bookingData.pickup.time);
  
  const content = `
    <div class="booking-header">
      <h3 class="booking-number">
        Booking Confirmation #${bookingData.bookingNumber} - Airport Drop-off Service
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
            <div class="address">Salt Lake City International Airport (SLC)</div>
          </div>
          ${getExtrasListHTML(bookingData.extras)}
        </div>
      </div>
      
      ${getToAirportInstructions()}
      
      ${getNotesHTML(bookingData.passengerDetails?.notes)}
      
      ${getReturnTripHTML(bookingData.returnDetails)}
      
      ${getPricingBreakdownHTML(bookingData)}
    </div>
    <div class="footer">
      <strong>Thank you for choosing Elite Transportation</strong><br>
      Where your comfort is our priority<br><br>
      ELITE TRANSPORTATION<br>
      elitetransportationpc@gmail.com
    </div>
  `;
  
  return getBaseTemplate(content);
};

module.exports = { getToAirportTemplate };
