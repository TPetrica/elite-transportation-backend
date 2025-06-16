const { google } = require('googleapis');
const moment = require('moment-timezone');
const logger = require('../config/logger');

const CALENDAR_CREDENTIALS = {
  type: 'service_account',
  project_id: 'elite-transportation-450818',
  private_key_id: '42b1d519f894d739f203aef96dd3f317efbdae8a',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCO8uAGM4dZELRr\nn3tZ9tHGvfRsK7o5k4uWPK0MdF2t+60ls6aCsWJxywVeIU7KbCYdSb85bWbGnX3H\nt05O5tW0tRJkbUh1rBLrTdvzVz2DI2kxtT6DFR7XsEuBOVh9/9/IW9woNRpnnR3H\n5c9JlFme0SEi5c9gDc2J37570c5TlIL15Vd1FiLuxbFagkjiNDCEuw2fzkfPN77u\nmlKyIK3TPyJGkYcg04ai9eEZz+hwskzSH5fr7s0DrZBc5LzCN9wR1EcuZP47w6E5\n/Vk2nOiKsLKs6zA71lYVY02kao1rXVAm5fNS7WT1twG3NWm/WFag5+zHGSerQTBs\nIeh1LXdjAgMBAAECggEADguIqFioFpUAwnGdKzXdiaNAoIoxVhaMSKV13pCRDcGk\nfbJSN2rEqz072Jz5gq5allZtyUTZrBptm9GuX4E9rm97ZaOj0sVRPI5eAIw/Tnhh\nuGZq7x0u9m6WFJXKVI2Z8rPX2e7RxSwXm3xAatB+d7oWK+QcL9Swr7hsnPonGr4J\n+9NHoMPXogIkiRddytxT24mMLsHZg/gNthf5HnjjO14QksDdTnvWK0Rc0VIAvS93\nV6r0Bc8xJl8ZiEu7lLssQFneT4qfqQxWr0SwuUooaf/KpgRoXsysGe4NC7lp3aGk\nUVaPmM1+9Zadu4JR9I+2F6vqwwDcpPOl0+VD1qxiiQKBgQDGmhOFemWAW8vGnpoO\nbbF6UAUoMCCms59PjjnGv7zMgXW4c0cR6ggQtmBWKGVRyt4mTZNwKpp8jjo862J4\nDZ+aTqUHORZPcXTX3o5wYZLc4hy4c1DfeuGHoi4tvzbZ8YTGov7IQod5XHMRT7++\n8f+Z3ncXb1biYxZsrYEz1ZbmKwKBgQC4QzMiG2rkgooFHCKwRY2cEj0WNlPyfzkV\nr6a6iYgXI9D0zVfTtV/YsF1gXOtCN4kVA0sXrtxG9gboGQvZ8LXFMncmZ6Z1IS0a\ndpQrIJToV3kLBD2N5d5hiFGjQqiHeFrLnkDV3T9YjG8pZ1TnCBgB3+S6D0OldEJF\nBLjE2LkPqQKBgDwPHjYwZH+jwwUms3oHjDNr/ZNAsq8XBOd/IFPNaiACSoJkQirV\ntmivboS/pJxOmE3HCf5Ss/NU46HGoTmjDRASFnAPwIJ30hjyEetEZrBrpLnXDa73\nrzpgPkzRVZolIr0bT6dqDyQRZC7pChiJgH2cvDEXF5RQ2Ng2xCrTvdWPAoGBAKFQ\ne5CNjkxVmD2W/ytxCOOs9/vdPisbhD9fEslWJGWVvpbCuvQmYq3S4Ty+vFuxQPq7\ncl9ef4xEUZGac8yuNoRYhQWDUrBShikXzOng0VyDT/38DWOP7dtXO5mBfwdyr5J5\njmttEcsUzzDhPOwyIsppV9YoDOHp4SaJVrVGwuVZAoGARm/l6cPUJxWHmc6J8M6s\nzEUfm25bQNubMtsq9zTXzbg5A0s/EG1vHT/At6Un1gZrmPfmDMDolJo5Fn5yDaxP\n863G1OSHNszFPHXAFsBwj/smK6RPbbzPf8hJPVA9qIMnTBkk+L20ZTbDbsTB4e8R\nMnOegyvOGICkk4k2Gt85EBU=\n-----END PRIVATE KEY-----\n',
  client_email: 'elite-transportation@elite-transportation-450818.iam.gserviceaccount.com',
  client_id: '112764763379658178421',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/elite-transportation%40elite-transportation-450818.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com',
};

const CALENDAR_ID = 'elitetransportationpc@gmail.com';
// Utah is in Mountain Time Zone
const TIMEZONE = 'America/Denver';

