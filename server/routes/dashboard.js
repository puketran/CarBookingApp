const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const c = require('../controllers/dashboardController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/summary', c.summary);
router.get('/inbox', c.inbox);
router.get('/booking-trend', c.bookingTrend);
router.get('/peak-hours', c.peakHours);
router.get('/breakdown', c.breakdown);

module.exports = router;
