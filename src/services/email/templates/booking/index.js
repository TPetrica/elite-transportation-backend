const { getFromAirportTemplate } = require('./fromAirportTemplate');
const { getToAirportTemplate } = require('./toAirportTemplate');
const { getGenericTemplate, getServiceName } = require('./genericTemplate');

// Simple template cache to avoid regenerating templates
const templateCache = new Map();

/**
 * Get the appropriate email template based on service type
 * @param {string} serviceType - The type of service
 * @param {object} bookingData - The booking data
 * @returns {string} HTML email template
 */
const getBookingConfirmationTemplate = (serviceType, bookingData) => {
  // Create cache key based on service type and booking data essentials
  const cacheKey = `${serviceType}_${bookingData.bookingNumber}_${bookingData.pickup?.address?.includes('airport')}_${bookingData.dropoff?.address?.includes('airport')}`;
  
  // Check cache first
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey);
  }

  // Check if pickup or dropoff involves airport
  const pickupIsAirport = bookingData.pickup?.address?.toLowerCase().includes('airport') || 
                         bookingData.pickup?.address?.toLowerCase().includes('slc');
  const dropoffIsAirport = bookingData.dropoff?.address?.toLowerCase().includes('airport') || 
                          bookingData.dropoff?.address?.toLowerCase().includes('slc');
  
  let template;
  
  // Select template based on airport involvement
  if (pickupIsAirport && !dropoffIsAirport) {
    // Pickup from airport
    template = getFromAirportTemplate(bookingData);
  } else if (!pickupIsAirport && dropoffIsAirport) {
    // Dropoff to airport
    template = getToAirportTemplate(bookingData);
  } else if (serviceType === 'from-airport') {
    // Legacy support: service type from-airport
    template = getFromAirportTemplate(bookingData);
  } else if (serviceType === 'to-airport') {
    // Legacy support: service type to-airport
    template = getToAirportTemplate(bookingData);
  } else {
    // All other services (including per-person without airport)
    template = getGenericTemplate(bookingData);
  }

  // Cache the template (with size limit to prevent memory leaks)
  if (templateCache.size < 100) {
    templateCache.set(cacheKey, template);
  }
  
  return template;
};

module.exports = {
  getBookingConfirmationTemplate,
  getServiceName,
};
