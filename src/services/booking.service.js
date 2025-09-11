const httpStatus = require('http-status');
const moment = require('moment');
const Booking = require('../models/booking.model');
const Extra = require('../models/extra.model');
const User = require('../models/user.model');
const availabilityService = require('./availability.service');
const emailService = require('./email/emailService');
const affiliateService = require('./affiliate.service');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { convertTo24Hour } = require('../utils/timeFormat');

const createBooking = async (bookingBody) => {
  try {
    logger.info('Starting booking creation process');
    console.log('bookingBody', bookingBody)
    
    // Debug logging for initial booking data from frontend
    logger.info('=== FRONTEND BOOKING DATA ===');
    logger.info('Raw pickup date from frontend:', bookingBody.pickup?.date);
    logger.info('Raw pickup time from frontend:', bookingBody.pickup?.time);
    logger.info('Frontend date type:', typeof bookingBody.pickup?.date);
    logger.info('Frontend time type:', typeof bookingBody.pickup?.time);
    if (bookingBody.pickup?.date) {
      logger.info('Frontend date as Date object:', new Date(bookingBody.pickup.date));
      logger.info('Frontend date ISO:', new Date(bookingBody.pickup.date).toISOString());
    }
    logger.info('==============================');

    if (bookingBody.extras?.length) {
      const extraIds = bookingBody.extras.map((extra) => extra.item);
      const extras = await Extra.find({ _id: { $in: extraIds } });
      if (extras.length !== extraIds.length) {
        throw new ApiError(httpStatus.NOT_FOUND, 'One or more extras not found');
      }

      bookingBody.extras = bookingBody.extras.map((extra) => {
        const extraDoc = extras.find((e) => e._id.toString() === extra.item.toString());
        return {
          ...extra,
          name: extra.name || extraDoc.name, // Preserve the name from frontend or use from DB
          price: extraDoc.price * extra.quantity,
        };
      });
    }

    if (bookingBody.user) {
      const user = await User.findById(bookingBody.user);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }
    }
    
    // Convert pickup time from AM/PM to 24-hour format for availability check
    const pickupTime24h = convertTo24Hour(bookingBody.pickup.time);
    logger.info(`Converting pickup time from ${bookingBody.pickup.time} to ${pickupTime24h}`);

    const isAvailable = await availabilityService.checkTimeSlotAvailability(
      bookingBody.pickup.date,
      pickupTime24h
    );

    if (!isAvailable) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Selected time slot is no longer available');
    }

    const bookingNumber = await Booking.generateBookingNumber();
    
    // Convert times to 24-hour format for storage
    const bookingDataForStorage = {
      ...bookingBody,
      pickup: {
        ...bookingBody.pickup,
        time: pickupTime24h
      }
    };
    
    // Convert return time if exists
    if (bookingBody.returnDetails?.time) {
      bookingDataForStorage.returnDetails = {
        ...bookingBody.returnDetails,
        time: convertTo24Hour(bookingBody.returnDetails.time)
      };
    }

    const booking = await Booking.create({
      ...bookingDataForStorage,
      bookingNumber,
      affiliate: bookingBody.affiliate || false,
      affiliateCode: bookingBody.affiliateCode || '',
    });

    logger.info(`Booking created with ID: ${booking._id}`);

    // Track affiliate booking if applicable
    if (bookingBody.affiliateCode) {
      try {
        await affiliateService.trackBooking(bookingBody.affiliateCode, booking.payment.amount);
        logger.info(`Affiliate booking tracked for code: ${bookingBody.affiliateCode}`);
      } catch (error) {
        logger.error('Failed to track affiliate booking:', error);
        // Don't throw error - continue with booking creation
      }
    }

    try {
      
      console.log('booking SERVICE', booking)

      const emailData = {
        bookingNumber: booking.bookingNumber,
        amount: booking.payment.amount,
        pickup: {
          date: booking.pickup.date,
          time: booking.pickup.time,
          address: booking.pickup.address,
          coordinates: booking.pickup.coordinates,
          flightNumber: booking.pickup.flightNumber || '',
          flightTime: booking.pickup.flightTime || '',
          isCustom: booking.pickup.isCustom || false,
        },
        dropoff: {
          address: booking.dropoff.address,
          coordinates: booking.dropoff.coordinates,
          isCustom: booking.dropoff.isCustom || false,
        },
        distance: booking.distance,
        duration: booking.duration,
        service: booking.service,
        passengerDetails: {
          firstName: booking.passengerDetails.firstName,
          lastName: booking.passengerDetails.lastName,
          phone: booking.passengerDetails.phone,
          passengers: booking.passengerDetails.passengers,
          luggage: booking.passengerDetails.luggage,
          email: booking.email, // Use main booking email
          notes: booking.passengerDetails.notes || '',
          specialRequirements: booking.passengerDetails.specialRequirements || '',
          flightNumber: booking.passengerDetails.flightNumber || booking.pickup.flightNumber || '',
          company: booking.passengerDetails.company || booking.billingDetails?.company || '',
        },
        billingDetails: {
          firstName: booking.billingDetails.firstName,
          lastName: booking.billingDetails.lastName,
          company: booking.billingDetails.company || '',
          address: booking.billingDetails.address,
          country: booking.billingDetails.country,
          city: booking.billingDetails.city,
          zipCode: booking.billingDetails.zipCode,
          email: booking.billingDetails.email || '',
        },
        payment: {
          method: booking.payment.method,
          amount: booking.payment.amount,
          status: booking.payment.status,
          currency: 'USD',
        },
        extras: (booking.extras || []).map(extra => ({
          item: extra.item,
          name: extra.name || 'Extra Service',
          quantity: extra.quantity || 1,
          price: extra.price || 0
        })),
        affiliate: booking.affiliate,
        affiliateCode: booking.affiliateCode || '',
        // Add pricing details
        pricing: booking.pricing || {
          basePrice: 0,
          extrasTotal: 0,
          gratuity: 0,
          nightFee: 0,
          selectedTipPercentage: 0,
          totalPrice: 0
        },
        // Add round trip details
        isRoundTrip: booking.isRoundTrip || false,
        tripType: booking.tripType || 'one-way',
        returnDetails: booking.returnDetails || null,
      };

      // Send email to customer
      console.log('emailData SERVICE', emailData)
      await emailService.sendBookingConfirmationEmail(booking.email, emailData);
      logger.info('Booking confirmation email sent to customer');
      
      // Send email to admin if configured
      const config = require('../config/config');
      if (config.email.adminEmail) {
        await emailService.sendBookingConfirmationEmail(config.email.adminEmail, emailData);
        logger.info('Booking confirmation email sent to admin');
      }
      
      // Send email to affiliate company if configured
      if (booking.affiliate && booking.affiliateCode) {
        try {
          const affiliate = await affiliateService.getAffiliateByCode(booking.affiliateCode);
          if (affiliate && affiliate.sendNotificationEmails && affiliate.companyEmail) {
            await emailService.sendBookingConfirmationEmail(affiliate.companyEmail, emailData, `[Affiliate: ${affiliate.name}] `);
            logger.info('Booking confirmation email sent to affiliate company:', {
              affiliateCode: booking.affiliateCode,
              affiliateName: affiliate.name,
              email: affiliate.companyEmail
            });
          }
        } catch (affiliateError) {
          logger.error('Failed to send affiliate notification email:', affiliateError);
          // Don't throw - continue without affiliate email
        }
      }
    } catch (error) {
      logger.error('Failed to send confirmation email:', error);
      // Don't throw an error here, just log it and continue
      // This way the booking is still created even if there's an email error
      logger.warn('Continuing with booking creation despite email error');
    }

    return booking;
  } catch (error) {
    logger.error('Booking creation failed:', error);
    throw error;
  }
};

