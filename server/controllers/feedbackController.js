const pool = require('../config/db');

const CATEGORIES = ['bug', 'idea', 'question', 'other'];

// POST /feedback — any authenticated user submits feedback.
async function create(req, res, next) {
  try {
    const { message, page } = req.body;
    const category = CATEGORIES.includes(req.body.category) ? req.body.category : 'other';
    const [r] = await pool.query(
      'INSERT INTO feedback (user_id, email, page, category, message) VALUES (?, ?, ?, ?, ?)',
      [req.user.user_id, req.user.email, page || null, category, message],
    );
    res.status(201).json({ id: r.insertId, message: 'Thanks for the feedback!' });
  } catch (err) {
    next(err);
  }
}

// GET /feedback — admin only; optional ?status= / ?category= filters.
async function list(req, res, next) {
  try {
    const where = [];
    const params = [];
    if (req.query.status) { where.push('f.status = ?'); params.push(req.query.status); }
    if (req.query.category) { where.push('f.category = ?'); params.push(req.query.category); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT f.*, u.name AS employee_name
         FROM feedback f LEFT JOIN users u ON f.user_id = u.user_id
       ${whereSql} ORDER BY f.id DESC`,
      params,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /feedback/:id — admin updates triage status.
async function updateStatus(req, res, next) {
  try {
    await pool.query('UPDATE feedback SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ id: Number(req.params.id), status: req.body.status });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, updateStatus };
