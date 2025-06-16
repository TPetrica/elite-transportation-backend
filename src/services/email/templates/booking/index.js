const { getFromAirportTemplate } = require('./fromAirportTemplate');
const { getToAirportTemplate } = require('./toAirportTemplate');
const { getGenericTemplate, getServiceName } = require('./genericTemplate');

/**
 * Get the appropriate email template based on service type
 * @param {string} serviceType - The type of service
 * @param {object} bookingData - The booking data
 * @returns {string} HTML email template
 */
const getBookingConfirmationTemplate = (serviceType, bookingData) => {
  // Check if pickup or dropoff involves airport
  const pickupIsAirport = bookingData.pickup?.address?.toLowerCase().includes('airport') || 
                         bookingData.pickup?.address?.toLowerCase().includes('slc');
  const dropoffIsAirport = bookingData.dropoff?.address?.toLowerCase().includes('airport') || 
                          bookingData.dropoff?.address?.toLowerCase().includes('slc');
  
  // Select template based on airport involvement
  if (pickupIsAirport && !dropoffIsAirport) {
    // Pickup from airport
    return getFromAirportTemplate(bookingData);
  } else if (!pickupIsAirport && dropoffIsAirport) {
    // Dropoff to airport
    return getToAirportTemplate(bookingData);
  } else if (serviceType === 'from-airport') {
    // Legacy support: service type from-airport
    return getFromAirportTemplate(bookingData);
  } else if (serviceType === 'to-airport') {
    // Legacy support: service type to-airport
    return getToAirportTemplate(bookingData);
  } else {
    // All other services (including per-person without airport)
    return getGenericTemplate(bookingData);
  }
};

module.exports = {
  getBookingConfirmationTemplate,
  getServiceName,
};
