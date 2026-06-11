// Seeds 3 vehicles and 3 users (one per role). Idempotent: only inserts when
// the table is empty, so re-running won't duplicate rows. SUPER_ADMIN_EMAIL
// bootstraps the first admin (role 'admin') so it matches the env-gated login.
// Also backfills vehicle media (image/transmission/parking) added in 006.
require('dotenv').config();
const pool = require('../config/db');
const { hashPassword } = require('../services/password');

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'super@company.com';

const vehicles = [
  ['51A-12345', 'Innova 01', 7, 'Nguyen Tai', 'active', ''],
  ['51A-67890', 'Innova 02', 7, 'Tran Hung', 'active', ''],
  ['51B-11122', 'Vios 01', 4, 'Le Minh', 'active', ''],
];

const users = [
  ['employee@company.com', 'Nguyen Van A', 'Marketing', 'employee'],
  ['admin@company.com', 'Tran Thi B', 'Operations', 'admin'],
  // SUPER_ADMIN_EMAIL bootstraps the first admin (role is just 'admin').
  [SUPER_ADMIN_EMAIL, 'Super Admin', 'IT', 'admin'],
];

// Backfill values for the 006 columns (placeholder images shipped in client/public/vehicles).
const MEDIA = {
  'Innova 01': ['/vehicles/suv.svg', 'auto', 'Parking B1'],
  'Innova 02': ['/vehicles/van.svg', 'auto', 'Parking C1'],
  'Vios 01': ['/vehicles/sedan.svg', 'auto', 'Parking B2'],
};

async function seedIfEmpty(table, rows, insertSql) {
  const [[{ n }]] = await pool.query(`SELECT COUNT(*) AS n FROM ${table}`);
  if (n > 0) {
    console.log(`• ${table}: already has ${n} row(s), skipping`);
    return;
  }
  for (const row of rows) await pool.query(insertSql, row);
  console.log(`• ${table}: inserted ${rows.length} row(s)`);
}

async function ensureUser(email, name, dept, role) {
  const [[u]] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
  if (u) return u.user_id;
  const [r] = await pool.query('INSERT INTO users (email, name, department, role) VALUES (?, ?, ?, ?)', [email, name, dept, role]);
  console.log(`• users: added ${role} ${email}`);
  return r.insertId;
}

// Seed a driver account and link it to its vehicle (Nguyen Tai → Innova 01).
async function ensureVehicleDriver() {
  const driverId = await ensureUser('driver@company.com', 'Nguyen Tai', 'Fleet', 'driver');
  const [r] = await pool.query(
    "UPDATE vehicles SET driver_user_id = ? WHERE driver_name = 'Nguyen Tai' AND driver_user_id IS NULL",
    [driverId],
  );
  console.log(r.affectedRows ? `• vehicles: linked driver to ${r.affectedRows} vehicle(s)` : '• vehicles: driver already linked');
}

async function ensureVehicleMedia() {
  const [rows] = await pool.query('SELECT vehicle_id, vehicle_name FROM vehicles WHERE image_url IS NULL');
  for (const r of rows) {
    const m = MEDIA[r.vehicle_name] || ['/vehicles/sedan.svg', 'auto', 'Parking A1'];
    await pool.query('UPDATE vehicles SET image_url = ?, transmission = ?, parking_location = ? WHERE vehicle_id = ?', [...m, r.vehicle_id]);
  }
  console.log(rows.length ? `• vehicles: set media on ${rows.length} row(s)` : '• vehicles: media already set');
}

// Dev convenience: give seeded accounts a default password so login works
// without going through the OTP set-password flow first.
async function ensurePasswords() {
  const [rows] = await pool.query('SELECT user_id FROM users WHERE password_hash IS NULL');
  for (const r of rows) await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashPassword('password123'), r.user_id]);
  console.log(rows.length ? `• users: set default password (password123) on ${rows.length} account(s)` : '• users: passwords already set');
}

async function main() {
  await seedIfEmpty(
    'vehicles',
    vehicles,
    'INSERT INTO vehicles (license_plate, vehicle_name, capacity, driver_name, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
  );
  await seedIfEmpty(
    'users',
    users,
    'INSERT INTO users (email, name, department, role) VALUES (?, ?, ?, ?)',
  );
  await ensureVehicleMedia();
  await ensureVehicleDriver();
  await ensurePasswords();
  await pool.end();
  console.log('\nSeed complete.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
