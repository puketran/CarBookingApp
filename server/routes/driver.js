const express = require('express');
const { param, body } = require('express-validator');

const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const c = require('../controllers/driverController');

const router = express.Router();
router.use(requireAuth, requireRole('driver'));

router.get('/trips', c.trips);

router.patch(
  '/trips/:id',
  param('id').isInt(),
  body('action').isIn(['confirm', 'decline', 'complete', 'no_show']).withMessage('invalid action'),
  body('reason').optional().isString().isLength({ max: 500 }),
  validate,
  c.actOnTrip,
);

router.get('/vehicles', c.myVehicles);

router.patch(
  '/vehicles/:id/status',
  param('id').isInt(),
  body('status').isIn(['active', 'maintenance']).withMessage('invalid status'),
  validate,
  c.setVehicleStatus,
);

module.exports = router;
