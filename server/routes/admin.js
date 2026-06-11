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
  validate,
  c.updateUser,
);

router.get('/settings', c.getSettings);
router.patch('/settings', c.updateSettings);

module.exports = router;
