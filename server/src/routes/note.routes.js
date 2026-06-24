const express = require('express');
const router = express.Router({ mergeParams: true });
const { getNotes, createNote } = require('../controllers/note.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireNotViewer } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', getNotes);
router.post('/', requireNotViewer, createNote);

module.exports = router;
