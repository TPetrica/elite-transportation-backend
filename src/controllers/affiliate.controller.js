const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { affiliateService } = require('../services');

const createAffiliate = catchAsync(async (req, res) => {
  const affiliate = await affiliateService.createAffiliate(req.body);
  res.status(httpStatus.CREATED).send(affiliate);
});

const getAffiliates = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'code', 'isActive', 'search']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  console.log('Query params:', req.query);
  console.log('Filter before processing:', filter);
  console.log('Options:', options);

  // Handle search parameter
  if (filter.search !== undefined && filter.search !== '') {
    const searchRegex = new RegExp(filter.search, 'i');
    filter.$or = [
      { name: searchRegex },
      { code: searchRegex },
      { companyName: searchRegex },
    ];
    delete filter.search;
  }

  // If search is empty string, remove it
  if (filter.search === '') {
    delete filter.search;
  }

  console.log('Final filter:', filter);

  const result = await affiliateService.queryAffiliates(filter, options);
  console.log('Query result:', result);
  res.send(result);
});

const getAffiliate = catchAsync(async (req, res) => {
  const affiliate = await affiliateService.getAffiliateById(req.params.affiliateId);
  if (!affiliate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Affiliate not found');
  }
  res.send(affiliate);
});

const updateAffiliate = catchAsync(async (req, res) => {
  const affiliate = await affiliateService.updateAffiliateById(req.params.affiliateId, req.body);
  res.send(affiliate);
});

const deleteAffiliate = catchAsync(async (req, res) => {
  await affiliateService.deleteAffiliateById(req.params.affiliateId);
  res.status(httpStatus.NO_CONTENT).send();
});

const trackVisit = catchAsync(async (req, res) => {
  const affiliate = await affiliateService.trackVisit(req.params.code);
  res.send({ redirectPath: affiliate.redirectPath });
});

const validateAffiliate = catchAsync(async (req, res) => {
  const affiliate = await affiliateService.getAffiliateByCode(req.params.code);
  if (!affiliate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invalid affiliate code');
  }
  res.send({
    valid: true,
    redirectPath: affiliate.redirectPath,
    affiliate: {
      name: affiliate.name,
      code: affiliate.code,
      preferredService: affiliate.preferredService,
      defaultPickupLocation: affiliate.defaultPickupLocation,
      defaultDropoffLocation: affiliate.defaultDropoffLocation,
      servicePricing: affiliate.servicePricing,
      servicePricingList: affiliate.servicePricingList, // Include the new pricing list
    }
  });
});

module.exports = {
  createAffiliate,
  getAffiliates,
  getAffiliate,
  updateAffiliate,
  deleteAffiliate,
  trackVisit,
  validateAffiliate,
};