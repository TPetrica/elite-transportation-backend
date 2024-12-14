const { google } = require('googleapis');
const moment = require('moment');
const logger = require('../config/logger');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const credentials = {
  clientEmail: 'booking-calendar@luxury-transportation-444520.iam.gserviceaccount.com',
  privateKey:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCUY/ubxinlIr5z\nP3QaA67zxcXoER6f9Kfco6ECgkx8TX4uGiWw7QWNMabZ8mht6mIxqSVKjR4w29zT\nF+spOvKxuLHaLkxFGLiDb5BEYlz1gbn2EsVwcpGiNwn1txl4NYhROSn2nvFMCY23\nEJ/Dx59K/d8V6HaSkPGOZmpDp5PYmHDYh1akGi6ZxOBDICQpEOZjgQm36FlwV0PL\nIlEkjWX3Ce90VzXPzdIRvb8i6+/BA4ttOUT01FtjDh7sJuxazgS4764EYzF+s+HP\ndQEGoYY9a+EfvlYOXu0fsg9FpiHhWJKWnVA92FmXvZ/YsoyFoSUeGa6q4//PkYl1\nYEOwSu+9AgMBAAECggEABIcO4YdeC8NXApiiF/Th0H/0d/HP/6zbRTK/yw/cJMod\nnfl8X0CJc/4h5E6ZMTVbKxRluZsX4shOHZtl1PDUAEvYLyJM1OMaQwRhdYrpNttS\ntikyIKpA5Z8bEGmaDUj0aW2TzOt+sEWD6CQQw9qiOYt6cKZn1m3EDlvW02lKJQh3\nHkEfb7IjA0U++PcImqGZ+QtxEVu/1Rh5nqETTB4x0/FRIxye5G6JX3ZnlzRreMrM\ntuX7hxbxab6EO+cDdQkfvjGz1ZnWGnnpwLTpE9d6hwukT9G9PfEHvMLgLgtug52s\npWzp4H/XP5yeSiMq9rRqilFLKl39uP9FFSm8ix307wKBgQDEx9A8hG07Q9TStIoZ\nQfQRuhqPs9flWg2u3yPNo5ugUTVmZPR7grE95MIdNf0qkmRg93aYtb/cLMO/oAzJ\ntkLmxBLGcU0pew96h/X+aks4IAlMXysNG0Jk3jbvqEKlCOybx8D6doK079scqXGJ\nlwCzpzI+9nkZTHPZXHTYvtNLJwKBgQDBDCda/6j2UEAJk07aFwgZQ6yTwp/RIZet\nhIoR+k5R1OkdqAW3lasNh3mou34OqaBCpUSdBDTjClglE+G3NZekWys86gHgdQqs\nUbP4EO6izNfFQ7HajglZKYacUGrKsyRxXzrDtqC7zlECs0DI/u/UeAq+tDg/e96K\nQNRh5MAMewKBgQCv/yJArhRgGDflyDFni7R2kmOlOS2UZOmuCMcl6fmL9nXzQcHk\nIazSdaIjrCDlDY+Xply9EnkpvCPLZKNrWYcWjDFaqQVhXz4l0ipyxLDH3udSFiAU\nFdhZDOJHkM8iegvc/Fid6pbWq1vmk6oHbDXleFmZNKp0tQs8UdPz8yBZqwKBgCBB\n7qWXCN23xSuUcN2icZj/JOw/3kKs0VKOTh/46nNkF1v8QpBNsxp8o8idI9BBaeUZ\nBqESHeA+T0JK0zGxA9jT3yK7m3qtNA5dTKxL8ARGJFvzFtoFV+yNMtAV4/JhAtrq\n5b/kWXFoZUMFPvMXHm4rbOg25xs8kJAbiyGcfrbXAoGAapkwG7V+9cUE+PalX1Pq\nKG5Xz6K/fBSYu4R8C93xrVpTAoTFz2qBvBQnjy0TWcyPOaQoF3sAMa5os/5M/dMz\nfkpbCHLJdVZmE2HXq9r8ZiBbRsMVtFva/ec9oZoounhTevn3ZDwka2g1WwBSDpt/\nhqR+wZBbZafQn7WDrNyhWfM=\n-----END PRIVATE KEY-----\n',
  calendarId: 'da4bb71699496f6041aaa66db7ed471747bb3f398766133eb1c2033f2f225ba2@group.calendar.google.com',
};

class CalendarService {
  constructor() {
    try {
      // Initialize auth using credentials
      this.auth = new google.auth.JWT(credentials.clientEmail, null, credentials.privateKey, [
        'https://www.googleapis.com/auth/calendar',
      ]);

      this.calendar = google.calendar({
        version: 'v3',
        auth: this.auth,
      });

      this.calendarId = credentials.calendarId;
    } catch (error) {
      logger.error('Failed to initialize calendar service:', error);
      throw error;
    }
  }

