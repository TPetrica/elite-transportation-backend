const { getBaseTemplate } = require('./baseTemplate');
const { 
  formatDate, 
  formatTime12Hour,
  getPricingBreakdownHTML, 
  getReturnTripHTML, 
  getNotesHTML,
  getExtrasListHTML 
} = require('./emailUtils');

const getMeetAndGreetInstructions = () => `
<div class="airport-instructions">
  <h4>🤝 Meet & Greet Experience</h4>

  <div class="step">
    <div class="step-icon">👋</div>
    <div class="step-content">
      <div class="step-title">Personal Welcome</div>
      <p>Upon exiting the terminal, you will be personally welcomed by an Elite Transportation representative.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-icon">📱</div>
    <div class="step-content">
      <div class="step-title">Easy Identification</div>
      <p>Your chauffeur will be holding a tablet displaying your name, along with the Elite Transportation name and logo, for easy identification.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-icon">🛒</div>
    <div class="step-content">
      <div class="step-title">Luggage Cart Provided</div>
      <p>A luggage cart will be provided for your convenience.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-icon">🧳</div>
    <div class="step-content">
      <div class="step-title">Baggage Claim Escort</div>
      <p>After greeting you, your chauffeur will escort you to baggage claim, where luggage will be retrieved together before proceeding to your vehicle.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-icon">💼</div>
    <div class="step-content">
      <div class="step-title">Luggage Assistance</div>
      <p>Your chauffeur will assist with luggage handling and transport to the vehicle.</p>
      <p style="margin-top: 10px; font-size: 0.9em; color: #666;">While every effort is made to provide seamless service, guests must be able to assist with their luggage, particularly when traveling with multiple or oversized items such as skis or large suitcases.</p>
    </div>
  </div>

  <div class="contact-info">
    <p><strong>📱 Need assistance?</strong> Call or text us at <a href="tel:4359019158">(435) 901-9158</a></p>
  </div>
</div>
`;

const hasMeetAndGreetExtra = (extras) => {
  if (!extras || !Array.isArray(extras)) return false;
  return extras.some(extra =>
    extra.name && extra.name.toLowerCase().includes('meet') &&
    extra.name.toLowerCase().includes('greet')
  );
};

const getFromAirportInstructions = () => `
<div class="airport-instructions">
  <h4>🛬 Airport Pickup Instructions</h4>
  
  <div class="step">
    <div class="step-icon">💬</div>
    <div class="step-content">
      <div class="step-title">Once you have retrieved your luggage 🧳, please notify us.</div>
    </div>
  </div>

  <div class="step">
    <div class="step-icon">⬇️</div>
    <div class="step-content">
      <div class="step-title">Proceed to the elevators located between baggage claims 7 and 8</div>
      <p>Take them down to Level 1 – Ground Transportation.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-icon">🚷</div>
    <div class="step-content">
      <div class="step-title">Kindly do not cross the pedestrian bridge.</div>
    </div>
  </div>
  
  <div class="image-container" style="text-align: center; margin: 20px 0;">
    <img src="https://res.cloudinary.com/dxncqwsnw/image/upload/v1750188640/image1_bn5bdr.jpg" alt="Do not cross pedestrian bridge" style="max-width: 100%; height: auto; border-radius: 8px;">
  </div>

  <div class="step">
    <div class="step-icon">➡️</div>
    <div class="step-content">
      <div class="step-title">Upon exiting the elevators, turn right</div>
      <p>Proceed through the first set of doors to reach the outside.</p>
    </div>
  </div>
  
  <div class="image-container" style="text-align: center; margin: 20px 0;">
    <img src="https://res.cloudinary.com/dxncqwsnw/image/upload/v1750188639/image2_fjzvsr.jpg" alt="Turn right after elevators" style="max-width: 100%; height: auto; border-radius: 8px;">
  </div>
  
  <div class="image-container" style="text-align: center; margin: 20px 0;">
    <img src="https://res.cloudinary.com/dxncqwsnw/image/upload/v1750188639/image3_ukucip.jpg" alt="Proceed through doors" style="max-width: 100%; height: auto; border-radius: 8px;">
  </div>

  <div class="step">
    <div class="step-icon">📩</div>
    <div class="step-content">
      <div class="step-title">Kindly notify us once you are outside</div>
      <p>We will proceed to the designated pick-up area. We will be arriving in a black Chevrolet Suburban marked with Elite Transportation on the side.</p>
    </div>
  </div>
  
  <div class="image-container" style="text-align: center; margin: 20px 0;">
    <img src="https://res.cloudinary.com/dxncqwsnw/image/upload/v1750188639/image4_bqpt9s.jpg" alt="Elite Transportation vehicle" style="max-width: 100%; height: auto; border-radius: 8px;">
  </div>

  <div class="contact-info">
    <p><strong>📱 Need assistance?</strong> Call or text us at <a href="tel:4359019158">(435) 901-9158</a></p>
  </div>
</div>
`;

const getFromAirportTemplate = (bookingData) => {
  const pickupDate = formatDate(bookingData.pickup.date);
  // Format time to 12-hour format with AM/PM
  const pickupTime = formatTime12Hour(bookingData.pickup.time);
  
  const content = `
    <div class="booking-header">
      <h3 class="booking-number">
        Booking Confirmation #${bookingData.bookingNumber} - Airport Pickup Service
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
            <div class="address">Salt Lake City International Airport (SLC)</div>
          </div>
          <div class="address-section">
            <div class="address-label">Drop-off Location</div>
            <div class="address">${bookingData.dropoff.address}</div>
          </div>
          ${bookingData.passengerDetails?.flightNumber ? `
          <div class="address-section">
            <div class="address-label">Flight Number</div>
            <div class="address">${bookingData.passengerDetails.flightNumber}</div>
          </div>
          ` : ''}
          ${getExtrasListHTML(bookingData.extras)}
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
            <div class="info-label">Email</div>
            <div class="info-value">${bookingData.passengerDetails.email}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Passengers</div>
            <div class="info-value">${bookingData.passengerDetails.passengers}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Luggage</div>
            <div class="info-value">${bookingData.passengerDetails.luggage}</div>
          </div>
          ${bookingData.passengerDetails.company ? `
          <div class="info-row">
            <div class="info-label">Company</div>
            <div class="info-value">${bookingData.passengerDetails.company}</div>
          </div>
          ` : ''}
          ${bookingData.passengerDetails.specialRequirements ? `
          <div class="info-row">
            <div class="info-label">Special Requirements</div>
            <div class="info-value">${bookingData.passengerDetails.specialRequirements}</div>
          </div>
          ` : ''}
          ${bookingData.passengerDetails.notes ? `
          <div class="info-row">
            <div class="info-label">Notes</div>
            <div class="info-value">${bookingData.passengerDetails.notes}</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      ${hasMeetAndGreetExtra(bookingData.extras) ? getMeetAndGreetInstructions() : getFromAirportInstructions()}

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

module.exports = { getFromAirportTemplate };
