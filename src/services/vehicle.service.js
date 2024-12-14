const httpStatus = require('http-status');
const Vehicle = require('../models/vehicle.model');
const ApiError = require('../utils/ApiError');

/**
 * Create a vehicle
 * @param {Object} vehicleBody
 * @returns {Promise<Vehicle>}
 */
const createVehicle = async (vehicleBody) => {
  return Vehicle.create(vehicleBody);
};

/**
 * Query for vehicles
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryVehicles = async (filter, options) => {
  const vehicles = await Vehicle.paginate(filter, options);
  return vehicles;
};

/**
 * Get vehicle by id
 * @param {ObjectId} id
 * @returns {Promise<Vehicle>}
 */
const getVehicleById = async (id) => {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vehicle not found');
  }
  return vehicle;
};

/**
 * Get available vehicles
 * @returns {Promise<Vehicle[]>}
 */
const getAvailableVehicles = async () => {
  return Vehicle.find({ isAvailable: true });
};

/**
 * Update vehicle by id
 * @param {ObjectId} vehicleId
 * @param {Object} updateBody
 * @returns {Promise<Vehicle>}
 */
const updateVehicleById = async (vehicleId, updateBody) => {
  const vehicle = await getVehicleById(vehicleId);
  Object.assign(vehicle, updateBody);
  await vehicle.save();
  return vehicle;
};

/**
 * Delete vehicle by id
 * @param {ObjectId} vehicleId
 * @returns {Promise<Vehicle>}
 */
const deleteVehicleById = async (vehicleId) => {
  const vehicle = await getVehicleById(vehicleId);
  await vehicle.remove();
  return vehicle;
};

/**
 * Calculate vehicle price for trip
 * @param {ObjectId} vehicleId
 * @param {number} distance
 * @returns {Promise<number>}
 */
const calculateVehiclePrice = async (vehicleId, distance) => {
  const vehicle = await getVehicleById(vehicleId);
  return vehicle.pricing.basePrice + distance * vehicle.pricing.pricePerKm;
};

module.exports = {
  createVehicle,
  queryVehicles,
  getVehicleById,
  getAvailableVehicles,
  updateVehicleById,
  deleteVehicleById,
  calculateVehiclePrice,
};
