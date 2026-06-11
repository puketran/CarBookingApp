const express = require('express');
const { param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/notificationController');

const router = express.Router();
router.use(requireAuth);

router.get('/', c.list);
router.get('/unread-count', c.unreadCount);
router.patch('/:id/read', param('id').isInt(), validate, c.markRead);
router.post('/read-all', c.readAll);

module.exports = router;
