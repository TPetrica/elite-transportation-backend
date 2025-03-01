const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { serviceService } = require('../services');

const createService = catchAsync(async (req, res) => {
  const service = await serviceService.createService(req.body);
  res.status(httpStatus.CREATED).send(service);
});

const getServices = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['serviceType', 'title', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await serviceService.queryServices(filter, options);
  res.send(result);
});

const getActiveServices = catchAsync(async (req, res) => {
  const services = await serviceService.getActiveServices();
  res.send(services);
});

const getService = catchAsync(async (req, res) => {
  const service = await serviceService.getServiceById(req.params.serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }
  res.send(service);
});

const getServiceByServiceType = catchAsync(async (req, res) => {
  const service = await serviceService.getServiceByServiceType(req.params.serviceType);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }
  res.send(service);
});

const updateService = catchAsync(async (req, res) => {
  const service = await serviceService.updateServiceById(req.params.serviceId, req.body);
  res.send(service);
});

const deleteService = catchAsync(async (req, res) => {
  await serviceService.deleteServiceById(req.params.serviceId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createService,
  getServices,
  getActiveServices,
  getService,
  getServiceByServiceType,
  updateService,
  deleteService,
};
