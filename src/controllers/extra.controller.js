const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { extraService } = require('../services');
const ApiError = require('../utils/ApiError');

const createExtra = catchAsync(async (req, res) => {
  const extra = await extraService.createExtra(req.body);
  res.status(httpStatus.CREATED).send(extra);
});

const getExtras = catchAsync(async (req, res) => {
  const filter = { isAvailable: true };
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.type) {
    filter.type = req.query.type;
  }
  const options = {
    sort: req.query.sort || 'name',
  };
  const extras = await extraService.queryExtras(filter, options);
  res.send(extras);
});

const getExtra = catchAsync(async (req, res) => {
  const extra = await extraService.getExtraById(req.params.extraId);
  if (!extra) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Extra not found');
  }
  res.send(extra);
});

const updateExtra = catchAsync(async (req, res) => {
  const extra = await extraService.updateExtraById(req.params.extraId, req.body);
  res.send(extra);
});

const deleteExtra = catchAsync(async (req, res) => {
  await extraService.deleteExtraById(req.params.extraId);
  res.status(httpStatus.NO_CONTENT).send();
});

const calculateExtrasPrice = catchAsync(async (req, res) => {
  const totalPrice = await extraService.calculateExtrasPrice(req.body.extras);
  res.send({ totalPrice });
});

module.exports = {
  createExtra,
  getExtras,
  getExtra,
  updateExtra,
  deleteExtra,
  calculateExtrasPrice,
};
