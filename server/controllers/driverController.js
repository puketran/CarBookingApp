const pool = require('../config/db');
const { BOOKING_SELECT } = require('./bookingController');
const { notify, notifyAdmins } = require('./../services/notify');
const { getSettings } = require('./../services/settings');

// After a no-show, if the owner hit the monthly limit, block them for ban_months.
async function applyStrike(bookingId) {
  const [[b]] = await pool.query('SELECT user_id FROM bookings WHERE booking_id = ?', [bookingId]);
  if (!b) return;
  const { noshow_limit, ban_months } = await getSettings();
  const [[{ n }]] = await pool.query(
    `SELECT COUNT(*) AS n FROM bookings
       WHERE user_id = ? AND status = 'no_show'
         AND YEAR(booking_date) = YEAR(CURDATE()) AND MONTH(booking_date) = MONTH(CURDATE())`,
    [b.user_id],
  );
  if (n >= noshow_limit) {
    await pool.query('UPDATE users SET booking_blocked_until = DATE_ADD(CURDATE(), INTERVAL ? MONTH) WHERE user_id = ?', [ban_months, b.user_id]);
    notify(b.user_id, 'blocked', `You've reached ${noshow_limit} no-shows — booking is blocked for ${ban_months} month(s)`, '/my-bookings');
  }
}

// GET /driver/trips — bookings on vehicles this driver is assigned to.
async function trips(req, res, next) {
  try {
    const params = [req.user.user_id];
    let where = 'WHERE v.driver_user_id = ?';
    if (req.query.status) { where += ' AND b.status = ?'; params.push(req.query.status); }
    const [rows] = await pool.query(
      `${BOOKING_SELECT} ${where} ORDER BY b.booking_date DESC, b.slot_start DESC`,
      params,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /driver/trips/:id — confirm / decline / complete (own vehicle, approved trips).
async function actOnTrip(req, res, next) {
  try {
    const { action } = req.body;
    const reason = (req.body.reason || '').toString().trim();
    const [[b]] = await pool.query(
      `SELECT b.booking_id, b.status, b.user_id, b.driver_confirmed, b.booking_type, (b.booking_date = CURDATE()) AS is_today
       FROM bookings b JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       WHERE b.booking_id = ? AND v.driver_user_id = ?`,
      [req.params.id, req.user.user_id],
    );
    if (!b) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Resource does not exist' });
    }
    // Regular trips: the driver confirms/denies pending or approved directly.
    // Full-day trips: only after an admin has approved them (status === 'approved').
    const actionable = b.booking_type === 'full_day'
      ? b.status === 'approved'
      : (b.status === 'pending' || b.status === 'approved');

    if (action === 'confirm') {
      if (!actionable) return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'This trip can no longer be confirmed' });
      await pool.query("UPDATE bookings SET status = 'approved', driver_confirmed = 1 WHERE booking_id = ?", [b.booking_id]);
      notify(b.user_id, 'trip_confirm', `A driver confirmed your trip (booking #${b.booking_id})`, '/my-bookings');
    } else if (action === 'decline') {
      if (!actionable) return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'This trip can no longer be denied' });
      await pool.query("UPDATE bookings SET status = 'rejected', driver_confirmed = 0 WHERE booking_id = ?", [b.booking_id]);
      const tail = reason ? `: ${reason}` : '';
      notify(b.user_id, 'trip_declined', `A driver declined your trip (booking #${b.booking_id})${tail}`, '/my-bookings');
      notifyAdmins('trip_declined', `Driver declined booking #${b.booking_id}${tail}`, '/admin');
    } else if (action === 'complete' || action === 'no_show') {
      // Only after the driver has confirmed, and only on the trip's day.
      if (b.status !== 'approved' || b.driver_confirmed !== 1) {
        return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Confirm the trip first.' });
      }
      if (!b.is_today) {
        return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'This is only available on the trip day.' });
      }
      if (action === 'complete') {
        await pool.query("UPDATE bookings SET status = 'completed' WHERE booking_id = ?", [b.booking_id]);
        notify(b.user_id, 'trip_complete', `Your trip was marked completed (booking #${b.booking_id})`, '/my-bookings');
      } else {
        await pool.query("UPDATE bookings SET status = 'no_show' WHERE booking_id = ?", [b.booking_id]);
        await applyStrike(b.booking_id);
        notify(b.user_id, 'trip_no_show', `Your trip was marked as a no-show (booking #${b.booking_id})`, '/my-bookings');
      }
    } else {
      return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Unknown action' });
    }
    res.json({ booking_id: Number(req.params.id), action });
  } catch (err) {
    next(err);
  }
}

// GET /driver/vehicles — vehicles assigned to this driver.
async function myVehicles(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT vehicle_id, vehicle_name, status, image_url, parking_location FROM vehicles WHERE driver_user_id = ?',
      [req.user.user_id],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /driver/vehicles/:id/status — toggle active/maintenance on own vehicle.
async function setVehicleStatus(req, res, next) {
  try {
    const { status } = req.body;
    const [[v]] = await pool.query('SELECT driver_user_id FROM vehicles WHERE vehicle_id = ?', [req.params.id]);
    if (!v || v.driver_user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Resource does not exist' });
    }
    await pool.query('UPDATE vehicles SET status = ? WHERE vehicle_id = ?', [status, req.params.id]);
    res.json({ vehicle_id: Number(req.params.id), status });
  } catch (err) {
    next(err);
  }
}

module.exports = { trips, actOnTrip, myVehicles, setVehicleStatus };
