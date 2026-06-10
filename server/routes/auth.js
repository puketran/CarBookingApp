const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const { validate } = require('../middleware/validate');
const { requestOtp, verifyOtp, GENERIC } = require('../controllers/authController');

const router = express.Router();

// Max 5 OTP requests per email per hour. On limit, return the same generic
// message so we don't reveal that an email is being throttled.
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => String(req.body.email || '').toLowerCase().trim(),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(200).json(GENERIC),
});

router.post(
  '/request-otp',
  body('email').isEmail().withMessage('A valid email is required'),
  validate,
  otpLimiter,
  requestOtp,
);

router.post(
  '/verify-otp',
  body('email').isEmail().withMessage('A valid email is required'),
  body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Code must be 6 digits'),
  validate,
  verifyOtp,
);

module.exports = router;
