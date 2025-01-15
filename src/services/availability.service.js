const moment = require('moment');
const httpStatus = require('http-status');
const Schedule = require('../models/schedule.model');
const Booking = require('../models/booking.model');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

class AvailabilityService {
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  isTimeInRanges(time, ranges) {
    const timeMinutes = this.timeToMinutes(time);
    return ranges.some((range) => {
      const startMinutes = this.timeToMinutes(range.start);
      const endMinutes = this.timeToMinutes(range.end);
      return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    });
  }

  generateTimeSlots(ranges) {
    const slots = [];
    const INTERVAL = 90;
    const MINUTES_IN_DAY = 24 * 60;

    // Generate slots for every 90 minutes
    for (let minutes = 0; minutes < MINUTES_IN_DAY; minutes += INTERVAL) {
      const time = this.minutesToTime(minutes);
      if (this.isTimeInRanges(time, ranges)) {
        slots.push(time);
      }
    }

    logger.info(`Generated ${slots.length} time slots with 90-minute intervals`);
    return slots;
  }

  async getAvailableTimeSlots(date) {
    try {
      const requestedDate = moment(date);
      logger.info(`Getting available time slots for date: ${requestedDate.format('YYYY-MM-DD')}`);

      if (!requestedDate.isValid()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date format');
      }

      // Get schedule for the day of week
      const dayOfWeek = requestedDate.day();
      const schedule = await Schedule.findOne({ dayOfWeek, isEnabled: true });

      logger.info(`Found schedule for day ${dayOfWeek}:`, schedule);

      if (!schedule || !schedule.timeRanges.length) {
        logger.info(`No schedule found for day ${dayOfWeek}`);
        return { availableSlots: [] };
      }

      // Generate all possible slots for the day
      const allSlots = this.generateTimeSlots(schedule.timeRanges);

      // Get booked slots
      const startOfDay = requestedDate.startOf('day').toDate();
      const endOfDay = requestedDate.endOf('day').toDate();

      const bookings = await Booking.find({
        'pickup.date': {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: { $nin: ['cancelled'] },
      }).select('pickup.time');

      const bookedTimes = bookings.map((booking) => booking.pickup.time);
      logger.info(`Found ${bookedTimes.length} booked slots for ${requestedDate.format('YYYY-MM-DD')}`);

      // Filter out booked slots and past times
      const availableSlots = allSlots.filter((time) => {
        // Check if slot is not booked
        if (bookedTimes.includes(time)) {
          logger.debug(`Slot ${time} is already booked`);
          return false;
        }

        // If date is today, filter out past times plus 2 hours buffer
        if (requestedDate.isSame(moment(), 'day')) {
          const slotTime = moment(`${requestedDate.format('YYYY-MM-DD')} ${time}`);
          const isAfterBuffer = slotTime.isAfter(moment().add(2, 'hours'));
          if (!isAfterBuffer) {
            logger.debug(`Slot ${time} is in the past or within 2 hour buffer`);
          }
          return isAfterBuffer;
        }

        return true;
      });

      logger.info(`Returning ${availableSlots.length} available slots`);
      return { availableSlots };
    } catch (error) {
      logger.error('Error in getAvailableTimeSlots:', error);
      throw error;
    }
  }

  async checkTimeSlotAvailability(date, time) {
    try {
      logger.info(`Checking availability for date: ${date}, time: ${time}`);

      const requestedDate = moment(date).startOf('day');
      const dayOfWeek = requestedDate.day();

      // Check if time slot is within schedule
      const schedule = await Schedule.findOne({ dayOfWeek, isEnabled: true });
      if (!schedule || !this.isTimeInRanges(time, schedule.timeRanges)) {
        logger.info(`Time ${time} is not within scheduled ranges for day ${dayOfWeek}`);
        return false;
      }

      // Check if slot is already booked
      const booking = await Booking.findOne({
        'pickup.date': requestedDate.toDate(),
        'pickup.time': time,
        status: { $nin: ['cancelled'] },
      });

      const isAvailable = !booking;
      logger.info(`Time slot availability: ${isAvailable}`);
      return isAvailable;
    } catch (error) {
      logger.error('Error in checkTimeSlotAvailability:', error);
      throw error;
    }
  }

  async updateSchedule(dayOfWeek, timeRanges, isEnabled = true) {
    try {
      logger.info(`Updating schedule for day ${dayOfWeek}`, { timeRanges, isEnabled });

      const schedule = await Schedule.findOneAndUpdate(
        { dayOfWeek },
        {
          $set: {
            timeRanges,
            isEnabled,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      logger.info(`Successfully updated schedule for day ${dayOfWeek}`);
      return schedule;
    } catch (error) {
      logger.error('Error in updateSchedule:', error);
      throw error;
    }
  }

  async getFullSchedule() {
    try {
      logger.info('Fetching full schedule');
      const schedule = await Schedule.find().sort('dayOfWeek');
      logger.info(`Found ${schedule.length} schedule entries`);
      return schedule;
    } catch (error) {
      logger.error('Error in getFullSchedule:', error);
      throw error;
    }
  }
}

module.exports = new AvailabilityService();
