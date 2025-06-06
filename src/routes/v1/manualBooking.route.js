const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { manualBookingValidation } = require('../../validations');
const { manualBookingController } = require('../../controllers');

const router = express.Router();

router
  .route('/')
  .post(
    auth('manageManualBookings'),
    validate(manualBookingValidation.createManualBooking),
    manualBookingController.createManualBooking
  )
  .get(
    auth('getManualBookings'),
    validate(manualBookingValidation.getManualBookings),
    manualBookingController.getManualBookings
  );

router
  .route('/check-conflict')
  .post(
    auth('manageManualBookings'),
    validate(manualBookingValidation.checkTimeConflict),
    manualBookingController.checkTimeConflict
  );

router
  .route('/blocked-slots')
  .get(
    auth('getManualBookings'),
    validate(manualBookingValidation.getBlockedSlots),
    manualBookingController.getBlockedSlots
  );

router
  .route('/:manualBookingId')
  .get(
    auth('getManualBookings'),
    validate(manualBookingValidation.getManualBooking),
    manualBookingController.getManualBooking
  )
  .patch(
    auth('manageManualBookings'),
    validate(manualBookingValidation.updateManualBooking),
    manualBookingController.updateManualBooking
  )
  .delete(
    auth('manageManualBookings'),
    validate(manualBookingValidation.deleteManualBooking),
    manualBookingController.deleteManualBooking
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: ManualBookings
 *   description: Manual booking and calendar blocking management
 */

/**
 * @swagger
 * /manual-bookings:
 *   post:
 *     summary: Create a manual booking
 *     description: Only admins can create manual bookings to block calendar time slots.
 *     tags: [ManualBookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - startTime
 *               - endTime
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               endTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               type:
 *                 type: string
 *                 enum: [manual-booking, maintenance, personal, blocked]
 *               vehicleId:
 *                 type: string
 *               clientName:
 *                 type: string
 *               clientPhone:
 *                 type: string
 *               clientEmail:
 *                 type: string
 *               pickupLocation:
 *                 type: string
 *               dropoffLocation:
 *                 type: string
 *               price:
 *                 type: number
 *               notes:
 *                 type: string
 *             example:
 *               title: "Phone Booking - John Doe"
 *               description: "Manual booking made via phone call"
 *               date: "2024-01-15"
 *               startTime: "14:00"
 *               endTime: "16:00"
 *               type: "manual-booking"
 *               clientName: "John Doe"
 *               clientPhone: "+1234567890"
 *               clientEmail: "john@example.com"
 *               pickupLocation: "Salt Lake City Airport"
 *               dropoffLocation: "Park City"
 *               price: 120
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/ManualBooking'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all manual bookings
 *     description: Only admins can retrieve all manual bookings.
 *     tags: [ManualBookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Manual booking title
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [manual-booking, maintenance, personal, blocked]
 *         description: Manual booking type
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Manual booking date
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date range
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, client name, locations
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. date:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of manual bookings
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ManualBooking'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */