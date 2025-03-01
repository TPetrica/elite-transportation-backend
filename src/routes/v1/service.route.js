const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const serviceValidation = require('../../validations/service.validation');
const serviceController = require('../../controllers/service.controller');

const router = express.Router();

// Public route - available to all users without authentication
router.get('/public', serviceController.getActiveServices);
router.get('/type/:serviceType', serviceController.getServiceByServiceType);

// Protected routes - require authentication
router
  .route('/')
  .post(auth('manageServices'), validate(serviceValidation.createService), serviceController.createService)
  .get(auth('getServices'), validate(serviceValidation.getServices), serviceController.getServices);

router
  .route('/:serviceId')
  .get(auth('getServices'), validate(serviceValidation.getService), serviceController.getService)
  .patch(auth('manageServices'), validate(serviceValidation.updateService), serviceController.updateService)
  .delete(auth('manageServices'), validate(serviceValidation.deleteService), serviceController.deleteService);

module.exports = router;
