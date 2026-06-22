const express = require('express');
const { body, param } = require('express-validator');

const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { create, list, getOne, updateStatus, conflicts } = require('../controllers/bookingController');

const router = express.Router();

router.get('/', requireAuth, list);

router.get('/:id', requireAuth, param('id').isInt().withMessage('id must be an integer'), validate, getOne);

router.get('/:id/conflicts', requireAuth, requireRole('admin'), param('id').isInt(), validate, conflicts);

router.post(
  '/',
  requireAuth,
  body('vehicle_id').isInt().withMessage('vehicle_id must be an integer'),
  body('booking_date').isISO8601().withMessage('booking_date must be YYYY-MM-DD'),
  body('slot_start').matches(/^\d{2}:\d{2}$/).withMessage('slot_start must be HH:MM'),
  body('slot_end').matches(/^\d{2}:\d{2}$/).withMessage('slot_end must be HH:MM'),
  body('booking_type').optional().isIn(['slot', 'full_day']).withMessage('invalid booking_type'),
  body('passenger_count').isInt({ min: 1 }).withMessage('passenger_count must be >= 1'),
  body('destination').isString().notEmpty().withMessage('destination is required'),
  body('purpose').optional().isString(),
  body('contact_number').isString().notEmpty().withMessage('contact_number is required'),
  validate,
  create,
);

router.patch(
  '/:id/status',
  requireAuth,
  param('id').isInt().withMessage('id must be an integer'),
  body('status').isIn(['approved', 'rejected', 'completed', 'cancelled']).withMessage('invalid status'),
  validate,
  updateStatus,
);

module.exports = router;
