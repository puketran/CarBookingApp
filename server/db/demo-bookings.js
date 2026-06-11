// Dev-only: clears bookings and inserts a varied set across the current-ish month
// so the dashboard / calendar look populated. Safe to re-run.
require('dotenv').config();
const pool = require('../config/db');

const SLOTS = [['08:00', '10:00'], ['10:30', '12:30'], ['13:00', '15:00'], ['15:30', '17:30'], ['18:00', '20:00']];
const DEST = ['Tan Son Nhat (SGN)', 'Office HQ', 'Client visit', 'District 1', 'Factory'];

// [vehicle_id, user_id, date, slotIdx, status, driver_confirmed]
const DATA = [
  // completed (past)
  [1, 1, '2026-06-03', 0, 'completed', 1],
  [2, 1, '2026-06-04', 1, 'completed', 1],
  [3, 2, '2026-06-05', 2, 'completed', null],
  [1, 1, '2026-06-06', 3, 'completed', 1],
  [2, 1, '2026-06-09', 1, 'completed', 1],
  [3, 2, '2026-06-10', 1, 'completed', null],
  // no-show (past) — keep <3 per user so nobody auto-blocks
  [1, 1, '2026-06-04', 2, 'no_show', null],
  [2, 2, '2026-06-05', 0, 'no_show', null],
  // approved (now/future)
  [1, 1, '2026-06-12', 1, 'approved', 1],
  [2, 1, '2026-06-13', 2, 'approved', null],
  [3, 1, '2026-06-15', 0, 'approved', 1],
  [1, 2, '2026-06-16', 3, 'approved', null],
  [2, 1, '2026-06-23', 1, 'approved', 1],
  // pending (future)
  [2, 1, '2026-06-17', 1, 'pending', null],
  [3, 2, '2026-06-18', 2, 'pending', null],
  [1, 1, '2026-06-19', 0, 'pending', null],
  [2, 2, '2026-06-20', 3, 'pending', null],
  [3, 1, '2026-06-24', 1, 'pending', null],
  // cancelled
  [3, 1, '2026-06-08', 4, 'cancelled', null],
  [1, 2, '2026-06-22', 4, 'cancelled', null],
];

async function main() {
  await pool.query('DELETE FROM bookings');
  let n = 0;
  for (const [vehicle_id, user_id, date, slotIdx, status, dc] of DATA) {
    const [s, e] = SLOTS[slotIdx];
    await pool.query(
      `INSERT INTO bookings (vehicle_id, user_id, destination, purpose, passenger_count, booking_date, slot_start, slot_end, status, contact_number, driver_confirmed)
       VALUES (?, ?, ?, 'Demo', 2, ?, ?, ?, ?, '0900000000', ?)`,
      [vehicle_id, user_id, DEST[slotIdx], date, s, e, status, dc],
    );
    n++;
  }
  // make sure nobody is left blocked from earlier tests
  await pool.query('UPDATE users SET booking_blocked_until = NULL');
  console.log(`Inserted ${n} demo bookings; cleared any blocks.`);
  await pool.end();
}

main().catch((err) => { console.error('demo seed failed:', err.message); process.exit(1); });
