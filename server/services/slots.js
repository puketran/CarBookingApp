const pool = require('../config/db');
const DEFAULT_SLOTS = require('../config/slots');

// Resolve the bookable slots for a driver. Custom slots from the `slots` table
// (active only) win; with none configured we fall back to the 5 fixed defaults.
async function getDriverSlots(driverUserId) {
  if (!driverUserId) return DEFAULT_SLOTS;
  const [rows] = await pool.query(
    `SELECT TIME_FORMAT(slot_start, '%H:%i') AS slot_start, TIME_FORMAT(slot_end, '%H:%i') AS slot_end
       FROM slots WHERE driver_user_id = ? AND is_active = 1 ORDER BY slot_start`,
    [driverUserId],
  );
  return rows.length ? rows : DEFAULT_SLOTS;
}

// Resolve the bookable slots for a vehicle (via its assigned driver).
async function getVehicleSlots(vehicleId) {
  const [[v]] = await pool.query('SELECT driver_user_id FROM vehicles WHERE vehicle_id = ?', [vehicleId]);
  return getDriverSlots(v && v.driver_user_id);
}

module.exports = { getDriverSlots, getVehicleSlots, DEFAULT_SLOTS };
