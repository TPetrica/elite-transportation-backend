const jwt = require('jsonwebtoken');
const config = require('../config/config');

const ACCESS_SECRET = `${config.jwt.secret}:booking-access`;

const ACCESS_PURPOSES = {
  BOOKING: 'booking',
  INVOICE: 'invoice',
  PAYMENT_SESSION: 'payment-session',
};

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

const generateBookingAccessToken = (booking, purpose = ACCESS_PURPOSES.INVOICE, expiresIn = '30d') => {
  const bookingId = booking?._id?.toString?.() || booking?.id?.toString?.();
  const bookingNumber = booking?.bookingNumber;
  const email = normalizeEmail(booking?.email || booking?.passengerDetails?.email);

  if (!bookingId || !bookingNumber || !email) {
    throw new Error('Booking access token requires booking id, booking number, and email');
  }

  return jwt.sign(
    {
      sub: bookingId,
      bookingNumber,
      email,
      purpose,
    },
    ACCESS_SECRET,
    { expiresIn }
  );
};

const generatePaymentSessionAccessToken = (payment, expiresIn = '1d') => {
  const paymentId = payment?._id?.toString?.() || payment?.id?.toString?.();

  if (!paymentId) {
    throw new Error('Payment session access token requires payment id');
  }

  return jwt.sign(
    {
      sub: paymentId,
      purpose: ACCESS_PURPOSES.PAYMENT_SESSION,
    },
    ACCESS_SECRET,
    { expiresIn }
  );
};

const verifyAccessToken = (token, expectedPurpose) => {
  const payload = jwt.verify(token, ACCESS_SECRET);

  if (expectedPurpose && payload.purpose !== expectedPurpose) {
    throw new Error('Invalid access token purpose');
  }

  return payload;
};

const canAccessBookingWithToken = (token, booking, expectedPurpose) => {
  if (!token || !booking) return false;

  try {
    const payload = verifyAccessToken(token, expectedPurpose);
    const bookingId = booking?._id?.toString?.() || booking?.id?.toString?.();
    const bookingEmail = normalizeEmail(booking?.email || booking?.passengerDetails?.email);

    return (
      payload.sub === bookingId &&
      payload.bookingNumber === booking.bookingNumber &&
      payload.email === bookingEmail
    );
  } catch (error) {
    return false;
  }
};

const canAccessPaymentSessionWithToken = (token, payment) => {
  if (!token || !payment) return false;

  try {
    const payload = verifyAccessToken(token, ACCESS_PURPOSES.PAYMENT_SESSION);
    const paymentId = payment?._id?.toString?.() || payment?.id?.toString?.();
    return payload.sub === paymentId;
  } catch (error) {
    return false;
  }
};

module.exports = {
  ACCESS_PURPOSES,
  generateBookingAccessToken,
  generatePaymentSessionAccessToken,
  verifyAccessToken,
  canAccessBookingWithToken,
  canAccessPaymentSessionWithToken,
};
