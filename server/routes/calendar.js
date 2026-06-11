const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const c = require('../controllers/calendarController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', c.month);

module.exports = router;
