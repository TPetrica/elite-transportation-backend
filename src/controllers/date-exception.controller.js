const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { dateExceptionService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createDateException = catchAsync(async (req, res) => {
  const dateException = await dateExceptionService.createDateException(req.body);
  res.status(httpStatus.CREATED).send(dateException);
});

const getDateExceptions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['isEnabled', 'startDate', 'endDate']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await dateExceptionService.queryDateExceptions(filter, options);
  res.send(result);
});

const getDateException = catchAsync(async (req, res) => {
  const dateException = await dateExceptionService.getDateExceptionById(req.params.exceptionId);
  if (!dateException) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Date exception not found');
  }
  res.send(dateException);
});

const getDateExceptionByDate = catchAsync(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Date parameter is required');
  }

  const dateException = await dateExceptionService.getDateExceptionByDate(date);
  res.send({ exists: !!dateException, exception: dateException });
});

const updateDateException = catchAsync(async (req, res) => {
  const dateException = await dateExceptionService.updateDateExceptionById(req.params.exceptionId, req.body);
  res.send(dateException);
});

const deleteDateException = catchAsync(async (req, res) => {
  await dateExceptionService.deleteDateExceptionById(req.params.exceptionId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getUpcomingDateExceptions = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const exceptions = await dateExceptionService.getUpcomingDateExceptions(limit);
  res.send(exceptions);
});

module.exports = {
  createDateException,
  getDateExceptions,
  getDateException,
  getDateExceptionByDate,
  updateDateException,
  deleteDateException,
  getUpcomingDateExceptions,
};
