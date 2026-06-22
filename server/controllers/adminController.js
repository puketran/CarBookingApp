const pool = require('../config/db');
const settingsService = require('../services/settings');
const { DEFAULT_SLOTS } = require('../services/slots');

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

// PATCH /admin/users/:id — edit profile (name/dept/email), role / active, or unblock.
async function updateUser(req, res, next) {
  try {
    const b = req.body;
    const set = [];
    const params = [];
    const has = (k) => Object.prototype.hasOwnProperty.call(b, k);
    if (has('name')) { set.push('name = ?'); params.push(b.name || null); }
    if (has('department')) { set.push('department = ?'); params.push(b.department || null); }
    if (has('email')) { set.push('email = ?'); params.push(String(b.email).toLowerCase().trim()); }
    if (has('role')) { set.push('role = ?'); params.push(b.role); }
    if (has('is_active')) { set.push('is_active = ?'); params.push(b.is_active ? 1 : 0); }
    if (has('booking_blocked_until')) { set.push('booking_blocked_until = ?'); params.push(b.booking_blocked_until || null); }
    if (set.length) {
      params.push(req.params.id);
      await pool.query(`UPDATE users SET ${set.join(', ')} WHERE user_id = ?`, params);
    }
    res.json({ user_id: Number(req.params.id), ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'CONFLICT', message: 'A user with that email already exists' });
    }
    next(err);
  }
}

// DELETE /admin/users/:id — hard delete, guarded. Refuse if self, or if the user
// still has bookings or is a vehicle's driver (deactivate instead).
async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (id === req.user.user_id) {
      return res.status(409).json({ error: 'SELF_DELETE', message: 'You cannot delete your own account.' });
    }
    const [[{ n: bookingCount }]] = await pool.query('SELECT COUNT(*) AS n FROM bookings WHERE user_id = ?', [id]);
    if (bookingCount > 0) {
      return res.status(409).json({ error: 'HAS_BOOKINGS', message: 'User has bookings — deactivate instead of deleting.' });
    }
    const [[{ n: vehicleCount }]] = await pool.query('SELECT COUNT(*) AS n FROM vehicles WHERE driver_user_id = ?', [id]);
    if (vehicleCount > 0) {
      return res.status(409).json({ error: 'IS_DRIVER', message: 'User is assigned to a vehicle — unassign or deactivate instead.' });
    }
    await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
    res.json({ user_id: id, deleted: true });
  } catch (err) {
    next(err);
  }
}

// GET /admin/users/:id/slots — a driver's configured slots (empty → app uses defaults).
async function listDriverSlots(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT slot_id, TIME_FORMAT(slot_start, '%H:%i') AS slot_start,
              TIME_FORMAT(slot_end, '%H:%i') AS slot_end, is_active
         FROM slots WHERE driver_user_id = ? ORDER BY slot_start`,
      [req.params.id],
    );
    res.json({ slots: rows, defaults: DEFAULT_SLOTS, using_defaults: rows.length === 0 });
  } catch (err) {
    next(err);
  }
}

// POST /admin/users/:id/slots — add a slot for a driver.
async function createDriverSlot(req, res, next) {
  try {
    const { slot_start, slot_end } = req.body;
    if (slot_end <= slot_start) {
      return res.status(422).json({ error: 'INVALID_SLOT', message: 'slot_end must be after slot_start' });
    }
    const [r] = await pool.query(
      'INSERT INTO slots (driver_user_id, slot_start, slot_end) VALUES (?, ?, ?)',
      [req.params.id, slot_start, slot_end],
    );
    res.status(201).json({ slot_id: r.insertId, slot_start, slot_end, is_active: 1 });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'CONFLICT', message: 'That start time already has a slot for this driver.' });
    }
    next(err);
  }
}

// PATCH /admin/slots/:slotId — modify a slot (times / active flag).
async function updateSlot(req, res, next) {
  try {
    const b = req.body;
    const set = [];
    const params = [];
    if (b.slot_start !== undefined) { set.push('slot_start = ?'); params.push(b.slot_start); }
    if (b.slot_end !== undefined) { set.push('slot_end = ?'); params.push(b.slot_end); }
    if (b.is_active !== undefined) { set.push('is_active = ?'); params.push(b.is_active ? 1 : 0); }
    if (b.slot_start !== undefined && b.slot_end !== undefined && b.slot_end <= b.slot_start) {
      return res.status(422).json({ error: 'INVALID_SLOT', message: 'slot_end must be after slot_start' });
    }
    if (set.length) {
      params.push(req.params.slotId);
      await pool.query(`UPDATE slots SET ${set.join(', ')} WHERE slot_id = ?`, params);
    }
    res.json({ slot_id: Number(req.params.slotId), ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'CONFLICT', message: 'That start time already has a slot for this driver.' });
    }
    next(err);
  }
}

// DELETE /admin/slots/:slotId — remove a slot.
async function deleteSlot(req, res, next) {
  try {
    await pool.query('DELETE FROM slots WHERE slot_id = ?', [req.params.slotId]);
    res.json({ slot_id: Number(req.params.slotId), deleted: true });
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

module.exports = {
  listUsers, updateUser, createUser, deleteUser, getSettings, updateSettings,
  listDriverSlots, createDriverSlot, updateSlot, deleteSlot,
};
