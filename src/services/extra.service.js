const httpStatus = require('http-status');
const Extra = require('../models/extra.model');
const ApiError = require('../utils/ApiError');

/**
 * Create an extra
 * @param {Object} extraBody
 * @returns {Promise<Extra>}
 */
const createExtra = async (extraBody) => {
  return Extra.create(extraBody);
};

/**
 * Query for extras
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryExtras = async (filter, options) => {
  const extras = await Extra.find(filter).sort(options?.sort || 'name');
  return extras;
};

/**
 * Get extra by id
 * @param {ObjectId} id
 * @returns {Promise<Extra>}
 */
const getExtraById = async (id) => {
  const extra = await Extra.findById(id);
  if (!extra) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Extra not found');
  }
  return extra;
};

/**
 * Get available extras by category
 * @param {string} category
 * @returns {Promise<Extra[]>}
 */
const getAvailableExtrasByCategory = async (category) => {
  return Extra.find({ category, isAvailable: true });
};

/**
 * Update extra by id
 * @param {ObjectId} extraId
 * @param {Object} updateBody
 * @returns {Promise<Extra>}
 */
const updateExtraById = async (extraId, updateBody) => {
  const extra = await getExtraById(extraId);
  Object.assign(extra, updateBody);
  await extra.save();
  return extra;
};

/**
 * Delete extra by id
 * @param {ObjectId} extraId
 * @returns {Promise<Extra>}
 */
const deleteExtraById = async (extraId) => {
  const extra = await getExtraById(extraId);
  await extra.remove();
  return extra;
};

/**
 * Calculate extras total price
 * @param {Array} extras Array of {item: extraId, quantity: number}
 * @returns {Promise<number>}
 */
const calculateExtrasPrice = async (extras) => {
  let totalPrice = 0;
  for (const extra of extras) {
    const extraItem = await getExtraById(extra.item);
    totalPrice += extraItem.price * extra.quantity;
  }
  return totalPrice;
};

module.exports = {
  createExtra,
  queryExtras,
  getExtraById,
  getAvailableExtrasByCategory,
  updateExtraById,
  deleteExtraById,
  calculateExtrasPrice,
};