const processQueryFilters = (filter) => {
  const queryFilter = { ...filter };

  // Process date filter
  if (queryFilter.date) {
    const date = new Date(queryFilter.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    queryFilter['pickup.date'] = {
      $gte: startOfDay,
      $lte: endOfDay,
    };

    delete queryFilter.date;
  }

  // Process date range filters
  if (queryFilter.startDate) {
    const startDate = new Date(queryFilter.startDate);
    if (!queryFilter['pickup.date']) queryFilter['pickup.date'] = {};
    queryFilter['pickup.date'].$gte = startDate;
    delete queryFilter.startDate;
  }

  if (queryFilter.endDate) {
    const endDate = new Date(queryFilter.endDate);
    if (!queryFilter['pickup.date']) queryFilter['pickup.date'] = {};
    queryFilter['pickup.date'].$lte = endDate;
    delete queryFilter.endDate;
  }

  // Process passenger name search
  if (queryFilter.customerName) {
    const nameRegex = new RegExp(queryFilter.customerName, 'i');
    queryFilter.$or = [{ 'passengerDetails.firstName': nameRegex }, { 'passengerDetails.lastName': nameRegex }];
    delete queryFilter.customerName;
  }

  // Process phone search
  if (queryFilter.phone) {
    queryFilter['passengerDetails.phone'] = new RegExp(queryFilter.phone, 'i');
    delete queryFilter.phone;
  }

  // Process email search
  if (queryFilter.email) {
    queryFilter.email = new RegExp(queryFilter.email, 'i');
  }

  // Process boolean fields
  if (queryFilter.affiliate !== undefined) {
    queryFilter.affiliate = queryFilter.affiliate === 'true';
  }

  // Remove pagination parameters from the filter
  delete queryFilter.sortBy;
  delete queryFilter.limit;
  delete queryFilter.page;

  return queryFilter;
};

const queryBookings = async (filter, options) => {
  try {
    logger.info(`Raw filter: ${JSON.stringify(filter)}`);

    // Process the filter to handle special cases like date ranges
    const processedFilter = processQueryFilters(filter);

    logger.info(`Processed filter: ${JSON.stringify(processedFilter)}`);

    // Create a new options object without modifying the original
    const paginateOptions = { ...options };

    // Set default sort by date if not specified
    if (!paginateOptions.sortBy) {
      paginateOptions.sortBy = 'pickup.date:desc';
    }

    // Get the paginated results first
    const bookings = await Booking.paginate(processedFilter, paginateOptions);

    // Manually populate the needed fields
    if (bookings.results && bookings.results.length > 0) {
      await Booking.populate(bookings.results, [
        { path: 'vehicle', select: 'name type capacity' },
        { path: 'extras.item', select: 'name price' },
        { path: 'user', select: 'name email phone' },
      ]);
    }

    return bookings;
  } catch (error) {
    logger.error('Error querying bookings:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to query bookings');
  }
};

const getBookingById = async (id) => {
  try {
    const booking = await Booking.findById(id)
      .populate('vehicle')
      .populate('extras.item')
      .populate('user', 'name email phone');

    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }
    return booking;
  } catch (error) {
    logger.error(`Error getting booking by ID ${id}:`, error);
    throw error;
  }
};

const getBookingByNumber = async (bookingNumber) => {
  try {
    const booking = await Booking.findOne({ bookingNumber })
      .populate('vehicle')
      .populate('extras.item')
      .populate('user', 'name email phone');

    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }
    return booking;
  } catch (error) {
    logger.error(`Error getting booking by number ${bookingNumber}:`, error);
    throw error;
  }
};

const updateBookingById = async (bookingId, updateBody) => {
  try {
    const booking = await getBookingById(bookingId);

    if (booking.status === 'completed') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update completed booking');
    }

    // Check if pickup date or time is being updated
    const isDateTimeChange = updateBody.pickup?.date || updateBody.pickup?.time;
    const updatedDateTime = {};

    if (updateBody.pickup?.date) {
      updatedDateTime.date = updateBody.pickup.date;
    }

    if (updateBody.pickup?.time) {
      updatedDateTime.time = updateBody.pickup.time;
    }

    // If updating extras
    if (updateBody.extras) {
      const extraIds = updateBody.extras.map((extra) => extra.item);
      const extras = await Extra.find({ _id: { $in: extraIds } });
      if (extras.length !== extraIds.length) {
        throw new ApiError(httpStatus.NOT_FOUND, 'One or more extras not found');
      }

      updateBody.extras = updateBody.extras.map((extra) => {
        const extraDoc = extras.find((e) => e._id.toString() === extra.item.toString());
        return {
          ...extra,
          price: extraDoc.price * extra.quantity,
        };
      });
    }

    // If updating time/date, check if the new slot is available
    // but make an exception for the current booking's time slot
    if (isDateTimeChange) {
      const newDate = updateBody.pickup?.date || booking.pickup.date;
      const newTime = updateBody.pickup?.time || booking.pickup.time;

      // Only check availability if the date or time has changed
      const dateChanged =
        updateBody.pickup?.date &&
        moment(updateBody.pickup.date).format('YYYY-MM-DD') !== moment(booking.pickup.date).format('YYYY-MM-DD');
      const timeChanged = updateBody.pickup?.time && updateBody.pickup.time !== booking.pickup.time;

      if (dateChanged || timeChanged) {
        // Check availability, excluding this booking from the check
        const isAvailable = await availabilityService.checkTimeSlotAvailability(
          newDate,
          newTime,
          bookingId // Pass the current booking ID to exclude it from the availability check
        );

        if (!isAvailable) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Selected time slot is not available');
        }
      }
    }

    Object.assign(booking, updateBody);
    await booking.save();

    // Send update email if date/time was changed
    if (isDateTimeChange) {
      try {
        await emailService.sendBookingUpdateEmail(booking.email, booking.bookingNumber, booking.passengerDetails, {
          pickup: updatedDateTime,
        });
        logger.info(`Booking update email sent to ${booking.email} for booking ${booking.bookingNumber}`);
      } catch (error) {
        logger.error('Failed to send update email:', error);
        // Continue with the booking update even if the email fails
      }
    }

    return booking;
  } catch (error) {
    logger.error(`Error updating booking ${bookingId}:`, error);
    throw error;
  }
};

