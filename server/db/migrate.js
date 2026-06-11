// Runs db/migrations/*.sql in filename order, tracking applied files in a
// schema_migrations table so each runs exactly once (needed now that we have
// non-idempotent ALTERs alongside the CREATE TABLE IF NOT EXISTS files).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL, multipleStatements: true });
  await conn.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
  );
  const [rows] = await conn.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map((r) => r.name));

  let applied = 0;
  for (const file of files) {
    if (done.has(file)) {
      console.log(`• ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    process.stdout.write(`→ ${file} ... `);
    await conn.query(sql);
    await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
    console.log('ok');
    applied++;
  }

  await conn.end();
  console.log(`\nDone. ${applied} new migration(s) applied.`);
}

main().catch((err) => {
  console.error('\nMigration failed:', err.message);
  process.exit(1);
});