  async getAvailableTimeSlots(date) {
    try {
      logger.info(`Getting available time slots for date: ${date}`);

      const startTime = moment(date).startOf('day').add(17, 'hours');
      const endTime = moment(date).startOf('day').add(22, 'hours');

      logger.info(`Time range: ${startTime.format('YYYY-MM-DD HH:mm')} to ${endTime.format('YYYY-MM-DD HH:mm')}`);

      // Get existing events for the day
      logger.info(`Fetching events from Google Calendar for ${date}`);
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items;
      logger.info(`Found ${events.length} existing events for the day`);

      // Map busy slots from events
      const busySlots = events.map((event) => ({
        start: moment(event.start.dateTime),
        end: moment(event.end.dateTime),
      }));

      logger.info(
        'Busy slots:',
        busySlots.map((slot) => ({
          start: slot.start.format('HH:mm'),
          end: slot.end.format('HH:mm'),
        }))
      );

      // Generate all possible time slots
      const slots = [];
      let currentSlot = moment(startTime);

      logger.info('Generating available time slots...');
      const now = moment();
      const selectedDate = moment(date).startOf('day');
      const today = moment().startOf('day');

      while (currentSlot < endTime) {
        const currentTime = currentSlot.format('HH:mm');
        logger.info(`Checking slot: ${currentTime}`);

        const isAvailable = this.isSlotAvailable(currentSlot, busySlots);
        // Only apply the 2-hour buffer for today's slots
        const isValid = selectedDate.isSame(today) ? currentSlot.isAfter(now.add(2, 'hours')) : true;

        logger.info(`Slot ${currentTime} - Available: ${isAvailable}, Valid: ${isValid}`);

        if (isAvailable && isValid) {
          slots.push(currentTime);
          logger.info(`Added slot: ${currentTime}`);
        }

        currentSlot = moment(currentSlot).add(30, 'minutes');
      }

      logger.info(`Total available slots found: ${slots.length}`);
      logger.info('Available slots:', slots);

      return slots;
    } catch (error) {
      logger.error('Error fetching calendar availability:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch available time slots');
    }
  }

  isSlotAvailable(slotTime, busySlots) {
    const slotStart = moment(slotTime);
    const slotEnd = moment(slotTime).add(30, 'minutes');

    return !busySlots.some((busy) => {
      return (
        (slotStart.isSameOrAfter(busy.start) && slotStart.isBefore(busy.end)) ||
        (slotEnd.isAfter(busy.start) && slotEnd.isSameOrBefore(busy.end)) ||
        (slotStart.isSameOrBefore(busy.start) && slotEnd.isSameOrAfter(busy.end))
      );
    });
  }

  async createCalendarEvent(booking) {
    try {
      const event = {
        summary: `Booking #${booking.bookingNumber}`,
        description: `Pickup: ${booking.pickup.address}\nDropoff: ${booking.dropoff.address}\nPassenger: ${booking.passengerDetails.firstName} ${booking.passengerDetails.lastName}`,
        start: {
          dateTime: moment(`${booking.pickup.date} ${booking.pickup.time}`).toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: moment(`${booking.pickup.date} ${booking.pickup.time}`).add(30, 'minutes').toISOString(),
          timeZone: 'UTC',
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        resource: event,
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating calendar event:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create calendar event');
    }
  }

  async updateCalendarEvent(eventId, updatedBooking) {
    try {
      const event = {
        summary: `Booking #${updatedBooking.bookingNumber}`,
        description: `Pickup: ${updatedBooking.pickup.address}\nDropoff: ${updatedBooking.dropoff.address}\nPassenger: ${updatedBooking.passengerDetails.firstName} ${updatedBooking.passengerDetails.lastName}`,
        start: {
          dateTime: moment(`${updatedBooking.pickup.date} ${updatedBooking.pickup.time}`).toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: moment(`${updatedBooking.pickup.date} ${updatedBooking.pickup.time}`).add(30, 'minutes').toISOString(),
          timeZone: 'UTC',
        },
      };

      const response = await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        resource: event,
      });

      return response.data;
    } catch (error) {
      logger.error('Error updating calendar event:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update calendar event');
    }
  }

  async deleteCalendarEvent(eventId) {
    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: eventId,
      });
    } catch (error) {
      logger.error('Error deleting calendar event:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete calendar event');
    }
  }

  async testConnection() {
    try {
      const now = moment();
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: now.toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return {
        success: true,
        events: response.data.items,
      };
    } catch (error) {
      logger.error('Calendar test failed:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Calendar connection failed: ${error.message}`);
    }
  }

  async checkTimeSlotAvailability(date, time) {
    try {
      const startTime = moment(`${date} ${time}`);
      const endTime = moment(startTime).add(30, 'minutes');

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
      });

      return response.data.items.length === 0;
    } catch (error) {
      logger.error('Error checking time slot availability:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to check time slot availability');
    }
  }
}

module.exports = new CalendarService();
