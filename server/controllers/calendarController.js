const pool = require('../config/db');

const SLOTS_PER_DAY = 5;
const currentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

// GET /calendar?month=YYYY-MM — vehicle × day occupancy for the month.
async function month(req, res, next) {
  try {
    const m = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : currentMonth();
    const first = `${m}-01`;
    const [y, mo] = m.split('-').map(Number);
    const daysInMonth = new Date(y, mo, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => `${m}-${String(i + 1).padStart(2, '0')}`);

    const [vehicles] = await pool.query('SELECT vehicle_id, vehicle_name, status FROM vehicles ORDER BY vehicle_id');
    const [counts] = await pool.query(
      `SELECT vehicle_id, DATE_FORMAT(booking_date, '%Y-%m-%d') AS d, COUNT(*) AS booked
       FROM bookings
       WHERE status IN ('pending','approved','completed') AND booking_date BETWEEN ? AND LAST_DAY(?)
       GROUP BY vehicle_id, d`,
      [first, first],
    );

    const byVehicle = {};
    for (const r of counts) {
      (byVehicle[r.vehicle_id] ||= {})[r.d] = r.booked;
    }

    res.json({
      month: m,
      slots_per_day: SLOTS_PER_DAY,
      days,
      vehicles: vehicles.map((v) => ({ ...v, cells: byVehicle[v.vehicle_id] || {} })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { month };
