const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { vehicleService } = require('../services');
const ApiError = require('../utils/ApiError');

const createVehicle = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.createVehicle(req.body);
  res.status(httpStatus.CREATED).send(vehicle);
});

const getVehicles = catchAsync(async (req, res) => {
  const filter = { isAvailable: true };
  if (req.query.type) {
    filter.type = req.query.type;
  }
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  const result = await vehicleService.queryVehicles(filter, options);
  res.send(result);
});

const getVehicle = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.getVehicleById(req.params.vehicleId);
  if (!vehicle) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vehicle not found');
  }
  res.send(vehicle);
});

const updateVehicle = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.updateVehicleById(req.params.vehicleId, req.body);
  res.send(vehicle);
});

const deleteVehicle = catchAsync(async (req, res) => {
  await vehicleService.deleteVehicleById(req.params.vehicleId);
  res.status(httpStatus.NO_CONTENT).send();
});

const calculatePrice = catchAsync(async (req, res) => {
  const price = await vehicleService.calculateVehiclePrice(req.params.vehicleId, req.query.distance);
  res.send({ price });
});

module.exports = {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  calculatePrice,
};
