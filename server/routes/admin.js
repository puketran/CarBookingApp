const express = require('express');
const { param, body } = require('express-validator');

const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const c = require('../controllers/adminController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/users', c.listUsers);
router.post(
  '/users',
  body('email').isEmail().withMessage('valid email required'),
  body('role').optional().isIn(['employee', 'driver', 'admin']),
  validate,
  c.createUser,
);
router.patch(
  '/users/:id',
  param('id').isInt(),
  body('role').optional().isIn(['employee', 'driver', 'admin']),
  body('email').optional().isEmail().withMessage('valid email required'),
  validate,
  c.updateUser,
);
router.delete('/users/:id', param('id').isInt(), validate, c.deleteUser);

// Per-driver time slots.
const HHMM = body(['slot_start', 'slot_end']).matches(/^\d{2}:\d{2}$/).withMessage('time must be HH:MM');
router.get('/users/:id/slots', param('id').isInt(), validate, c.listDriverSlots);
router.post('/users/:id/slots', param('id').isInt(), HHMM, validate, c.createDriverSlot);
router.patch(
  '/slots/:slotId',
  param('slotId').isInt(),
  body('slot_start').optional().matches(/^\d{2}:\d{2}$/),
  body('slot_end').optional().matches(/^\d{2}:\d{2}$/),
  validate,
  c.updateSlot,
);
router.delete('/slots/:slotId', param('slotId').isInt(), validate, c.deleteSlot);

router.get('/settings', c.getSettings);
router.patch('/settings', c.updateSettings);

module.exports = router;
