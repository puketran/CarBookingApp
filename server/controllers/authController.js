const pool = require('../config/db');
const otp = require('../services/otp');
const mailer = require('../services/mailer');
const { issue } = require('../services/jwt');

const OTP_TTL_MIN = 5;
const MAX_ATTEMPTS = 5;

// Identical response whether or not the email exists — prevents email enumeration.
const GENERIC = {
  message: 'Nếu email hợp lệ, mã OTP đã được gửi. / If the email is valid, an OTP has been sent.',
};
const INVALID = {
  error: 'INVALID_OTP',
  message: 'Mã sai hoặc đã hết hạn. / Invalid or expired code.',
};

async function requestOtp(req, res, next) {
  try {
    const email = String(req.body.email).toLowerCase().trim();
    const [[user]] = await pool.query(
      'SELECT user_id FROM users WHERE email = ? AND is_active = TRUE',
      [email],
    );

    // Only generate + send when the email is a real, active user. Either way the
    // response is identical so callers can't probe which emails exist.
    if (user) {
      const code = otp.generateCode();
      await pool.query(
        'INSERT INTO otp_codes (email, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
        [email, otp.hash(code, email), OTP_TTL_MIN],
      );
      await mailer.send({
        to: email,
        subject: 'Your CarBooking OTP',
        text: `Your code is ${code} (valid ${OTP_TTL_MIN} minutes).`,
      });
    }

    return res.json(GENERIC);
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const email = String(req.body.email).toLowerCase().trim();
    const code = String(req.body.code);

    // Newest unused, unexpired code for this email.
    const [[row]] = await pool.query(
      'SELECT * FROM otp_codes WHERE email = ? AND used = FALSE AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [email],
    );

    if (!row) return res.status(401).json(INVALID);
    if (row.attempts >= MAX_ATTEMPTS) return res.status(401).json(INVALID); // locked → must re-request

    if (!otp.verify(code, email, row.code_hash)) {
      await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [row.id]);
      return res.status(401).json(INVALID);
    }

    await pool.query('UPDATE otp_codes SET used = TRUE WHERE id = ?', [row.id]);
    const [[user]] = await pool.query(
      'SELECT user_id, name, department, role FROM users WHERE email = ?',
      [email],
    );
    const token = issue({ user_id: user.user_id, email, role: user.role });
    return res.json({
      token,
      user: { user_id: user.user_id, name: user.name, email, department: user.department, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { requestOtp, verifyOtp, GENERIC };
