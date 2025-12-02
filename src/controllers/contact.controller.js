const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { contactService } = require('../services');

const submitContactForm = catchAsync(async (req, res) => {
  const result = await contactService.processContactForm(req.body);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  submitContactForm,
};
