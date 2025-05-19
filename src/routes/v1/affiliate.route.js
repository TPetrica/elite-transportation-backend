const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const affiliateValidation = require('../../validations/affiliate.validation');
const affiliateController = require('../../controllers/affiliate.controller');

const router = express.Router();

// Test route to debug (REMOVE IN PRODUCTION)
router.get('/test', async (req, res) => {
  try {
    const { Affiliate } = require('../../models');
    const count = await Affiliate.countDocuments();
    const all = await Affiliate.find();
    res.json({ count, affiliates: all });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router
  .route('/')
  .post(auth('manageAffiliates'), validate(affiliateValidation.createAffiliate), affiliateController.createAffiliate)
  .get(auth('manageAffiliates'), validate(affiliateValidation.getAffiliates), affiliateController.getAffiliates);

router
  .route('/:affiliateId')
  .get(auth('manageAffiliates'), validate(affiliateValidation.getAffiliate), affiliateController.getAffiliate)
  .patch(auth('manageAffiliates'), validate(affiliateValidation.updateAffiliate), affiliateController.updateAffiliate)
  .delete(auth('manageAffiliates'), validate(affiliateValidation.deleteAffiliate), affiliateController.deleteAffiliate);

// Public routes for tracking and validation
router
  .route('/track/:code')
  .get(validate(affiliateValidation.trackVisit), affiliateController.trackVisit);

router
  .route('/validate/:code')
  .get(validate(affiliateValidation.validateAffiliate), affiliateController.validateAffiliate);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Affiliates
 *   description: Affiliate management and tracking
 */

/**
 * @swagger
 * /affiliates:
 *   post:
 *     summary: Create an affiliate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               companyName:
 *                 type: string
 *               companyEmail:
 *                 type: string
 *                 format: email
 *               commissionPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               isActive:
 *                 type: boolean
 *               trackingUrl:
 *                 type: string
 *                 format: uri
 *               redirectPath:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Created
 *       "400":
 *         description: Bad request
 *       "401":
 *         description: Unauthorized
 */