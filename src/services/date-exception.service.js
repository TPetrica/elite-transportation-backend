const httpStatus = require('http-status');
const moment = require('moment');
const { DateException } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Create a date exception
 * @param {Object} exceptionBody
 * @returns {Promise<DateException>}
 */
const createDateException = async (exceptionBody) => {
  // Check if exception already exists for this date
  const existingException = await DateException.findOne({
    date: {
      $gte: moment(exceptionBody.date).startOf('day').toDate(),
      $lte: moment(exceptionBody.date).endOf('day').toDate(),
    },
  });

  if (existingException) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'An exception already exists for this date');
  }

  try {
    return await DateException.create(exceptionBody);
  } catch (error) {
    logger.error('Error creating date exception:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create date exception');
  }
};

/**
 * Query for date exceptions
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<DateException[]>}
 */
const queryDateExceptions = async (filter, options = {}) => {
  try {
    const { startDate, endDate, ...otherFilters } = filter;
    const queryFilter = { ...otherFilters };

    // Handle date range
    if (startDate || endDate) {
      queryFilter.date = {};
      if (startDate) {
        queryFilter.date.$gte = moment(startDate).startOf('day').toDate();
      }
      if (endDate) {
        queryFilter.date.$lte = moment(endDate).endOf('day').toDate();
      }
    }

    const sort = options.sortBy || { date: 1 };
    const limit = options.limit || 100;
    const skip = options.page ? (options.page - 1) * limit : 0;

    const exceptions = await DateException.find(queryFilter).sort(sort).skip(skip).limit(limit);

    const count = await DateException.countDocuments(queryFilter);

    return {
      results: exceptions,
      page: options.page || 1,
      limit,
      totalPages: Math.ceil(count / limit),
      totalResults: count,
    };
  } catch (error) {
    logger.error('Error querying date exceptions:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to query date exceptions');
  }
};

/**
 * Get date exception by id
 * @param {ObjectId} id
 * @returns {Promise<DateException>}
 */
const getDateExceptionById = async (id) => {
  try {
    const exception = await DateException.findById(id);
    if (!exception) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Date exception not found');
    }
    return exception;
  } catch (error) {
    logger.error(`Error getting date exception by ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get date exception by date
 * @param {Date} date
 * @returns {Promise<DateException>}
 */
const getDateExceptionByDate = async (date) => {
  try {
    const dateStart = moment(date).startOf('day').toDate();
    const dateEnd = moment(date).endOf('day').toDate();

    return await DateException.findOne({
      date: { $gte: dateStart, $lte: dateEnd },
    });
  } catch (error) {
    logger.error(`Error getting date exception for date ${date}:`, error);
    throw error;
  }
};

/**
 * Update date exception by id
 * @param {ObjectId} exceptionId
 * @param {Object} updateBody
 * @returns {Promise<DateException>}
 */
const updateDateExceptionById = async (exceptionId, updateBody) => {
  try {
    const exception = await getDateExceptionById(exceptionId);

    // If updating date, check for conflicts
    if (updateBody.date && moment(updateBody.date).format('YYYY-MM-DD') !== moment(exception.date).format('YYYY-MM-DD')) {
      const conflictingException = await DateException.findOne({
        _id: { $ne: exceptionId },
        date: {
          $gte: moment(updateBody.date).startOf('day').toDate(),
          $lte: moment(updateBody.date).endOf('day').toDate(),
        },
      });

      if (conflictingException) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'An exception already exists for this date');
      }
    }

    // Set type based on timeRanges
    if (updateBody.timeRanges && updateBody.timeRanges.length > 0) {
      updateBody.type = 'custom-hours';
    } else if (updateBody.type === 'custom-hours' && (!updateBody.timeRanges || updateBody.timeRanges.length === 0)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Custom hours type requires at least one time range');
    }

    Object.assign(exception, updateBody);
    await exception.save();
    return exception;
  } catch (error) {
    logger.error(`Error updating date exception ${exceptionId}:`, error);
    throw error;
  }
};

/**
 * Delete date exception by id
 * @param {ObjectId} exceptionId
 * @returns {Promise<DateException>}
 */
const deleteDateExceptionById = async (exceptionId) => {
  try {
    const exception = await getDateExceptionById(exceptionId);
    await exception.remove();
    return exception;
  } catch (error) {
    logger.error(`Error deleting date exception ${exceptionId}:`, error);
    throw error;
  }
};

/**
 * Get upcoming date exceptions
 * @param {number} limit - Maximum number of exceptions to return
 * @returns {Promise<DateException[]>}
 */
const getUpcomingDateExceptions = async (limit = 10) => {
  try {
    const today = moment().startOf('day').toDate();

    return await DateException.find({
      date: { $gte: today },
    })
      .sort({ date: 1 })
      .limit(limit);
  } catch (error) {
    logger.error('Error getting upcoming date exceptions:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get upcoming date exceptions');
  }
};

module.exports = {
  createDateException,
  queryDateExceptions,
  getDateExceptionById,
  getDateExceptionByDate,
  updateDateExceptionById,
  deleteDateExceptionById,
  getUpcomingDateExceptions,
};
