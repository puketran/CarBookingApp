const express = require('express');
const { query } = require('express-validator');

const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { getAvailable } = require('../controllers/vehicleController');

const router = express.Router();

// GET /vehicles/available?date=YYYY-MM-DD — access: any authenticated user.
router.get(
  '/available',
  requireAuth,
  query('date').isISO8601().withMessage('date (YYYY-MM-DD) is required'),
  validate,
  getAvailable,
);

module.exports = router;
