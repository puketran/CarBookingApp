const pool = require('../config/db');
const settingsService = require('../services/settings');

// GET /admin/users — users with this-month no-show count + block status.
async function listUsers(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.department, u.role, u.is_active,
              DATE_FORMAT(u.booking_blocked_until, '%Y-%m-%d') AS booking_blocked_until,
              (SELECT COUNT(*) FROM bookings b
                 WHERE b.user_id = u.user_id AND b.status = 'no_show'
                   AND YEAR(b.booking_date) = YEAR(CURDATE())
                   AND MONTH(b.booking_date) = MONTH(CURDATE())) AS noshow_this_month
       FROM users u ORDER BY u.user_id`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /admin/users/:id — edit role / active, or unblock (clear booking_blocked_until).
async function updateUser(req, res, next) {
  try {
    const set = [];
    const params = [];
    if (Object.prototype.hasOwnProperty.call(req.body, 'role')) { set.push('role = ?'); params.push(req.body.role); }
    if (Object.prototype.hasOwnProperty.call(req.body, 'is_active')) { set.push('is_active = ?'); params.push(req.body.is_active ? 1 : 0); }
    if (Object.prototype.hasOwnProperty.call(req.body, 'booking_blocked_until')) {
      set.push('booking_blocked_until = ?'); params.push(req.body.booking_blocked_until || null);
    }
    if (set.length) {
      params.push(req.params.id);
      await pool.query(`UPDATE users SET ${set.join(', ')} WHERE user_id = ?`, params);
    }
    res.json({ user_id: Number(req.params.id), ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /admin/users — add a user (this is how admins add admins/drivers now).
async function createUser(req, res, next) {
  try {
    const email = String(req.body.email).toLowerCase().trim();
    const { name, department } = req.body;
    const role = ['employee', 'driver', 'admin'].includes(req.body.role) ? req.body.role : 'employee';
    const [r] = await pool.query(
      'INSERT INTO users (email, name, department, role) VALUES (?, ?, ?, ?)',
      [email, name || null, department || null, role],
    );
    res.status(201).json({ user_id: r.insertId, email, role });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'CONFLICT', message: 'A user with that email already exists' });
    }
    next(err);
  }
}

// GET /admin/settings
async function getSettings(req, res, next) {
  try { res.json(await settingsService.getSettings()); } catch (err) { next(err); }
}

// PATCH /admin/settings
async function updateSettings(req, res, next) {
  try {
    await settingsService.setSettings(req.body || {});
    res.json(await settingsService.getSettings());
  } catch (err) { next(err); }
}

module.exports = { listUsers, updateUser, createUser, getSettings, updateSettings };
