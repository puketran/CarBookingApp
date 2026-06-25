// Mounts the /api/v1 routes.
//   Day 1: /slots
//   Day 2: /auth/* + protected probes (/me, /admin/ping)
//   Day 3: /vehicles, /bookings
const express = require('express');
const pool = require('../config/db');
const slots = require('../config/slots');
const auth = require('./auth');
const vehicles = require('./vehicles');
const bookings = require('./bookings');
const driver = require('./driver');
const admin = require('./admin');
const dashboard = require('./dashboard');
const calendar = require('./calendar');
const exportRoutes = require('./export');
const notifications = require('./notifications');
const feedback = require('./feedback');
const driverController = require('../controllers/driverController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

const router = express.Router();

// GET /api/v1/slots — the master list of fixed daily slots. Access: all.
router.get('/slots', (req, res) => {
  res.json(slots);
});

// Auth endpoints (public).
router.use('/auth', auth);

// Booking domain (Day 3).
router.use('/vehicles', vehicles);
router.use('/bookings', bookings);
router.use('/driver', driver);
router.use('/admin', admin);
router.use('/dashboard', dashboard);
router.use('/calendar', calendar);
router.use('/export', exportRoutes);
router.use('/notifications', notifications);

// Feedback (in-app collection).
router.use('/feedback', feedback);

// Vehicles under maintenance with a driver message — app-wide banner for all users.
router.get('/maintenance-notices', requireAuth, driverController.maintenanceNotices);

// Current user — always read fresh from the DB so role/profile reflect the
// latest server state (the JWT payload can be stale, e.g. after a role change).
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [[u]] = await pool.query(
      'SELECT user_id, name, email, department, role FROM users WHERE user_id = ? AND is_active = TRUE',
      [req.user.user_id],
    );
    if (!u) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Account not found or inactive' });
    res.json({ user: u });
  } catch (err) {
    next(err);
  }
});
router.get('/admin/ping', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ ok: true, role: req.user.role });
});

module.exports = router;
