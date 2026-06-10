// Seeds 3 vehicles and 3 users (one per role). Idempotent: only inserts when
// the table is empty, so re-running won't duplicate rows. The super_admin email
// is taken from SUPER_ADMIN_EMAIL so it matches the env-gated login.
require('dotenv').config();
const pool = require('../config/db');

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'super@company.com';

const vehicles = [
  ['51A-12345', 'Innova 01', 7, 'Nguyen Tai', 'active', ''],
  ['51A-67890', 'Innova 02', 7, 'Tran Hung', 'active', ''],
  ['51B-11122', 'Vios 01', 4, 'Le Minh', 'active', ''],
];

const users = [
  ['employee@company.com', 'Nguyen Van A', 'Marketing', 'employee'],
  ['admin@company.com', 'Tran Thi B', 'Operations', 'admin'],
  [SUPER_ADMIN_EMAIL, 'Super Admin', 'IT', 'super_admin'],
];

async function seedIfEmpty(table, countCol, rows, insertSql) {
  const [[{ n }]] = await pool.query(`SELECT COUNT(*) AS n FROM ${table}`);
  if (n > 0) {
    console.log(`• ${table}: already has ${n} row(s), skipping`);
    return;
  }
  for (const row of rows) await pool.query(insertSql, row);
  console.log(`• ${table}: inserted ${rows.length} row(s)`);
}

async function main() {
  await seedIfEmpty(
    'vehicles',
    'vehicle_id',
    vehicles,
    'INSERT INTO vehicles (license_plate, vehicle_name, capacity, driver_name, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
  );
  await seedIfEmpty(
    'users',
    'user_id',
    users,
    'INSERT INTO users (email, name, department, role) VALUES (?, ?, ?, ?)',
  );
  await pool.end();
  console.log('\nSeed complete.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
