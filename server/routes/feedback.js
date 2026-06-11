const express = require('express');
const { body, param } = require('express-validator');

const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const c = require('../controllers/feedbackController');

const router = express.Router();

// Submit feedback — any logged-in user.
router.post(
  '/',
  requireAuth,
  body('message').isString().isLength({ min: 1, max: 2000 }).withMessage('message is required'),
  body('category').optional().isString(),
  body('page').optional().isString(),
  validate,
  c.create,
);

// Review feedback — admin only.
router.get('/', requireAuth, requireRole('admin'), c.list);

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  param('id').isInt(),
  body('status').isIn(['new', 'triaged', 'done', 'wontfix']).withMessage('invalid status'),
  validate,
  c.updateStatus,
);

module.exports = router;
