const pool = require('../config/db');
const SLOTS = require('../config/slots');

const slotSet = new Set(SLOTS.map((s) => `${s.slot_start}-${s.slot_end}`));
const isAdminRole = (role) => role === 'admin' || role === 'super_admin';

const BOOKING_SELECT = `
  SELECT b.booking_id, b.vehicle_id, v.vehicle_name, b.user_id, u.name AS employee_name,
         u.department, b.contact_number, b.destination, b.purpose, b.passenger_count,
         b.booking_date, TIME_FORMAT(b.slot_start, '%H:%i') AS slot_start,
         TIME_FORMAT(b.slot_end, '%H:%i') AS slot_end, b.status, b.created_at, b.updated_at
  FROM bookings b
  JOIN users u ON b.user_id = u.user_id
  JOIN vehicles v ON b.vehicle_id = v.vehicle_id`;

// POST /bookings — lock a slot as pending. App-level check + DB unique constraint.
async function create(req, res, next) {
  try {
    const { vehicle_id, booking_date, slot_start, slot_end, destination, purpose, passenger_count, contact_number } = req.body;

    if (!slotSet.has(`${slot_start}-${slot_end}`)) {
      return res.status(422).json({ error: 'INVALID_SLOT', message: 'Slot not in allowed list' });
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
           (vehicle_id, user_id, destination, purpose, passenger_count, booking_date, slot_start, slot_end, status, contact_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [vehicle_id, req.user.user_id, destination, purpose, passenger_count, booking_date, slot_start, slot_end, contact_number],
      );
      return res.status(201).json({
        booking_id: result.insertId,
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
    res.json({ booking_id: Number(req.params.id), status: next_status });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, updateStatus };