class CalendarService {
  constructor() {
    try {
      this.auth = new google.auth.GoogleAuth({
        credentials: CALENDAR_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      this.calendar = google.calendar({
        version: 'v3',
        auth: this.auth,
      });

      this.calendarId = CALENDAR_ID;

      logger.info('Calendar service initialized');
    } catch (error) {
      logger.error('Failed to initialize calendar service:', error);
      throw error;
    }
  }

  async createEvent(booking) {
    try {
      const events = [];
      
      // Create first trip event
      const firstEvent = await this.createSingleEvent(booking, false);
      if (firstEvent) events.push(firstEvent);
      
      // Create return trip event if it's a round trip
      if (booking.isRoundTrip && booking.returnDetails) {
        const returnEvent = await this.createSingleEvent(booking, true);
        if (returnEvent) events.push(returnEvent);
      }
      
      return events;
    } catch (error) {
      logger.error('Error creating calendar events:', {
        error: error.message,
        bookingNumber: booking.bookingNumber,
        stack: error.stack,
      });
      return [];
    }
  }
  
  async createSingleEvent(booking, isReturn = false) {
    try {
      let pickupDate, pickupTime, pickupAddress, dropoffAddress;
      
      if (isReturn) {
        // Use return trip details
        pickupDate = moment(booking.returnDetails.date).format('YYYY-MM-DD');
        pickupTime = booking.returnDetails.time;
        pickupAddress = booking.returnDetails.pickupAddress;
        dropoffAddress = booking.returnDetails.dropoffAddress;
      } else {
        // Use original trip details
        // Parse date as UTC to avoid timezone shifts
        const dateObj = new Date(booking.pickup.date);
        pickupDate = moment.utc(dateObj).format('YYYY-MM-DD');
        pickupTime = booking.pickup.time;
        pickupAddress = booking.pickup.address;
        dropoffAddress = booking.dropoff.address;
      }

      // Ensure time is in 24-hour format (HH:mm)
      // The booking service should have already converted it, but let's be safe
      if (pickupTime.includes('AM') || pickupTime.includes('PM')) {
        // Convert from 12-hour to 24-hour format
        const time12h = moment(pickupTime, ['h:mm A', 'hh:mm A'], true);
        if (time12h.isValid()) {
          pickupTime = time12h.format('HH:mm');
        }
      }

      // Create the datetime - parse as local time in the Mountain Time zone (Utah)
      const pickupDateTime = moment.tz(`${pickupDate} ${pickupTime}`, 'YYYY-MM-DD HH:mm', TIMEZONE);

      logger.info(`Creating ${isReturn ? 'return' : 'initial'} event with datetime:`, {
        originalDate: isReturn ? booking.returnDetails.date : booking.pickup.date,
        formattedDate: pickupDate,
        time: pickupTime,
        parsedTime: pickupDateTime.format('YYYY-MM-DD HH:mm:ss'),
        timezone: TIMEZONE,
        combined: pickupDateTime.format(),
      });

      if (!pickupDateTime.isValid()) {
        throw new Error(`Invalid date/time format. Date: ${pickupDate}, Time: ${pickupTime}`);
      }

      const endDateTime = moment(pickupDateTime).add(30, 'minutes');

      const event = {
        summary: `Ride #${booking.bookingNumber}${isReturn ? ' (Return)' : ''}`,
        description: `
Pickup: ${pickupAddress}
Dropoff: ${dropoffAddress}
Flight Number: ${!isReturn && booking.pickup.flightNumber ? booking.pickup.flightNumber : 'N/A'}

Passenger Details:
- Name: ${booking.passengerDetails.firstName} ${booking.passengerDetails.lastName}
- Phone: ${booking.passengerDetails.phone || 'N/A'}
- Email: ${booking.email}
- Passengers: ${booking.passengerDetails.passengers}
- Luggage: ${booking.passengerDetails.luggage}
${
  booking.passengerDetails.specialRequirements
    ? '- Special Requirements: ' + booking.passengerDetails.specialRequirements
    : ''
}

Service: ${booking.service}${isReturn ? ' (Return Trip)' : ''}
Distance: ${booking.distance.miles} miles
Duration: ${booking.duration}
Amount: $${booking.payment.amount}
        `.trim(),
        start: {
          dateTime: pickupDateTime.format('YYYY-MM-DDTHH:mm:ss'),
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: endDateTime.format('YYYY-MM-DDTHH:mm:ss'),
          timeZone: TIMEZONE,
        },
        // Color coding based on service
        colorId:
          booking.service === 'from-airport'
            ? '9' // Purple for airport pickups
            : booking.service === 'to-airport'
            ? '7' // Red for airport dropoffs
            : '1', // Blue for others
      };

      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        resource: event,
      });

      logger.info(`Calendar ${isReturn ? 'return' : 'initial'} event created successfully:`, {
        bookingNumber: booking.bookingNumber,
        eventId: response.data.id,
        link: response.data.htmlLink,
        isReturn,
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating calendar event:', {
        error: error.message,
        bookingNumber: booking.bookingNumber,
        pickupDate: booking.pickup.date,
        pickupTime: booking.pickup.time,
        stack: error.stack,
      });
      return null;
    }
  }
}

module.exports = new CalendarService();
