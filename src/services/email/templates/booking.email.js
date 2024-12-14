/**
 * Email templates for booking-related notifications
 */

const getBookingConfirmationEmail = (bookingNumber, passengerDetails) => {
  return {
    subject: `Booking Confirmation - ${bookingNumber}`,
    text: `
Dear ${passengerDetails.firstName} ${passengerDetails.lastName},

Thank you for booking with us. Your booking has been confirmed.

Booking Details:
- Booking Number: ${bookingNumber}
- Passenger Name: ${passengerDetails.firstName} ${passengerDetails.lastName}
- Number of Passengers: ${passengerDetails.passengers}
- Luggage: ${passengerDetails.luggage}

You can track your booking status using your booking number.

Best regards,
Your Transportation Team
    `,
  };
};

const getBookingCancellationEmail = (bookingNumber) => {
  return {
    subject: `Booking Cancellation - ${bookingNumber}`,
    text: `
Your booking ${bookingNumber} has been cancelled.

If you have any questions about your cancellation, please contact our support team.

Best regards,
Your Transportation Team
    `,
  };
};

const getBookingReminderEmail = (booking) => {
  return {
    subject: `Upcoming Trip Reminder - ${booking.bookingNumber}`,
    text: `
Dear ${booking.passengerDetails.firstName} ${booking.passengerDetails.lastName},

This is a reminder about your upcoming trip.

Pickup Details:
- Date: ${new Date(booking.pickup.date).toLocaleDateString()}
- Time: ${booking.pickup.time}
- Address: ${booking.pickup.address}

Your driver will arrive at the specified time. You can contact us if you need any assistance.

Best regards,
Your Transportation Team
    `,
  };
};

module.exports = {
  getBookingConfirmationEmail,
  getBookingCancellationEmail,
  getBookingReminderEmail,
};