const cancelBookingById = async (bookingId) => {
  try {
    const booking = await getBookingById(bookingId);

    if (booking.status === 'completed') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel completed booking');
    }

    if (booking.status === 'cancelled') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is already cancelled');
    }

    // Release the time slot
    await availabilityService.releaseTimeSlot(bookingId);

    booking.status = 'cancelled';
    await booking.save();

    // Send cancellation email
    try {
      await emailService.sendBookingCancellationEmail(booking.email, booking.bookingNumber);
    } catch (error) {
      logger.error('Failed to send cancellation email:', error);
    }

    return booking;
  } catch (error) {
    logger.error(`Error cancelling booking ${bookingId}:`, error);
    throw error;
  }
};

const attachUserToBooking = async (bookingNumber, userId) => {
  try {
    const booking = await getBookingByNumber(bookingNumber);

    if (booking.user) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking already has a user attached');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    booking.user = userId;
    await booking.save();

    return booking;
  } catch (error) {
    logger.error(`Error attaching user ${userId} to booking ${bookingNumber}:`, error);
    throw error;
  }
};

const getUserBookings = async (userId, options) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return queryBookings(
      { user: userId },
      {
        ...options,
        sortBy: options.sortBy || 'pickup.date:desc',
      }
    );
  } catch (error) {
    logger.error(`Error getting bookings for user ${userId}:`, error);
    throw error;
  }
};

const getBookingStats = async (startDate, endDate) => {
  try {
    // Create date filters if provided
    const dateFilter = {};
    if (startDate) {
      dateFilter['pickup.date'] = { $gte: new Date(startDate) };
    }
    if (endDate) {
      if (!dateFilter['pickup.date']) dateFilter['pickup.date'] = {};
      dateFilter['pickup.date'].$lte = new Date(endDate);
    }

    // Get status breakdown with optional date filter
    const statusAggregation = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$payment.amount' },
        },
      },
    ]);

    // Get upcoming bookings (from today) - independent of date filter
    const today = moment().startOf('day');
    const upcomingBookings = await Booking.countDocuments({
      'pickup.date': { $gte: today.toDate() },
      status: { $in: ['pending', 'confirmed'] },
    });

    // Get today's bookings - independent of date filter
    const todayBookings = await Booking.countDocuments({
      'pickup.date': {
        $gte: today.toDate(),
        $lte: moment().endOf('day').toDate(),
      },
    });

    // Get total active vehicles count (this would typically come from the vehicle service,
    // but we'll mock it here for simplicity)
    const activeVehicles = 0; // Replace with actual vehicle count when available

    // Calculate total revenue for the period
    const totalRevenue = statusAggregation.reduce((sum, status) => sum + (status.totalRevenue || 0), 0);

    // Get recent bookings for the dashboard
    const recentBookings = await Booking.find(dateFilter).sort({ createdAt: -1 }).limit(5).populate('extras.item').lean();

    return {
      statusBreakdown: statusAggregation,
      upcomingBookings,
      todayBookings,
      activeVehicles,
      totalRevenue,
      recentBookings,
    };
  } catch (error) {
    logger.error('Error getting booking stats:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get booking statistics');
  }
};

module.exports = {
  createBooking,
  queryBookings,
  getBookingById,
  getBookingByNumber,
  updateBookingById,
  cancelBookingById,
  attachUserToBooking,
  getUserBookings,
  getBookingStats,
};
