const httpStatus = require('http-status');
const { Affiliate } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create an affiliate
 * @param {Object} affiliateBody
 * @returns {Promise<Affiliate>}
 */
const createAffiliate = async (affiliateBody) => {
  if (await Affiliate.isCodeTaken(affiliateBody.code)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Affiliate code already taken');
  }
  return Affiliate.create(affiliateBody);
};

/**
 * Query for affiliates
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryAffiliates = async (filter, options) => {
  const affiliates = await Affiliate.paginate(filter, options);
  return affiliates;
};

/**
 * Get affiliate by id
 * @param {ObjectId} id
 * @returns {Promise<Affiliate>}
 */
const getAffiliateById = async (id) => {
  return Affiliate.findById(id);
};

/**
 * Get affiliate by code
 * @param {string} code
 * @returns {Promise<Affiliate>}
 */
const getAffiliateByCode = async (code) => {
  return Affiliate.findOne({ code: code.toUpperCase(), isActive: true });
};

/**
 * Update affiliate by id
 * @param {ObjectId} affiliateId
 * @param {Object} updateBody
 * @returns {Promise<Affiliate>}
 */
const updateAffiliateById = async (affiliateId, updateBody) => {
  const affiliate = await getAffiliateById(affiliateId);
  if (!affiliate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found');
  }
  if (updateBody.code && (await Affiliate.isCodeTaken(updateBody.code, affiliateId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Affiliate code already taken');
  }
  Object.assign(affiliate, updateBody);
  await affiliate.save();
  return affiliate;
};

/**
 * Delete affiliate by id
 * @param {ObjectId} affiliateId
 * @returns {Promise<Affiliate>}
 */
const deleteAffiliateById = async (affiliateId) => {
  const affiliate = await getAffiliateById(affiliateId);
  if (!affiliate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found');
  }
  await affiliate.remove();
  return affiliate;
};

/**
 * Track affiliate visit
 * @param {string} code
 * @returns {Promise<Affiliate>}
 */
const trackVisit = async (code) => {
  const affiliate = await getAffiliateByCode(code);
  if (!affiliate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found');
  }
  affiliate.trackingData.visits += 1;
  await affiliate.save();
  return affiliate;
};

/**
 * Track affiliate booking
 * @param {string} code
 * @param {number} bookingAmount
 * @returns {Promise<Affiliate>}
 */
const trackBooking = async (code, bookingAmount) => {
  const affiliate = await getAffiliateByCode(code);
  if (!affiliate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found');
  }
  affiliate.trackingData.bookings += 1;
  affiliate.trackingData.totalRevenue += bookingAmount;
  await affiliate.save();
  return affiliate;
};

module.exports = {
  createAffiliate,
  queryAffiliates,
  getAffiliateById,
  getAffiliateByCode,
  updateAffiliateById,
  deleteAffiliateById,
  trackVisit,
  trackBooking,
};