const pool = require('../config/db');

const DEFAULTS = { booking_weeks: 2, bookings_per_week: 1, noshow_limit: 3, ban_months: 2, fullday_max_days: 14 };

// All settings are numeric; merge stored values over defaults.
async function getSettings() {
  const merged = { ...DEFAULTS };
  try {
    const [rows] = await pool.query('SELECT skey, svalue FROM settings');
    for (const r of rows) {
      if (r.skey in merged) merged[r.skey] = Number(r.svalue);
    }
  } catch {
    /* table missing pre-migration → defaults */
  }
  return merged;
}

async function setSettings(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (!(k in DEFAULTS)) continue;
    await pool.query(
      'INSERT INTO settings (skey, svalue) VALUES (?, ?) ON DUPLICATE KEY UPDATE svalue = VALUES(svalue)',
      [k, String(Math.max(0, parseInt(v, 10) || 0))],
    );
  }
}

module.exports = { getSettings, setSettings, DEFAULTS };
