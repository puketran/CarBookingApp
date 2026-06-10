// Runs every .sql file in db/migrations in filename order against DATABASE_URL.
// Idempotent: migrations use CREATE TABLE IF NOT EXISTS.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true,
  });

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    process.stdout.write(`→ ${file} ... `);
    await conn.query(sql);
    console.log('ok');
  }

  await conn.end();
  console.log(`\nDone. ${files.length} migration(s) applied.`);
}

main().catch((err) => {
  console.error('\nMigration failed:', err.message);
  process.exit(1);
});
