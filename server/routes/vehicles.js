const express = require('express');
const { query, body, param } = require('express-validator');

const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { getAvailable, list, create, update, remove, active, availability } = require('../controllers/vehicleController');

const router = express.Router();

// GET /vehicles/available?date=YYYY-MM-DD — access: any authenticated user.
router.get(
  '/available',
  requireAuth,
  query('date').isISO8601().withMessage('date (YYYY-MM-DD) is required'),
  validate,
  getAvailable,
);

// Employee booking picker — any authenticated user.
router.get('/active', requireAuth, active);
router.get('/:id/availability', requireAuth, param('id').isInt(), validate, availability);

// Vehicle management — admin only.
router.get('/', requireAuth, requireRole('admin'), list);
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  body('vehicle_name').isString().notEmpty(),
  body('capacity').isInt({ min: 1 }),
  validate,
  create,
);
router.put('/:id', requireAuth, requireRole('admin'), param('id').isInt(), validate, update);
router.delete('/:id', requireAuth, requireRole('admin'), param('id').isInt(), validate, remove);

module.exports = router;
