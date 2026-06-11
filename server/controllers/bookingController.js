const pool = require('../config/db');
const SLOTS = require('../config/slots');
const { notify, notifyAdmins } = require('../services/notify');
const { getSettings } = require('../services/settings');

const slotSet = new Set(SLOTS.map((s) => `${s.slot_start}-${s.slot_end}`));
const isAdminRole = (role) => role === 'admin';

const BOOKING_SELECT = `
  SELECT b.booking_id,
         CONCAT('BK-', DATE_FORMAT(b.created_at, '%Y'), '-', LPAD(b.booking_id, 4, '0')) AS code,
         b.vehicle_id, v.vehicle_name, v.image_url, b.user_id,
         COALESCE(b.requester_name, u.name) AS employee_name,
         COALESCE(b.department, u.department) AS department,
         b.contact_number, b.destination, b.purpose, b.passenger_count,
         DATE_FORMAT(b.booking_date, '%Y-%m-%d') AS booking_date, TIME_FORMAT(b.slot_start, '%H:%i') AS slot_start,
         TIME_FORMAT(b.slot_end, '%H:%i') AS slot_end, b.status, b.driver_confirmed, b.created_at, b.updated_at
  FROM bookings b
  JOIN users u ON b.user_id = u.user_id
  JOIN vehicles v ON b.vehicle_id = v.vehicle_id`;

// POST /bookings — lock a slot as pending. App-level check + DB unique constraint.
async function create(req, res, next) {
  try {
    const { vehicle_id, booking_date, slot_start, slot_end, destination, purpose, passenger_count, contact_number, requester_name, department } = req.body;

    if (!slotSet.has(`${slot_start}-${slot_end}`)) {
      return res.status(422).json({ error: 'INVALID_SLOT', message: 'Slot not in allowed list' });
    }

    // No-show block: 3 no-shows in a month → blocked from booking until month-end.
    const [[me]] = await pool.query(
      'SELECT DATE_FORMAT(booking_blocked_until, "%Y-%m-%d") AS blocked_until FROM users WHERE user_id = ? AND booking_blocked_until >= CURDATE()',
      [req.user.user_id],
    );
    if (me) {
      return res.status(403).json({
        error: 'USER_BLOCKED',
        message: `Too many no-shows — booking is blocked until ${me.blocked_until}.`,
      });
    }

    // Weekly limit: at most N non-cancelled bookings per Mon–Sun week (by trip date).
    const { bookings_per_week } = await getSettings();
    const [[{ wk }]] = await pool.query(
      "SELECT COUNT(*) AS wk FROM bookings WHERE user_id = ? AND status IN ('pending','approved','completed') AND YEARWEEK(booking_date, 1) = YEARWEEK(?, 1)",
      [req.user.user_id, booking_date],
    );
    if (wk >= bookings_per_week) {
      return res.status(403).json({
        error: 'WEEKLY_LIMIT',
        message: `You can book at most ${bookings_per_week} time(s) per week.`,
      });
    }

    // App-level conflict check (only pending/approved count as taken).
    const [[clash]] = await pool.query(
      "SELECT booking_id FROM bookings WHERE vehicle_id = ? AND booking_date = ? AND slot_start = ? AND status IN ('pending','approved') LIMIT 1",
      [vehicle_id, booking_date, slot_start],
    );
    if (clash) {
      return res.status(409).json({ error: 'SLOT_CONFLICT', message: 'This slot is no longer available.' });
    }

    try {
      const [result] = await pool.query(
        `INSERT INTO bookings
           (vehicle_id, user_id, destination, purpose, passenger_count, booking_date, slot_start, slot_end, status, contact_number, requester_name, department)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        [vehicle_id, req.user.user_id, destination, purpose, passenger_count, booking_date, slot_start, slot_end, contact_number, requester_name || null, department || null],
      );
      const code = `BK-${new Date().getFullYear()}-${String(result.insertId).padStart(4, '0')}`;
      notifyAdmins('booking_new', `New booking ${code} from ${req.user.email} — awaiting approval`, '/admin');
      return res.status(201).json({
        booking_id: result.insertId,
        code,
        status: 'pending',
        message: 'Booking submitted. Awaiting admin approval.',
      });
    } catch (err) {
      // Race safety net: two requests passed the app check; the DB unique
      // constraint lets exactly one win, the other lands here.
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        return res.status(409).json({ error: 'SLOT_CONFLICT', message: 'This slot is no longer available.' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// GET /bookings — employee sees own only (server-forced); admin sees all + filters.
async function list(req, res, next) {
  try {
    const isAdmin = isAdminRole(req.user.role);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];
    if (!isAdmin) {
      where.push('b.user_id = ?');
      params.push(req.user.user_id);
    } else {
      if (req.query.date) { where.push('b.booking_date = ?'); params.push(req.query.date); }
      if (req.query.vehicle_id) { where.push('b.vehicle_id = ?'); params.push(req.query.vehicle_id); }
      if (req.query.status) { where.push('b.status = ?'); params.push(req.query.status); }
      if (req.query.department) { where.push('u.department = ?'); params.push(req.query.department); }
      if (req.query.employee_name) { where.push('u.name LIKE ?'); params.push(`%${req.query.employee_name}%`); }
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b JOIN users u ON b.user_id = u.user_id ${whereSql}`,
      params,
    );
    const [data] = await pool.query(
      `${BOOKING_SELECT} ${whereSql} ORDER BY b.booking_date DESC, b.slot_start DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    res.json({ total, page, limit, data });
  } catch (err) {
    next(err);
  }
}

// GET /bookings/:id — admin any; employee own only (404 otherwise, no leak).
async function getOne(req, res, next) {
  try {
    const [[booking]] = await pool.query(`${BOOKING_SELECT} WHERE b.booking_id = ?`, [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'NOT_FOUND', message: 'Resource does not exist' });
    if (!isAdminRole(req.user.role) && booking.user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Resource does not exist' });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

// PATCH /bookings/:id/status — role-aware transitions.
const ADMIN_TRANSITIONS = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['completed', 'cancelled'],
  // rejected / completed / cancelled are terminal
};

async function updateStatus(req, res, next) {
  try {
    const { status: next_status } = req.body;
    const [[booking]] = await pool.query(
      'SELECT booking_id, user_id, status FROM bookings WHERE booking_id = ?',
      [req.params.id],
    );
    if (!booking) return res.status(404).json({ error: 'NOT_FOUND', message: 'Resource does not exist' });

    if (!isAdminRole(req.user.role)) {
      // Employee: cancel own pending booking only.
      if (booking.user_id !== req.user.user_id) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Resource does not exist' });
      }
      if (!(next_status === 'cancelled' && booking.status === 'pending')) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'You can only cancel your own pending booking' });
      }
    } else {
      const allowed = ADMIN_TRANSITIONS[booking.status] || [];
      if (!allowed.includes(next_status)) {
        return res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: `Illegal transition: ${booking.status} → ${next_status}`,
        });
      }
    }

    await pool.query('UPDATE bookings SET status = ? WHERE booking_id = ?', [next_status, req.params.id]);
    // Notify the booking owner when someone else changes their booking's status.
    if (booking.user_id !== req.user.user_id) {
      notify(booking.user_id, `booking_${next_status}`, `Your booking #${req.params.id} was ${next_status}`, '/my-bookings');
    }
    res.json({ booking_id: Number(req.params.id), status: next_status });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, updateStatus, BOOKING_SELECT };
