const pool = require('../config/db');
const otp = require('../services/otp');
const mailer = require('../services/mailer');
const { issue } = require('../services/jwt');
const { hashPassword, verifyPassword } = require('../services/password');

const OTP_TTL_MIN = 15; // generous window so slow email delivery doesn't expire the code
const MAX_ATTEMPTS = 5;

const GENERIC = { message: 'If the email is valid, a code has been sent. / Nếu email hợp lệ, mã đã được gửi.' };
const INVALID_OTP = { error: 'INVALID_OTP', message: 'Invalid or expired code. / Mã sai hoặc đã hết hạn.' };

const userPublic = (u) => ({ user_id: u.user_id, name: u.name, email: u.email, department: u.department, role: u.role });

// POST /auth/login — email + password.
async function login(req, res, next) {
  try {
    const email = String(req.body.email).toLowerCase().trim();
    const [[user]] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
    if (!user || !verifyPassword(req.body.password, user.password_hash)) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Wrong email or password.' });
    }
    const token = issue({ user_id: user.user_id, email, role: user.role });
    res.json({ token, user: userPublic(user) });
  } catch (err) {
    next(err);
  }
}

// POST /auth/request-otp — OTP for register or password reset (open registration: any email).
async function requestOtp(req, res, next) {
  try {
    const email = String(req.body.email).toLowerCase().trim();
    const code = otp.generateCode();
    await pool.query(
      'INSERT INTO otp_codes (email, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
      [email, otp.hash(code, email), OTP_TTL_MIN],
    );
    await mailer.send({ to: email, subject: 'Your CarBooking code', text: `Your code is ${code} (valid ${OTP_TTL_MIN} minutes).` });
    res.json(GENERIC);
  } catch (err) {
    next(err);
  }
}

// POST /auth/set-password — verify OTP, then create (new) or update password, and log in.
async function setPassword(req, res, next) {
  try {
    const email = String(req.body.email).toLowerCase().trim();
    const code = String(req.body.code);
    // Match ANY recent unused, unexpired, unlocked code for this email — so a
    // slightly-older code still works even if the user re-requested a newer one.
    const [rows] = await pool.query(
      'SELECT * FROM otp_codes WHERE email = ? AND used = FALSE AND expires_at > NOW() AND attempts < ? ORDER BY id DESC LIMIT 10',
      [email, MAX_ATTEMPTS],
    );
    const match = rows.find((r) => otp.verify(code, email, r.code_hash));
    if (!match) {
      if (rows[0]) await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [rows[0].id]);
      return res.status(401).json(INVALID_OTP);
    }
    await pool.query('UPDATE otp_codes SET used = TRUE WHERE id = ?', [match.id]);

    const hash = hashPassword(req.body.password);
    let [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (user) {
      await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, user.user_id]);
    } else {
      const [r] = await pool.query("INSERT INTO users (email, role, password_hash) VALUES (?, 'employee', ?)", [email, hash]);
      [[user]] = await pool.query('SELECT * FROM users WHERE user_id = ?', [r.insertId]);
    }
    const token = issue({ user_id: user.user_id, email, role: user.role });
    res.json({ token, user: userPublic(user) });
  } catch (err) {
    next(err);
  }
}

// PATCH /auth/password — logged-in user sets a new password (no current password required).
async function changePassword(req, res, next) {
  try {
    await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashPassword(req.body.password), req.user.user_id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, requestOtp, setPassword, changePassword, GENERIC };
