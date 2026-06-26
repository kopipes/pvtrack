const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getNotifications } = require('../controllers/notification.controller');

router.get('/', authenticate, getNotifications);

module.exports = router;
