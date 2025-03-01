const httpStatus = require('http-status');
const { Service } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Create a service
 * @param {Object} serviceBody
 * @returns {Promise<Service>}
 */
const createService = async (serviceBody) => {
  if (await Service.findOne({ serviceType: serviceBody.serviceType })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Service with this type already exists');
  }

  try {
    return await Service.create(serviceBody);
  } catch (error) {
    logger.error('Error creating service:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create service');
  }
};

/**
 * Query for services
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryServices = async (filter, options) => {
  try {
    const services = await Service.paginate(filter, options);
    return services;
  } catch (error) {
    logger.error('Error querying services:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to query services');
  }
};

/**
 * Get service by id
 * @param {ObjectId} id
 * @returns {Promise<Service>}
 */
const getServiceById = async (id) => {
  try {
    return await Service.findById(id).populate('vehicle');
  } catch (error) {
    logger.error(`Error getting service by ID ${id}:`, error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get service');
  }
};

/**
 * Get service by service type
 * @param {string} serviceType
 * @returns {Promise<Service>}
 */
const getServiceByServiceType = async (serviceType) => {
  try {
    return await Service.findOne({ serviceType }).populate('vehicle');
  } catch (error) {
    logger.error(`Error getting service by service type ${serviceType}:`, error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get service');
  }
};

/**
 * Update service by id
 * @param {ObjectId} serviceId
 * @param {Object} updateBody
 * @returns {Promise<Service>}
 */
const updateServiceById = async (serviceId, updateBody) => {
  try {
    const service = await getServiceById(serviceId);
    if (!service) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }

    // Check if trying to update serviceType to one that already exists
    if (updateBody.serviceType && updateBody.serviceType !== service.serviceType) {
      const existingService = await Service.findOne({
        serviceType: updateBody.serviceType,
        _id: { $ne: serviceId },
      });

      if (existingService) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Service with this type already exists');
      }
    }

    Object.assign(service, updateBody);
    await service.save();
    return service;
  } catch (error) {
    logger.error(`Error updating service ${serviceId}:`, error);
    throw error;
  }
};

/**
 * Delete service by id
 * @param {ObjectId} serviceId
 * @returns {Promise<Service>}
 */
const deleteServiceById = async (serviceId) => {
  try {
    const service = await getServiceById(serviceId);
    if (!service) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }
    await service.remove();
    return service;
  } catch (error) {
    logger.error(`Error deleting service ${serviceId}:`, error);
    throw error;
  }
};

/**
 * Get all active services (for public access)
 * @returns {Promise<Service[]>}
 */
const getActiveServices = async () => {
  try {
    return await Service.find({ isActive: true }).sort({ sortOrder: 1 }).populate('vehicle');
  } catch (error) {
    logger.error('Error getting active services:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get active services');
  }
};

module.exports = {
  createService,
  queryServices,
  getServiceById,
  getServiceByServiceType,
  updateServiceById,
  deleteServiceById,
  getActiveServices,
};
