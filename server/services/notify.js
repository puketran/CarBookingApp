const pool = require('../config/db');

// Best-effort in-app notification — never fails the calling action.
async function notify(userId, type, message, link = null) {
  try {
    await pool.query('INSERT INTO notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)', [userId, type, message, link]);
  } catch (err) {
    console.error('[notify] failed:', err.message);
  }
}

async function notifyAdmins(type, message, link = null) {
  try {
    const [admins] = await pool.query("SELECT user_id FROM users WHERE role = 'admin' AND is_active = TRUE");
    for (const a of admins) {
      await pool.query('INSERT INTO notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)', [a.user_id, type, message, link]);
    }
  } catch (err) {
    console.error('[notify] failed:', err.message);
  }
}

module.exports = { notify, notifyAdmins };
