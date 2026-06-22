// Non-destructive demo data for the admin dashboard.
//   - Collapses the fleet to ONE active vehicle (prefers "Innova 1"); hides the rest.
//   - Ensures ~8 demo employees exist.
//   - Appends ~30 days of bookings on the keep-vehicle (INSERT IGNORE — never deletes).
//   - Adds a few full-day PENDING requests (the "needs approval" KPI).
// Idempotent: re-running adds little/nothing (unique slot constraint + INSERT IGNORE).
// Run with:  npm run seed:demo
require('dotenv').config();
const pool = require('../config/db');
const { hashPassword } = require('../services/password');

const SLOTS = [['08:00', '10:00'], ['10:30', '12:30'], ['13:00', '15:00'], ['15:30', '17:30'], ['18:00', '20:00']];
const DEST = ['Tan Son Nhat (SGN)', 'Office HQ', 'Client visit — District 1', 'Factory — Binh Duong', 'Partner meeting', 'Airport pickup'];
const DEMO_EMPLOYEES = [
  ['linh.demo@company.com', 'Pham Thuy Linh', 'Marketing'],
  ['quan.demo@company.com', 'Le Minh Quan', 'Engineering'],
  ['huong.demo@company.com', 'Tran Thu Huong', 'Finance'],
  ['nam.demo@company.com', 'Nguyen Hoai Nam', 'Sales'],
  ['mai.demo@company.com', 'Vo Thi Mai', 'HR'],
  ['dat.demo@company.com', 'Bui Tien Dat', 'Engineering'],
  ['trang.demo@company.com', 'Do Quynh Trang', 'Operations'],
  ['khoa.demo@company.com', 'Dang Anh Khoa', 'Sales'],
];

const ymd = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function sample(arr, k) { const c = [...arr]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c.slice(0, k); }

// 1) Fleet → one active vehicle, others inactive.
async function setupFleet() {
  const [act] = await pool.query("SELECT vehicle_id, vehicle_name, driver_user_id FROM vehicles WHERE status = 'active' ORDER BY vehicle_id");
  let keep = act.find((v) => /innova\s*0?1\b/i.test(v.vehicle_name)) || act[0];
  if (!keep) {
    const [[any]] = await pool.query('SELECT vehicle_id, vehicle_name, driver_user_id FROM vehicles ORDER BY vehicle_id LIMIT 1');
    keep = any;
  }
  if (!keep) throw new Error('No vehicles exist — run `npm run seed` first.');

  await pool.query("UPDATE vehicles SET status = 'active' WHERE vehicle_id = ?", [keep.vehicle_id]);
  const [hid] = await pool.query("UPDATE vehicles SET status = 'inactive' WHERE vehicle_id <> ?", [keep.vehicle_id]);

  // Ensure the keep-vehicle has a linked driver account.
  if (!keep.driver_user_id) {
    let [[drv]] = await pool.query("SELECT user_id FROM users WHERE role = 'driver' LIMIT 1");
    if (!drv) {
      const [r] = await pool.query("INSERT INTO users (email, name, department, role, password_hash) VALUES (?, ?, ?, 'driver', ?)",
        ['driver@company.com', 'Trai', 'Fleet', hashPassword('password123')]);
      drv = { user_id: r.insertId };
    }
    await pool.query('UPDATE vehicles SET driver_user_id = ? WHERE vehicle_id = ?', [drv.user_id, keep.vehicle_id]);
  }
  console.log(`• fleet: keep "${keep.vehicle_name}" (id ${keep.vehicle_id}) active; set ${hid.affectedRows} other vehicle(s) inactive`);
  return keep.vehicle_id;
}

// 2) Ensure a pool of employees for varied analytics.
async function ensureEmployees() {
  for (const [email, name, dept] of DEMO_EMPLOYEES) {
    const [[u]] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (!u) {
      await pool.query("INSERT INTO users (email, name, department, role, password_hash) VALUES (?, ?, ?, 'employee', ?)",
        [email, name, dept, hashPassword('password123')]);
    }
  }
  const [rows] = await pool.query("SELECT user_id FROM users WHERE role = 'employee'");
  console.log(`• employees: ${rows.length} employee account(s) available`);
  return rows.map((r) => r.user_id);
}

