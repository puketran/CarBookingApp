const pool = require('../config/db');

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

// Resolve a date range from ?days= (default 30); explicit from/to override it.
function range(req) {
  const days = Math.min(366, Math.max(1, parseInt(req.query.days, 10) || 30));
  const to = req.query.to || today();
  const from = req.query.from || daysAgo(days - 1);
  return { from, to, days };
}

// GET /dashboard/summary?days=30 — people/usage KPIs over the range, plus the
// current full-day approval backlog (not range-bound).
async function summary(req, res, next) {
  try {
    const { from, to } = range(req);
    const [[{ total_bookings }]] = await pool.query(
      "SELECT COUNT(*) AS total_bookings FROM bookings WHERE status NOT IN ('cancelled','rejected') AND booking_date BETWEEN ? AND ?",
      [from, to],
    );
    const [[{ active_employees }]] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) AS active_employees FROM bookings WHERE status NOT IN ('cancelled','rejected') AND booking_date BETWEEN ? AND ?",
      [from, to],
    );
    const [[{ full_day_pending }]] = await pool.query(
      "SELECT COUNT(*) AS full_day_pending FROM bookings WHERE booking_type = 'full_day' AND status = 'pending'",
    );
    const avg_bookings_per_employee = active_employees ? Math.round((total_bookings / active_employees) * 10) / 10 : 0;
    res.json({ total_bookings, active_employees, avg_bookings_per_employee, full_day_pending });
  } catch (err) {
    next(err);
  }
}

// GET /dashboard/booking-trend?days=30&period=day|week|month
async function bookingTrend(req, res, next) {
  try {
    const { from, to } = range(req);
    const fmt = req.query.period === 'month' ? '%Y-%m' : req.query.period === 'week' ? '%x-W%v' : '%Y-%m-%d';
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(booking_date, ?) AS period, COUNT(*) AS count
       FROM bookings WHERE status NOT IN ('cancelled','rejected') AND booking_date BETWEEN ? AND ?
       GROUP BY period ORDER BY period`,
      [fmt, from, to],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /dashboard/peak-hours?days=30 — slot histogram over the range (full-day excluded).
async function peakHours(req, res, next) {
  try {
    const { from, to } = range(req);
    const [rows] = await pool.query(
      `SELECT TIME_FORMAT(slot_start, '%H:%i') AS slot_start, TIME_FORMAT(slot_end, '%H:%i') AS slot_end, COUNT(*) AS count
       FROM bookings WHERE status NOT IN ('cancelled','rejected') AND booking_type = 'slot' AND booking_date BETWEEN ? AND ?
       GROUP BY slot_start, slot_end ORDER BY slot_start`,
      [from, to],
    );
    res.json(rows.map((r) => ({ slot: `${r.slot_start}-${r.slot_end}`, count: r.count })));
  } catch (err) {
    next(err);
  }
}

// GET /dashboard/breakdown?days=30 — status mix + slot/full-day split over the range.
async function breakdown(req, res, next) {
  try {
    const { from, to } = range(req);
    const [byStatus] = await pool.query(
      'SELECT status, COUNT(*) AS count FROM bookings WHERE booking_date BETWEEN ? AND ? GROUP BY status',
      [from, to],
    );
    const [[{ slot }]] = await pool.query(
      "SELECT COUNT(*) AS slot FROM bookings WHERE booking_type = 'slot' AND status NOT IN ('cancelled','rejected') AND booking_date BETWEEN ? AND ?",
      [from, to],
    );
    const [[{ full_day }]] = await pool.query(
      "SELECT COUNT(*) AS full_day FROM bookings WHERE booking_type = 'full_day' AND status NOT IN ('cancelled','rejected') AND booking_date BETWEEN ? AND ?",
      [from, to],
    );
    res.json({ by_status: byStatus, by_type: { slot, full_day } });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, bookingTrend, peakHours, breakdown };
