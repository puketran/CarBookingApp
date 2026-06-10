const pool = require('../config/db');
const SLOTS = require('../config/slots');

// GET /vehicles/available?date=YYYY-MM-DD
// For each active vehicle, return the fixed slots minus those already taken
// (pending/approved) on that date. Only vehicles with >=1 open slot are returned.
async function getAvailable(req, res, next) {
  try {
    const { date } = req.query;

    const [vehicles] = await pool.query(
      "SELECT vehicle_id, vehicle_name, capacity, driver_name FROM vehicles WHERE status = 'active' ORDER BY vehicle_id",
    );
    const [booked] = await pool.query(
      "SELECT vehicle_id, TIME_FORMAT(slot_start, '%H:%i') AS slot_start FROM bookings WHERE booking_date = ? AND status IN ('pending','approved')",
      [date],
    );

    const takenByVehicle = {};
    for (const b of booked) {
      (takenByVehicle[b.vehicle_id] ||= new Set()).add(b.slot_start);
    }

    const result = vehicles
      .map((v) => {
        const taken = takenByVehicle[v.vehicle_id] || new Set();
        return { ...v, available_slots: SLOTS.filter((s) => !taken.has(s.slot_start)) };
      })
      .filter((v) => v.available_slots.length > 0);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAvailable };
