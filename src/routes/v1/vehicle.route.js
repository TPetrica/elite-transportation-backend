const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const vehicleValidation = require('../../validations/vehicle.validation');
const vehicleController = require('../../controllers/vehicle.controller');

const router = express.Router();

// Public routes
router.route('/').get(validate(vehicleValidation.getVehicles), vehicleController.getVehicles);

router.route('/:vehicleId').get(validate(vehicleValidation.getVehicle), vehicleController.getVehicle);

router.get('/:vehicleId/price', validate(vehicleValidation.calculatePrice), vehicleController.calculatePrice);

// Admin routes
router.route('/').post(auth('manageVehicles'), validate(vehicleValidation.createVehicle), vehicleController.createVehicle);

router
  .route('/:vehicleId')
  .patch(auth('manageVehicles'), validate(vehicleValidation.updateVehicle), vehicleController.updateVehicle)
  .delete(auth('manageVehicles'), validate(vehicleValidation.deleteVehicle), vehicleController.deleteVehicle);

module.exports = router;
