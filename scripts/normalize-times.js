const mongoose = require('mongoose');
const config = require('../src/config/config');
const { Booking, ManualBooking } = require('../src/models');
const { normalizeTimeString } = require('../src/utils/timeFormat');

async function normalizeBookingTimes() {
  const bookings = await Booking.find({});
  let updated = 0;
  let skipped = 0;

  for (const booking of bookings) {
    let hasChanges = false;

    if (booking.pickup?.time) {
      const normalizedPickup = normalizeTimeString(booking.pickup.time);
      if (normalizedPickup) {
        if (normalizedPickup !== booking.pickup.time) {
          booking.pickup.time = normalizedPickup;
          hasChanges = true;
        }
      } else {
        skipped += 1;
        console.warn('Unable to normalize pickup time', {
          bookingId: booking._id,
          pickupTime: booking.pickup.time,
        });
      }
    }

    if (booking.returnDetails?.time) {
      const normalizedReturn = normalizeTimeString(booking.returnDetails.time);
      if (normalizedReturn) {
        if (normalizedReturn !== booking.returnDetails.time) {
          booking.returnDetails.time = normalizedReturn;
          hasChanges = true;
        }
      } else {
        skipped += 1;
        console.warn('Unable to normalize return time', {
          bookingId: booking._id,
          returnTime: booking.returnDetails.time,
        });
      }
    }

    if (hasChanges) {
      await booking.save();
      updated += 1;
    }
  }

  console.log(`Normalized ${updated} bookings. Skipped ${skipped} fields due to invalid values.`);
}

async function normalizeManualBookingTimes() {
  const manualBookings = await ManualBooking.find({});
  let updated = 0;
  let skipped = 0;

  for (const manualBooking of manualBookings) {
    const normalizedStart = normalizeTimeString(manualBooking.startTime);
    const normalizedEnd = normalizeTimeString(manualBooking.endTime);

    if (!normalizedStart || !normalizedEnd) {
      skipped += 1;
      console.warn('Unable to normalize manual booking time range', {
        manualBookingId: manualBooking._id,
        startTime: manualBooking.startTime,
        endTime: manualBooking.endTime,
      });
      continue;
    }

    if (normalizedStart !== manualBooking.startTime || normalizedEnd !== manualBooking.endTime) {
      manualBooking.startTime = normalizedStart;
      manualBooking.endTime = normalizedEnd;
      await manualBooking.save();
      updated += 1;
    }
  }

  console.log(`Normalized ${updated} manual bookings. Skipped ${skipped} records due to invalid values.`);
}

async function run() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected to MongoDB');

  await normalizeBookingTimes();
  await normalizeManualBookingTimes();

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

run()
  .then(() => {
    console.log('Time normalization completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Time normalization failed:', error);
    process.exit(1);
  });
