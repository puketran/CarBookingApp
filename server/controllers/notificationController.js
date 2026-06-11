const pool = require('../config/db');

// GET /notifications — recent for the current user + unread count.
async function list(req, res, next) {
  try {
    const [items] = await pool.query(
      'SELECT id, type, message, link, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50',
      [req.user.user_id],
    );
    const [[{ unread }]] = await pool.query('SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.user_id]);
    res.json({ unread, items });
  } catch (err) {
    next(err);
  }
}

async function unreadCount(req, res, next) {
  try {
    const [[{ unread }]] = await pool.query('SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.user_id]);
    res.json({ unread });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.user_id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function readAll(req, res, next) {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.user_id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, unreadCount, markRead, readAll };
