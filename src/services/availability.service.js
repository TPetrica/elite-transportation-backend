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

  getBlockedTimeRange(bookingTime, duration = 90) {
    const bookingMinutes = this.timeToMinutes(bookingTime);

    // Block 30 minutes before (preparation and travel to pickup)
    const blockedStart = Math.max(0, bookingMinutes - 30);

    // Block 60 minutes after (service time + return/preparation)
    const blockedEnd = Math.min(24 * 60 - 1, bookingMinutes + 60);

    logger.debug(`Calculating blocked range for booking at ${bookingTime}:`, {
      bookingMinutes,
      blockedStart: this.minutesToTime(blockedStart),
      blockedEnd: this.minutesToTime(blockedEnd),
      totalBlockedDuration: `${(blockedEnd - blockedStart) / 60} hours`,
    });

    const blockedTimes = [];
    for (let i = blockedStart; i <= blockedEnd; i += 30) {
      blockedTimes.push(this.minutesToTime(i));
    }

    logger.debug('Generated blocked time slots:', {
      bookingTime,
      blockedTimes,
      totalSlots: blockedTimes.length,
    });

    return blockedTimes;
  }

  generateTimeSlots() {
    const slots = [];
    const INTERVAL = 30;
    const MINUTES_IN_DAY = 24 * 60;

    for (let minutes = 0; minutes < MINUTES_IN_DAY; minutes += INTERVAL) {
      slots.push(this.minutesToTime(minutes));
    }

    return slots;
  }

  async getAvailableTimeSlots(date) {
    try {
      const requestedDate = moment(date);
      logger.info(`Processing available time slots for date: ${requestedDate.format('YYYY-MM-DD')}`);

      if (!requestedDate.isValid()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date format');
      }

      // Get schedule for the requested day
      const dayOfWeek = requestedDate.day();
      const schedule = await Schedule.findOne({ dayOfWeek });

      if (!schedule || !schedule.isEnabled) {
        logger.debug(`No schedule available for day ${dayOfWeek}`);
        return { availableSlots: [] };
      }

      // Generate all possible slots
      const allSlots = this.generateTimeSlots();

      // Get existing bookings for the day
      const startOfDay = requestedDate.startOf('day').toDate();
      const endOfDay = requestedDate.endOf('day').toDate();

      const bookings = await Booking.find({
        'pickup.date': {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: { $nin: ['cancelled'] },
      }).select('pickup.time duration service');

      logger.debug('Found existing bookings:', {
        date: requestedDate.format('YYYY-MM-DD'),
        bookingsCount: bookings.length,
        bookings: bookings.map((b) => ({
          time: b.pickup.time,
          service: b.service,
        })),
      });

      // Get all blocked times based on bookings
      const blockedTimes = new Set();
      bookings.forEach((booking) => {
        const blockedRange = this.getBlockedTimeRange(booking.pickup.time);
        blockedRange.forEach((time) => blockedTimes.add(time));
      });

      logger.debug('Total blocked times:', {
        count: blockedTimes.size,
        times: Array.from(blockedTimes).sort(),
      });

      // Filter available slots
      const availableSlots = allSlots.filter((time) => {
        // Check if within schedule
        const isWithinSchedule = schedule.timeRanges.some((range) => {
          const slotMinutes = this.timeToMinutes(time);
          const startMinutes = this.timeToMinutes(range.start);
          const endMinutes = this.timeToMinutes(range.end);
          return slotMinutes >= startMinutes && slotMinutes <= endMinutes;
        });

        // Check if blocked
        const isBlocked = blockedTimes.has(time);

        // Check if in past (with 2 hour buffer)
        const isInPast =
          requestedDate.isSame(moment(), 'day') &&
          moment(`${requestedDate.format('YYYY-MM-DD')} ${time}`).isSameOrBefore(moment().add(2, 'hours'));

        if (!isWithinSchedule || isBlocked || isInPast) {
          logger.debug(`Time slot ${time} is unavailable:`, {
            isWithinSchedule,
            isBlocked,
            isInPast,
          });
          return false;
        }

        return true;
      });

      logger.info(`Returning ${availableSlots.length} available slots for ${requestedDate.format('YYYY-MM-DD')}`);
      return { availableSlots };
    } catch (error) {
      logger.error('Error in getAvailableTimeSlots:', error);
      throw error;
    }
  }

  async checkTimeSlotAvailability(date, time) {
    try {
      const requestedDate = moment(date);
      logger.info(`Checking availability for date: ${requestedDate.format('YYYY-MM-DD')}, time: ${time}`);

      // Get schedule
      const dayOfWeek = requestedDate.day();
      const schedule = await Schedule.findOne({ dayOfWeek });

      if (!schedule || !schedule.isEnabled) {
        logger.debug('Schedule not available');
        return false;
      }

      // Check existing bookings
      const startOfDay = requestedDate.startOf('day').toDate();
      const endOfDay = requestedDate.endOf('day').toDate();

      const bookings = await Booking.find({
        'pickup.date': {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: { $nin: ['cancelled'] },
      }).select('pickup.time duration');

      // Check if time is blocked by any booking
      const isBlocked = bookings.some((booking) => {
        const blockedRange = this.getBlockedTimeRange(booking.pickup.time);
        const isTimeBlocked = blockedRange.includes(time);

        if (isTimeBlocked) {
          logger.debug(`Time ${time} is blocked by booking at ${booking.pickup.time}`);
        }

        return isTimeBlocked;
      });

      if (isBlocked) {
        return false;
      }

      // Check if time is in the past
      const slotTime = moment(`${requestedDate.format('YYYY-MM-DD')} ${time}`);
      const isPastTime = slotTime.isSameOrBefore(moment().add(2, 'hours'));

      const isAvailable = !isPastTime;
      logger.debug(`Time slot ${time} availability check result:`, { isAvailable });

      return isAvailable;
    } catch (error) {
      logger.error('Error in checkTimeSlotAvailability:', error);
      throw error;
    }
  }

  async releaseTimeSlot(bookingId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
      }
      // No actual action needed as the booking status will be updated to 'cancelled'
      // which is automatically excluded from availability checks
      return true;
    } catch (error) {
      logger.error('Error in releaseTimeSlot:', error);
      throw error;
    }
  }

  async updateSchedule(dayOfWeek, timeRanges, isEnabled = true) {
    try {
      logger.info(`Updating schedule for day ${dayOfWeek}`, { timeRanges, isEnabled });

      // Validate time ranges
      for (const range of timeRanges) {
        const startMinutes = this.timeToMinutes(range.start);
        const endMinutes = this.timeToMinutes(range.end);

        if (startMinutes >= endMinutes) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Invalid time range: start time (${range.start}) must be before end time (${range.end})`
          );
        }
      }

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
      return schedule;
    } catch (error) {
      logger.error('Error in getFullSchedule:', error);
      throw error;
    }
  }
}

module.exports = new AvailabilityService();
