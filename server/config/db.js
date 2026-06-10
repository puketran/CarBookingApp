// MySQL connection pool. Reads DATABASE_URL (Railway MySQL plugin).
// The pool is lazy — it does not open a connection until the first query,
// so the server can boot and serve non-DB routes (/health, /slots) without a live DB.
require('dotenv').config();
const mysql = require('mysql2/promise');

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL is not set — DB queries will fail until you set it.');
}

const pool = mysql.createPool(
  process.env.DATABASE_URL || 'mysql://root@localhost:3306/carbooking',
);

module.exports = pool;
