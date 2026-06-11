const pool = require('../config/db');

const SLOTS_PER_DAY = 5;
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
// "used" = slots actually consumed; pending is reserved but counted as taken elsewhere.
// For utilisation we count approved + completed.

// GET /dashboard/summary
async function summary(req, res, next) {
  try {
    const [[{ total_vehicles }]] = await pool.query("SELECT COUNT(*) AS total_vehicles FROM vehicles WHERE status = 'active'");
    const [[{ todays_bookings }]] = await pool.query(
      "SELECT COUNT(*) AS todays_bookings FROM bookings WHERE booking_date = CURDATE() AND status NOT IN ('cancelled','rejected')",
    );
    const [[{ used_today }]] = await pool.query(
      "SELECT COUNT(*) AS used_today FROM bookings WHERE booking_date = CURDATE() AND status IN ('approved','completed')",
    );
    const totalSlotsToday = (total_vehicles || 0) * SLOTS_PER_DAY;
    const utilisation_rate = totalSlotsToday ? Math.round((used_today / totalSlotsToday) * 1000) / 10 : 0;
    const [[most]] = await pool.query(
      `SELECT v.vehicle_name FROM bookings b JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       WHERE b.status NOT IN ('cancelled','rejected')
       GROUP BY b.vehicle_id ORDER BY COUNT(*) DESC LIMIT 1`,
    );
    res.json({ total_vehicles, todays_bookings, utilisation_rate, most_used_vehicle: most?.vehicle_name || '—' });
  } catch (err) {
    next(err);
  }
}

// GET /dashboard/utilisation?from&to
async function utilisation(req, res, next) {
  try {
    const to = req.query.to || today();
    const from = req.query.from || daysAgo(29);
    const days = Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);

    const [vehicles] = await pool.query("SELECT vehicle_id, vehicle_name FROM vehicles WHERE status = 'active' ORDER BY vehicle_id");
    const [used] = await pool.query(
      "SELECT vehicle_id, COUNT(*) AS used FROM bookings WHERE status IN ('approved','completed') AND booking_date BETWEEN ? AND ? GROUP BY vehicle_id",
      [from, to],
    );
    const usedMap = Object.fromEntries(used.map((r) => [r.vehicle_id, r.used]));
    res.json(
      vehicles.map((v) => {
        const u = usedMap[v.vehicle_id] || 0;
        const total = days * SLOTS_PER_DAY;
        return { vehicle_id: v.vehicle_id, vehicle_name: v.vehicle_name, total_slots: total, used_slots: u, utilisation_pct: total ? Math.round((u / total) * 1000) / 10 : 0 };
      }),
    );
  } catch (err) {
    next(err);
  }
}

// GET /dashboard/booking-trend?period&from&to
async function bookingTrend(req, res, next) {
  try {
    const to = req.query.to || today();
    const from = req.query.from || daysAgo(29);
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

// GET /dashboard/peak-hours
async function peakHours(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT TIME_FORMAT(slot_start, '%H:%i') AS slot_start, TIME_FORMAT(slot_end, '%H:%i') AS slot_end, COUNT(*) AS count
       FROM bookings WHERE status NOT IN ('cancelled','rejected')
       GROUP BY slot_start, slot_end ORDER BY slot_start`,
    );
    res.json(rows.map((r) => ({ slot: `${r.slot_start}-${r.slot_end}`, count: r.count })));
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, utilisation, bookingTrend, peakHours };
