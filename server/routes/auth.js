const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { login, requestOtp, setPassword, changePassword, GENERIC } = require('../controllers/authController');

const router = express.Router();

// Max 5 OTP requests per email per hour. On limit, return the same generic message.
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => String(req.body.email || '').toLowerCase().trim(),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(200).json(GENERIC),
});

router.post(
  '/login',
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
  validate,
  login,
);

router.post(
  '/request-otp',
  body('email').isEmail().withMessage('A valid email is required'),
  validate,
  otpLimiter,
  requestOtp,
);

router.post(
  '/set-password',
  body('email').isEmail().withMessage('A valid email is required'),
  body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Code must be 6 digits'),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  setPassword,
);

router.patch(
  '/password',
  requireAuth,
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  changePassword,
);

module.exports = router;
