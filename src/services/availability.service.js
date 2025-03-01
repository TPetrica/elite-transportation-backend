const moment = require('moment');
const httpStatus = require('http-status');
const { Schedule, DateException } = require('../models');
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

  // Check if date has an exception
  async getDateException(date) {
    const requestedDate = moment(date).startOf('day');
    return DateException.findOne({
      date: {
        $gte: requestedDate.toDate(),
        $lt: requestedDate.clone().add(1, 'day').toDate(),
      },
    });
  }

  async getAvailableTimeSlots(date, excludeBookingId = null) {
    try {
      const requestedDate = moment(date);
      logger.info(`Processing available time slots for date: ${requestedDate.format('YYYY-MM-DD')}`);

      if (!requestedDate.isValid()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date format');
      }

      // Check for date exception first
      const dateException = await this.getDateException(date);

      if (dateException) {
        logger.debug(`Found date exception for ${requestedDate.format('YYYY-MM-DD')}:`, {
          isEnabled: dateException.isEnabled,
          type: dateException.type,
          timeRanges: dateException.timeRanges || [],
        });

        // If date is closed (not enabled), return empty slots
        if (!dateException.isEnabled) {
          logger.debug(`Date ${requestedDate.format('YYYY-MM-DD')} is marked as closed`);
          return { availableSlots: [], exception: dateException };
        }

        // If custom hours type, use those time ranges instead of regular schedule
        if (dateException.type === 'custom-hours' && dateException.timeRanges?.length > 0) {
          // Use the custom time ranges from the exception
          const customSchedule = {
            isEnabled: true,
            timeRanges: dateException.timeRanges,
          };

          // Continue with the exception schedule
          return this.processAvailableSlots(requestedDate, customSchedule, excludeBookingId, dateException);
        }
      }

      // Get regular schedule for the requested day
      const dayOfWeek = requestedDate.day();
      const schedule = await Schedule.findOne({ dayOfWeek });

      logger.debug(`Retrieved schedule for day ${dayOfWeek}:`, {
        exists: !!schedule,
        isEnabled: schedule?.isEnabled,
        timeRanges: schedule?.timeRanges || [],
      });

      if (!schedule || !schedule.isEnabled) {
        logger.debug(`No schedule available for day ${dayOfWeek}`);
        return { availableSlots: [] };
      }

      return this.processAvailableSlots(requestedDate, schedule, excludeBookingId);
    } catch (error) {
      logger.error('Error in getAvailableTimeSlots:', error);
      throw error;
    }
  }

  async processAvailableSlots(requestedDate, schedule, excludeBookingId = null, dateException = null) {
    // Ensure the timeRanges array exists and is not empty
    if (!Array.isArray(schedule.timeRanges) || schedule.timeRanges.length === 0) {
      logger.debug(`No time ranges defined for schedule`);
      return { availableSlots: [] };
    }

    // Generate all possible slots
    const allSlots = this.generateTimeSlots();

    // Get existing bookings for the day
    const startOfDay = requestedDate.startOf('day').toDate();
    const endOfDay = requestedDate.endOf('day').toDate();

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

    const bookings = await Booking.find(query).select('pickup.time duration service');

    logger.debug(`Found ${bookings.length} bookings for ${requestedDate.format('YYYY-MM-DD')}`);

    // Get all blocked times based on bookings
    const blockedTimes = new Set();
    bookings.forEach((booking) => {
      const blockedRange = this.getBlockedTimeRange(booking.pickup.time);
      blockedRange.forEach((time) => blockedTimes.add(time));
    });

    logger.debug(`Total blocked times: ${blockedTimes.size}`);

    // Filter available slots
    const availableSlots = [];

    for (const time of allSlots) {
      // Check if within schedule
      let isWithinSchedule = false;
      for (const range of schedule.timeRanges) {
        const slotMinutes = this.timeToMinutes(time);
        const startMinutes = this.timeToMinutes(range.start);
        const endMinutes = this.timeToMinutes(range.end);

        if (slotMinutes >= startMinutes && slotMinutes <= endMinutes) {
          isWithinSchedule = true;
          break;
        }
      }

      // Check if blocked
      const isBlocked = blockedTimes.has(time);

      // Check if in past (with 2 hour buffer)
      const isInPast =
        requestedDate.isSame(moment(), 'day') &&
        moment(`${requestedDate.format('YYYY-MM-DD')} ${time}`).isSameOrBefore(moment().add(2, 'hours'));

      // Only add to available slots if all conditions are met
      if (isWithinSchedule && !isBlocked && !isInPast) {
        availableSlots.push(time);
      } else {
        logger.debug(`Time slot ${time} is unavailable:`, {
          isWithinSchedule,
          isBlocked,
          isInPast,
        });
      }
    }

    logger.info(`Returning ${availableSlots.length} available slots for ${requestedDate.format('YYYY-MM-DD')}`);

    return {
      availableSlots,
      exception: dateException,
    };
  }

  async checkTimeSlotAvailability(date, time, excludeBookingId = null) {
    try {
      const requestedDate = moment(date);
      logger.info(
        `Checking availability for date: ${requestedDate.format('YYYY-MM-DD')}, time: ${time}, excludeBookingId: ${
          excludeBookingId || 'none'
        }`
      );

      // First check for date exception
      const dateException = await this.getDateException(date);
      if (dateException) {
        // If date is not enabled (closed), time slot is not available
        if (!dateException.isEnabled) {
          logger.debug('Date is marked as closed in exception');
          return false;
        }

        // For custom hours, check against exception time ranges
        if (dateException.type === 'custom-hours') {
          let isWithinCustomRange = false;
          for (const range of dateException.timeRanges) {
            const slotMinutes = this.timeToMinutes(time);
            const startMinutes = this.timeToMinutes(range.start);
            const endMinutes = this.timeToMinutes(range.end);

            if (slotMinutes >= startMinutes && slotMinutes <= endMinutes) {
              isWithinCustomRange = true;
              break;
            }
          }

          if (!isWithinCustomRange) {
            logger.debug(`Time ${time} is outside of allowed custom schedule for the date`);
            return false;
          }
        }
      } else {
        // No exception, check regular schedule
        // Get schedule
        const dayOfWeek = requestedDate.day();
        const schedule = await Schedule.findOne({ dayOfWeek });

        logger.debug(`Schedule for day ${dayOfWeek}:`, {
          exists: !!schedule,
          isEnabled: schedule?.isEnabled,
          timeRanges: schedule?.timeRanges || [],
        });

        if (!schedule || !schedule.isEnabled) {
          logger.debug('Schedule not available');
          return false;
        }

        // Check if time is within allowed schedule
        let isWithinSchedule = false;
        for (const range of schedule.timeRanges) {
          const slotMinutes = this.timeToMinutes(time);
          const startMinutes = this.timeToMinutes(range.start);
          const endMinutes = this.timeToMinutes(range.end);

          if (slotMinutes >= startMinutes && slotMinutes <= endMinutes) {
            isWithinSchedule = true;
            break;
          }
        }

        if (!isWithinSchedule) {
          logger.debug(`Time ${time} is outside of allowed schedule`);
          return false;
        }
      }

      // Check existing bookings
      const startOfDay = requestedDate.startOf('day').toDate();
      const endOfDay = requestedDate.endOf('day').toDate();

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

      const bookings = await Booking.find(query).select('pickup.time duration _id');

      // Check if time is blocked by any booking
      const isBlocked = bookings.some((booking) => {
        const blockedRange = this.getBlockedTimeRange(booking.pickup.time);
        const isTimeBlocked = blockedRange.includes(time);

        if (isTimeBlocked) {
          logger.debug(`Time ${time} is blocked by booking at ${booking.pickup.time} (ID: ${booking._id})`);
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

  async updateSchedule(dayOfWeek, updateData) {
    try {
      const { timeRanges, isEnabled = true } = updateData;
      logger.info(`Updating schedule for day ${dayOfWeek}`, { timeRanges, isEnabled });

      // Validate time ranges
      if (timeRanges) {
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
      }

      const updateObj = {};
      if (timeRanges) updateObj.timeRanges = timeRanges;
      if (isEnabled !== undefined) updateObj.isEnabled = isEnabled;

      const schedule = await Schedule.findOneAndUpdate(
        { dayOfWeek },
        { $set: updateObj },
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

  async getSchedule() {
    return this.getFullSchedule();
  }
}

module.exports = new AvailabilityService();
