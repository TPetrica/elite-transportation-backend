/**
 * Utility functions for calculating prices
 */

const { vehicleService, extraService } = require('../services');

/**
 * Calculate total price for a trip
 * @param {number} distance - Distance in kilometers
 * @param {Object} vehicle - Vehicle object
 * @param {Array} extras - Array of extra items with quantities
 * @returns {Promise<number>} Total price
 */
const calculateTripPrice = async (distance, vehicle, extras = []) => {
  // Calculate base vehicle price
  const vehiclePrice = vehicle.pricing.basePrice + distance * vehicle.pricing.pricePerKm;

  // Calculate extras price
  let extrasPrice = 0;
  if (extras?.length) {
    extrasPrice = await extraService.calculateExtrasPrice(extras);
  }

  return vehiclePrice + extrasPrice;
};

/**
 * Calculate cancellation fee based on booking time and cancellation time
 * @param {Object} booking - Booking object
 * @returns {number} Cancellation fee
 */
const calculateCancellationFee = (booking) => {
  const now = new Date();
  const bookingTime = new Date(booking.pickup.date);
  const hoursUntilBooking = (bookingTime - now) / (1000 * 60 * 60);

  if (hoursUntilBooking > 24) {
    return 0; // Free cancellation
  } else if (hoursUntilBooking > 12) {
    return booking.payment.amount * 0.5; // 50% fee
  } else {
    return booking.payment.amount; // Full fee
  }
};

module.exports = {
  calculateTripPrice,
  calculateCancellationFee,
};
