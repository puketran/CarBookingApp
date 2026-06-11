const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const c = require('../controllers/exportController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/bookings', c.bookings);
router.get('/utilisation', c.utilisation);
router.get('/monthly', c.monthly);

module.exports = router;
