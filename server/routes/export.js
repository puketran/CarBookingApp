const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const c = require('../controllers/exportController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/:report/preview', c.preview);
router.get('/:report', c.download);

module.exports = router;
