const pool = require('../config/db');
const SLOTS = require('../config/slots');
const { getSettings } = require('../services/settings');

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// GET /vehicles/available?date=YYYY-MM-DD
// For each active vehicle, return the fixed slots minus those already taken
// (pending/approved) on that date. Only vehicles with >=1 open slot are returned.
async function getAvailable(req, res, next) {
  try {
    const { date } = req.query;

    const [vehicles] = await pool.query(
      "SELECT vehicle_id, vehicle_name, capacity, driver_name, image_url, transmission, parking_location FROM vehicles WHERE status = 'active' ORDER BY vehicle_id",
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

// GET /vehicles — admin: all vehicles incl. assigned driver name.
async function list(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT v.vehicle_id, v.license_plate, v.vehicle_name, v.capacity, v.driver_name, v.status,
              v.notes, v.image_url, v.transmission, v.parking_location, v.driver_user_id,
              u.name AS driver_account
       FROM vehicles v LEFT JOIN users u ON v.driver_user_id = u.user_id
       ORDER BY v.vehicle_id`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

const VEHICLE_FIELDS = ['license_plate', 'vehicle_name', 'capacity', 'driver_name', 'status', 'notes', 'image_url', 'transmission', 'parking_location', 'driver_user_id'];

// POST /vehicles — insert only provided fields so DB defaults (e.g. status) apply.
async function create(req, res, next) {
  try {
    const cols = VEHICLE_FIELDS.filter((f) => req.body[f] !== undefined && req.body[f] !== '');
    const [r] = await pool.query(
      `INSERT INTO vehicles (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      cols.map((f) => req.body[f]),
    );
    res.status(201).json({ vehicle_id: r.insertId });
  } catch (err) {
    next(err);
  }
}

// PUT /vehicles/:id — update provided fields only.
async function update(req, res, next) {
  try {
    const set = [];
    const params = [];
    for (const f of VEHICLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) { set.push(`${f} = ?`); params.push(req.body[f]); }
    }
    if (set.length) {
      params.push(req.params.id);
      await pool.query(`UPDATE vehicles SET ${set.join(', ')} WHERE vehicle_id = ?`, params);
    }
    res.json({ vehicle_id: Number(req.params.id), ok: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /vehicles/:id — soft delete (status = inactive).
async function remove(req, res, next) {
  try {
    await pool.query("UPDATE vehicles SET status = 'inactive' WHERE vehicle_id = ?", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// GET /vehicles/active — active vehicles for the employee booking picker.
async function active(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT vehicle_id, vehicle_name, capacity, driver_name, image_url, transmission, parking_location FROM vehicles WHERE status = 'active' ORDER BY vehicle_id",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /vehicles/:id/availability — from Monday of this week through booking_weeks*7 days.
async function availability(req, res, next) {
  try {
    const { booking_weeks } = await getSettings();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Monday of the current week (getDay: 0=Sun..6=Sat).
    const monday = new Date(today);
    const shift = (today.getDay() + 6) % 7;
    monday.setDate(today.getDate() - shift);
    const total = booking_weeks * 7;
    const end = new Date(monday);
    end.setDate(monday.getDate() + total - 1);

    const [booked] = await pool.query(
      "SELECT DATE_FORMAT(booking_date, '%Y-%m-%d') d, TIME_FORMAT(slot_start, '%H:%i') s FROM bookings WHERE vehicle_id = ? AND status IN ('pending','approved') AND booking_date BETWEEN ? AND ?",
      [req.params.id, ymd(monday), ymd(end)],
    );
    const takenByDay = {};
    for (const r of booked) (takenByDay[r.d] ||= []).push(r.s);

    const days = [];
    for (let i = 0; i < total; i += 1) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const date = ymd(d);
      const taken = takenByDay[date] || [];
      days.push({
        date,
        dow: DOW[d.getDay()],
        past: date < ymd(today),
        open: SLOTS.length - taken.length,
        takenSlots: taken,
      });
    }
    res.json({ weeks: booking_weeks, days });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAvailable, list, create, update, remove, active, availability };