// 3) Append slot bookings across the last ~30 days (+ a few upcoming).
async function fillBookings(vehicleId, employees) {
  const noShowByUser = {};
  let inserted = 0;
  for (let off = -28; off <= 5; off++) {
    const d = addDays(off);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // weekdays only
    const date = ymd(d);
    const slotIdxs = sample([0, 1, 2, 3, 4], randInt(2, 4));
    for (const si of slotIdxs) {
      const [s, e] = SLOTS[si];
      const user = pick(employees);
      let status;
      if (off < 0) {
        const roll = Math.random();
        if (roll < 0.8) status = 'completed';
        else if (roll < 0.88 && (noShowByUser[user] || 0) < 2) { status = 'no_show'; noShowByUser[user] = (noShowByUser[user] || 0) + 1; }
        else status = 'cancelled';
      } else {
        status = Math.random() < 0.6 ? 'approved' : 'pending';
      }
      const driverConfirmed = status === 'completed' || status === 'approved' ? 1 : null;
      const [r] = await pool.query(
        `INSERT IGNORE INTO bookings
           (vehicle_id, user_id, destination, purpose, passenger_count, booking_date, slot_start, slot_end, status, contact_number, driver_confirmed, booking_type)
         VALUES (?, ?, ?, 'Demo', ?, ?, ?, ?, ?, ?, ?, 'slot')`,
        [vehicleId, user, pick(DEST), randInt(1, 4), date, s, e, status, `09${randInt(10000000, 99999999)}`, driverConfirmed],
      );
      inserted += r.affectedRows;
    }
  }
  console.log(`• bookings: inserted ${inserted} slot booking(s) (skipped pre-existing slots)`);
}

// 4) A few full-day PENDING requests on distinct upcoming weekdays.
async function fillFullDayPending(vehicleId, employees) {
  let inserted = 0;
  let added = 0;
  for (let off = 2; off <= 12 && added < 4; off++) {
    const d = addDays(off);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const [r] = await pool.query(
      `INSERT IGNORE INTO bookings
         (vehicle_id, user_id, destination, purpose, passenger_count, booking_date, slot_start, slot_end, status, contact_number, booking_type)
       VALUES (?, ?, ?, 'Team offsite', ?, ?, '00:00', '23:59', 'pending', ?, 'full_day')`,
      [vehicleId, pick(employees), pick(DEST), randInt(3, 7), ymd(d), `09${randInt(10000000, 99999999)}`],
    );
    inserted += r.affectedRows;
    added++;
  }
  console.log(`• full-day: inserted ${inserted} pending full-day request(s)`);
}

// 4b) A few past COMPLETED full-day trips so the "full-day vs slot" split has data in-range.
async function fillFullDayHistory(vehicleId, employees) {
  let inserted = 0;
  let added = 0;
  for (let off = -20; off <= -4 && added < 3; off += 6) {
    const d = addDays(off);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const [r] = await pool.query(
      `INSERT IGNORE INTO bookings
         (vehicle_id, user_id, destination, purpose, passenger_count, booking_date, slot_start, slot_end, status, contact_number, driver_confirmed, booking_type)
       VALUES (?, ?, ?, 'Team offsite', ?, ?, '00:00', '23:59', 'completed', ?, 1, 'full_day')`,
      [vehicleId, pick(employees), pick(DEST), randInt(3, 7), ymd(d), `09${randInt(10000000, 99999999)}`],
    );
    inserted += r.affectedRows;
    added++;
  }
  console.log(`• full-day: inserted ${inserted} completed full-day trip(s) (history)`);
}

async function main() {
  const vehicleId = await setupFleet();
  const employees = await ensureEmployees();
  await fillBookings(vehicleId, employees);
  await fillFullDayPending(vehicleId, employees);
  await fillFullDayHistory(vehicleId, employees);
  await pool.query('UPDATE users SET booking_blocked_until = NULL');
  console.log('• cleared any booking blocks');
  await pool.end();
  console.log('\nDemo setup complete.');
}

main().catch((err) => {
  console.error('\nDemo setup failed:', err.message);
  process.exit(1);
});
