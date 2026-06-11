// Mounts the /api/v1 routes.
//   Day 1: /slots
//   Day 2: /auth/* + protected probes (/me, /admin/ping)
//   Day 3: /vehicles, /bookings
const express = require('express');
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

// Protected probes — demonstrate JWT + role enforcement.
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
router.get('/admin/ping', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ ok: true, role: req.user.role });
});

module.exports = router;
