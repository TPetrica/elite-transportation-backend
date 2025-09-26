const cron = require('node-cron');
const moment = require('moment-timezone');
const { Booking } = require('../models');
const emailService = require('../services/email/emailService');
const logger = require('../config/logger');

const TIMEZONE = 'America/Denver'; // Mountain Time

/**
 * Send return trip reminder emails
 * Runs daily at 10 AM Mountain Time
 */
const sendReturnTripReminders = async () => {
  try {
    logger.info('Starting return trip reminder job');
    
    // Get tomorrow's date in Mountain Time
    const tomorrow = moment().tz(TIMEZONE).add(1, 'day').startOf('day');
    const dayAfter = moment().tz(TIMEZONE).add(2, 'days').startOf('day');
    
    // Find bookings with return trips tomorrow that haven't been reminded
    const bookingsWithReturn = await Booking.find({
      'returnDetails.date': {
        $gte: tomorrow.toDate(),
        $lt: dayAfter.toDate()
      },
      'returnDetails.reminderSent': { $ne: true },
      'isRoundTrip': true,
      'status': { $ne: 'cancelled' }
    }).populate('extras.item');
    
    logger.info(`Found ${bookingsWithReturn.length} bookings with return trips tomorrow`);
    
    for (const booking of bookingsWithReturn) {
      try {
        // Prepare booking data for email template
        const emailBookingData = {
          bookingNumber: booking.bookingNumber,
          service: 'to-airport', // Return trip is usually to airport
          pickup: {
            address: booking.returnDetails.pickupAddress,
            date: booking.returnDetails.date,
            time: booking.returnDetails.time,
            coordinates: booking.returnDetails.pickupCoordinates
          },
          dropoff: {
            address: booking.returnDetails.dropoffAddress,
            coordinates: booking.returnDetails.dropoffCoordinates
          },
          passengerDetails: {
            ...booking.passengerDetails,
            email: booking.email // Add email to passengerDetails for template compatibility
          },
          distance: booking.distance,
          duration: booking.duration,
          extras: booking.extras,
          pricing: booking.pricing,
          payment: booking.payment
        };
        
        // Send reminder email using appropriate template
        const pickupIsAirport = booking.returnDetails.pickupAddress?.toLowerCase().includes('airport');
        const dropoffIsAirport = booking.returnDetails.dropoffAddress?.toLowerCase().includes('airport');
        
        // Determine service type based on locations
        if (!pickupIsAirport && dropoffIsAirport) {
          emailBookingData.service = 'to-airport';
        } else if (pickupIsAirport && !dropoffIsAirport) {
          emailBookingData.service = 'from-airport';
        } else {
          emailBookingData.service = 'private';
        }
        
        // Send reminder email
        await emailService.sendBookingConfirmationEmail(
          booking.email,
          emailBookingData,
          'Return Trip Reminder - '
        );
        
        // Mark reminder as sent
        await Booking.findByIdAndUpdate(booking._id, {
          'returnDetails.reminderSent': true
        });
        
        logger.info(`Return trip reminder sent for booking ${booking.bookingNumber}`);
      } catch (error) {
        logger.error(`Failed to send return reminder for booking ${booking.bookingNumber}:`, error);
      }
    }
    
    logger.info('Return trip reminder job completed');
  } catch (error) {
    logger.error('Error in return trip reminder job:', error);
  }
};

/**
 * Initialize cron jobs
 */
const initializeCronJobs = () => {
  // Schedule return trip reminders for 10 AM Mountain Time daily
  cron.schedule('0 10 * * *', sendReturnTripReminders, {
    timezone: TIMEZONE
  });
  
  logger.info('Cron jobs initialized');
};

module.exports = {
  initializeCronJobs,
  sendReturnTripReminders // Export for testing
};