const moment = require('moment');
const httpStatus = require('http-status');
const Booking = require('../models/booking.model');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

class AvailabilityService {
  generateTimeSlots() {
    const slots = [];
    const startHour = 17; // 5 PM
    const endHour = 22; // 10 PM
    const interval = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
      }
    }

    logger.info(`Generated ${slots.length} possible time slots: ${slots.join(', ')}`);
    return slots;
  }

  async getBookedSlots(date, excludeBookingId = null) {
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();

    logger.info(`Checking booked slots between ${startOfDay} and ${endOfDay}`);

    const query = {
      'pickup.date': {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $nin: ['cancelled'] },
    };

    // Exclude the current booking if ID is provided
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const bookings = await Booking.find(query).select('pickup.time');
    const bookedSlots = bookings.map((booking) => booking.pickup.time);
    logger.info(`Found ${bookedSlots.length} booked slots: ${bookedSlots.join(', ')}`);

    return bookedSlots;
  }

  async getAvailableTimeSlots(date) {
    try {
      const requestedDate = moment(date);
      logger.info(`Parsed date: ${requestedDate.format('YYYY-MM-DD')}`);

      if (!requestedDate.isValid()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date format. Use YYYY-MM-DD');
      }

      const today = moment().startOf('day');
      if (requestedDate.isBefore(today)) {
        return { availableSlots: [] };
      }

      if (requestedDate.isAfter(moment().add(3, 'months'))) {
        return { availableSlots: [] };
      }

      let availableSlots = this.generateTimeSlots();
      const bookedSlots = await this.getBookedSlots(requestedDate.toDate());
      availableSlots = availableSlots.filter((slot) => !bookedSlots.includes(slot));

      if (requestedDate.isSame(moment(), 'day')) {
        const twoHoursFromNow = moment().add(2, 'hours');
        availableSlots = availableSlots.filter((slot) => {
          const slotTime = moment(`${requestedDate.format('YYYY-MM-DD')} ${slot}`, 'YYYY-MM-DD HH:mm');
          return slotTime.isAfter(twoHoursFromNow);
        });
      }

      return { availableSlots };
    } catch (error) {
      logger.error('Error in getAvailableTimeSlots:', error);
      throw error;
    }
  }

  async checkTimeSlotAvailability(date, time, excludeBookingId = null) {
    try {
      logger.info(`Checking availability for date: ${date}, time: ${time}`);

      const requestedDate = moment(date);
      if (!requestedDate.isValid()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date format. Use YYYY-MM-DD');
      }

      if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid time format. Use HH:mm');
      }

      const timeHour = parseInt(time.split(':')[0]);
      if (timeHour < 17 || timeHour >= 22) {
        return false;
      }

      const query = {
        'pickup.date': requestedDate.toDate(),
        'pickup.time': time,
        status: { $nin: ['cancelled'] },
      };

      // Exclude the current booking if ID is provided
      if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
      }

      const existingBooking = await Booking.findOne(query);
      return !existingBooking;
    } catch (error) {
      logger.error('Error in checkTimeSlotAvailability:', error);
      throw error;
    }
  }

  async bookTimeSlot(date, time, bookingId) {
    try {
      logger.info(`Booking time slot - Date: ${date}, Time: ${time}, Booking: ${bookingId}`);

      // When checking availability, exclude the current booking
      const isAvailable = await this.checkTimeSlotAvailability(date, time, bookingId);
      if (!isAvailable) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Time slot is not available');
      }

      // No need to do anything else since the booking is already created
      logger.info(`Successfully booked time slot for booking ${bookingId}`);
      return true;
    } catch (error) {
      logger.error('Error booking time slot:', error);
      throw error;
    }
  }

  async releaseTimeSlot(bookingId) {
    try {
      logger.info(`Releasing time slot for booking: ${bookingId}`);

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
      }

      // Since we're not using a separate TimeSlot collection,
      // we just need to verify the booking exists
      logger.info(`Successfully released time slot for booking ${bookingId}`);
      return true;
    } catch (error) {
      logger.error('Error releasing time slot:', error);
      throw error;
    }
  }
}

module.exports = new AvailabilityService();
